import "dotenv/config";
import { getResolver } from "@dsnp/did-resolver";
import { Resolver } from "did-resolver";
import { pluginInit, pluginDestroy } from "../dist/index.js";

await pluginInit({
  providerUri: process.env.FREQUENCY_NODE,
  frequencyNetwork: process.env.FREQUENCY_NETWORK,
});

const resolver = new Resolver(getResolver());

const myDid = `did:dsnp:${process.argv[2]}`;
const result = await resolver.resolve(myDid);
console.log(JSON.stringify(result, null, 2));

await pluginDestroy();
