Cube currently offers cross-margined linear perpetual futures contracts for
various digital assets. Each perpetual contract is designed to track the
underlying spot price while providing leverage opportunities.

## Contract Specifications

Perpetual contracts and their parameters are defined as `assets` with
`AssetType::Perpetual` under [market
definitions](/exchange-info.md#markets). The high-level structure is as
follows:

| Field               | Description                                                                                                                                        | Example                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| underlying_asset_id | The underlying asset tracked by this contract                                                                                                      | BTC                                                           |
| settlement_asset_id | Asset used for settlement. This is implicitly also the contract's denominating asset (e.g the contract's Index price is denominated in this asset) | USDC                                                          |
| decimals            | Contract quantity precision, relative to whole units of the underlying asset                                                                       | -5 (each contract unit represents 1e-5 BTC, or 1000 satoshis) |
| symbol              | Trading pair symbol                                                                                                                                | BTC-USDC                                                      |
| market_id           | Unique identifier for the trading market. Each perpetual contract is one-to-one with a market.                                                     | 1000                                                          |
| margin_tier_table_id| The margin tier table for this contract                                                                                                            |                                                               |

Each contract's margin table information can be found in the corresponding
margin table.


## Pricing and Indexes

### Index Price
The index price is calculated using data from multiple exchanges to ensure
robust and manipulation-resistant prices. Used for funding calculations.

The index price calculation follows these key principles:

1. **Multi-Exchange Aggregation**: Prices are sourced from multiple major
   cryptocurrency exchanges to create a weighted average. This diversification
   helps prevent manipulation from any single exchange.

2. **Source-Quality-Weighted**: Each source's contribution to the index is
   weighted based on the source's quality score (which is a function of factors
   including trading volume, liquidity, etc.).

3. **Outlier Filtering**: Extreme price outliers are filtered out using
   statistical methods to maintain index stability and prevent manipulation
   attempts.

4. **Real-Time Updates**: The index price is updated frequently to ensure
   accurate tracking of the underlying market.

5. **Fallback Mechanisms**: If too many sources are unavailable, the market may
   enter a reduce-only mode.

### Mark Price
The mark price is used for PNL calculation and liquidation purposes. Used for
margin calculations (e.g unsettled PnL, liquidation, etc). It is derived from:

The mark price is calculated from the index price, funding rate, and time until
the end of the current funding interval.

```
funding basis = funding rate * (time until funding / funding interval)
mark price    = index price * (1 + funding basis)
```

An implication of this is that at the instant of funding payment, the mark
price change offsets the funding payment, and so the instantaneous account
equity does not change (though the margin requirements might). This results in
a mark price that converges to the spot index price over the course of each
funding interval. Squinting, it's like the future settles every funding
interval. See [funding](./funding.md) for more details.
