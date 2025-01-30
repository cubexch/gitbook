
## Spot Balance

Settlement asset (USDC) in the account. Spot balance is the [`available` amount
in AssetPosition](/order-entry/websocket-api.md#assetposition).

This is the settled USDC balance, and is always in your MPC wallet on chain.
Note that this balance excludes spot units this are reserved for open spot
orders or intents.

## Unsettled Balance

The unsettled balance (including Pnl, funding, fees, etc) for a particular
perpetual contract. This is equal to [`units * mark_price +
quote`](/order-entry/websocket-api.md#contractposition) for each perpetual
contract position. That is, each perpetual contract has a separate unsettled
balance, and the account's unsettled balance is their linear sum.

Note that this is distinct from the _unrealized PnL_, which is determined by
the cost basis and current mark price.

## Settlement

As mark prices change continuously, the value of open positions also change
continuously. Settlement is the discretized process of moving unsettled balance
from the open perpetual positions into the settlement asset (USDC) token
balance. Note that settlement does not have an impact on open positions or
account health, and is performed over the entire subaccount (i.e positive
unsettled balance in one contract cannot be settled independently of others).

Settlement takes two perpetual market participants with unsettled balance of
opposite signs, and reduces the magnitude of that unsettled balance equally for
each party by transferring USDC between the accounts. Settlement is fully
peer-to-peer, and require on-chain transactions to settle the token balance.
Note that since settlement is between accounts and not perpetual contracts,
party A who only traded contract X might be settled with party B who only
traded contract Y (where ostensibly some chain of intermediate parties had the
offsetting positions between).

Morever, settlement can only be initiated by acconuts with positive
realized PnL (and specifically, when the free balance is positive). But note
that the counterparty's negative unsettled PnL might be entirely from
unrealized PnL.

PnL can be settled at any time, and is settlement is performed automatically
when spot operations are performed that require additional spot balance.

### Example

Suppose Alice buys 1 BTC perpetual from Bob at 100k. Both have sufficient spot
balance.

| Operation         | Alice Open | Alice Unsettled | Alice Realized | Bob Open | Bob Unsettled | Bob Realized |
| ----------------- | ---------- | --------------- | -------------- | -------- | ------------- | ------------ |
| Initial           | 0          | 0               | 0              | 0        | 0             | 0            |
| Trade 1 @ 100k    | +1 BTC     | 0               | 0              | -1 BTC   | 0             | 0            |
| BTC mark @ 110k   | +1 BTC     | 10000           | 0              | -1 BTC   | -10000        | 0            |
| Funding 10 USDC   | +1 BTC     | 9990            | -10            | -1 BTC   | -9990         | 10           |
| Trade -0.5 @ 110k | +0.5 BTC   | 9990            | 4990           | -0.5 BTC | -9990         | -4990        |
| Trade -0.5 @ 100k | 0          | 4990            | 4990           | 0        | -4990         | -4990        |
| Settlement        | 0          | 0               | 4990           | 0        | 0             | -4990        |

Throughout this process, Alice and Bob's spot balances remain unchanged until
the final Settlement operation.

## Other Terminology

- **Unrealized PnL**: The total profit or loss of open positions.
- **Equity**: The total value of the account.
- **Wallet Balance**: The total value of the account, excluding unrealized PnL.
- **Available Balance**: The total value of the account, minus margin requirements.
- **Free Balance**: The amount of funds that can be used for spot operations
  from the account.

As formulas:

```
Unrealized PnL = SUM(Quantity * (Price - Cost Basis))
Equity = Spot Balance + Unsettled Balance
Wallet Balance = Equity - Unrealized PnL
Available Balance = Equity - Margin Requirement
Free Balance = max(0, min(Wallet Balance, Available Balance) - Margin Requirement)
```
