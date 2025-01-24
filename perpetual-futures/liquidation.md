Liquidation is a multi-step process that is trigged when a trader's account
equity is below the maintenance margin requirement. The liquidation process
helps prevent negative account equity and maintains market stability.

# Liquidation Process

Liquidation occurs over the following steps:

1. Open Market Liquidation
    - Open order cancellation
    - Market close positions
2. Takeover Liquidation and Auto-Deleveraging (ADL)
3. Insurance Fund and Socialized Loss

At each step, if the account equity is now above the maintenance margin
requirements, liquidation is complete and the process stops.

## Open Market Liquidation

Liquidation begins with forced open-market operations. Here, the liquidatee
(subaccount being liquidated) automatically performs market operations to
attempt to increase account health.

### Open Order Cancellation

First, the system automatically cancels all open orders. This cancellation is
crucial as open orders require maintenance margin allocation. By releasing this
allocated margin, the account may return to a healthy state without further
intervention.

### Market Close Positions

Second, if the position remains unhealthy after order cancellation, the system
attempts to close positions through market orders. These closure attempts
target prices more favorable than the designated liquidator price, protecting
both the trader and market stability.

## Takeover Liquidation and Auto-Deleveraging (ADL)

If open market liquidation is unsuccessful, the protocol enables position
takeover through two mechanisms:

Active liquidators may assume control of all positions at the predetermined
liquidator price. This provides an opportunity for market participants to
strategically acquire positions while supporting system stability.

If there is insufficient capacity for backstop liquidity, the system implements
Auto-Deleveraging (ADL), where traders holding opposing positions automatically
assume portions of the liquidated position. The ADL process prioritizes traders
based on their PnL ranking.

```
unrealized PnL = open contracts * (mark price - cost basis)
effective leverage = open contract * mark price / account equity

ranking = if unrealized PnL > 0 {
    unrealized PnL * effective leverage
} else {
    unrealized PnL / effective leverage
}
```

Position rankings are calculated for open positions and sorted to determine the
order of deleveraging.


## Insurance Fund and Socialized Loss

Once all positions are closed, any remaining settlement-asset losses are
evaluated against the insurance fund. The fund serves as a protective buffer,
covering losses to the extent of its available resources.

In cases where the insurance fund is insufficient to cover remaining losses,
the protocol implements socialized loss distribution. Losses are allocated
across all traders proportionally to their current notional position sizes,
ensuring system stability through collective risk sharing.


# Prices

## Liquidation Price

The price for a perpetual contract at which liquidation occurs for the
calculated subaccount, supposing that the prices of everything else is
constant.

Liquidation occurs when account equity is below the maintenance margin
requirement. The constituent changes in the provided contract's price is as
follows:

```text
   SUM(spot balance) + SUM(units * price + quote) < SUM(maintenance_margin(units * price))
=> SUM(s_i) + SUM(u_j * p_j + q_j) < SUM(maintenace_margin_j(u_j * p_j))
=> SUM(s_i) + SUM_j!=x(u_j * p_j + q_j) + (u_x * p_x + q_x)
        < SUM_j!=x(maintenace_margin_j(u_j * p_j)) + maintenace_margin_x(u_x * p_x)

   let C1 = SUM(s_i) = spot_balance
   let C2 = SUM_j!=x(u_j * p_j + q_j)
          = unsettled - (u_x * p_x + q_x)
   let C3 = SUM_j!=x(maintenace_margin_j(u_j * p_j))
          = maintenance_margin - maintenance_margin_x(u_x * p_x)
   let K = C3 - C1 - C2

=> C1 + C2 + (u_x * p_x + q_x) < C3 + maintenance_margin_x(u_x * p_x)
=> (u_x * p_x + q_x) - maintenance_margin_x(u_x * p_x) < K
=> (u_x * p_x) - maintenance_margin_x(u_x * p_x) < K - q_x
```

The left-hand-side is a piecewise continuous function of the contract's price.
We can then back out threshold price from the margin table. i.e for a given
tier:

```text
   maintence_margin_x(u_x * p_x) = MMR * u_x * p_x - OFFSET
=> (u_x * p_x) - (MMR * ABS(u_x * p_x) - OFFSET) = K - q_x
=> p_x = (K - q_x - OFFSET) / (1 - MMR * SIGN(u_x)) / u_x
```

## Bankruptcy Price

The price at which the account is bankrupt, supposing that the prices of
everything else is constant.

```text
   SUM(spot balance) + SUM(units * price + quote) < 0
=> C1 + C2 + (u_x * p_x + q_x) < 0
=> p_x < -(C1 + C2 + q_x) / u_x
```

## Liquidator Price

The price that the liquidator would pay for the contract.

This is a price improvement over the oracle price to incentivize liquidators to
provide liquidity, while ensuring that cascading liquidations and thin order
books do not result in egrigious liquidation prices.
