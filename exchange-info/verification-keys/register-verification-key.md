# Register Verification Key

Once you have generated your verification key, you must sign a provenance payload using your Cube wallet mpc secret key and a signing function provided in the public npm package [`@cubexch/electrum`](https://www.npmjs.com/package/@cubexch/electrum). Then you must send the signature and verification public key to the Cube API endpoint for registering verification keys. See the example below:

```typescript
import { sign_verification_key_provenance } from '@cubexch/electrum';

// The fetchCubeApi code this references is provided
// for convenience on the Access Cube Api Example page
import { fetchCubeApi, cubeApiBaseUrl } from './fetch-cube-api';

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

  // Call the electrum WASM function for signing verification key provenance
  // which allows it to be registered with cube
  const {
    signature,
    verification_key: encodedVerificationKey,
  } = sign_verification_key_provenance(
    cubeMpcSecretKey,
    parsedUserId,
    JSON.stringify(verificationKey),
    BigInt(timestamp),
  );

 // This is the expected request body for the verification-keys endpoint
  const registerKeyBody = {
    verificationKey: bytesToBase64Normalized(encodedVerificationKey),
    signature: bytesToBase64Normalized(signature),
    timestamp,
    provider: 'manual',
    metadata: {},
  };

  // See Fetch Cube Api example code
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
function bytesToBase64Normalized(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/=/g, "")
    ;
}
```
