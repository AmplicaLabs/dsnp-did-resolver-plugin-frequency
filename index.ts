import { base58btc } from "multiformats/bases/base58";
import { dsnp } from "@dsnp/frequency-schemas";
import { DSNPResolver } from "@dsnp/did-resolver";
import avro from "avro-js";
import { options } from "@frequency-chain/api-augment";
import { WsProvider, ApiPromise } from "@polkadot/api";
import { xxhashAsHex } from "@polkadot/util-crypto";
import { bnToU8a, u8aToHex } from "@polkadot/util";

const publicKeyAvroSchema = avro.parse(dsnp.publicKey);

const keyCountStorageKeyHex =
  xxhashAsHex("Msa", 128) +
  xxhashAsHex("PublicKeyCountForMsaId", 128).substring(2);

type VerificationMethod = {
  "@context": "https://w3id.org/security/multikey/v1";
  id: string;
  type: "Multikey";
  controller: string;
  publicKeyMultibase: string;
};

function makeVerificationMethod(
  controller: string,
  publicKeyMultibase: string,
): VerificationMethod {
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
  private _singletonApi: Promise<ApiPromise> | null = null;
  private keyAgreementSchemaId: number | null = null;
  private assertionMethodSchemaId: number | null = null;
  private initialized: boolean = false;

  constructor(options: {
    providerUri?: string;
    apiPromise?: Promise<ApiPromise>;
  }) {
    if (options.providerUri) {
      this.providerUri = options.providerUri;
    } else if (options.apiPromise != null) {
      this._singletonApi = options.apiPromise;
    } else {
      throw new Error("providerUri or apiPromise is required");
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
      const onChainPublicKey = publicKeyAvroSchema.fromBuffer(
        Buffer.from(payloadAvro),
      ).publicKey;
      // Work around keys stored without multicodec
      const publicKeyMulticodec =
        onChainPublicKey.length === 32
          ? new Uint8Array([0xec, 0x01, ...onChainPublicKey])
          : onChainPublicKey;

      return base58btc.encode(publicKeyMulticodec);
    });
  }

  async resolve(dsnpUserId: bigint): Promise<object | null> {
    if (!this.initialized) {
      const api: Promise<ApiPromise> = this.getApi();
      // Get the appropriate schemaIds for the chain we're connecting to
      this.keyAgreementSchemaId = await dsnp.getSchemaId(
        api,
        "public-key-key-agreement",
      );
      try {
        this.assertionMethodSchemaId = await dsnp.getSchemaId(
          api,
          "public-key-assertion-method",
        );
      } catch (e) {
        this.assertionMethodSchemaId = null;
      }
      this.initialized = true;
    }

    // Determine if MSA exists by checking public key count
    const msaUint8a = bnToU8a(dsnpUserId, { bitLength: 64 });
    const key =
      keyCountStorageKeyHex +
      xxhashAsHex(msaUint8a).substring(2) +
      u8aToHex(msaUint8a).substring(2);
    const result = await (await this.getApi()).rpc.state.getStorage(key);
    if (Number(result) == 0) {
      return null;
    }

    const controller = `did:dsnp:${dsnpUserId}`;

    let assertionMethod: VerificationMethod[] = [];
    if (this.assertionMethodSchemaId) {
      // Retrieve public key(s)
      const assertionMethodKeys = await this.getPublicKeysForSchema(
        dsnpUserId,
        this.assertionMethodSchemaId!,
      );
      assertionMethod = assertionMethodKeys.map(
        (publicKeyMultibase: string) => {
          return makeVerificationMethod(controller, publicKeyMultibase);
        },
      );
    }

    const keyAgreementKeys = await this.getPublicKeysForSchema(
      dsnpUserId,
      this.keyAgreementSchemaId!,
    );
    const keyAgreement = keyAgreementKeys.map((publicKeyMultibase) => {
      return makeVerificationMethod(controller, publicKeyMultibase);
    });

    // Return the DID document object
    return {
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: `did:dsnp:${dsnpUserId}`,
      assertionMethod,
      keyAgreement,
    };
  }
}
