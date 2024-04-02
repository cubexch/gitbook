# Implied Matching
Certain markets will be enabled for Implied Matching.  In these markets, aggressing orders may be matched against other markets' books
when doing so would result in a better price than matching against resting orders in the market where the order was placed.

## Terminology and Concept
Consider a trade in the ETH/BTC market where the price of ETH/BTC is implied via ETH/USDC and BTC/USDC.  In this case:
- ETH is the base asset
- BTC is the quote asset
- USDC is the implied-through asset
- ETH/USDC is the source market for the base asset
- BTC/USDC is the source market for the quote asset

The term "implied match" describes such a match against orders in other markets,
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
- During the matching process, if a price level is exhausted, both direct and implied books will be considered before matching further quantity
- All legs of all trades in the match, direct and implied, are executed atomically in all relevant markets from the user's perspective
- The average price of all fills in a single atomic operation will be no worse than the limit price.

## Float and Floated Assets

### Fill Float

Because trades in the spot markets are currency swaps and prices can vary with high granularity,
it's common that the amount of the implied-through asset that can be acquired in the first step (in this case, the USDC)
is not evenly divisible into lots in the target market.  We call this discrepancy the fill's "float".

In the ETH/BTC example, there will either be:
- some amount of USDC acquired in the first source market left over after buying the desired asset in in the second source market (positive float)
- some amount of USDC that, if paid into the transaction, would cover the remaining cost of buying a complete lot in the second source market (negative float)

### Floated Asset Fee

When a subaccount first places a trade that gets filled through an implied asset, Cube collects a fee, paid in that implied asset,
with a value equivalent to the largest size of a single lot of any asset in any market in which that asset is traded.
If a new market is added with a larger single-lot size, the fee will be increased to match.

When that subaccount's orders are being indirectly matched against markets implied through that asset,
Cube will credit or debit your account some amount of the implied-through asset,
where the cumulative sum of such credits and debits never exceeds the value of the Floated Asset Fee.

### Floated Asset Balance

The amount of the fee debited from a given subaccount at any given time is referred to as that subaccount's "Floated Asset Balance".

Cube tracks the floated balance continuously between trades.  The matching engine automatically handles whether or not the float for any given fill is positive or negative based on the Floated Asset Balance at the time of the fill:
1. If the subaccount has a sufficient Floated Asset Balance in the implied-through asset to round up to the next full lot in the second market:
    - That amount will be debited from the Floated Asset Balance
    - The amount will be put towards covering the purchase of the asset received in the implied match.
2. If the subaccount's Floated Asset Balance is insufficient to do so:
    - The matching engine will cause the aggressing order to purchase more of the implied-through asset than required to cover the receipt of the asset in the trade, generating a surplus, positive float.
    - The surplus float will to credited to the Floated Asset Balance
    - The now-higher Floated Asset Balance will be more likely to assist acquisition in subsequent implied matches (case 1 above)

