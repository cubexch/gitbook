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

## Floated Assets

Because trades in the spot markets are currency swaps and prices can vary with high granularity,
it's common that the amount of the implied-through asset that can be acquired in the first step (USDC)
is not evenly divisible into lots in the target market.  We call this discrepancy the "float".

In the ETH/BTC example, there will either be:
- some amount of USDC acquired in the first source market left over after buying the desired asset in in the second source market (positive float)
- some amount of USDC that will need to be paid into the transaction to cover the full cost of buying the desired asset in the second source market (negative float)

Cube tracks the float continuously between trades.  Whether or not the float is positive or negative in any given trade is handled automatically:
- If the subaccount has a sufficient amount of the implied-through asset in their float account to round the implied-through asset up to the next lot in the second market:
    - That amount will be spent towards covering the purchase of the asset received in the implied match.
    - This results in a slightly improved price and a debit from the floated assets account.
- If the subaccount does not have a sufficient amount of the implied-through asset in their float account to do so:
    - The matching engine will purchase more of the implied-through asset than required to cover the receipt of the asset in the trade, generating a surplus, positive float.
    - This results in a slightly worse price and a credit to the floated assets account that will be used to improve the price in subsequent implied matches.

The amount in the floated assets account will never exceed the value of a single lot.
The max bound is the largest of the lot sizes of all assets, base or quote,
in all markets which participate in implied matches by floating the asset in question.

## Theoretical Price

The "theoretical" price of the implied match is the best possible price for which the implied trade could execute,
Assuming infinite quantity on the top levels of the source markets.
Under that assumption, the executed price would converge to the theoretical price as the executed quantity increases.

Since lot sizes can differ between markets, we need to adjust for them.  Here is one such way:
```
lot size ratio = base lot size / quote lot size
lot size factor =
    ratio(implied market)
    * ratio(quote source market)
    / ratio (base source market)
theoretical price (implied market) =
    base source market price
    / quote source market price
    * lot size factor
```

More concretely, using the example above:
```
ETH/BTC theoretical price = (ETH/USDC price / BTC/USDC price) * lot size factor

If buying ETH/BTC: theoretical price =
    (ETH/USDC ask price / BTC/USDC bid price)
    * (ETH/BTC base lot size / ETH/BTC quote lot size)
    * (BTC/USDC base lot size / BTC/USDC quote lot size)
    / (ETH/USDC base lot size / ETH/USDC quote lot size)

If buying ETH/BTC: theoretical price =
    (ETH/USDC bid price / BTC/USDC ask price)  # only difference vs. the buy case
    * (ETH/BTC base lot size / ETH/BTC quote lot size)
    * (BTC/USDC base lot size / BTC/USDC quote lot size)
    / (ETH/USDC base lot size / ETH/USDC quote lot size)
```

## Executed Price

In practice, trades are for finite quantities and the book is finitely thick.  The executed price and quantity will depend on:
- the quantity of the aggressing order
- the quantity and price on the resting orders on the books of the source markets
    - i.e. not all quantity will be available at the "best" level
- the amount of the traded-through asset in the user's float account at the time of the match
    - i.e. any floated asset previously accumulated will be put towards acquiring the desired asset in a given trade

* The price that appears in the fill message will be the average of the theoretical prices at each executed level, weighted by the quantity executed at each level.
* This price reflects the true price paid, inclusive of the floated asset, and so **may not reflect the ratio between base and quote transacted in the trade**.
* When calculating `RawUnit` amounts for transacted assets, e.g. for reconciliation,
  **use the `fill_quantity * base lot size` for the base asset
  and the `fill_quote_quantity * quote lot size` for the quote asset**.

That said, each match offers the following guarantees:
- The quantity on a single order will always execute at an average price no worse than the limit price.
- If there are orders on the direct book (i.e. the market where the agressing order was placed), and matching against them would produce a better price, the agressing orders will be matched against the direct book.
- An entire match and all fills generated are one atomic operation regardless of how many fills are direct and how many are implied.

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

Via the "Theoretical Price" section, the theoretical price in the implied market is:
```text
(ETH/USDC price / BTC/USDC price) * lot size factor
= 350,000 / 962,000 * 1e5
= 50578.03
```

