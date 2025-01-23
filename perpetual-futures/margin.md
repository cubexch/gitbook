## Margin Modes

Currently, all Cube margin subaccounts are cross margined. As such, all
positions share the same margin balance. Positive PnL in one contract can be
used to offset negative PnL in another, but margin calculations and limits are
done and applied independently for each contract.

## Margin Table

Each contract is associated with a Margin Table, which defines the supported
margin tiers. Each margin tie is defined as follows

| Field                    | Description                                                                                                                                                                                                         |
| -------------------      | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------    |
| Position Notional        | The maximum position notional that can be opened for this leverage tier. Note that a position (long or short) can increase in size beyond this limit due to mark price changes, but new contracts cannot be opened. |
| Max Leverage             | The maximum leverage allowed for this tier.                                                                                                                                                                         |
| Maintenance Margin Ratio | The maintenance margin ratio required for position notional within this tier.                                                                                                                                       |
| Maintenance Deduction    | A derived value useful for maintenance magrin calculations                                                                                                                                                          |

Where

```
MMR(N) = maintenance margin ratio on tier N
MD(N)  = maintenance margin deduction on tier N
       = position notional of tier N-1 * (MMR(N) - MMR(N-1)) + MD(N-1)
Maintenance Margin = Position Notional * MMR(N) - MD(N)
```

For example,

 | Tier | Position Notional | Max Leverage | Maintenance Margin Ratio | Maintenance Deduction |
 | ---- | ----------------- | ------------ | ------------------------ | --------------------- |
 | 1    | 50000.0           | 100          | 0.005                    | 0.0                   |
 | 2    | 200000.0          | 50           | 0.01                     | 250.0                 |
 | 3    | 500000.0          | 25           | 0.02                     | 2250.0                |
 | 4    | 1000000.0         | 10           | 0.05                     | 17250.0               |
 | 5    | 5000000.0         | 5            | 0.075                    | 42250.0               |
 | 6    | 10000000.0        | 3            | 0.166                    | 497250.0              |
 | 7    | 20000000.0        | 2            | 0.25                     | 1337250.0             |
 | 8    | 50000000.0        | 1            | 0.5                      | 6337250.0             |

These tiers follow strict monotonic rules: as tiers progress, position notionals
increase, maximum leverage decrease, and maintenance rates increase.
Additionally, each tier's maintenance rate is always lower than its initial
margin rate (determined by maximum leverage).

## Leverage and Initial Margin

Each subaccount has a configurable leverage ratio per perpetual contract.
The maximum leverage for a contract is effectively defined defined by the
maximum leverage of the highest leverage tier (100x in the above example). The
initial margin rate required to open the position is calculated as the
reciprocal of leverage.

When placing an order, the _effective notional_ of the position is calculated
inclusive of the new order at the current [mark
price](./contracts.md#mark-price) as

```text
Open Position Value = units * mark price
Effective Notional = Max (
    Abs(Open Position Value + Bid Order Notional),
    Abs(Open Position Value - Ask Order Notional),
)
```

For example, if the open position is short 1 BTC perpetual contract (`-1 *
10^-decimals` units) at a mark price of 100k, with an additional `0.5@90k` bid
and `0.2@110k` ask, the effective notional is `MAX(ABS(-100k + 45k), ABS(-100k
- 22k)) = 122k`.

The initial margin is used by the position and cannot be used for other
operations (e.g opening more perpetual positions or placing spot orders or
withdrawals). Unrealized PnL is automatically available as initial margin for
new perpetual positions, but only realized PnL is available for spot
operations.

A subaccount's leverage ratio can be changed with open positions and orders,
but the new leverage ratio must satisfy all current position constraints.

### Order Entry

New orders are immediately marked to the contract's mark price, regardless of
the execution price. As such, unrealized PnL is considered part of the initial
margin requirements for new orders. As with spot orders, market orders are
cancelled when reaching the position limit (initial margin limit) instead of
being rejected, while limit orders are preflight-checked as having executed at
their specified limit price, and rejected if there is insufficient margin.

## Maintenance Margin

Cube's maintenance margin system operates independently of the leverage used to
open positions. Instead of considering how a position was opened, it focuses
solely on the position's notional value. This system employs tiers where larger
positions naturally require higher maintenance margins, with each tier defining
its specific maintenance margin rate.

Higher notional amounts required more conservative trading parameters through
lower maximum leverage and higher maintenance requirements. This tiered
approach helps manage risk concentration and potential market impact of large
positions. Positions are liquidated when the subaccount value (including
unrealized PnL) is less than the maintenance margin required.
