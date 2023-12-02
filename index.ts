import { VerificationMethod, DIDDocument } from "did-resolver";
import { base58btc } from "multiformats/bases/base58";
import { dsnp } from "@dsnp/frequency-schemas";
import { DSNPResolver } from "@dsnp/did-resolver";
import avro from "avro-js";
import { options } from "@frequency-chain/api-augment";
import { WsProvider, ApiPromise } from "@polkadot/api";

const publicKeyAvroSchema = avro.parse(dsnp.publicKey);

function makeVerificationMethod(
  controller: string,
  publicKeyMultibase: string,
) {
  return {
    "@context": "https://w3id.org/security/multikey/v1",
    id: `${controller}#${publicKeyMultibase}`,
    type: "Multikey",
    controller,
    publicKeyMultibase,
  };
}

export class FrequencyResolver implements DSNPResolver {
  private providerUri: string | null = null;
  private frequencyNetwork: string;
  private _singletonApi: Promise<ApiPromise> | null = null;

  constructor(options: { providerUri?: string; apiPromise?: Promise<ApiPromise>, frequencyNetwork: string }) {
    if (options.providerUri) {
      this.providerUri = options.providerUri;
    } else if (options.apiPromise != null) {
      this._singletonApi = options.apiPromise;
    } else {
      throw new Error("providerUri or apiPromise is required");
    }

    this.frequencyNetwork = options.frequencyNetwork;
    if (
      !this.frequencyNetwork ||
      !["local", "testnet", "mainnet"].includes(this.frequencyNetwork)
    ) {
      throw new Error(
        'frequencyNetwork must be one of: "local", "testnet", "mainnet"',
      );
    }
  }

  async getApi(): Promise<ApiPromise> {
    if (this._singletonApi == null) {
      this._singletonApi = ApiPromise.create({
        provider: new WsProvider(this.providerUri as string),
        throwOnConnect: true,
        ...options,
      });
    }

    return this._singletonApi;
  }

  async disconnect() {
    if (this._singletonApi === null) return;
    const api = await this.getApi();
    await api.disconnect();
    this._singletonApi = null;
  }

  private async getPublicKeysForSchema(
    dsnpUserId: bigint,
    schemaId: number,
  ): Promise<string[]> {
    const { items } = await (
      await this.getApi()
    ).rpc.statefulStorage.getItemizedStorage(dsnpUserId, schemaId);

    return items.map((item: { payload: Uint8Array }) => {
      const payloadAvro = item.payload;
      const publicKeyMulticodec = publicKeyAvroSchema.fromBuffer(
        Buffer.from(payloadAvro),
      ).publicKey;
      return base58btc.encode(publicKeyMulticodec);
    });
  }

  async resolve(dsnpUserId: bigint): Promise<DIDDocument | null> {
    const controller = `did:dsnp:${dsnpUserId}`;

    // Attempt to retrieve public key(s)
    let keyAgreementSchemaId: number;
    let assertionMethodSchemaId: number;

    switch (this.frequencyNetwork) {
      case "testnet":
        keyAgreementSchemaId = 18;
        assertionMethodSchemaId = 100;
        break;
      default:
        keyAgreementSchemaId = 7;
        assertionMethodSchemaId = 11;
        break;
    }

    const assertionMethodKeys = await this.getPublicKeysForSchema(
      dsnpUserId,
      assertionMethodSchemaId,
    );
    const assertionMethod = assertionMethodKeys.map(
      (publicKeyMultibase: string) => {
        return makeVerificationMethod(controller, publicKeyMultibase);
      },
    );

    const keyAgreementKeys = await this.getPublicKeysForSchema(
      dsnpUserId,
      keyAgreementSchemaId,
    );
    const keyAgreement = keyAgreementKeys.map((publicKeyMultibase) => {
      return makeVerificationMethod(controller, publicKeyMultibase);
    });

    // Return the DIDDocument object
    return {
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: `did:dsnp:${dsnpUserId}`,
      assertionMethod,
      keyAgreement,
    };
  }
}
