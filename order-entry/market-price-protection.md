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
    - check is relative to the current top-of-book prices (TOB)
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

### Description

1. Off-Market Limit Check (`priceBandBid/AskPct`)
    * The **reference price** is the last known price for the asset pair from an external price source.
    * Orders placed more than `priceBandBid/AskPct` off the reference price will be rejected.
    * This hints to participants to establish a market near the last known externally verified price
while still leaving ample room for the market to move away from that price.

2. Aggressing Threshold Calculation (`protectionPriceLevels`)
    * The aggressing threshold (`a_thresh`) is the tighter of the aggressing TOB and the reference price, improved by `protection_levels`.
    * Note that when sending a MarketWithProtection order with no price specified, the aggressing threshold will be used as the halting price.

3. Aggressing Threshold Limit Check (applies only when an opposing market exists, for which there are two possible cases):
    * Order Would Not Cross Market / Not Match (3a)
        * Market orders that don't cross the book will be rejected
        * Limit orders that don't cross the book are always accepted, regardless of the aggressing threshold, assuming they don't violate the Off-Market Limit Check in (1).

    * Order Would Cross Market / Match Immediately (3b)
        * Market orders will execute up to the aggressing threshold (`a_thresh`) or their specified protection price, whichever is tighter.
        * Limit orders with prices better, i.e. less aggressive than `a_thresh` will be accepted and will match immediately.
        * Limit orders with prices worse, i.e. more aggressive than `a_thresh` will be rejected.

Note that if a trader wants to cross a wide market:
- they can 'walk' the aggressing threshold over the opposing side of the market by repeatedly placing non-crossing limit orders close to same-side TOB.
- this moves the `a_thresh` and allows placing an order that crosses the book while remaining within the `a_thresh`.

This behavior encourages tighter markets and allows for gradual price discovery while still preventing trades at undesirable prices.

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
