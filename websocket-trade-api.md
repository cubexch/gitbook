# WebSocket: Trade API

This schema defines the Protobuf messages used for communication with the
Cube Order Service (Osmium, OS). The `proto` definition file can be found
[here](https://github.com/cubexch/ws-api/blob/main/schema/trade.proto).

### Connection

The order service exposes a websocket endpoint for clients to connect to.
Once connected, clients should submit a [`Credentials`](#credentials)
message, listen for [`Bootstrap`](#bootstrap) messages for resting orders
and positions, and then can begin submitting
[`OrderRequest`](#orderrequest) and processing
[`OrderResponse`](#orderresponse).

### Heartbeats

Application-level heartbeats are expected every 30 seconds. If more than one
interval is missed, the order service will disconnect the websocket.

### Price, Quantity, and Lots

All orders are placed on a single market, specified by the market-id. The
market definition specifies the base and quote assets and their respective
lot sizes for the particular market. Prices and quantities in this API are in
units of base and quote _lots_. That is, a quantity of 1 equals 1 base lot,
and a price of 10 equals 10 quote lots / base lot (read as quote lots per
base lot).

For example, consider an ETHBTC market. ETH is the base asset and BTC is the
quote asset. ETH has 18 decimal places (`1 ETH = 10^18 WEI`) and BTC has 8
decimal places (`1 BTC = 10^8 SAT`). Suppose that in this example, the ETHBTC
market has a base lot size of `10^15` and a quote lot size of `10^0` (`1`).
Then an order placed with `quantity = 230` and `price = 6300` in
market-agnostic terms is an order for `0.23 ETH` at a price of `0.06300 BTC /
ETH`. In more detail, we have:

```text
230 base lots
  * (10^15 WEI / base lot)
  / (10^18 WEI / ETH)
  = 230 ETH

6300 quote lots / base lot
  * (1 SAT / quote lot)
  / (10^15 WEI / base lot)
  * (10^18 WEI / ETH)
  / (10^8 SAT / BTC)
  = 0.06300 BTC / ETH
```

### Trading Fees

Trading Fees are calculated on each individual trade as a ratio of the filled quantity,
and are always charged as a deduction from the asset received in that trade.

Fee ratios may vary from trade to trade based on the user's VIP level.
For fee discounts based on Trading Volume, ratios are adjusted continuously
at the time of each trade based on the user's trailing 30-day volume.

To ensure that the client has enough information to determine the exact fee charged,
the fee ratio is expressed as a fixed-point decimal number consisting of a mantissa and an exponent.
Generally, the exponent will be "-4", indicating that the mantissa is equivalent to pips,
Though some fees may be expressed with greater granularity.

For example, consider the case of a trade where:
- Asset received is BTC
- `quantity` = 5
- `fee_ratio.mantissa` = 11
- `fee_ratio.exponent` = -4

...in which case:
- The fee ratio would be 0.0011, or 11 pips.
- The fee would be equal to 0.0055 BTC.
- The total amount credited at settlement would be 4.9945 BTC.

If you need exact granularity at time of trade, you can replicate the fee calculation performed by the exchange.
To avoid rounding errors, this entire process is performed in integer math using the exponent as a devisor.
In the example above, the full fee amount in indivisible [RawUnits](#rawunits) would be calculated as:
```text
5 * 100_000_000 * 11 / 10_000 = 550_000 RawUnits

(in the BTC case, that would be 550,000 Satoshi)
```

Since the fee is expressed with a decimal exponent, it's highly likely that this calculation results in a whole number.
In the unlikely case that the final division results in a non-whole number, the result should be truncated,
hence the division at the end: i.e. the fee is rounded down to the nearest `RawUnit`.

### Exchange Order ID

Each order is assigned a unique ID by the exchange. This order ID is
consistent across modifies (including cancel-replace), and other operations.
The exchange order ID can be used to find a particular order in the
market-by-order market data feed, which allows the determination of FIFO
queue priority, etc.

### Transact Time

The transact time is the matching engine timestamp for when an event is
processed. Events that occur with the same transact time occur atomically
from the perspective of the matching engine.



## Credentials
Sent by client on websocket initialization. Once the websocket has been
connected, the client is expected to send this credentials message
immediately. The API key (UUID) and secret access key (hex-encoded 32-byte
array) should be generated on the settings page with the write access. The
signature should be calculated as the concatenation of the byte string
`cube.xyz` and the current unix epoch in seconds interpreted at a
little-endian 64-bit number.

### Implementation notes:
- The signature is base-64 encoded with the 'standard' alphabet and
  padding.

  ```
  ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/
  ```
- The timestamp should be encoded as 8-byte little-endian (array of bytes)
- The secret key should be decoded from a hex string into a 32-byte array of
  bytes

If the credentials provided are incorrect, the server will drop the connection with a close code of 4401.

### Examples

In the following examples, replace "cafecafecafe..." with your secret key.
When calculated for:
  secret key: "cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe"
  timestamp: 1706546268
...the resulting signature should be:
  "tmtSP4NIzTLXyVUHIOfinotGnPWyfM8JefxivBdSjc8="

#### Rust

```rust compile_fail
// With crates hmac, base64, hex:
use base64::Engine;
use hmac::{Hmac, Mac, NewMac};
use std::time::SystemTime;

let secret_key = hex::decode("cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe").expect("secret key valid hex").as_slice();

let timestamp: u64 = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs();

let mut mac = Hmac::<sha2::Sha256>::new_from_slice(
    secret_key
).expect("new HMAC error");
mac.update(b"cube.xyz");
mac.update(&timestamp.to_le_bytes());
let signature_bytes = <[u8; 32]>::from(mac.finalize().into_bytes());
let signature = base64::general_purpose::STANDARD.encode(signature_bytes);
```

#### Typescript
```
import { createHmac } from 'crypto';
const secretKey = "cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe";
const timestampSecs = Math.floor(Date.now() / 1000);
const timestampBytes = Buffer.alloc(8);
timestampBytes.writeBigInt64LE(BigInt(timestampSecs));

const signature = createHmac('sha256', Buffer.from(secretKey, 'hex'))
  .update(`cube.xyz`)
  .update(timestampBytes)
  .digest('base64');
```


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| access_key_id | [string](#string) |  | Public API key |
| signature | [string](#string) |  | HMAC signature, base-64 encoded |
| timestamp | [uint64](#uint64) |  | Timestamp in seconds |







## OrderRequest
Every client message, aside from Credentials, must be wrapped as an
OrderRequest.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| new | [NewOrder](#neworder) |  |  |
| cancel | [CancelOrder](#cancelorder) |  |  |
| modify | [ModifyOrder](#modifyorder) |  |  |
| heartbeat | [Heartbeat](#heartbeat) |  |  |
| mc | [MassCancel](#masscancel) |  |  |







### NewOrder
Place a new order.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| client_order_id | [uint64](#uint64) |  | A unique order ID assigned by the client for this order. The ID must be unique among open orders by this subaccount. |
| request_id | [uint64](#uint64) |  | A request ID that is echoed back on the NewOrderAck or NewOrderReject |
| market_id | [uint64](#uint64) |  |  |
| price | [uint64](#uint64) | optional |  |
| quantity | [uint64](#uint64) |  |  |
| side | [Side](#side) |  |  |
| time_in_force | [TimeInForce](#timeinforce) |  |  |
| order_type | [OrderType](#ordertype) |  |  |
| subaccount_id | [uint64](#uint64) |  | The subaccount to place this order on. This subaccount must be writable by the API key specified in the Credentials message. |
| self_trade_prevention | [SelfTradePrevention](#selftradeprevention) | optional |  |
| post_only | [PostOnly](#postonly) |  |  |
| cancel_on_disconnect | [bool](#bool) |  | If true, this order will be automatically cancelled after the closure of the network connection between Cube's servers and the client that placed the order.

If the client initiates the disconnect or network instability drops the connection, the order will be cancelled when Cube's servers recognize the disconnection.

In the event of a server-side disconnect that causes a halt in trading, such as scheduled downtime, the order will be cancelled before trading resumes. |







### CancelOrder
Cancel a resting order.
Note that this can be done before the order is acknowledged (an aggressive
cancel) since the identifying field is the `client_order_id`.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| market_id | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  | The order ID specified by the client on the NewOrder request. |
| request_id | [uint64](#uint64) |  | A request ID that is echoed back on the CancelOrderAck or CancelOrderReject |
| subaccount_id | [uint64](#uint64) |  | The subaccount that the NewOrder was placed on. |







### ModifyOrder
Modify a resting order.
- If the `newPrice` and the current resting order's price is the same, and
`newQuantity` is not greater, then the modify is considered a modify down,
and the FIFO queue priority is maintained. Otherwise, the modify-order
request is treated as an atomic cancel-replace and the replacement order is
placed at the end of the FIFO queue for the new price level.
- If post-only is specified and the replacement order would trade, then the
request is rejected and the current resting order remains resting.

Currently, in-flight-mitigation (IFM) is always enabled. That is, the
cumulative fill qty is subtracted from `newQuantity` to calculate the new
resting quantity. For example:

```text
         | Resting | Filled
---------+---------+--------
New 5    | 5       | 0
Fill 2   | 3       | 2
Modify 4 | 2       | 2
```

The post-modify quantity will be `newQuantity - filled = 4 - 2 = 2`.

Regardless of IFM, the invariant for order quantity is that `quantity =
remaining_quantity + cumulative_quantity`.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| market_id | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  | The order ID specified by the client on the NewOrder request. |
| request_id | [uint64](#uint64) |  | A request ID that is echoed back on the ModifyOrderAck or ModifyOrderReject |
| new_price | [uint64](#uint64) |  |  |
| new_quantity | [uint64](#uint64) |  |  |
| subaccount_id | [uint64](#uint64) |  | The subaccount that the NewOrder was placed on. |
| self_trade_prevention | [SelfTradePrevention](#selftradeprevention) | optional |  |
| post_only | [PostOnly](#postonly) |  |  |







### MassCancel
Cancel all resting orders, optionally limiting to a particular market and /
or order book side.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| subaccount_id | [uint64](#uint64) |  | The subaccount to cancel orders for. |
| request_id | [uint64](#uint64) |  | A request ID that is echoed back on the MassCancelAck and individual CancelOrderAck's. |
| market_id | [uint64](#uint64) | optional | If specified, only orders on the corresponding market will be canceled. |
| side | [Side](#side) | optional | If specified, only orders with this side will be canceled. |







### Heartbeat
A client and server heartbeat. The heartbeat reply, including the timestamp
value, comes from the order service and not the matching engine. Matching
engine timestamps can be extracted from `transact_time` (below).

Latency can be estimated from this, but only the relative difference between
successive server messages should be used. In particular, the client and
server clock should not be expected to be synchronized.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| request_id | [uint64](#uint64) |  | A request ID that is echoed back on the Heartbeat |
| timestamp | [uint64](#uint64) |  |  |







## OrderResponse
Every exchange message after the initial bootstrap will be wrapped as an
OrderResponse.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| new_ack | [NewOrderAck](#neworderack) |  |  |
| cancel_ack | [CancelOrderAck](#cancelorderack) |  |  |
| modify_ack | [ModifyOrderAck](#modifyorderack) |  |  |
| new_reject | [NewOrderReject](#neworderreject) |  |  |
| cancel_reject | [CancelOrderReject](#cancelorderreject) |  |  |
| modify_reject | [ModifyOrderReject](#modifyorderreject) |  |  |
| fill | [Fill](#fill) |  |  |
| heartbeat | [Heartbeat](#heartbeat) |  |  |
| position | [AssetPosition](#assetposition) |  |  |
| mass_cancel_ack | [MassCancelAck](#masscancelack) |  |  |







### NewOrderAck
New-order-ack confirms a new-order request. The ack will be ordered before
any fills for this order.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  | The client order ID specified in the new-order request. |
| request_id | [uint64](#uint64) |  | The request ID specified in the new-order request. |
| exchange_order_id | [uint64](#uint64) |  | [Exchange order ID](#exchange-order-id) |
| market_id | [uint64](#uint64) |  |  |
| price | [uint64](#uint64) | optional | If the order ultimately rests, the `price` field will include the resting price. |
| quantity | [uint64](#uint64) |  | The quantity submitted in the new-order request. |
| side | [Side](#side) |  |  |
| time_in_force | [TimeInForce](#timeinforce) |  |  |
| order_type | [OrderType](#ordertype) |  |  |
| transact_time | [uint64](#uint64) |  | [Transact time](#transact-time) |
| subaccount_id | [uint64](#uint64) |  |  |
| cancel_on_disconnect | [bool](#bool) |  |  |







### CancelOrderAck
Cancel-order-ack confirms a cancel request, or that an order has been
canceled as the result of a different user-initiated reason.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  |  |
| request_id | [uint64](#uint64) |  | If the Reason is `DISCONNECT`, `IOC`, `STP_RESTING`, or `STP_AGGRESSING`, this request ID will be `u64::MAX`. Otherwise, it will be the request ID of the initiated cancel action. For a mass cancel, each cancel order ack will have the MassCancel's request_id. |
| transact_time | [uint64](#uint64) |  | [Transact time](#transact-time) |
| subaccount_id | [uint64](#uint64) |  |  |
| reason | [CancelOrderAck.Reason](#cancelorderack.reason) |  |  |
| market_id | [uint64](#uint64) |  |  |
| exchange_order_id | [uint64](#uint64) |  | [Exchange order ID](#exchange-order-id) |







### ModifyOrderAck
Modify-order-ack confirms a modify-order request. If the modify resulted in
an aggressing cancel-replace, the ack will be ordered before any fills for
this order.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  |  |
| request_id | [uint64](#uint64) |  | The request ID specified in the modify request. |
| transact_time | [uint64](#uint64) |  | [Transact time](#transact-time) |
| remaining_quantity | [uint64](#uint64) |  | The quantity remaining on the book after applying the modify request. |
| subaccount_id | [uint64](#uint64) |  |  |
| market_id | [uint64](#uint64) |  |  |
| price | [uint64](#uint64) |  |  |
| quantity | [uint64](#uint64) |  | The quantity submitted in the modify request. |
| cumulative_quantity | [uint64](#uint64) |  | The cumulative filled quantity for this order. |
| exchange_order_id | [uint64](#uint64) |  | [Exchange order ID](#exchange-order-id) |







### MassCancelAck
Mass-cancel-ack confirms a mass-cancel request. If `reason` is set, the mass
cancel was not applied and there are no affected orders. Individual
CancelOrderAck's will be sent for each order that was affected.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| subaccount_id | [uint64](#uint64) |  |  |
| request_id | [uint64](#uint64) |  | The request ID specified in the mass-cancel request. |
| transact_time | [uint64](#uint64) |  | [Transact time](#transact-time) |
| reason | [MassCancelAck.Reason](#masscancelack.reason) | optional |  |
| total_affected_orders | [uint32](#uint32) |  | The total number of orders that were canceled. |







### NewOrderReject
New-order-reject indicates that a new-order request was not applied.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  | The client order ID specified in the new-order request. |
| request_id | [uint64](#uint64) |  | The request ID specified in the new-order request. |
| transact_time | [uint64](#uint64) |  | [Transact time](#transact-time) |
| subaccount_id | [uint64](#uint64) |  |  |
| reason | [NewOrderReject.Reason](#neworderreject.reason) |  |  |
| market_id | [uint64](#uint64) |  |  |
| price | [uint64](#uint64) | optional |  |
| quantity | [uint64](#uint64) |  |  |
| side | [Side](#side) |  |  |
| time_in_force | [TimeInForce](#timeinforce) |  |  |
| order_type | [OrderType](#ordertype) |  |  |







### CancelOrderReject
Cancel-order-reject indicates that a cancel-order request was not applied.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  | The client order ID specified in the cancel-order request. |
| request_id | [uint64](#uint64) |  | The request ID specified in the cancel-order request. |
| transact_time | [uint64](#uint64) |  | [Transact time](#transact-time) |
| subaccount_id | [uint64](#uint64) |  |  |
| reason | [CancelOrderReject.Reason](#cancelorderreject.reason) |  |  |
| market_id | [uint64](#uint64) |  |  |







### ModifyOrderReject
Modify-order-reject indicates that a modify-order request was not applied.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  | The client order ID specified in the modify-order request. |
| request_id | [uint64](#uint64) |  | The request ID specified in the modify-order request. |
| transact_time | [uint64](#uint64) |  | [Transact time](#transact-time) |
| subaccount_id | [uint64](#uint64) |  |  |
| reason | [ModifyOrderReject.Reason](#modifyorderreject.reason) |  |  |
| market_id | [uint64](#uint64) |  |  |







### Fill
A fill for an order.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| market_id | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  | The client order ID specified in the new-order request. |
| exchange_order_id | [uint64](#uint64) |  | [Exchange order ID](#exchange-order-id) |
| fill_price | [uint64](#uint64) |  | The price that this trade occured at. |
| fill_quantity | [uint64](#uint64) |  | The quantity that was traded in this fill. |
| leaves_quantity | [uint64](#uint64) |  | The remaining quantity for this order after the fill is applied. |
| transact_time | [uint64](#uint64) |  | [Transact time](#transact-time) |
| subaccount_id | [uint64](#uint64) |  |  |
| cumulative_quantity | [uint64](#uint64) |  | The cumulative filled quantity for this order after the fill is applied. |
| side | [Side](#side) |  |  |
| aggressor_indicator | [bool](#bool) |  |  |
| fee_ratio | [FixedPointDecimal](#fixedpointdecimal) |  | Indicates the fee charged on this trade. See [Fees](#fees) for details. |
| trade_id | [uint64](#uint64) |  | The unique trade ID associated with a match event. Each order participanting in the match event will receive this trade ID |







### FixedPointDecimal
A fixed-point decimal number.
Matches the representation preferred by the FIX protocol,
except that the exponent is int32 since Protobuf does not have an int8 type.
The value is computed as `mantissa * 10^exponent`;
for example, `mantissa = 1234` and `exponent = -2` is `12.34`.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| mantissa | [int64](#int64) |  |  |
| exponent | [int32](#int32) |  |  |







### AssetPosition
The user's underlying asset position. These are sent asynchronously as
positions are updated and broadcast through internal position channels. They
can also be tracked by applying other OrderResponse messages individually.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| subaccount_id | [uint64](#uint64) |  |  |
| asset_id | [uint64](#uint64) |  |  |
| total | [RawUnits](#rawunits) |  |  |
| available | [RawUnits](#rawunits) |  | The available amount after open orders are subtracted. |







### RawUnits
Raw-units is a 256-bit number for the amount of an asset. The precision is
based on the underlying asset. For example, ETH is specified as if in
fixed-point 10^18, while BTC is specified as if in fixed-point 10^8.

The number is interpreted in 'little-endian' as `[word0, word1, word2,
word3]`.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| word0 | [uint64](#uint64) |  |  |
| word1 | [uint64](#uint64) |  |  |
| word2 | [uint64](#uint64) |  |  |
| word3 | [uint64](#uint64) |  |  |







## Bootstrap
A bootstrap message sent after Credentials authentication.
Client resting and pending orders used to bootstrap state. Sent as the first
message(s) after initialization. Bootstrap is complete after a message tagged
`Done` is received and every message after that will be an `OrderResponse`.
Multiple messages may be received for `RestingOrders` and `AssetPositions`
and these should be concatenated.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| done | [Done](#done) |  |  |
| resting | [RestingOrders](#restingorders) |  |  |
| position | [AssetPositions](#assetpositions) |  |  |







### RestingOrders
A chunk of resting orders. Sent on bootstrap.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| orders | [RestingOrder](#restingorder) | repeated |  |







### AssetPositions
A chunk of asset positions. Sent on bootstrap.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| positions | [AssetPosition](#assetposition) | repeated |  |







### Done
An indication that bootstrap is complete.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| latest_transact_time | [uint64](#uint64) |  | [Transact time](#transact-time) |
| read_only | [bool](#bool) |  |  |







### RestingOrder
A resting order. Sent on bootstrap in `RestingOrders`.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| client_order_id | [uint64](#uint64) |  | The client order ID specified in the new-order request. |
| exchange_order_id | [uint64](#uint64) |  | [Exchange order ID](#exchange-order-id) |
| market_id | [uint64](#uint64) |  |  |
| price | [uint64](#uint64) |  |  |
| order_quantity | [uint64](#uint64) |  | The quantity submitted in the latest quantity-modifying request. If the order has not been modified, then it is the quantity on the new-order-ack. If it has been modified, then it is the quantity of the latest modify-order-ack. |
| side | [Side](#side) |  |  |
| time_in_force | [TimeInForce](#timeinforce) |  |  |
| order_type | [OrderType](#ordertype) |  |  |
| remaining_quantity | [uint64](#uint64) |  | The current remaining quantity on the book. |
| rest_time | [uint64](#uint64) |  | [Transact time](#transact-time) of the NewOrderAck |
| subaccount_id | [uint64](#uint64) |  |  |
| cumulative_quantity | [uint64](#uint64) |  | The cumulative filled quantity for this order. |
| cancel_on_disconnect | [bool](#bool) |  |  |







## Enums


### Side
Side specifies whether the order is buying or selling the base asset. A trade
is matched when a buyer (BID) and a seller (ASK) agree on a price (cross).
The bid-ask spread is the gap between the highest bid price and lowest ask
price on the orderbook.

| Name | Number | Description |
| ---- | ------ | ----------- |
| BID | 0 | A bid order buys the base asset with the quote asset. |
| ASK | 1 | An ask (or offer) order sells the base asset and gets the quote asset. |




### TimeInForce
Time-in-force (TIF) specifies how long the order remains in effect.

| Name | Number | Description |
| ---- | ------ | ----------- |
| IMMEDIATE_OR_CANCEL | 0 | Immediate-or-cancel (IOC), also known as fill-and-kill (FAK), orders are immediately executed against resting orders. If the order cannot be fully filled, the remaining balance will be canceled, and an additional CancelOrderAck with the IOC reason will be sent. |
| GOOD_FOR_SESSION | 1 | Good-for-session (GFS) orders are active until they are completely executed, canceled, or when the session expires. |
| FILL_OR_KILL | 2 | Fill-or-kill (FOK), also known as all-or-none (AON), orders must be filled immediately against resting orders or the entire order is canceled. |




### OrderType
Order-type specifies how the order will be placed into the order book.

- Note that for LIMIT orders, there is a pre-flight check that there is
  sufficient available balance to place this order at the price and quantity
  specified. Otherwise, the order will be rejected with the
  EXCEEDED_SPOT_POSITION reason.
- For MARKET_LIMIT and MARKET_WITH_PROTECTION orders, there is no such
  pre-flight check and a submitted order will be partially filled up until
  the subaccount's position limit. The remaining quantity will be canceled
  with the POSITION_LIMIT reason.

| Name | Number | Description |
| ---- | ------ | ----------- |
| LIMIT | 0 | A limit order is accompanied with a price (inclusive) that specifies the upper limit to buy and the lower limit to sell. If the price is not immediately available and the TIF allows resting orders, the limit order will rest until filled or canceled. |
| MARKET_LIMIT | 1 | A market limit order crosses the bid-ask spread and, if not fully filled, becomes a limit order at the best available market price. - If there is no opposing market, the order is rejected with the NO_OPPOSING_RESTING_ORDER reason. - The price must be null. |
| MARKET_WITH_PROTECTION | 2 | A market with protection order crosses the bid-ask spread and continues to cross until the order is fully filled or the protection price is reached. - The protection price is defined as: - If the price is provided, this price is used as the protection price. - If the price is null, the best market price widened by a market-specific protection point count. - If the protection price would not cross the resting market, the order is rejected with the NO_OPPOSING_RESTING_ORDER reason instead of resting at that level. |




### SelfTradePrevention
Self-trade-prevention (STP) allows market participants to prevent the matching
of orders for accounts with common ownership. Currently, STP only applies for
orders with the same subaccount_id. STP will only be applied when a match is
about to occur between the two orders. That is, if the aggressing order is
fully filled before reaching the resting order in FIFO order, no STP cancels
will happen.

| Name | Number | Description |
| ---- | ------ | ----------- |
| CANCEL_RESTING | 0 | Cancel-resting specifies that if a self-trade is about to occur, the resting order should be canceled instead and further order book processing should occur as normal. |
| CANCEL_AGGRESSING | 1 | Cancel-aggressing specifies that if a self-trade is about to occur, the aggressing order should be canceled instead and no further action should be taken. |
| ALLOW_SELF_TRADE | 2 | Allow-self-trade disables STP functionality. |




### PostOnly
Post-only specifies whether a new order is allowed to immediately execute.
Post-only cannot be enabled with market orders or with a TIF that does not
allow resting orders.

| Name | Number | Description |
| ---- | ------ | ----------- |
| DISABLED | 0 |  |
| ENABLED | 1 |  |




### CancelOrderAck.Reason


| Name | Number | Description |
| ---- | ------ | ----------- |
| UNCLASSIFIED | 0 |  |
| DISCONNECT | 1 |  |
| REQUESTED | 2 | This order was specified in a cancel request. |
| IOC | 3 | This was an IOC new-order that does not get fully filled. |
| STP_RESTING | 4 | A resting order was STP canceled. |
| STP_AGGRESSING | 5 | An aggressing order was STP canceled. |
| MASS_CANCEL | 6 | This order was covered by a mass-cancel request. |
| POSITION_LIMIT | 7 | This order was canceled because asset position limits would be otherwise breached. |




### MassCancelAck.Reason


| Name | Number | Description |
| ---- | ------ | ----------- |
| UNCLASSIFIED | 0 |  |
| INVALID_MARKET_ID | 1 |  |
| INVALID_SIDE | 2 |  |




### NewOrderReject.Reason
Reasons that are prefixed with `INVALID_` normally indicate that the
corresponding field did not take a valid value.

| Name | Number | Description |
| ---- | ------ | ----------- |
| UNCLASSIFIED | 0 |  |
| INVALID_QUANTITY | 1 | Quantity was zero. |
| INVALID_MARKET_ID | 2 | The specified market ID does not exist. |
| DUPLICATE_ORDER_ID | 3 | The specified client order ID was not unique among open orders for this subaccount. |
| INVALID_SIDE | 4 |  |
| INVALID_TIME_IN_FORCE | 5 |  |
| INVALID_ORDER_TYPE | 6 |  |
| INVALID_POST_ONLY | 7 |  |
| INVALID_SELF_TRADE_PREVENTION | 8 |  |
| UNKNOWN_TRADER | 9 | Internal error: the matching engine could not find this subaccounts positions. |
| PRICE_WITH_MARKET_LIMIT_ORDER | 10 |  |
| POST_ONLY_WITH_MARKET_ORDER | 11 |  |
| POST_ONLY_WITH_INVALID_TIF | 12 |  |
| EXCEEDED_SPOT_POSITION | 13 | The sum of open orders and this new-order would exceed the subaccounts spot limits. |
| NO_OPPOSING_RESTING_ORDER | 14 | There are no opposing resting orders to trade against. |
| POST_ONLY_WOULD_TRADE | 15 | The post-only order would have crossed and traded. |
| DID_NOT_FULLY_FILL | 16 | A FOK was not fully fillable against resting orders at the requested price and quantity. |
| ONLY_ORDER_CANCEL_ACCEPTED | 17 | An exchange accepts no now orders at this time |
| PROTECTION_PRICE_WOULD_NOT_TRADE | 18 | A more specific error code for market-with-protection orders that could trade but have a user-specified protection price that is too tight. |
| NO_REFERENCE_PRICE | 19 | Market orders cannot be place because there is currently no internal reference price |
| SLIPPAGE_TOO_HIGH | 20 | A market order would trade beyond the internal reference price offset by protection levels in the direction of aggress. |
| OUTSIDE_PRICE_BAND | 21 | Limit orders cannot have bid price too low or ask price too high that is multiple times away from the internal reference price. |




### CancelOrderReject.Reason


| Name | Number | Description |
| ---- | ------ | ----------- |
| UNCLASSIFIED | 0 |  |
| INVALID_MARKET_ID | 1 | The specified market ID does not exist. |
| ORDER_NOT_FOUND | 2 | The specified client order ID does not exist for the corresponding market ID and subaccount ID. |




### ModifyOrderReject.Reason
Reasons that are prefixed with `INVALID_` normally indicate that the
corresponding field did not take a valid value.

| Name | Number | Description |
| ---- | ------ | ----------- |
| UNCLASSIFIED | 0 |  |
| INVALID_QUANTITY | 1 | Quantity was zero. |
| INVALID_MARKET_ID | 2 | The specified market ID does not exist. |
| ORDER_NOT_FOUND | 3 | The specified client order ID does not exist for the corresponding market ID and subaccount ID. |
| INVALID_IFM | 4 |  |
| INVALID_POST_ONLY | 5 |  |
| INVALID_SELF_TRADE_PREVENTION | 6 |  |
| UNKNOWN_TRADER | 7 | Internal error: the matching engine could not find this subaccounts positions. |
| EXCEEDED_SPOT_POSITION | 8 | If the modify-order would cause a cancel-replace, the sum of open orders and this replacement order would exceed the subaccounts spot limits. |
| POST_ONLY_WOULD_TRADE | 9 | If the modify-order would cause a cancel-replace, the post-only replacement would have crossed and traded. |
| ONLY_ORDER_CANCEL_ACCEPTED | 17 | An exchange accepts no order modifications at this time |
| OUTSIDE_PRICE_BAND | 11 | Limit orders cannot have bid price too low or ask price too high that is multiple times away from the internal reference price. |








## Scalar Value Types

| .proto Type | Notes | Rust | C++ | Python | Go |
| ----------- | ----- | ---- | --- | ------ | -- |
| double |  | f64 | double | float | float64 |
| float |  | f32 | float | float | float32 |
| int32 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint32 instead. | i32 | int32 | int | int32 |
| int64 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint64 instead. | i64 | int64 | int/long | int64 |
| uint32 | Uses variable-length encoding. | u32 | uint32 | int/long | uint32 |
| uint64 | Uses variable-length encoding. | u64 | uint64 | int/long | uint64 |
| sint32 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int32s. | i32 | int32 | int | int32 |
| sint64 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int64s. | i64 | int64 | int/long | int64 |
| fixed32 | Always four bytes. More efficient than uint32 if values are often greater than 2^28. | u64 | uint32 | int | uint32 |
| fixed64 | Always eight bytes. More efficient than uint64 if values are often greater than 2^56. | u64 | uint64 | int/long | uint64 |
| sfixed32 | Always four bytes. | i32 | int32 | int | int32 |
| sfixed64 | Always eight bytes. | i64 | int64 | int/long | int64 |
| bool |  | bool | bool | boolean | bool |
| string | A string must always contain UTF-8 encoded or 7-bit ASCII text. | String | string | str/unicode | string |
| bytes | May contain any arbitrary sequence of bytes. | Vec<u8> | string | str | []byte |

