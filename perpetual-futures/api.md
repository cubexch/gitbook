
# Margin Subaccounts

- To trade perpetual futures, you must create a subaccount enabled for `margin`
  trading. This subaccount is a superset of the `spot` subaccount type, and can
  perform all relevant spot operations (assuming sufficient margin).
    - [`{"accountType": "margin"}`](/exchange-info.md#users-subaccounts-1)

- To change the leverage override for a praticular contract.
    - [`{"contractId":"123","leverage":10}`](/exchange-info.md#users-subaccount-subaccount_id-1)

# New Messages

## Order Entry

- [ContractPosition](/order-entry/websocket-api.md#contractposition)
    - Open perpetual contract positions. Including (average) cost basis used
      for PnL calculations (used for e.g [free
      balance](./pnl-settlement.md#other-terminology) calculations).,
      cumulative funding paid / accrued, etc.

## Market Data

- [FundingCalculation](/market-data/websocket-api.md#fundingcalculation)
- [FundingApplication](/market-data/websocket-api.md#fundingapplication)
- [ContractStatistics](/market-data/websocket-api.md#contractstatistics)
