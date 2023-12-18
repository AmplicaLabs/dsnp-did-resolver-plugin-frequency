# Overview

This package contains a resolver for the [@dsnp/did-resolver](https://github.com/LibertyDSNP/dsnp-did-resolver) library which enables resolution of `did:dsnp:*` DIDs on the [Frequency](https://github.com/LibertyDSNP/frequency) blockchain.

# Installation

`npm install @dsnp/did-resolver-frequency`

# Usage

The resolver object can be constructed with Frequency connection information in one of two ways.

1. Construct with provider URI:

```
import { FrequencyResolver } from "@dsnp/did-resolver-frequency";

const frequencyResolver = new FrequencyResolver({
  providerUri: "ws://127.0.0.1:9944",
});
```

If constructed this way, you must call `disconnect()` to explicitly release the connection; the process will not exit if this is not done.

or,

2. Construct with preconfigured `Promise<ApiPromise>` object from `@polkadot/api`:

```
import { FrequencyResolver } from "@dsnp/did-resolver-frequency";

const frequencyResolver = new FrequencyResolver({
  apiPromise: myApiPromise, // from ApiPromise.create(...)
});
```

Summary of options:

| Configuration option | Description |
| --- | --- |
| `providerUri` | Provider URI for Frequency RPC node (optional; alternative to `apiPromise` |
| `apiPromise` | A `Promise<ApiPromise>` (optional; alternative to `providerUri` |

See `.env.example` for example configuration.

Here's a full usage example with the DID resolver framework:

```
import { Resolver } from "did-resolver";
import dsnp from "@dsnp/did-resolver"; 

const frequencyResolver = new FrequencyResolver({
  providerUri: "wss://rpc.rococo.frequency.xyz",
});

const resolver = new Resolver(dsnp.getResolver([frequencyResolver]));
const myDid = "did:dsnp:13972";
const result = await resolver.resolve(myDid);
console.log(JSON.stringify(result, null, 2));

frequencyResolver.disconnect();

/* Example output:
{
  "didResolutionMetadata": {
    "contentType": "application/did+ld+json"
  },
  "didDocument": {
    "@context": [
      "https://www.w3.org/ns/did/v1"
    ],
    "id": "did:dsnp:13972",
    "assertionMethod": [
      {
        "@context": "https://w3id.org/security/multikey/v1",
        "id": "did:dsnp:13972#z6MkuzE4hBVHTmwFff37ZuPQs9sbkdJo8jifN9sZ1jXbgyMp",
        "type": "Multikey",
        "controller": "did:dsnp:13972",
        "publicKeyMultibase": "z6MkuzE4hBVHTmwFff37ZuPQs9sbkdJo8jifN9sZ1jXbgyMp"
      }
    ],
    "keyAgreement": []
  },
  "didDocumentMetadata": {}
}
*/
```

## CLI

The example above is provided as a command line script.

```
cp .env.example .env
npm run resolve -- 13972
```

# Features

Currently this resolver implements the minimal functionality required to support lookup of public keys by DSNP applications.

- DSNP public keys with `keyType` 1 are listed in the `keyAgreement` array.
- DSNP public keys with `keyType` 2 are listed in the `assertionMethod` array.

Public keys are encoded using the `Multikey` type.
The `id` consists of the DSNP DID and a URL fragment that is the same as the `publicKeyMultibase` value, which is a multicodec value in `base58btc` encoding.
The decoded value for `ed25519-pub` keys will be 34 bytes, including the two-byte multicodec identifier.
