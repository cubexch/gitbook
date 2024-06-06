This page describes the various fees and rebates that can be applied to fills on Cube:
- Trading Fees
- Implied Match Fee or Rebate

# Trading Fees

## Summary

Trading Fees are calculated on each individual trade as a ratio of the filled quantity,
and are always charged as a deduction from the asset received in that trade.

Fee ratios may vary from trade to trade based on the user's VIP level.
For fee discounts based on Trading Volume, ratios are adjusted continuously
at the time of each trade based on the user's trailing 30-day volume.

To ensure that the client has enough information to determine the exact fee charged,
the fee ratio is expressed as a fixed-point decimal number consisting of a mantissa and an exponent.
Generally, the exponent will be "-4", indicating that the mantissa is equivalent to pips,
Though some fees may be expressed with greater granularity.

## Example

Consider the case of a trade where:
- Asset received is BTC
- `quantity` = 5
- `fee_ratio.mantissa` = 11
- `fee_ratio.exponent` = -4

...in which case:
- The fee ratio would be 0.0011, or 11 pips.
- The fee would be equal to 0.0055 BTC.
- The total amount credited at settlement would be 4.9945 BTC.

If you need exact granularity at time of trade, you can replicate the fee calculation performed by the exchange.
To avoid rounding errors, this entire process is performed in integer math using the exponent as a devisor.
In the example above, the full fee amount in indivisible [RawUnits](#rawunits) would be calculated as:
```text
5 * 100_000_000 * 11 / 10_000 = 550_000 RawUnits

(in the BTC case, that would be 550,000 Satoshi)
```

Since the fee is expressed with a decimal exponent, it's highly likely that this calculation results in a whole number.
In the unlikely case that the final division results in a non-whole number, the result should be truncated,
hence the division at the end: i.e. the fee is rounded down to the nearest `RawUnit`.

# Implied Match Fee or Rebate

See the [documentation on Implied Matching](./implied-matching.md#ImpliedMatchFeeOrRebate).
