# Cube Market & User API

## Market Definitions

Definitions are [available as JSON](https://api.cube.exchange/ir/v0/markets)
and provide all of the information needed to convert between on-chain amounts
and the values used on the exchange.  For further details, see the [Trade Api](trade_api.md).

### Market Status Field

Some trading pairs appear in multiple markets,
but only a single market will be in use
for a given trading pair at any given time.

Definitions appear for markets that are no longer in use; these can be used to interpret historical orders.

- Markets that are currently active for trading will have a `status` of `1` or `2`.
- Markets that are no longer in use will have a `status` of `3`.
