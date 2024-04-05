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
- If a price level is exhausted during the match, both direct and implied books will be considered for matching further quantity
- All legs of all trades in the match, direct and implied, are executed atomically in all relevant markets

# Implied Price

The implied price for a single fill is the ratio of the prices of the source markets.

If the aggressing order trades against multiple levels, the price will be the average of the implied prices at each executed level,  weighted by the quantity executed at each level.

Since that value may be between price levels and the API requires an integer for price, the price reported on the API will be rounded to the next price level away from the market (i.e. up for bids, down for asks).

## Example Calculation

Since lot sizes can differ between markets, we need to adjust for them.  Here is one way to calculate the implied price:
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

More concretely, using the formulae above:
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

# Fees and Rebates

Two fees may be present on an implied fill:
- An [Implied Match Fee or Rebate](./implied-matching.md#ImpliedMatchFeeOrRebate)
- The usual [Trading Fee](./implied-matching.md#TradingFee)

## Implied Match Fee or Rebate

### Lot Size Mismatch
Because trades in the spot markets are currency swaps and prices can vary with high granularity,
it's common that the amount of the implied-through asset that can be acquired in the first step (in this case, the USDC)
is not evenly divisible into lots in the target market.

### Decision to Fee or Rebate

In the event of a lot size mismatch, the Cube matching engine will either:
- round up to the next lot of the divested asset and take a fee equal to the difference
- round down to the previous lot of the divested asset and provide the shortfall in the form of a rebate

Cube tracks the value of implied match fees paid by each individual subaccount across all markets in real-time,
a value referred to as the **Floated Balance**.

The decision to choose fee or rebate for any given trade is based on the Floated Balance at the time of the match.
For example:
```text
Aggressing Bid for 1 base lot, Implied Price is 6.7:

If Floated Balance value < 0.7 quote lots,
  Aggressor sells 7 quote lots; Cube takes implied fee equal to 0.3 quote lots
If Floated Balance value >= 0.7 quote lots,
  Aggressor sells 6 quote lots; Cube provides implied rebate equal to 0.7 quote lots

The aggressor receives the same 1 base lot in either case.
```

The value of the fee or rebate for any given trade will always be less than a single lot of either the base or quote asset.
The [implied match example](./implied-matching.md#Example) contains a more precise illustration of this behavior.

Since any previously paid fees are rebated whenever possible on future implied trades,
the assets settled are always within one lot of the implied price
regardless of how many trades are filled via implied markets.

### Asset for Fee or Rebate
Like trading fees, the Implied Match Fee or Rebate is denominated in the asset received in the trade:
- Bid => fee paid/rebate received in base asset
- Ask => fee paid/rebate received in quote asset

## Trading Fee
Implied fills incur trading fees in [the same way as direct fills](./trading_fees.md).
This fee is charged on top of the implied match fee or rebate.
All legs of the implied trade are treated the same way as a direct fill would be in their respective books.

For the purposes of calculating the trading fees:
- the aggressing order will be charged the taker fee rate
- all resting orders involved in the match, on the books of any of the markets involved, will be charged the maker fee rate

# Reconciling Fills (API)

## Calculating Transacted Amount

Due to current API limitations, the price and quantities are reported as whole integers.
To avoid breaking this relationship:

- The `quantity` fields in the `Fill` message reflect the amounts that will be settled:
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

Note that for trades resulting in an [Implied Match Fee or Rebate](./implied-matching.md#ImpliedMatchFeeOrRebate),
**the price reported in the fill message will not equal the ratio of the quote quantity to the base quantity**,
for two reasons:
- The `fill_price` reported is net of the implied asset fees/rebates
- If the implied price is fractional, it will be rounded to the next worst level due to API limitations

> Do not reply on the `fill_price` field when calculating `RawUnit` amounts for transacted assets.
>
> Use the `fill_quantity * base lot size` for the base asset
> and the `fill_quote_quantity * quote lot size` for the quote asset.

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

*referenced in description below

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
    - Hit ask at price 350,000: for every 1e15 wei, we will need to pay 350,000 * 1e1 = 3,500,000 rawUSDC
    - 5e18 wei / 1e15 * 3,500,000 = 17,500,000,000 rawUSDC

3. How much BTC will we have to sell in the BTC/USDC market to acquire the 1.75e10 rawUSDC needed to cover that purchase?
    - Hit bid at price 692,000: for every 1000 satoshis, we will receive 692,000 * 1e0 = 692,000 rawUSDC (because quote lot size is 1)
    - 17,500,000,000 rawUSDC / price of 692,000 = 25,289.0173 base lots in the BTC/USDC market

4. This presents an issue as we can only transact in whole lots, which in this case means whole multiples of 1000 satoshis.  To compensate:
    - We round up and oversell 25,290 lots of BTC into the BTC/USDC market
    - The fractional 0.9827 lots of BTC will be taken as the Implied Match Fee

#### Filled Legs

The resulting fill will consist of three legs, one in each market.

Pricing in lots, based on the amount transacted and lot size in each market:
- ETH/BTC:
  - base lots = 5e18 wei / 1e16 = 500
  - quote lots = 25,290,000 satoshis / 1e0 = 25,290,000 (from step 4)
  - price = 50,579 (implied price rounded up, since this is a Bid)
- ETH/USDC:
  - base lots = 5e18 wei / 1e15 = 5000
  - quote lots = 17,500,000,000 rawUSDC / 1e1 = 1,750,000
  - price = 350,000 (price level of the resting order)
- BTC/USDC:
  - base lots = 25290 (from step 4)
  - quote lots = 17,500,680,000 rawUSDC / 1e0 = 17,500,680,000
  - price = 692,000 (price level of the resting order)

**Note that in the aggressed market, ETH/BTC, the implied price is not the ratio of the base/quote (50,580)
because it's inclusive of the Implied Match Fee.  This compensates for the fact that
the exact price transacted in the implied market in inexpressible in the two source markets.**

### Subsequent Aggressing Order (API)

#### Implied Price

The market conditions are same as the first trade, so the calculation is the same as the first trade (50,578.035).

#### Matching Process

This match diverges in step 4 due to the Floated Balance generated by the fee collected in the previous trade:

4.
    - Same as the previous trade, we need to acquire 25,289.0173 base lots in the BTC/USDC market
    - This time, we have a Float Balance with a value equal to 0.9827 lots of BTC
    - 0.9827 > 0.0173, so Cube rebates us the 0.0173 lots
    - We need to sell only 25,289 lots of BTC into the BTC/USDC market (not 25,290 as before)
    - The aggressing subaccount has a new Floated Balance equivalent to 0.9827 - 0.0173 = 0.9654 lots of BTC.

#### Filled Legs

**Emphasized** fields show how this fill differs from the first fill:

- ETH/BTC:
  - base lots = 5e18 wei / 1e16 = 500
  - **quote lots = 25,289,000 satoshis / 1e0 = 25,289,000** (from step 4)
  - price = 50,579 (implied price rounded up, since this is a Bid)
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
since the rebate allows the aggressor to receive the same amount of ETH in the ETH/USDC market
while spending one fewer lot of BTC in the BTC/USDC market.
- The quote/base ratio in this example is exactly 50,578,
which happens to look the same as the rounded implied price (50,578.03 => 50,578),
but this is a coincidence.
