# Overview

This package contains a plugin for the [@dsnp/did-resolver](https://github.com/LibertyDSNP/dsnp-did-resolver) library which enables resolution of `did:dsnp:*` DIDs on the [Frequency](https://github.com/LibertyDSNP/frequency) blockchain.

# Usage

The plugin must be initialized with Frequency connection information.

```
import { FrequencyResolver } from "@dsnp/did-resolver-plugin-frequency";

const frequencyResolver = new FrequencyResolver({
  providerUri: "ws://127.0.0.1:9944",
  frequencyNetwork: "local",
});
```

The plugin will automatically register itself with the DSNP DID resolver when initialized.

The following options must be provided:

| Configuration option | Description |
| --- | --- |
| `providerUri` | Provider URI for Frequency RPC node |
| `frequencyNetwork` | One of `local`, `testnet`, `mainnet` |

See `.env.example` for example configuration.

Here's a full usage example with the DID resolver framework:

```
import { Resolver } from "did-resolver";
import dsnp from "@dsnp/did-resolver"; 

const frequencyResolver = new FrequencyResolver({
  providerUri: "wss://rpc.rococo.frequency.xyz",
  frequencyNetwork: "testnet"
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
        "@context": [
          "https://w3id.org/security/multikey/v1"
        ],
        "id": "did:dsnp:13972#z6MkuzE4hBVHTmwFff37ZuPQs9sbkdJo8jifN9sZ1jXbgyMp",
        "type": "Multikey",
        "controller": "did:dsnp:13972",
        "publicKeyMultibase": "z6MkuzE4hBVHTmwFff37ZuPQs9sbkdJo8jifN9sZ1jXbgyMp"
      }
    ]
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

Currently this plugin implements the minimal functionality required to support lookup of public keys by DSNP applications.

- DSNP public keys with `keyType` 1 are listed in the `keyAgreement` array.
- DSNP public keys with `keyType` 2 are listed in the `assertionMethod` array.

Public keys are encoded using the `Multikey` type.
The `id` consists of the DSNP DID and a URL fragment that is the same as the `publicKeyMultibase` value, which is a multicodec value in `base58btc` encoding.
The decoded value for `ed25519-pub` keys will be 34 bytes, including the two-byte multicodec identifier.

## Known issues

- The resolver currently responds with a DID document for any valid-looking DSNP DID.
  It should return a `notFound` error if there is no corresponding Frequency MSA.
