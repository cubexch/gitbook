# Generate Verification Key

There are two types of verification keys that the Cube API supports: `'curve25519'` and `'ethereum'`. You may use either to sign withdrawal and transfer payloads, but the process for generating them and using them for signing future requests is slightly different. See the examples for generating below:

{% tabs %}
{% tab title="curve25519" %}

#### Generate `'curve25519'` Verification Key

```typescript
import nacl from 'tweetnacl';

/**
 * Generates a curve25519 key pair.
 */
export function generateCurve25519KeyPair() {
  return nacl.sign.keyPair(); // { publicKey: bytes, privateKey: bytes }
}

```

{% endtab %}

{% tab title="ethereum" %}

#### Generate `'ethereum'` Verification Key

```ts
import * as secp from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";

/**
 * Generates a secp256k1 key pair and derived Ethereum address.
 */
export function generateEthereumKeyPair() {
  // generate random 32-byte private key
  const privateKey = secp.utils.randomSecretKey();

  // get public key (uncompressed)
  const publicKey = secp.getPublicKey(privateKey, false);

  // Ethereum address:
  // Skip the 0x04 prefix of the public key (ie. the first byte '04')
  const pubKeySlice = publicKey.slice(1);
  // Compute the keccak_256 hash and take the last 20 bytes of the result
  const addressBytes = keccak_256(pubKeySlice).slice(-20);

  const address = "0x" + Buffer.from(addressBytes).toString("hex");

  return {
    privateKey, // bytes
    publicKey, // bytes
    address, // string
  };
}

```

{% endtab %}
{% endtabs %}
