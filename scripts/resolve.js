import "dotenv/config";
import { CachedResolver } from "@digitalbazaar/did-io";
import didDsnp from "@dsnp/did-resolver";
import { FrequencyResolver } from "../dist/index.js";

const frequencyResolver = new FrequencyResolver({
  providerUri: process.env.FREQUENCY_NODE,
});

const resolver = new CachedResolver();
resolver.use(didDsnp.driver([frequencyResolver]));

const did = `did:dsnp:${process.argv[2]}`;
const result = await resolver.get({did});
console.log(JSON.stringify(result, null, 2));

await frequencyResolver.disconnect();
