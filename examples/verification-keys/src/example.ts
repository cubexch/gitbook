import fs from 'fs';
import { mpcSecretKeyFromMnemonicPhrases } from './mpc-key';
import {
  generateCurve25519KeyPair,
  generateEthereumKeyPair,
  registerNewVerificationKey
} from './verification-key';
import { doWithdrawal } from './withdrawal'

const cubeMpcSecretKey: Uint8Array = Buffer.from('1234567890abcdef', 'hex');
const apiPublicKey: string = '';
const apiSecret: string = '';
const userKey: string = '';
const isOrg: boolean = false;

const exampleWithdrawalInputs = {
  subaccountId: 1,
  destination: 'DHHWEj7Q3TNEeCDnBUp4WmxMCqhEipY4njiQqdSvP93e',
  amount: '10000',
  assetId: 5,
  dryRun: true,
};

export const exampleWithCurve25519 = async () => {
  const { secretKey, publicKey } = generateCurve25519KeyPair();

  registerNewVerificationKey(
    cubeMpcSecretKey,
    userKey,
    isOrg,
    apiPublicKey,
    apiSecret,
    Buffer.from(publicKey).toString('hex'),
    'curve25519'
  )
    .then((result) => {
      console.log('Verification key response:');
      console.log(result);
      console.log('Curve25519 Public Key', Buffer.from(publicKey).toString('hex'));
      console.log('Curve25519 Secret Key', Buffer.from(secretKey).toString('hex'));
    })
    .catch((err) => {
      console.error('Error:', err);
      return;
    });

  await new Promise(resolve => setTimeout(resolve, 1000));

  doWithdrawal(
    exampleWithdrawalInputs,
    userKey,
    isOrg,
    apiPublicKey,
    apiSecret,
    publicKey,
    secretKey,
    'curve25519'
  )
    .then((result) => {
      console.log('Withdrawal response:');
      console.log(result);
    })
    .catch((err) => {
      console.error('Error:', err);
    });
};


export const exampleWithEthereum = async () => {
  const {
    privateKey,
    publicKey: ethPublicKey,
    address: ethAddress
  } = generateEthereumKeyPair();

  registerNewVerificationKey(
    cubeMpcSecretKey,
    userKey,
    isOrg,
    apiPublicKey,
    apiSecret,
    ethAddress,
    'ethereum'
  ).then(result => {
    console.log('Verification key registered:');
    console.log(result);
    console.log('Ethereum Address', ethAddress);
    console.log('Ethereum Public Key', Buffer.from(ethPublicKey).toString('hex'));
    console.log('Ethereum Private Key', Buffer.from(privateKey).toString('hex'));
  }).catch(err => {
    console.error('Error:', err);
  });



  doWithdrawal(
    exampleWithdrawalInputs,
    userKey,
    isOrg,
    apiPublicKey,
    apiSecret,
    Buffer.from(ethAddress.replace('0x',''),'hex'),
    privateKey,
    'ethereum'
  ).then(result => {
    console.log('Withdrawal response:');
    console.log(result);
  }).catch(err => {
    console.error('Error:', err);
  });

}

// Helper to read the cube secret key mnemoics file and conver it to the secret key bytes
function getSecretKey(mnemonicsPath: string): Uint8Array {
  const secretCubeKeyPhrases = fs.readFileSync(mnemonicsPath, "utf8");
  const secretCubeKey = mpcSecretKeyFromMnemonicPhrases(secretCubeKeyPhrases);
  return secretCubeKey;
}
