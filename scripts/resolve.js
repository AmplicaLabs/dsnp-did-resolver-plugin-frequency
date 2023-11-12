import "dotenv/config";
import { getResolver } from "@dsnp/did-resolver";
import { Resolver } from "did-resolver";
import { FrequencyResolver } from "../dist/index.js";

const frequencyResolver = new FrequencyResolver({
  providerUri: process.env.FREQUENCY_NODE,
  frequencyNetwork: process.env.FREQUENCY_NETWORK,
});

const resolver = new Resolver(getResolver([frequencyResolver]));

const myDid = `did:dsnp:${process.argv[2]}`;
const result = await resolver.resolve(myDid);
console.log(JSON.stringify(result, null, 2));

await frequencyResolver.disconnect();
