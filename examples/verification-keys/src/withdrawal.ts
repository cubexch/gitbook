import nacl from 'tweetnacl';
import * as secp from '@noble/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';

import { fetchCubeApi, cubeApiBaseUrl } from './fetch-cube-api';

import { VerificationKey, bytesToBase64Normalized } from './verification-key'

import { encode_verification_key } from '@cubexch/electrum'

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
 * @param verificationKey - VerificationKey public key string and type
 * @param verificationKeySecret - The verification secret key bytes
 * @returns The json response from the Cube API after withdrawing
 */

export const doWithdrawal = async (
  withdrawal: WithdrawalInputs,
  cubeUserId: string,
  isOrganization: boolean,
  apiKey: string,
  apiSecretKey: string,
  verificationKey: VerificationKey,
  verificationKeySecret: Uint8Array,
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
    verificationKey.type === 'curve25519'
      ? signCurve25519(payload, verificationKeySecret)
      : await signEthereum(payload, verificationKeySecret);

  // use provided electrum WASM function to encode the verification key
  const encodedVerificationKey = encode_verification_key(JSON.stringify(verificationKey));

  // construct the entire request for the Cube Api, including signature and key
  const withdrawalBody = {
    subaccountId: withdrawal.subaccountId,
    assetId: withdrawal.assetId,
    amount: withdrawal.amount,
    ...(withdrawal.feeAmount ? { feeAmount: withdrawal.feeAmount } : {}),
    destination: withdrawal.destination,
    signature: bytesToBase64Normalized(signature),
    timestamp,
    verificationKey: bytesToBase64Normalized(encodedVerificationKey),
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
