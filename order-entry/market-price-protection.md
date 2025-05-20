# Market Price Protection Limits

Price protection limits constrain where orders can be placed in a given market.

## Goals

There are a few competing goals to the protection logic:
- to prevent fills at undesirable prices, e.g. when using Market orders on wide markets or with no specified protection price
- to allow seamless trading when the market is tight
- to make sure that new quotes that would improve the book are never blocked

## Parameters

Three parameters affect price protection, and they can differ between markets:
- `priceBandBidPct`
- `priceBandAskPct`
- `protectionPriceLevels`

You can see the parameters configured for each market in the `markets` section of
the [Cube Market Definitions](https://api.cube.exchange/ir/v0/markets/).

For more details on those definitions, see [Exchange Info](/exchange-info.md).

## Protection Checks

There are two separate checks applied to each incoming order.  Both are considered separately.

When the characteristics of an order fall outside the boundaries of the check,
the order is rejected.

1. `priceBandBidPct` and`priceBandAskPct`
    - check is relative to the last known reference price
    - determines how far orders can be placed from the reference price
    - expressed as percentages, e.g. "25" means 25% of reference price
    - typically, these are very wide (25% and 400% for a factor of 4x ref price)
2. `protectionPriceLevels`
    - Check is relative to the current top-of-book prices (TOB)
    - determines how far orders can be placed from the aggressing-side's best (i.e. TOB) price
    - expressed as a number of levels, e.g. 20 levels away from price 500 is price 520
    - applies only to markets with opposing orders
    - see diagram below for details

## Diagram

This diagram illustrates which prices will cause orders to be rejected.
Note the range of acceptable order prices in yellow:

<figure>
  <picture>
    <img
      src="/images/protection_price_levels_diagram.svg"
      alt="Diagram showing where market price protections apply"
    />
  </picture>
  <figcaption>Market Price Protection Levels</figcaption>
</figure>

### (1) Off-Market Limit Check (`bid/ask_pct`)

The **reference price** is the last known price for the asset pair from an external price source.

Orders placed more than `bid/ask_pct` off the reference price will be rejected.

This hints to participants to establish a market near the last known externally verified price
while still leaving ample room for the market to move away from that price.

### (2) Aggressing Threshold Calculation (`protection_levels`)

The **aggressing threshold** (`a_thresh`) is the tighter of the aggressing TOB and the reference price, improved by `protection_levels`.
- If there is no aggressing TOB, the reference price will be used as the base.
- If there is no opposing market, the aggressing threshold is ignored.

Note that when sending a `MarketWithProtection` order with no price specified, the aggressing threshold will be used as the halting price.

### (3) Aggressing Threshold Limit Check

The aggressing threshold limit applies when an opposing market exists, for which there are two possible cases:

#### Threshold does not Cross Market

Spread is large / market is wide:

- Any order that would cross the book will be rejected, including all Market orders, as they are collared to `a_thresh`.
- Any limit order that don’t cross the book will be accepted

Note that none of this prevents participants from improving the book as they can place orders up until the point of crossing.

In this case, one can 'walk' the aggressing threshold over the opposing side of the market by repeatedly placing non-crossing limit orders close to same-side TOB.

#### Threshold Crosses Market

Spread is small / market is tight:

- Market orders will trade up until `a_thresh` or their specified protection price, whichever is tighter
- Limit orders with a limit price worse than `a_thresh` will be rejected
- Limit orders with a limit price better than `a_thresh`, including those that cross the book, will be accepted

This allows trading near the TOB while providing protection against sudden pulls and sweeps of the opposing book to liquidity takers sending Market orders.

Limit orders are unaffected by pulls or sweeps as the range where a limit order can be placed will only increase as the opposing book retreats.

## Relevant Reject Errors

The following `NewRejectReason`s are sent when price protection rejects an order:

### `PROTECTION_PRICE_WOULD_NOT_TRADE`
- Trader sent a market order with a given protection price
- The protection price is tighter than the opposing TOB, so the order would not trade

Resolution: loosen the protection price to allow more slippage

### `SLIPPAGE_TOO_HIGH`
- Trader sent a market order
- the calculated `a_thresh` is tighter than the opposing TOB, so the order would not trade

Note that this can also appear when sending market orders with a specified protection price
as the order may be able to trade at that price, but not at `a_thresh`.

Resolution: place limit orders on the book to reduce the spread, then try crossing the market again

### `OUTSIDE_PRICE_BAND`
- `a_thresh` is tighter than the limit price or market price
- The order would cross the book and trade at the limit price or market price
- The market is wide, so the order is rejected

This reject is also sent for orders that are too far off the reference price,
or orders with a price of 0.

Resolution: place limit orders on the book to reduce the spread, then try crossing the market again