See the [example](./implied-matching.md#Example) below for details on how this such orders are matched.

The Floated Asset Balance for a given subaccount will never be negative, nor will it ever exceed the amount of the Floated Asset Fee.

## Theoretical Price

The theoretical price for a single fill is the ratio of the prices of the source markets.

If a fill would match all assets in the trade to a lot size boundary in every source market:
- that fill would have a float of zero (0)
- the ratio of the quote/base amounts transacted would equal the theoretical price.

All direct market fills have this property, but most implied fills do not. **When a fill's float is nonzero, the theoretical price will not equal the ratio of the quote to the base** as the price is inclusive of the implied-through float.

Since lot sizes can differ between markets, we need to adjust for them.  Here is one way to calculate the theoretical price:
```
lot size ratio = base lot size / quote lot size

lot size factor =
    ratio(implied market)
    * ratio(quote source market)
    / ratio (base source market)

implied market theoretical price =
    base source market price
    / quote source market price
    * lot size factor
```

More concretely, using the formulae above:
```
ETH/BTC theoretical price = (ETH/USDC price / BTC/USDC price) * lot size factor

If buying ETH/BTC: theoretical price =
    (ETH/USDC ask price / BTC/USDC bid price)
    * (ETH/BTC base lot size / ETH/BTC quote lot size)
    * (BTC/USDC base lot size / BTC/USDC quote lot size)
    / (ETH/USDC base lot size / ETH/USDC quote lot size)

If selling ETH/BTC: theoretical price =
    (ETH/USDC bid price / BTC/USDC ask price)  # only difference vs. the buy case
    * (ETH/BTC base lot size / ETH/BTC quote lot size)
    * (BTC/USDC base lot size / BTC/USDC quote lot size)
    / (ETH/USDC base lot size / ETH/USDC quote lot size)
```

## Executed Price

* The price that appears in the fill message will be the average of the theoretical prices at each executed level, each weighted by the quantity executed at that level.
  * Since that value may be between price levels and the API requires an integer for price, it will be rounded to the nearest whole number.  This may change in the future.
* This price reflects the true price paid, inclusive of the floated asset, and so **may not reflect the ratio between base and quote transacted in the trade**.
* When calculating `RawUnit` amounts for transacted assets, e.g. for reconciliation,
  **use the `fill_quantity * base lot size` for the base asset
  and the `fill_quote_quantity * quote lot size` for the quote asset**.

Note that the subaccount's Floated Asset Balance at the time of the match does **not** affect the reported price; see [example](./implied-matching.md#Example) below.

## Effect on Fees
The legs of the implied trade are treated the same as a single-market trade from the perspective of each subaccount participating in the trade.
As such, for the purposes of fee calculation:
- the aggressing order will be charged the taker fee
- all resting orders involved in the match, on the books of any of the markets involved, will be charged the maker fee

## Example
Consider a hypothetical aggressing order to buy 5 ETH on the ETH/BTC market, assuming:
- "Price of Best Order" is the price of the side that would be hit during the implied match
- There's more than enough quantity at that price level in both source markets to fill the aggressing order via implied match
- Structure is:

| Asset | Decimals | Name of Raw Units* |
|-------|----------|--------------------|
| BTC   | 8        | satoshi            |
| ETH   | 18       | wei                |
| USDC  | 6        | rawUSDC            |

*referenced in description below

| Market    | Role     | Base Lot Size | Quote Lot Size | Price of Best Order On Book*            |
|-----------|----------|---------------|----------------|-----------------------------------------|
| BTC/USDC  | source   | 1e3           | 1e0            | 692,000  (= 1 BTC to 69,200 USDC)       |
| ETH/USDC  | source   | 1e15          | 1e1            | 350,000  (= 1 ETH to 3,500 USDC)        |
| ETH/BTC   | implied  | 1e16          | 1e0            | book is empty (i.e. will implied match) |

*integer value as entered on API; defined as `number of quote lots per base lot`

### Human-Readable Price
```
5 ETH for 0.2529 BTC
via 17,500.68 USDC (of which 0.68 USDC will be added to the floated asset balance)
```

### Aggressing Order Calculation (API)

#### Theoretical Price
Via the "Theoretical Price" section, the theoretical price in the implied market is:
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
    - Hit ask at price 350,000: for every 1e15 wei, we will need to pay 350,000 * 1e1 = 3,500,000 rawUSDC
    - 5e18 wei / 1e15 * 3,500,000 = 17,500,000,000 rawUSDC

3. How much BTC will we have to sell in the BTC/USDC market to acquire the 1.75e10 rawUSDC needed to cover that purchase?
    - Hit bid at price 692,000: for every 1000 satoshis, we will receive 692,000 * 1e0 = 692,000 rawUSDC (because quote lot size is 1)
    - 17,500,000,000 rawUSDC / price of 692,000 = 25289.0173 base lots in the BTC/USDC market

4. This presents an issue as we can only transact in whole lots, which in this case means whole multiples of 1000 satoshis.  To compensate:
    - Round up and oversell 25,290 lots of BTC into the BTC/USDC market
    - 25,290 * 1e3 = 25,290,000 satoshis
    - This nets us 25290 * 692,000 / 1e0 = 17,500,680,000 rawUSDC
    - Subtracting the 17,500,000,000 used to aquire our ETH, we have 680,000 rawUSDC extra

5. The 680,000 extra rawUSDC is then added to the aggressor's float account.

#### Filled Legs

The resulting fill will consist of three legs, one in each market.

Pricing in lots, based on the amount transacted and lot size in each market:
- ETH/BTC:
  - base lots = 5e18 wei / 1e16 = 500
  - quote lots = 25,290,000 satoshis / 1e0 = 25,290,000 (from step 4)
  - price = 50,578 (theoretical price rounded to nearest integer)
- ETH/USDC:
  - base lots = 5e18 wei / 1e15 = 5000
  - quote lots = 17,500,000,000 rawUSDC / 1e1 = 1,750,000
  - price = 350,000 (price level of the resting order)
- BTC/USDC:
  - base lots = 25290 (from step 4)
  - quote lots = 17,500,680,000 rawUSDC / 1e0 = 17,500,680,000
  - price = 692,000 (price level of the resting order)

**Note that in the aggressed market, ETH/BTC, the price is not the ratio of the base/quote (50,580)
because it accounts for the floated amount, which itself is compensating for the fact that
the exact price transacted in the implied market in inexpressible in the two source markets.**

### Subsequent Aggressing Order (API)

#### Theoretical Price

The market conditions are same as the first trade, so the calculation is the same as the first trade (50,578.035).

#### Matching Process

The matching calculation diverges in step 3 due to the 680,000 rawUSDC available in the [Floated Asset Balance](./implied-matching.md#floated-asset-balance) from the previous trade:

3. How much BTC will we have to sell in the BTC/USDC market to acquire the 1.75e10 rawUSDC needed to cover that purchase?
    - Hit bid at price 692,000: for every 1000 satoshis, we will receive 692,000 * 1e0 = 692,000 rawUSDC (because quote lot size is 1)
    - The Floated Asset Balance of 680,000 rawUSDC will be applied towards the purchase
    - We only need to acquire 17,500,000,000 - 680,000 = 17,499,320,000 rawUSDC
    - 17,499,320,000 rawUSDC / price of 692,000 = 25288.0347 base lots in the BTC/USDC market

4. We can only transact in whole lots, so:
    - We round up and sell 25289 lots of BTC into the BTC/USDC market
        - Note that this is different from the first trade, where this would have been 25290
    - This nets us 25289 * 692,000 / 1e0 = 17,499,988,000 rawUSDC
    - Adding the amount of the Floated Asset Balance and subtracting the amount used to acquire our ETH, we have:
        - 17,499,988,000 + 680,000 - 17,500,000,000 = 668,000 rawUSDC left over

5. The 668,000 rawUSDC left over is the new Floated Asset Balance of the aggressing subaccount.

#### Filled Legs

**Emphasized** fields differ from the previous fill:

- ETH/BTC:
  - base lots = 5e18 wei / 1e16 = 500
  - **quote lots = 25,289,000 satoshis / 1e0 = 25,289,000** (from step 4)
  - price = 50,578 (theoretical price rounded to nearest integer)
- ETH/USDC:
  - base lots = 5e18 wei / 1e15 = 5000
  - quote lots = 17,500,000,000 rawUSDC / 1e1 = 1,750,000
  - price = 350,000 (price level of the resting order)
- BTC/USDC:
  - **base lots = 25289** (from step 4)
  - **quote lots = 17,499,988,000 rawUSDC / 1e0 = 17,499,988,000**
  - price = 692,000 (price level of the resting order)

#### Points of Note for the Second Trade
- **The price given for the ETH/BTC trade is the same as the first trade**,
since the characteristics of the trade are identical.
- The base and quote lots transacted are different,
since the application of the Floated Asset Balance allows the aggressor to receive the same amount of ETH in the ETH/USDC market
while spending one fewer lot of BTC in the BTC/USDC market.
- The quote/base ratio is exactly 50,578,
which happens to look the same as the rounded theoretical price (50,578.03 => 50,578),
but this is a coincidence.
