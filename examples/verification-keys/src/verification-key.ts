import nacl from 'tweetnacl';
import * as secp from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";

// This npm package provides a special wasm function that
// signs the verification key provenance in a way that the Cube
// API recognizes
import * as electrum from '@cubexch/electrum';

// The fetchCubeApi code this references is provided
// for convenience on the Access Cube Api Example page
import { fetchCubeApi, cubeApiBaseUrl } from './fetch-cube-api';


/**
 * Generates a curve25519 key pair.
 */
export function generateCurve25519KeyPair() {
  return nacl.sign.keyPair();
}

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
    privateKey,
    publicKey,
    address,
  };
}

/**
 * Registers a verification key with the Cube API for either a user or organization.
 *
 * @param cubeMpcSecretKey - The cube wallet private key as a Uint8Array
 * @param cubeUserId - The cube userId
 * @param isOrganization - Whether this is an organization account or a standard user
 * @param apiKey - The API key for authenticating with the Cube API (without hyphens)
 * @param apiSecretKey - The API secret key for signing requests to the Cube API
 * @param verificationPublicKey - The verification public key to register (either curve25519 or ethereum)
 * @param verificationKeyType - The type of verification key ('curve25519 pubkey' or 'ethereum address')
 * @returns The json response from the Cube API after registering the verification key
 */
export const registerNewVerificationKey = async (
    cubeMpcSecretKey: Uint8Array,
    cubeUserId: string,
    isOrganization: boolean,
    apiKey: string,
    apiSecretKey: string,
    verificationPublicKey: string,
    verificationKeyType: 'curve25519' | 'ethereum'
): Promise<any> => {
  const parsedUserId = new Uint8Array(Buffer.from(cubeUserId.replaceAll('-', ''), 'hex'));

  // create the verification key object expected by electrum to sign
  const verificationKey = {
    type: verificationKeyType,
    ...(verificationKeyType === 'curve25519' ? { bytes: verificationPublicKey } : {}),
    ...(verificationKeyType === 'ethereum' ? { address: verificationPublicKey } : {}),
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Call the WASM function for signing verification key provenance which allows it to
  // be registered with cube
  const {
    signature,
    verification_key: encodedVerificationKey,
  } = electrum.sign_verification_key_provenance(
    cubeMpcSecretKey,
    parsedUserId,
    JSON.stringify(verificationKey),
    BigInt(timestamp),
  );

  const registerKeyBody = {
    verificationKey: bytesToBase64Normalized(encodedVerificationKey),
    signature: bytesToBase64Normalized(signature),
    timestamp,
    provider: 'manual',
    metadata: {},
  };

  const response = await fetchCubeApi(
    new URL(isOrganization ?
      `${cubeApiBaseUrl}/organization/verification-keys` :
      `${cubeApiBaseUrl}/users/verification-keys`),
    'POST',
    registerKeyBody,
    apiKey,
    apiSecretKey,
    cubeUserId,
    isOrganization
  );

  return response;
}


function bytesToBase64Normalized(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/=/g, "")
    ;
}
