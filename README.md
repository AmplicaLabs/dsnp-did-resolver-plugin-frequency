# Overview

This package contains a plugin for the [@dsnp/did-resolver](https://github.com/LibertyDSNP/dsnp-did-resolver) library which enables resolution of `did:dsnp:*` DIDs using the [Frequency](https://github.com/LibertyDSNP/frequency) blockchain.

# Usage

```
import "@amplica-labs/dsnp-did-resolver-plugin-frequency";
```

The plugin will automatically register itself with the DSNP DID resolver when imported.

Here's a full usage example with the DID resolver framework:

```
import { Resolver } from "did-resolver";
import dsnp from "@dsnp/did-resolver"; 
import "@amplica-labs/dsnp-did-resolver-plugin-frequency";

const resolver = new Resolver(dsnp.getResolver());
const myDid = "did:dsnp:123456";
const result = await resolver.resolve(myDid);
console.log(JSON.stringify(result, null, 2));

/* Example output:
    {
      "didResolutionMetadata": {
        "contentType": "application/did+ld+json"
      },
      "didDocument": {
        "@context": [
          "https://www.w3.org/ns/did/v1"
        ],
        "id": "did:dsnp:123456",
        "assertionMethod": [
          {
            "@context": [
              "https://w3id.org/security/multikey/v1"
            ],
            "id": "did:dsnp:123456#z6MkuzE4hBVHTmwFff37ZuPQs9sbkdJo8jifN9sZ1jXbgyMp",
            "type": "Multikey",
            "controller": "did:dsnp:123456",
            "publicKeyMultibase": "z6MkuzE4hBVHTmwFff37ZuPQs9sbkdJo8jifN9sZ1jXbgyMp"
          }
        ]
      },
      "didDocumentMetadata": {}
    }
*/
```

# Features

Currently this plugin implements the minimal functionality to support using keys associated with a DSNP User Id to verify Verifiable Credentials.

- DSNP public keys with `keyType` 2 are listed in the `assertionMethod` array using the `Multikey` type. The `id` fragment is the same as the `publicKeyMultibase` value, which is a multicodec value in `base58btc` encoding. The decoded value for `ed25519-pub` keys will be 34 bytes, including the two-byte multicodec identifier.
