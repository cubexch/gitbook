import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2';
ed25519.hashes.sha512 = sha512;

/**
 * Generates a curve25519 key pair.
 */
export function generateCurve25519KeyPair() {
  return ed25519.keygen(); // { secretKey: bytes, publicKey: bytes }
}
