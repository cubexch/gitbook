
# Cube Exchange Trade API

## Price, Quantity, and Lots

All orders are placed on a single market, specified by the market-id. The
market definition specifies the base and quote assets and their respective
lot sizes for the particular market. Prices and quantities in this API are in
units of base and quote _lots_. That is, a quantity of 1 equals 1 base lot,
and a price of 10 equals 10 quote lots / base lot (read as quote lots per
base lot).

For example, consider an ETH/BTC market. ETH is the base asset and BTC is the
quote asset. ETH has 18 decimal places (`1 ETH = 10^18 WEI`) and BTC has 8
decimal places (`1 BTC = 10^8 SAT`). Suppose that in this example, the ETH/BTC
market has a base lot size of `10^15` and a quote lot size of `10^0` (`1`).
Then an order placed with `quantity = 230` and `limit price = 6300` in
market-agnostic terms is an order for `0.23 ETH` at a price of `0.06300 BTC /
ETH`, calculated from:

```text
230 base lots
  * (10^15 WEI / base lot)
  / (10^18 WEI / ETH)
  = 0.230 ETH

6300 quote lots / base lot
  * (1 SAT / quote lot)
  / (10^15 WEI / base lot)
  * (10^18 WEI / ETH)
  / (10^8 SAT / BTC)
  = 0.06300 BTC / ETH
```

When calculating `RawUnit` amounts for transacted assets, e.g. for reconciliation,
**use the `fill_quantity * base lot size` for the base asset
and the `fill_quote_quantity * quote lot size` for the quote asset**.

When orders are filled in a market enabled for implied matching,
**the price may not reflect the exact ratio between the base and quote asset transacted**.
See [Implied Matching](implied-matching.md) for more details.

## Exchange Order ID

Each order is assigned a unique ID by the exchange. This order ID is
consistent across modifies (including cancel-replace), and other operations.
The exchange order ID can be used to find a particular order in the
market-by-order market data feed, which allows the determination of FIFO
queue priority, etc.

## Transact Time

The transact time is the matching engine timestamp for when an event is
processed. Events that occur with the same transact time occur atomically
from the perspective of the matching engine.
