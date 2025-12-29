import { exampleWithCurve25519, exampleWithEthereum } from './example';

async function main() {
  const typeArg = process.argv[2];
  if (typeArg === 'curve25519') {
    exampleWithCurve25519()
      .then(() => {
        console.log('Finished Curve25519 example');
      })
      .catch((err) => {
        console.error('Error in Curve25519 example:', err);
      });
  } else if (typeArg === 'ethereum') {
    exampleWithEthereum()
      .then(() => {
        console.log('Finished Ethereum example');
      })
      .catch((err) => {
        console.error('Error in Ethereum example:', err);
      });
  } else {
    console.error("Please provide an argument: 'curve25519' or 'ethereum'");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
