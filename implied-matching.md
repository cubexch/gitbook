# Summary
Certain markets will be enabled for Implied Matching.  In these markets, aggressing orders may be matched against other markets' books
when doing so would result in a better price than matching against resting orders in the market where the order was placed.

## Terminology and Concept
Consider a trade in an ETH/BTC market where the price of ETH/BTC is implied via ETH/USDC and BTC/USDC.  In this case:
- ETH is the base asset
- BTC is the quote asset
- USDC is the implied-through asset
- ETH/USDC is the source market for the base asset
- BTC/USDC is the source market for the quote asset

In this case, there are two sets of orders for the ETH/BTC pair:
- The direct market, consisting of the order book for the ETH/BTC market.
- The implied market, calculated from the orders on the source base and source quote markets.

The term "implied match" describes such a match against the orders in the source markets,
while the term "direct match" describes a match against orders on the book
in the same market as the aggressing order.

An aggressing Bid in ETH/BTC triggering an implied match would result in:
- first, selling the BTC in the BTC/USDC market to acquire the implied-through asset, USDC
- second, using that USDC to Buy ETH in the ETH/USDC market

... thus executing the intent of the original order - to acquire ETH using BTC.

The same logic applies if the order is an Ask, with the markets reversed:
- first, acquire USDC by Selling ETH into the ETH/USDC market
- second, acquire BTC by Buying BTC in the BTC/USDC market using the proceeds of the first transaction

... as this would acquire BTC using ETH.

## Match Characteristics
When a match takes place in a market with implied pricing enabled:
- The match will take place against whichever of the direct and implied books offers the best price.
- If a price level is exhausted during the match, both direct and implied books will be considered again for the best price before matching further quantity
- A single match could result in a combination of direct and implied fills, but regardless of the distribution, all fills in the match are executed atomically from the perspective of all relevant markets
- Currently, only aggressing orders can match against the implied market.
  This means that price movements in the implied market could cause it to cross resting orders on the book in the direct market, creating an arbitrage opportunity.

# Implied Price

The implied price for a single fill is the ratio of the prices of the source markets.

If the aggressing order trades against multiple levels, the price will be the average of the implied prices at each executed level,  weighted by the quantity executed at each level.

Since that value may be between price levels and the API requires an integer for price, the price reported on the API will be rounded to the next price level away from the market (i.e. up for bids, down for asks).

The market data `TopOfBook` feed disseminates best bid and ask levels in separate fields for:
- the direct market
- the implied market
- the better of the two considered together

## Example Calculation

Since lot sizes can differ between markets, we need to adjust for them.  Here's one way to calculate the implied price:
```
lot size ratio = base lot size / quote lot size

lot size factor =
    ratio(implied market)
    * ratio(quote source market)
    / ratio (base source market)

implied price =
    base source market price
    / quote source market price
    * lot size factor
```

More concretely, using the markets above:
```
ETH/BTC implied price = (ETH/USDC price / BTC/USDC price) * lot size factor

If buying ETH/BTC: implied price =
    (ETH/USDC ask price / BTC/USDC bid price)
    * (ETH/BTC base lot size / ETH/BTC quote lot size)
    * (BTC/USDC base lot size / BTC/USDC quote lot size)
    / (ETH/USDC base lot size / ETH/USDC quote lot size)

If selling ETH/BTC: implied price =
    (ETH/USDC bid price / BTC/USDC ask price)  # flipped bid/ask vs. the buy case; below lines are the same
    * (ETH/BTC base lot size / ETH/BTC quote lot size)
    * (BTC/USDC base lot size / BTC/USDC quote lot size)
    / (ETH/USDC base lot size / ETH/USDC quote lot size)
```

# Implied Match Fee
Because trades in the spot markets are currency swaps and the tick size of an asset can vary between markets,
it's common that the amount of the implied-through asset that can be acquired in the first source market (in this case, the USDC)
is not evenly divisible into lots in the second market where that asset is divested.

In the event of a lot size mismatch, the Cube matching engine will:
- round out to the next worst price level (i.e. the next whole lot)
- charge a fee equal to the amount of the rounding

For example:
```text
Aggressing Bid for 1 base lot matches when Implied Price is 6.7:
  Aggressor is credited the 1 base lot
  Aggressor is debited 7 quote lots
  Cube takes implied match fee equal to 0.3 quote lots
```

Since rounding is done to the lot, the value of the fee for any given order
will always be less than a single lot of either the base or quote asset.
**Note that this is the lot size of the asset in the source market providing the liquidity,
not the market in which the aggressing order is placed.**

