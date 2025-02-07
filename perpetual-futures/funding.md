Funding occurs at regular intervals in order to encourage price convergence
betweewn the perpetual contract and the underlying index price. Funding is only
paid by those with an open position at the time of the funding event,
regardless of when during the interval the position was opened. Moreover, the
amount of funding paid is based proportionally on the position value (defined
as `ABS(open contracts * mark price)`) at the time of the funding event,
regardless of subaccount leverage.

# Funding Calculation

The funding rate is composed of an interest component and a premium/discount
component.

The premium/discount component is calculated based on the average divergence of
the perpetual contract market from the index price.

Specifically, every `funding_rate_calculation_interval`, a 'snapshot' of the
order book is taken by sampling the perpetual contract's impact bid and ask
prices. Where `impact_bid_price` and `impact_ask_price` are the average
execution prices of aggressing `impact_bid_quantity` and `impact_ask_quantity`
into the order book. From this, we calculate the premium index as:

```
premium_index = (
  MAX(impact_bid_price - index_price, 0)
  - MAX(index_price - impact_ask_price, 0)
) / index_price
```

Every `funding_interval`, the funding rate is calculated as:

```
premium_index = AVG(premium_index)
funding_rate = premium_index + clamp(interest_rate - premium_index, -clamp, +clamp)
```

Currently, the interest rate is a fixed 0.01% per day, and clamp is a fixed 0.05%.

This funding is then clamped between the contract-specified minimum/maximum
funding rates. The clamped funding rate is then applied to the position value
to calculate the funding.

# Funding Application

```
funding = open contracts * index price
    * funding_rate
    * funding_interval / funding_period
```

Funding is credited or debited from the unsettled balance for every open
position, and is net zero across all positions since there are no fees
collected on the payments.

Funding is an atomic event from the perspective of exchange participants.
During the funding event, note that `mark_price == index_price`, and only after
the event is complete does the mark price get offset by the [funding
basis](./contracts.md#mark-price).
