# Stop Orders

A stop order is an order that may be active on the exchange without resting on the orer book.  When the market trades at a price equal to or worse than the order's `stop_price`, the order is triggered, and it matches as if it were just placed.

Stop orders must be placed with a `TimeInForce` of `GOOD_FOR_SESSION`.  The type of the order determines the `TimeInForce` behavior after the stop order triggers.  Submitting a stop order with any TIF other than `GOOD_FOR_SESSION` will result in an `INVALID_TIF_FOR_ORDER_TYPE` reject.

## Order Types

### `STOP_LOSS` (OrderType = 3)

Also called a **Take Profit** order. When triggered, executes as an **IOC MarketWithProtection** order.

- `stop_price` (required): the price level at which the order triggers.
- `price` (optional): if provided, acts as the **protection price** for the resulting MarketWithProtection order, capping the worst acceptable fill price. If omitted, the exchange uses the default market protection price (see [Market Price Protection](/order-entry/market-price-protection.md)).

### `STOP_LIMIT` (OrderType = 4)

When triggered, executes as a **GFS Limit** order.

- `stop_price` (required): the price level at which the order triggers.
- `price` (required): the **limit price** of the resulting limit order after triggering.

## Trigger Mechanics

After each execution in a given market, the matching engine evaluates stop orders active in that market to see if the fill was equal to or worse than the stop price:

- **Bid stop**: triggers when `fill_price >= stop_price` (price rises to or above the stop).
- **Ask stop**: triggers when `fill_price <= stop_price` (price falls to or below the stop).

The trigger is then added to the matching queue like any other order request.

To maintain market fairness, the Stop Order **will not** be executed atomically with the fill that triggered it.  Any orders on the matching queue (i.e. in-flight) will have priority over the triggered stop order.

When the trigger reaches the front of the queue, the order matches, and the API will deliver a second `NewAck` with a `status` of `OPEN`, followed by any resulting fills or cancels.

## Order Placement Status

The `status` field on a resting order indicates the stop order's current state:
- `PENDING_OPEN = 1`: The stop order is waiting for its trigger condition to be met. The order is active on the exchange but is not yet matching against the book.
- `OPEN = 2`: The stop order has been triggered and the underlying order is now active on the book.

If using the Websocket API:
- All active orders will appear in the `OrderBookUpdate` message on bootstrap.
- You can use the `order_type` field to determine if an order is a Stop Order and the `status` field to determine if the order is resting on the book.
- Only stop orders can have a `status` of `PENDING_OPEN`.

## Price Constraints

The matching engine validates the relationship between `stop_price` and the limit or protection price at submission time. The constraint ensures that when the order triggers, the limit or protection price is equal to or worse than the stop price, which ensures that the order would fill at the stop price if able:
- BID: `price >= stop_price` — the limit or protection price must be at or above the stop, ensuring the triggered order can fill as the price rises through the stop.
- ASK: `price <= stop_price` — the limit or protection price must be at or below the stop, ensuring the triggered order can fill as the price falls through the stop.

Violating these constraints results in a `LIMIT_OR_PROTECTION_PRICE_WOULD_NOT_TRADE_AT_STOP_PRICE` reject.

## Order Modification

An untriggered stop order (one with `status = PENDING_OPEN`) may be modified using a `ModifyOrder` request. The following fields are relevant:

- `new_stop_price`: updates the trigger price.
- `new_price`: updates the limit price (for `STOP_LIMIT`) or protection price (for `STOP_LOSS`).
- `new_quantity`: updates the order's base quantity

Currently, like `Limit` orders, Stop Orders specified in quote quantity will be converted to base quantity when they rest on the book.  Modify requests for Stop Orders must be specified in base quantity.

### In-Flight Modifies

The behavior of the modify is tied to the state of the stop order to prevent unexpected behavior if a stop order triggers while a modify is in-flight:
  - If the order has not triggered, `new_stop_price` must be set.
  - If the order has already triggered, `new_stop_price` must be omitted.

This prevents modifying a triggered order if the intention was to modify the untriggered order.  A resting `STOP_LIMIT` can still be modified the same way as a `Limit` order by omitting the `new_stop_price` field.

## No Guarantee of Execution

There is no guarantee a Stop Order will execute, even after it triggers.  The following reasons may cause a Stop Order to fail to execute:
- Failure to Trigger (market never trades at or worse than the stop price)
- Illiquid Market (the order that triggered the stop may move the price beyond the Limit Price specified by a `STOP_LIMIT` order)
- In-flight Requests (the market may move between the time the stop order triggers and the time the triggered order reaches the front of the matching queue)

## Relevant Reject Errors

The following `NewRejectReason`s are sent when a stop order is rejected:

### `INVALID_TIF_FOR_ORDER_TYPE`
- A `STOP_LOSS` or `STOP_LIMIT` order was submitted with a `time_in_force` other than `GOOD_FOR_SESSION`.

Resolution: set `time_in_force = GOOD_FOR_SESSION` on all stop order submissions.

### `STOP_ORDER_TYPE_WITHOUT_STOP_PRICE`
- A `STOP_LOSS` or `STOP_LIMIT` order was submitted without the `stop_price` field.

Resolution: include a valid `stop_price` in the new-order request for any stop order type.

### `STOP_PRICE_WITHOUT_STOP_ORDER_TYPE`
- The `stop_price` field was set on an order whose `order_type` is not `STOP_LOSS` or `STOP_LIMIT`.
- Also returned when modifying an already-triggered stop order (`status = OPEN`) with `new_stop_price` set.

Resolution: only set `stop_price` on orders with `order_type = STOP_LOSS` or `STOP_LIMIT`, and only set `new_stop_price` on untriggered stop orders.

### `LIMIT_OR_PROTECTION_PRICE_WOULD_NOT_TRADE_AT_STOP_PRICE`
- The relationship between `price` and `stop_price` violates the price constraint for the order's side and type.
- For example, a `STOP_LOSS` ASK with `stop_price = 18` and `price = 20`: the order would trigger as the price falls to 18, but a protection price of 20 (above the falling market) could never be reached, so the triggered order would not trade.

Resolution: ensure `price` and `stop_price` satisfy the constraints described in the [Price Constraints](#price-constraints) section above.

## Examples

### Bid Stop Loss (Take Profit)

A trader holds a long position bought at 100 and wants to take profit if the price rises to 120.

- Submit a `STOP_LOSS` BID order with `stop_price = 120`.
- Receive a `NewAck` with `status = PENDING_OPEN`.
- When a trade occurs at price 120 or higher, the stop triggers.
- The stop order is placed as an IOC MarketWithProtection BID order and executes at the best available ask price, but no worse than the protection price.
- Receive a `NewAck` for the same order with `status = OPEN`.

Note that if the market is illiquid, the MarketWithProtection order may not execute, e.g. if there is no liquidity remaining on the opposite side of the book.

### Ask Stop Limit

A trader holds a long position and wants to exit if the price falls to 80.

- Submit a `STOP_LIMIT` ASK order with `stop_price = 80` and `price = 78`.
- Receive a `NewAck` with `status = PENDING_OPEN`.
- When a trade occurs at price 80 or lower, the stop triggers.
- The stop order is placed as a GFS Limit ASK order and executes, with any remainder resting on the book at a limit price of 78.
- Receive a `NewAck` for the same order with `status = OPEN`.

Note that if the price falls below 78 by the time the stop triggers, the limit order may not execute.
