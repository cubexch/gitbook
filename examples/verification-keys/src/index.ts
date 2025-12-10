import { exampleWithCurve25519, exampleWithEthereum } from './example';

// exampleWithCurve25519().then(() => { console.log('Finished Curve25519 example') }).catch((err) => {
//   console.error('Error in Curve25519 example:', err);
// });


exampleWithEthereum().then(() => { console.log('Finished Ethereum example') }).catch((err) => {
  console.error('Error in Ethereum example:', err);
});