The [implied match example](implied-matching.md#example) contains a more precise illustration of this behavior.

## Notes on Implied Match Fee
When an aggressing order results in an implied match, the Order Service will send an `ImpliedMatchFee` message after the match completes.  This information has no effect on settlement as the amount of the fee is already accounted for in the quantities reported in each `Fill` message.

Like the per-fill trading fee, the Implied Match Fee is reported in the asset received in the trade:
- Bid => fee paid in base asset
- Ask => fee paid in quote asset

This conversion is done using the last filled price of the X/S source market, where:
- X is the asset received (either BTC or ETH in above example)
- S is the implied-through asset (USDC in above example)

Unlike the trading fee, which is charged per-fill,
the implied match fee is charged once on the entire match,
i.e. once per-order.

If the lot sizes of the source markets happen to line up perfectly,
the amount of the implied match fee will be zero.

## Notes on Trading Fee
Implied fills incur trading fees in [the same way as direct fills](cube-fees.md).

All legs of the implied trade are treated the same way as a direct fill would be in their respective books:
- the aggressing order will be charged the taker fee rate
- all resting orders involved in the match, on the books of any of the markets involved, will be charged the maker fee rate

## Calculating Amount to be Settled
The `quantity` fields in the `Fill` message reflect the amounts that will be settled:
- **Inclusive** of any implied asset fees
- **Exclusive** of any trading fees

...such that calculating the `RawUnit` amount filled remains the same as for a direct market, namely:

```text
Divested Asset:
  -(quantity * lot size)
Received Asset:
  (quantity * lot size) - trade fee amount
```

## Relationship to `fill_price`

Note that for trades resulting in an [Implied Match Fee](implied-matching.md#implied-match-fee),
**the price reported in the fill message will not equal the ratio of the quote quantity to the base quantity**,
for two reasons:
- The `fill_price` reported is net of the implied asset fee, if any
- If the implied price is fractional, it will be rounded to the next worst level due to API limitations

> ### Important
> Do not rely on the `fill_price` field when calculating `RawUnit` amounts for transacted assets.
>
> Use the `fill_quantity * base lot size` for the base asset
> and the `fill_quote_quantity * quote lot size` for the quote asset.

## Opting Out
Implied Match is a feature of the market, so there's no way to disable it for your account.

If you don't wish to participate in implied matching, or to be subject to the implied match fee,
you can still trade on these markets by sending orders as POST_ONLY.

# Detailed Example
Consider a hypothetical aggressing order to buy 5 ETH on the ETH/BTC market, assuming:
- "Price of Best Order" is the price of the side that would be hit during the implied match
- There's more than enough quantity at that price level in both source markets to fill the aggressing order via implied match
- Structure is:

| Asset | Decimals | Name of Raw Units* |
|-------|----------|--------------------|
| BTC   | 8        | satoshi            |
| ETH   | 18       | wei                |
| USDC  | 6        | rawUSDC            |

*referenced in description below to reduce ambiguity

| Market    | Role     | Base Lot Size | Quote Lot Size | Price of Best Order On Book*            |
|-----------|----------|---------------|----------------|-----------------------------------------|
| BTC/USDC  | source   | 1e3           | 1e0            | 692,000  (= 1 BTC to 69,200 USDC)       |
| ETH/USDC  | source   | 1e15          | 1e1            | 350,000  (= 1 ETH to 3,500 USDC)        |
| ETH/BTC   | implied  | 1e16          | 1e0            | book is empty (i.e. will implied match) |

*integer value as entered on API; defined as `number of quote lots per base lot`

### Value of Traded Assets

In human-readable terms, this trade will exchange:

```
5 ETH for 0.2529 BTC
via 17,500.68 USDC (of which 0.68 USDC will be taken as an Implied Match Fee)
```

### Aggressing Order Calculation (API)

#### Implied Price
The implied price in the implied market is:
```text
(ETH/USDC price / BTC/USDC price) * lot size factor
= 350,000 / 692,000 * 1e5
= 50,578.035
```

#### Matching Process

1. Aggressing order to Buy 5 ETH on the ETH/BTC market:
    - ETH decimals is 18, i.e. 1 ETH = 1e18 wei
    - Order amount = 5 ETH * 1e18 = 5e18 wei

2. Need to acquire 5e18 wei in the ETH/USDC market:
    - Hit ask at price 350,000: for every 1e15 wei, we will need to pay 350,000 * 1e1 = `3,500,000 rawUSDC`
    - 5e18 wei / 1e15 * 3,500,000 = `17,500,000,000 rawUSDC`

3. How much BTC will we have to sell in the BTC/USDC market to acquire the 1.75e10 rawUSDC needed to cover that purchase?
    - Hit bid at price 692,000: for every 1000 satoshis, we will receive 692,000 * 1e0 = `692,000 rawUSDC` (because quote lot size is 1)
    - 17,500,000,000 rawUSDC / price of 692,000 = `25,289.0173 base lots` in the BTC/USDC market

4. This presents an issue as we can only transact in whole lots, which in this case means whole multiples of 1000 satoshis.  To compensate:
    - We round up and oversell `25,290 lots` of BTC into the BTC/USDC market
    - The fractional `0.9827 lots` of BTC will be taken as the Implied Match Fee

#### Filled Legs

The resulting fill will consist of three legs, one in each market.

Pricing in lots, based on the amount transacted and lot size in each market:
- ETH/BTC:
  - base lots = 5e18 wei / 1e16 = `500`
  - quote lots = 25,290,000 satoshis / 1e0 = `25,290,000` (from step 4)
  - price = `50,579` (implied price rounded up, since this is a Bid)
- ETH/USDC:
  - base lots = 5e18 wei / 1e15 = `5000`
  - quote lots = 17,500,000,000 rawUSDC / 1e1 = `1,750,000`
  - price = `350,000` (price level of the resting order)
- BTC/USDC:
  - base lots = `25290` (from step 4)
  - quote lots = 17,500,680,000 rawUSDC / 1e0 = `17,500,680,000`
  - price = `692,000` (price level of the resting order)

Note that in the aggressed market, ETH/BTC,
**the implied price is not the ratio of the base/quote (50,580)**
because it's inclusive of the Implied Match Fee.
