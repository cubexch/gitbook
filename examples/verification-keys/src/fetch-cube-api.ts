import crypto from 'crypto';
export const cubeApiBaseUrl: string = 'https://api.cube.exchange/ir/v0';

/**
 * Fetches data from the Cube API with proper authentication headers.
 *
 * @param url - The URL endpoint to fetch from
 * @param method - The HTTP method to use ('GET' or 'POST')
 * @param requestBody - The request body payload (ignored for GET requests)
 * @param apiKey - The API key for authentication
 * @param apiSecretKey - The API secret key used for generating the signature
 * @param cubeUserId - The Cube user ID or organization key
 * @param isOrganization - Flag indicating if the request is for an organization
 * @returns A promise that resolves to the parsed JSON response
 * @throws Error if the fetch request fails or returns a non-ok status
 */
export const fetchCubeApi = async (
  url: URL,
  method: 'GET' | 'POST',
  requestBody: any,
  apiKey: string,
  apiSecretKey: string,
  cubeUserId: string,
  isOrganization: boolean
): Promise<any> => {
  const ts = Math.floor(Date.now() / 1000);
  const apiSignature = generateApiSignature(apiSecretKey, ts);

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('x-api-key', apiKey);
  headers.set('x-api-signature', apiSignature);
  headers.set('x-api-timestamp', ts.toString());
  if (isOrganization) {
    headers.set('x-organization-key', cubeUserId);
  }

  const request = {
    method,
    headers,
    ...(method !== 'GET' && { body: JSON.stringify(requestBody) }),
  };

  const response = await fetch(url.toString(), request);
  if (!response.ok) {
    throw new Error(
      `Cube fetch error: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
};


/**
 * Generates an HMAC-SHA256 signature for Cube API authentication.
 *
 * @param apiSecretKey - The api secret key in hexadecimal format
 * @param timestampSecs - The current timestamp in seconds since epoch
 * @returns The base64-encoded HMAC signature
 */
const generateApiSignature = (
  apiSecretKey: string,
  timestampSecs: number
): string => {
  const timestampBytes = Buffer.alloc(8);
  timestampBytes.writeBigInt64LE(BigInt(timestampSecs));

  const secretKeyHex = Buffer.from(apiSecretKey, 'hex');

  const signature = crypto
    .createHmac('sha256', secretKeyHex)
    .update('cube.xyz')
    .update(timestampBytes)
    .digest('base64');

  return signature;
};
