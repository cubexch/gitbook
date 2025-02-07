[Perpetual futures contracts](./contracts.md) are derivatives instruments that
provide continuous exposure to an underlying asset without explicit expiration
dates. These contracts maintain price alignment with the spot market through a
funding rate mechanism.

The [funding rate](./funding.md) facilitates price convergence between
perpetual futures and spot markets by transferring payments between long and
short position holders at regular intervals, typically every 8 hours, based on
the magnitude divergence from the underlying spot price and a prevailing
interest rate. When perpetual futures trade at a premium to spot, long
positions pay shorts. Conversely, when perpetual futures trade at a discount,
short positions pay longs.

Cube's perpetual futures trade on a central limit order book, which is a
transparent system that matches orders based on their 'price time priority'.
The highest bid (buy order) and lowest ask (offer or sell order) constitute the
best market for a given contract, ensuring transparent and efficient execution.
This best bid-ask spread is a component of funding rate determination.

Trading perpetual futures requires a Margin-enabled subaccount with sufficient
collateral. Currently, all Cube perpetuals are denominated in and
collateralized with USDC. Each contract specifies [margin
requirements](./margin.md) for opening and maintaining positions and open
orders. Subaccounts that breach maintenance margin requirements are subject to
[liquidation](./liquidation.md).

Position maintenance costs fluctuate based on market conditions, as funding
rates reflect the relative demand for long versus short exposure. During
periods of strong directional sentiment, funding rates can impose significant
holding costs on positions aligned with the prevailing market bias.
