import { VerificationMethod, DIDDocument } from "did-resolver";
import { base58btc } from "multiformats/bases/base58";
import { init, getApi, getChainType, ChainType, disconnectApi } from "./frequency.js";
import { dsnp } from "@dsnp/frequency-schemas";
import avro from "avro-js";
import { registerDSNPResolver } from "@dsnp/did-resolver";
import { ApiPromise } from "@polkadot/api";

const publicKeyAvroSchema = avro.parse(dsnp.publicKey);

export async function pluginInit(options: {
  providerUri: string;
  frequencyNetwork: string;
}) {
  init(options);
  api = await getApi();
  // Register this resolver
  registerDSNPResolver(resolveFrequency);
}

export async function pluginDestroy() {
  await disconnectApi();
}

let api: ApiPromise;

async function getPublicKeysForSchema(
  dsnpUserId: BigInt,
  schemaId: number,
): Promise<string[]> {
  const { items } = await api.rpc.statefulStorage.getItemizedStorage(
    dsnpUserId,
    schemaId,
  );

  type ItemType = {
    payload: Uint8Array;
  };

  return items.map((item: ItemType) => {
    const payloadAvro = item.payload;
    const publicKeyMulticodec = publicKeyAvroSchema.fromBuffer(
      Buffer.from(payloadAvro),
    ).publicKey;
    return base58btc.encode(publicKeyMulticodec);
  });
}

function makeVerificationMethod(
  controller: string,
  publicKeyMultibase: string,
) {
  return {
    "@context": ["https://w3id.org/security/multikey/v1"],
    id: `${controller}#${publicKeyMultibase}`,
    type: "Multikey",
    controller,
    publicKeyMultibase,
  };
}

async function resolveFrequency(
  dsnpUserId: BigInt,
): Promise<DIDDocument | null> {
  const controller = `did:dsnp:${dsnpUserId}`;

  // Attempt to retrieve public key(s)
  let keyAgreementSchemaId: number;
  let assertionMethodSchemaId: number;

  switch (getChainType()) {
    case ChainType.Testnet:
      keyAgreementSchemaId = 18;
      assertionMethodSchemaId = 100;
      break;
    default:
      keyAgreementSchemaId = 7;
      assertionMethodSchemaId = 11;
      break;
  }

  const assertionMethodKeys = await getPublicKeysForSchema(
    dsnpUserId,
    assertionMethodSchemaId,
  );
  const assertionMethod = assertionMethodKeys.map((publicKeyMultibase) => {
    return makeVerificationMethod(controller, publicKeyMultibase);
  });

  const keyAgreementKeys = await getPublicKeysForSchema(
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
