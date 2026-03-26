import { exampleWithCurve25519, exampleWithEthereum } from './example';

async function main() {
  const typeArg = process.argv[2];
  if (typeArg === 'curve25519') {
    await exampleWithCurve25519();
    console.log('Finished Curve25519 example');
  } else if (typeArg === 'ethereum') {
    await exampleWithEthereum();
    console.log('Finished Ethereum example');
  } else {
    console.error("Please provide an argument: 'curve25519' or 'ethereum'");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
