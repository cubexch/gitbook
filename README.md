
## About

Cube is a hybrid exchange built from first principles for the future of digital
and traditional asset trading. At it's core, a low-latency matching engine
powers trading at 200'000 operations per second with 200µs latency, and a
decentralized settlement layer powers a non-custodial peer-to-peer settlement
that ensures the safety of your assets.

## Overview

This documentation covers a large part of the Cube API, and is roughly
organized into the following:

- [Exchange Info](rest-iridium-api.md): Information about the exchange, such as
  assets, markets, account management, and more.
- [Market Data](rest-mendelev-api.md): Market data, including level 3 (order by
  order) book data, trade summaries, and more.
- [Order Entry](rest-osmium-api.md): Trading and order management.
- [Perpetual Futures](perpetual-futures/README.md): Information about our
  perpetual futures contracts, including contract specifications, margin
  requirements, funding, PnL settlement, and liquidation.
- [Fees](cube-fees.md): Information about fees on Cube.

### Connectivity

- **REST**: For market data snapshots and order entry.
- **Websocket**: For realtime market data and trading.
- **TCP FIX and UDP Multicast**: Out lowest latency connectivity. Reach out for
  more information.


## Environments

If you're interested in building with us, reach out about getting access to our
staging environment, where you can test your integrations before going live!

## Contact

Reach out to us at [engineering@cube.xyz](mailto:engineering@cube.xyz) for
questions or feedback!
