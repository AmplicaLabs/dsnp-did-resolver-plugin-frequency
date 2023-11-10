import { VerificationMethod, DIDDocument } from "did-resolver";
import { base58btc } from "multiformats/bases/base58";
import { getApi } from "./frequency.js";
import { dsnp } from "@dsnp/frequency-schemas";
import avro from "avro-js";
import { registerDSNPResolver } from "@dsnp/did-resolver";

const publicKeyAvroSchema = avro.parse(dsnp.publicKey);

// Register this resolver
registerDSNPResolver(resolveFrequency);

const api = await getApi();

async function getPublicKeysForSchema(dsnpUserId: BigInt, schemaId: number): Promise<string[]> {
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

async function resolveFrequency(
  dsnpUserId: BigInt,
): Promise<DIDDocument | null> {
  const controller = `did:dsnp:${dsnpUserId}`;

  // Attempt to retrieve assertionMethod public key(s)
  //const schemaId = getSchemaId(AnnouncementType.PublicKey_AssertionMethod);
  const assertionMethodSchemaId = 100; // 100=Testnet, 11=Mainnet FIXME

  const assertionMethodKeys = await getPublicKeysForSchema(dsnpUserId, assertionMethodSchemaId);
  const assertionMethod = assertionMethodKeys.map((publicKeyMultibase) => {
    return {
      "@context": ["https://w3id.org/security/multikey/v1"],
      id: `${controller}#${publicKeyMultibase}`,
      type: "Multikey",
      controller,
      publicKeyMultibase,
    };
  });

  // Return the DIDDocument object
  return {
    "@context": [
      "https://www.w3.org/ns/did/v1",
    ],
    id: `did:dsnp:${dsnpUserId}`,
    assertionMethod,
  };
}
