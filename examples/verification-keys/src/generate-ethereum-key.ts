import * as secp from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";

/**
 * Generates a secp256k1 key pair and Ethereum address.
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
