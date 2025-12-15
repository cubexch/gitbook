# Withdraw with Verification Key

With a successfully registered Verification Key, you may sign and send withdrawal or transfer requests to the Cube Api. You may use the same verification key to sign many subsequent withdrawals.

{% tabs %}
{% tab title="Withdrawal Example" %}

```typescript
import nacl from 'tweetnacl';
import * as secp from '@noble/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';

// The fetchCubeApi code this references is provided
// for convenience on the Access Cube Api Example page
import { fetchCubeApi, cubeApiBaseUrl } from './fetch-cube-api';

// See Reference Proto File
import { ov_schema } from './proto';
const PublicKey = ov_schema.PublicKey;

export interface WithdrawalInputs {
  subaccountId: number;
  assetId: number;
  amount: string;
  feeAmount?: string;
  destination: string;
  dryRun?: boolean;
}

/**
 * Signs a withdrawal with the verification key and sends it to the Cube API
 *
 * @param inputs - The withdrawal request inputs
 * @param cubeUserId - The cube userId
 * @param isOrganization - Whether this is an organization account or a standard user
 * @param apiKey - The API key for authenticating with the Cube API (without hyphens)
 * @param apiSecretKey - The API secret key for signing requests to the Cube API
 * @param verificationPublicKey - The verification public key bytes
 * @param verificationPrivateKey - The verification private key bytes
 * @param verificationKeyType - The type of verification key ('curve25519 pubkey' or 'ethereum address')
 * @returns The json response from the Cube API after withdrawing
 */

export const doWithdrawal = async (
  withdrawal: WithdrawalInputs,
  cubeUserId: string,
  isOrganization: boolean,
  apiKey: string,
  apiSecretKey: string,
  verificationPublicKey: Uint8Array,
  verificationPrivateKey: Uint8Array,
  verificationKeyType: 'curve25519' | 'ethereum'
): Promise<any> => {
  const timestamp = Math.floor(Date.now() / 1000);

  // contstruct the withdrawal/transfer body which is to be signed
  const transfer = {
    userKey: cubeUserId,
    subaccountId: withdrawal.subaccountId,
    assetId: withdrawal.assetId,
    amount: withdrawal.amount,
    ...(withdrawal.feeAmount ? { feeAmount: withdrawal.feeAmount } : {}),
    destination: withdrawal.destination,
    timestamp,
  };

  const payload = new TextEncoder().encode(JSON.stringify(transfer));

  // sign the payload with the verification private key.
  // note the different signing helper functions below for each type of key
  const signature =
    verificationKeyType === 'curve25519'
      ? signCurve25519(payload, verificationPrivateKey)
      : await signEthereum(payload, verificationPrivateKey);

  // create the corresponding proto object of the verification key to attach to the request
  const verificationKeyEncoded = PublicKey.encode(
    PublicKey.create({
      ...(verificationKeyType === 'curve25519'
        ? { curve25519: verificationPublicKey }
        : { ethereum: verificationPublicKey }),
    })
  ).finish();

  // construct the entire request for the Cube Api, including signature and key
  const withdrawalBody = {
    subaccountId: withdrawal.subaccountId,
    assetId: withdrawal.assetId,
    amount: withdrawal.amount,
    ...(withdrawal.feeAmount ? { feeAmount: withdrawal.feeAmount } : {}),
    destination: withdrawal.destination,
    signature: bytesToBase64Normalized(signature),
    timestamp,
    verificationKey: bytesToBase64Normalized(verificationKeyEncoded),
    dryRun: withdrawal.dryRun || false,
  };

  const response = await fetchCubeApi(
    new URL(
      isOrganization
        ? `${cubeApiBaseUrl}/organization/withdraw`
        : `${cubeApiBaseUrl}/users/withdraw`
    ),
    'POST',
    withdrawalBody,
    apiKey,
    apiSecretKey,
    cubeUserId,
    isOrganization
  );
  return response;
};

const signCurve25519 = (
  payload: Uint8Array,
  secretKey: Uint8Array
): Uint8Array => {
  const signature = nacl.sign.detached(payload, secretKey);
  return signature;
};

const signEthereum = async (
  payload: Uint8Array,
  secretKey: Uint8Array
): Promise<Uint8Array> => {
  const prefix = `\x19Ethereum Signed Message:\n${payload.length}`;
  const prefixed = new Uint8Array([
    ...new TextEncoder().encode(prefix),
    ...payload,
  ]);
  const hashBytes = keccak_256(prefixed);

  const signature = await secp.signAsync(hashBytes, secretKey, {
    prehash: false,
    lowS: true,
  });
  return signature;
};

export function bytesToBase64Normalized(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/=/g, '');
}

```

{% endtab %}

{% tab title="Reference Proto File" %}

#### `ov.proto`

The public protobuf schema used for verification keys. In the key registration example, this is handled for you within the WASM function. For subsequent withdrawals using the registered verification key, you must construct the proto object yourself.

```protobuf
syntax = "proto3";

package ov_schema;

message VerificationKey {
  oneof version {
    VerificationKeyV0 v0 = 1;
  }
}

message VerificationKeyV0 {
  PublicKey public_key = 1;
  optional int64 expires_at = 2;
}

message PublicKey {
  reserved 1; // type secp256k1
  oneof type {
    bytes curve25519 = 2;
    bytes ethereum = 3;
  }
}

```

{% endtab %}
{% endtabs %}
