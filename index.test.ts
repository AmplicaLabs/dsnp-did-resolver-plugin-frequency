import { expect, jest, test } from "@jest/globals";
import { FrequencyResolver } from "./index.js";

describe("dsnp-did-resolver-plugin-frequency", () => {
  it("can be constructed", async () => {
    const _resolver = new FrequencyResolver({
      providerUri: "ws://127.0.0.1:9944",
      frequencyNetwork: "local",
    });
  });

  /* Need to mock for this...
  it("resolves did:dsnp:13972", async () => {
    const myDid = "did:dsnp:13972";
    const result = await resolver.resolve(myDid);
  });

  afterAll(async () => {
    // Shut down Frequency client
    await resolver.disconnect();
  });
  */
});