### Example Aggressing Order

#### Match

1. Aggressing order to Buy 5 ETH on the ETH/BTC market:
    - ETH decimals is 18, i.e. 1 ETH = 1e18 wei
    - Order amount = 5 ETH * 1e18 = 5e18 wei

2. Need to acquire 5e18 wei in the ETH/USDC market:
    - Hit ask at price 350,000: for every 1e15 wei, we will need to pay 350,000 * 1e1 = 3,500,000 rawUSDC
    - 5e18 wei / 1e15 * 3,500,000 = 17,500,000,000 rawUSDC

3. How much BTC will we have to sell in the BTC/USDC market to acquire the 1.75e10 rawUSDC need to cover that purchase?
    - Hit bid at price 692,000: for every 1000 satoshis, we will receive 692,000 * 1e0 = 692,000 rawUSDC (because quote lot size is 1)
    - 17,500,000,000 rawUSDC / price of 692,000 = 25289.0173 base lots in the BTC/USDC market

4. This presents an issue as we can only transact in whole lots, which in this case means whole multiples of 1000 satoshis.  To compensate:
    - Round up and oversell 25,290 lots of BTC into the BTC/USDC market
    - 25,290 * 1e3 = 25,290,000 satoshis
    - This nets us 25290 * 692,000 / 1e0 = 17,500,680,000 rawUSDC
    - Subtracting the 17,500,000,000 used to aquire our ETH, we have 680,000 rawUSDC extra

5. The 680,000 extra rawUSDC (worth ~69 cents; nice) is then added to the aggressor's float account.

#### Fill

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

### Second Identical Aggressing Order

#### Match

If the same aggressor placed the exact same order into the exact same market,
the calculation would start out the same as the first trade, but would diverge in step 3
due to the 680,000 rawUSDC left in the float account from the previous trade:

3. How much BTC will we have to sell in the BTC/USDC market to acquire the 1.75e10 rawUSDC need to cover that purchase?
    - Hit bid at price 692,000: for every 1000 satoshis, we will receive 692,000 * 1e0 = 692,000 rawUSDC (because quote lot size is 1)
    - We already have 680,000 rawUSDC in the float account that can be put towards the purchase
    - We only need to acquire 17,500,000,000 - 680,000 = 17,499,320,000 rawUSDC
    - 17,499,320,000 rawUSDC / price of 692,000 = 25288.0347 base lots in the BTC/USDC market

4. We can only transact in whole lots, so:
    - We round up and sell 25289 lots of BTC into the BTC/USDC market
        - Note that this is different from the first trade, where this would have been 25290
    - This nets us 25289 * 692,000 / 1e0 = 17,499,988,000 rawUSDC
    - Adding the amount from our float account and subtracting the amount used to acquire our ETH, we have:
        - 17,499,988,000 + 680,000 - 17,500,000,000 = 668,000 rawUSDC left over

5. The 668,000 rawUSDC left over is the new balance of the aggressor's float account.

#### Fill

**Emphasized** fields differ from the previous fill:

- ETH/BTC:
  - base lots = 5e18 wei / 1e16 = 500
  - **quote lots** = 25,289,000 satoshis / 1e0 = 25,289,000 (from step 4)
  - price = 50,578 (theoretical price rounded to nearest integer)
- ETH/USDC:
  - base lots = 5e18 wei / 1e15 = 5000
  - quote lots = 17,500,000,000 rawUSDC / 1e1 = 1,750,000
  - price = 350,000 (price level of the resting order)
- BTC/USDC:
  - **base lots** = 25289 (from step 4)
  - **quote lots** = 17,499,988,000 rawUSDC / 1e0 = 17,499,988,000
  - price = 692,000 (price level of the resting order)

**Note that the price given for the ETH/BTC trade is the same as the first trade**,
since the characteristics of the trade are identical,
but the base and quote lots transacted are different.
The floated balance allows the aggressor to receive the same amount of ETH in the ETH/USDC market
while spending one fewer lot of BTC in the BTC/USDC market.

Note: In this second trade, the quote/base ratio is exactly 50,578,
which happens to look the same as the rounded theoretical price (50,578.03 => 50,578),
but this is coincidence.
