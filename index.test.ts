import { getResolver } from "@dsnp/did-resolver";
import { Resolver } from "did-resolver";
import { expect, jest, test } from "@jest/globals";
import { pluginInit, pluginDestroy } from "./index.js";

describe("dsnp-did-resolver-plugin-frequency", () => {
  it("currently contains no tests", () => {});

  /*
  TODO: Needs mocking

  it("registers as a DSNP resolver", async () => {
    await pluginInit({
      providerUri: "ws://127.0.0.1:9944",
      frequencyNetwork: "local",
    });

    const resolver = new Resolver(getResolver());
  });

  it("resolves did:dsnp:13972", async () => {
    const myDid = "did:dsnp:13972";
    const result = await resolver.resolve(myDid);
  });

  afterAll(async () => {
    // Shut down Frequency client
    await pluginDestroy();
  });
  */
});
