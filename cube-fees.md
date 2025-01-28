This page describes the various fees charged by Cube.

## Trading Fees

Trading Fees are calculated on each individual **fill** as a ratio of the filled quantity,
and are always charged as a deduction from the asset received in that trade.

The amount of the fee is indicated on Fill acknowlegements by a Fee Ratio
expressed as a fixed-point decimal number consisting of a mantissa and an exponent.
Generally, the exponent will be "-4", indicating that the mantissa is equivalent to pips,
Though some fees may be expressed with greater granularity.

### Example

Consider the case of a trade resulting in a credit of 5 Bitcoin:
- Asset received is BTC
- `fee_ratio.mantissa` = 11
- `fee_ratio.exponent` = -4

...in which case:
- The fee ratio would be 0.0011, or 11 pips.
- The fee would be equal to 0.0055 BTC.
- The total amount credited at settlement would be 4.9945 BTC.

If you need exact granularity at time of trade, you can replicate the fee calculation performed by the exchange.
To avoid rounding errors, this entire process is performed in integer math using the exponent as a divisor.
In the example above, the full fee amount in indivisible [RawUnits](/generated/ws-api/websocket-trade-api.md#rawunits) would be calculated as:
```text
5 * 100_000_000 * 11 / 10_000 = 550_000 RawUnits

(in the BTC case, that would be 550,000 Satoshi)
```

Since the fee is expressed with a decimal exponent, it's possible that this calculation results in a non-whole number.
Since `RawUnit`s are indivisible, the fee must be a whole number,
so it's rounded down to the nearest `RawUnit` during the final truncating division.

# Implied Match Fee

Each aggressing order into a market enabled for implied match may incur a fee,
the value of which will always be less than a single lot of either the base or quote asset from that market,
using the lot sizes from the source markets providing the implied liquidity.

Unlike the Trading Fee, the Implied Match Fee is calculated per-order rather than per-fill.
The amount is based on the prices and quantities executed,
as well as the relationship between the lot sizes in the different markets,
i.e. the number of fills in the match does not affect the amount of the fee.

See the [documentation on Implied Matching](./implied-matching.md#ImpliedMatchFee) for a detailed desciption.
