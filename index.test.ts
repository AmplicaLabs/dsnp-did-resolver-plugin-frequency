import "dotenv/config";
import { getResolver } from "@dsnp/did-resolver";
import { Resolver } from "did-resolver";
import { expect, jest, test } from "@jest/globals";
import "./index.js";
import { disconnectApi } from "./frequency.js";

jest.setTimeout(15000);

describe("dsnp-did-resolver", () => {
  let resolver: Resolver;

  beforeAll(() => {
    resolver = new Resolver(getResolver());
  });

  test("Resolve did:dsnp:13972", async () => {
    const myDid = "did:dsnp:13972";
    const result = await resolver.resolve(myDid);
    console.log(JSON.stringify(result, null, 2));
  });

  afterAll(() => {
    // Shut down Frequency client
    disconnectApi();
  });
});
