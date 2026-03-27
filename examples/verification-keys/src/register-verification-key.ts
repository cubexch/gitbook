import { sign_verification_key_provenance } from '@cubexch/electrum';

// The fetchCubeApi code this references is provided
// for convenience on the Access Cube Api Example page
import { fetchCubeApi, cubeApiBaseUrl } from './fetch-cube-api';

/**
 * VerificationKey: The public component and type of key being registered.
 *
 * Using the `publicKey` bytes from generateCurve25519KeyPair...
 *
 * const verificationKey: VerificationKey = {
 *   type: 'curve25519',
 *   bytes: Buffer.from(publicKey).toString('hex'),
 * };
 *
 * or
 *
 * Using the `address` string from generateEthereumKeyPair...
 *
 * const verificationKey: VerificationKey = {
 *   type: 'ethereum',
 *   address: address,
 * };
*/
export type VerificationKey =
  | {
      type: 'curve25519';
      bytes: string;
    }
  | {
      type: 'ethereum';
      address: string;
    };

/**
 * Registers a verification key with the Cube API for either a user or organization.
 *
 * @param cubeMpcSecretKey - The cube wallet private key as a Uint8Array
 * @param cubeUserId - The cube userId
 * @param isOrganization - Whether this is an organization account or a standard user
 * @param apiKey - The API key for authenticating with the Cube API (without hyphens)
 * @param apiSecretKey - The API secret key for signing requests to the Cube API
 * @param verificationKey - VerificationKey public key string and type
 * @returns The json response from the Cube API after registering the verification key
 */
export const registerNewVerificationKey = async (
    cubeMpcSecretKey: Uint8Array,
    cubeUserId: string,
    isOrganization: boolean,
    apiKey: string,
    apiSecretKey: string,
    verificationKey: VerificationKey,
): Promise<any> => {
  const parsedUserId = new Uint8Array(Buffer.from(cubeUserId.replaceAll('-', ''), 'hex'));

  const timestamp = Math.floor(Date.now() / 1000);

  // Call the WASM function for signing verification key provenance which allows it to
  // be registered with cube
  const {
    signature,
    verification_key: encodedVerificationKey,
  } = sign_verification_key_provenance(
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

// Helper function used to format byte strings correctly for the Cube Api
export function bytesToBase64Normalized(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/=/g, "")
    ;
}
