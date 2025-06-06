# WebSocket: Trade API

This schema defines the Protobuf messages used for communication with the
Cube Order Service (OS, or "Osmium").

- The connection URL for this Websocket API is `wss://api.cube.exchange/os`.

- See also:
  - The [Protobuf definition file for the Websocket connection](https://github.com/cubexch/ws-api/blob/main/schema/trade.proto)
  - [General documentation pertaining to the Trade API](https://cubexch.gitbook.io/cube-api/trade-api.md)

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



## Credentials
Sent by client on websocket initialization. Once the websocket has been
connected, the client is expected to send this credentials message
immediately. The API key (UUID) and secret access key (hex-encoded 32-byte
array) should be generated on the settings page with the write access. The
signature should be calculated as the concatenation of the byte string
`cube.xyz` and the current unix epoch in seconds interpreted at a
little-endian 64-bit number.

### Implementation notes
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
- secret key: "cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe"
- timestamp: 1706546268
...the resulting signature should be:
- "tmtSP4NIzTLXyVUHIOfinotGnPWyfM8JefxivBdSjc8="

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

println!("{}", signature);
```

#### Typescript
```typescript
import { createHmac } from 'crypto';

const secretKey = "cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe";
const timestampSecs = Math.floor(Date.now() / 1000);
const timestampBytes = Buffer.alloc(8);
timestampBytes.writeBigInt64LE(BigInt(timestampSecs));

const signature = createHmac('sha256', Buffer.from(secretKey, 'hex'))
  .update(`cube.xyz`)
  .update(timestampBytes)
  .digest('base64');

console.log(signature)
```

#### Python
```python
import base64
import hmac

# Calculates "signature" field for "Credentials" message
def calculate_signature(secret_key: bytes, timestamp_seconds: int) -> str:
    h = hmac.new(secret_key, digestmod=hashlib.sha256)
    h.update("cube.xyz".encode('utf-8'))
    h.update(timestamp_seconds.to_bytes(8, byteorder="little", signed=False))
    signature_bytes = h.digest()
    return base64.standard_b64encode(signature_bytes).decode('utf-8')

secret_key = bytes.fromhex("cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe")
timestamp = int(time.time())
signature = calculate_signature(secret_key, timestamp)

print(signature)
````


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

Execution details:
- For market orders, exactly one of `quantity` or `quote_quantity` must be
  specified.
- For MARKET_WITH_PROTECTION, if `price` is specified, it will override the
  default protection price.
- Matching will stop upon reaching the protection price, or `quantity` (or
  `quote_quantity`) filled.
- When specifying `quote_quantity`, the order is considered 'fully filled'
  when there is insufficient remaining quote quantity to fill 1 lot at the
  next trade price. In that case, there will _not_ be a `CancelOrderAck`
  published.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| client_order_id | [uint64](#uint64) |  | A unique order ID assigned by the client for this order. The ID must be unique among open orders by this subaccount. |
| request_id | [uint64](#uint64) |  | A request ID that is echoed back on the NewOrderAck or NewOrderReject |
| market_id | [uint64](#uint64) |  |  |
| price | [uint64](#uint64) | optional |  |
| quantity | [uint64](#uint64) | optional | Required for LIMIT orders. |
| side | [Side](#side) |  |  |
| time_in_force | [TimeInForce](#timeinforce) |  |  |
| order_type | [OrderType](#ordertype) |  |  |
| subaccount_id | [uint64](#uint64) |  | The subaccount to place this order on. This subaccount must be writable by the API key specified in the Credentials message. |
| self_trade_prevention | [SelfTradePrevention](#selftradeprevention) | optional |  |
| post_only | [PostOnly](#postonly) |  |  |
| cancel_on_disconnect | [bool](#bool) |  | If true, this order will be automatically cancelled after the closure of the network connection between Cube's servers and the client that placed the order.

If the client initiates the disconnect or network instability drops the connection, the order will be cancelled when Cube's servers recognize the disconnection.

In the event of a server-side disconnect that causes a halt in trading, such as scheduled downtime, the order will be cancelled before trading resumes. |
| quote_quantity | [uint64](#uint64) | optional | The quantity of the quote asset that the user wants to spend (for a BID) or receive (for an ASK). For limit orders, this is immediately converted to a base quantity using the provided price. For market orders, this is the maximum quantity that will be executed.

Note that lot size rules will be respected, and the actual quantity executed will be expressed in base quantity units. |







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
| trading_status | [TradingStatus](#tradingstatus) |  |  |
| implied_match_fee | [ImpliedMatchFee](#impliedmatchfee) |  |  |
| contract_position | [ContractPosition](#contractposition) |  |  |







### NewOrderAck
New-order-ack confirms a new-order request. The ack will be ordered before
any fills for this order.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  | The client order ID specified in the new-order request. |
| request_id | [uint64](#uint64) |  | The request ID specified in the new-order request. |
| exchange_order_id | [uint64](#uint64) |  | [Exchange order ID](/trade-api.md#exchange-order-id) |
| market_id | [uint64](#uint64) |  |  |
| price | [uint64](#uint64) |  | The price that matching completed at. For limit orders, this will be the limit price. For market orders, this will be the protection price. |
| quantity | [uint64](#uint64) |  | If `quote_quantity` was not specified, the quantity submitted in the new-order request. Otherwise, the quantity of the base asset that was executed. |
| side | [Side](#side) |  |  |
| time_in_force | [TimeInForce](#timeinforce) |  |  |
| order_type | [OrderType](#ordertype) |  |  |
| transact_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) |
| subaccount_id | [uint64](#uint64) |  |  |
| cancel_on_disconnect | [bool](#bool) |  |  |
| quote_quantity | [uint64](#uint64) | optional |  |







### CancelOrderAck
Cancel-order-ack confirms a cancel request, or that an order has been
canceled as the result of a different user-initiated reason.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  |  |
| request_id | [uint64](#uint64) |  | If the Reason is `DISCONNECT`, `IOC`, `STP_RESTING`, or `STP_AGGRESSING`, this request ID will be `u64::MAX`. Otherwise, it will be the request ID of the initiated cancel action. For a mass cancel, each cancel order ack will have the MassCancel's request_id. |
| transact_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) |
| subaccount_id | [uint64](#uint64) |  |  |
| reason | [CancelOrderAck.Reason](#cancelorderack.reason) |  |  |
| market_id | [uint64](#uint64) |  |  |
| exchange_order_id | [uint64](#uint64) |  | [Exchange order ID](/trade-api.md#exchange-order-id) |







### ModifyOrderAck
Modify-order-ack confirms a modify-order request. If the modify resulted in
an aggressing cancel-replace, the ack will be ordered before any fills for
this order.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  |  |
| request_id | [uint64](#uint64) |  | The request ID specified in the modify request. |
| transact_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) |
| remaining_quantity | [uint64](#uint64) |  | The quantity remaining on the book after applying the modify request. |
| subaccount_id | [uint64](#uint64) |  |  |
| market_id | [uint64](#uint64) |  |  |
| price | [uint64](#uint64) |  |  |
| quantity | [uint64](#uint64) |  | The quantity submitted in the modify request. |
| cumulative_quantity | [uint64](#uint64) |  | The cumulative filled quantity for this order. |
| exchange_order_id | [uint64](#uint64) |  | [Exchange order ID](/trade-api.md#exchange-order-id) |







### MassCancelAck
Mass-cancel-ack confirms a mass-cancel request. If `reason` is set, the mass
cancel was not applied and there are no affected orders. Individual
CancelOrderAck's will be sent for each order that was affected.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| subaccount_id | [uint64](#uint64) |  |  |
| request_id | [uint64](#uint64) |  | The request ID specified in the mass-cancel request. |
| transact_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) |
| reason | [MassCancelAck.Reason](#masscancelack.reason) | optional |  |
| total_affected_orders | [uint32](#uint32) |  | The total number of orders that were canceled. |







### NewOrderReject
New-order-reject indicates that a new-order request was not applied.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  | The client order ID specified in the new-order request. |
| request_id | [uint64](#uint64) |  | The request ID specified in the new-order request. |
| transact_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) |
| subaccount_id | [uint64](#uint64) |  |  |
| reason | [NewOrderReject.Reason](#neworderreject.reason) |  |  |
| market_id | [uint64](#uint64) |  |  |
| price | [uint64](#uint64) | optional |  |
| quantity | [uint64](#uint64) | optional |  |
| side | [Side](#side) |  |  |
| time_in_force | [TimeInForce](#timeinforce) |  |  |
| order_type | [OrderType](#ordertype) |  |  |
| quote_quantity | [uint64](#uint64) | optional |  |







### CancelOrderReject
Cancel-order-reject indicates that a cancel-order request was not applied.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| client_order_id | [uint64](#uint64) |  | The client order ID specified in the cancel-order request. |
| request_id | [uint64](#uint64) |  | The request ID specified in the cancel-order request. |
| transact_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) |
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
| transact_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) |
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
| exchange_order_id | [uint64](#uint64) |  | [Exchange order ID](/trade-api.md#exchange-order-id) |
| fill_price | [uint64](#uint64) |  | The price at which this trade occured. In the case of an implied fill, this price may be fractional, and will be truncated in that case. To determine the exact amount of the assets exchanged in the fill, use the fill_quantity and fill_quote_quantity fields. |
| fill_quantity | [uint64](#uint64) |  | The quantity of the base asset that was traded in this fill, expressed in lots of the base asset. |
| leaves_quantity | [uint64](#uint64) |  | The remaining base quantity for this order after the fill is applied. |
| fill_quote_quantity | [uint64](#uint64) |  | The quantity of the quote asset that was traded in this fill, expressed in lots of the quote asset. This will generally be the same as the base fill_quantity * fill_price, but may be different in the case of an implied fill. |
| transact_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) |
| subaccount_id | [uint64](#uint64) |  |  |
| cumulative_quantity | [uint64](#uint64) |  | The cumulative filled base quantity for this order after the fill is applied. |
| side | [Side](#side) |  |  |
| aggressor_indicator | [bool](#bool) |  |  |
| fee_ratio | [FixedPointDecimal](#fixedpointdecimal) |  | Indicates the fee charged on this trade. See [Trading Fees](/cube-fees.md#trading-fees) for details. |
| trade_id | [uint64](#uint64) |  | The unique trade ID associated with a match event. Each order participanting in the match event will receive this trade ID |







### ImpliedMatchFee
Indicates the implied match fee for a trade.
This message will be delivered once for each aggressing NewOrder (taker order)
that results in one or more implied fills.
If an implied match occurs but the implied match fee is zero,
this message will still be delivered and the fee_amount will be zero.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| msg_seq_num | [uint64](#uint64) |  |  |
| transact_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) |
| market_id | [uint64](#uint64) |  | The ID of the market in which the order was placed |
| subaccount_id | [uint64](#uint64) |  | The ID of the subaccount which placed the aggressing order that resulted in the implied match. |
| client_order_id | [uint64](#uint64) |  | The ID assigned by the client that placed the aggressing order that resulted in the implied match. |
| exchange_order_id | [uint64](#uint64) |  | The ID assigned by the exchange to the agressing order that resulted in the implied match. |
| fee_asset_id | [uint64](#uint64) |  | The ID of the asset demoninating the fee_amount. |
| fee_amount | [RawUnits](#rawunits) |  | The magnitude of the implied match fee in indivisible RawUnits. For details on how this is calculated, reference the documentation related to Implied Matching. Note that, unlike trading fees, this value is already accounted for in the quantities reported by the fill_quantity and fill_quote_quantity fields. It does not need to be subtracted when reconciling the associated order's fills against on-chain settlement. |
| fee_direction | [AdjustmentDirection](#adjustmentdirection) |  | Which way the fee_amount funds are moving, from the perspective of the client. |







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







### ContractPosition
The user's open contract position and open orders. Also see `AssetPosition`

`quote` is the settled offsetting quote balance for the open contract
units (and is thus almost almost always the opposite sign of
`net_contract_units`).

Funding payments (/ credits) are applied to this balance directly and are
not immediately settled. Also note that index price changes are not
immediately reflected in the `quote` balance. These are all settled at time
of PnL settlement, and subsequent `ContractPosition` and `AssetPosition`
messages will reflect those changes.

The unsettled PnL (different from the unrealized pnl) of the position,
which includes funding payments et al, is calculated as:

```rust compile_file
// the contract multiplier as defined in the contract specification
let contract_decimals = ...;

// from the index price market data feed, with 9 decimals of precision
let index_price = ...;

// base notional with 18 digits of precision
let base_notional
  = net_contract_units * 10.pow(9) / 10.pow(contract_decimals)
  * index_price
  ;

// quote is published with 18 decimals of precision
let quote = ...;

// pnl with 18 digits of precision.
let unsettled_pnl = base_notional + quote;
```


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| subaccount_id | [uint64](#uint64) |  |  |
| contract_id | [uint64](#uint64) |  |  |
| net_contract_units | [int64](#int64) |  | The net number of open contracts held by this subaccount. |
| quote | [HealthValue](#healthvalue) |  |  |
| bids | [RawUnits](#rawunits) |  |  |
| asks | [RawUnits](#rawunits) |  |  |
| cost_basis | [HealthValue](#healthvalue) |  | The cost basis paid for the current position. Lots are averaged together. <br> The cost basis will be the same sign as `net_contract_units`. <br> Display only. Reset when the position is closed or the position direction changes. |
| realized_pnl | [HealthValue](#healthvalue) |  | The realized PnL for the current position. Calculated as the sum of differences between contract value at time of close and average cost basis. <br> Display only. Reset when the position is closed or the position direction changes. |
| funding | [HealthValue](#healthvalue) |  | Total funding paid (positive) or received (negative) by this position. <br> Display only. Reset when the position is closed or the position direction changes. |
| leverage | [uint32](#uint32) |  | The leverage override applied to the contract. (0 if there is no override) <br> Leverage ratio affects the maximum notional position size as well as the initial margin requirements for the position. Note that this does not directly affect the maintenance margin requirements. |







## Bootstrap
A bootstrap message sent after Credentials authentication.
Client resting and pending orders used to bootstrap state.
Sent as the first message(s) after initialization.
A message containing the `Done` variant indicates that the Bootstrap is complete.
Multiple messages may be received for `RestingOrders` and `AssetPositions`
and these should be concatenated.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| done | [Done](#done) |  |  |
| resting | [RestingOrders](#restingorders) |  |  |
| position | [AssetPositions](#assetpositions) |  |  |
| trading_status | [TradingStatus](#tradingstatus) |  |  |
| contract_position | [ContractPositions](#contractpositions) |  |  |







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







### ContractPositions
A chunk of contract positions. Sent on bootstrap.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| positions | [ContractPosition](#contractposition) | repeated |  |







### Done
An indication that bootstrap is complete.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| latest_transact_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) |
| read_only | [bool](#bool) |  | DEPRECATED: will be removed in a future version; read the "connection_status" field in the "Bootstrap.TradingStatus" message that arrives before the "Done" message |







### TradingStatus
Indicates the scope of the ability to trade via this connection.
This message will be sent each time that scope changes.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| connection_status | [ConnectionStatus](#connectionstatus) |  | Indicates which operations are available through this connection as of this message. |







### RestingOrder
A resting order. Sent on bootstrap in `RestingOrders`.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| client_order_id | [uint64](#uint64) |  | The client order ID specified in the new-order request. |
| exchange_order_id | [uint64](#uint64) |  | [Exchange order ID](/trade-api.md#exchange-order-id) |
| market_id | [uint64](#uint64) |  |  |
| price | [uint64](#uint64) |  |  |
| order_quantity | [uint64](#uint64) |  | The quantity submitted in the latest quantity-modifying request. If the order has not been modified, then it is the quantity on the new-order-ack. If it has been modified, then it is the quantity of the latest modify-order-ack. |
| side | [Side](#side) |  |  |
| time_in_force | [TimeInForce](#timeinforce) |  |  |
| order_type | [OrderType](#ordertype) |  |  |
| remaining_quantity | [uint64](#uint64) |  | The current remaining quantity on the book. |
| rest_time | [uint64](#uint64) |  | [Transact time](/trade-api.md#transact-time) of the NewOrderAck |
| subaccount_id | [uint64](#uint64) |  |  |
| cumulative_quantity | [uint64](#uint64) |  | The cumulative filled quantity for this order. |
| cancel_on_disconnect | [bool](#bool) |  |  |








## Numeric Types
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







### HealthValue
Signed (twos-complement), fixed point 18-decimal-digit value.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| word0 | [uint64](#uint64) |  |  |
| word1 | [uint64](#uint64) |  |  |
| word2 | [uint64](#uint64) |  |  |
| word3 | [uint64](#uint64) |  |  |







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




### AdjustmentDirection
AdjustmentDirection specifies the directionality for a movement of funds between the client and the exchange.

| Name | Number | Description |
| ---- | ------ | ----------- |
| UNSPECIFIED | 0 | This value should never appear, and is used to detect if this field has been serialized correctly. |
| FEE | 1 | Funds are moving from the client to the exchange. |
| REBATE | 2 | Funds are moving from the exchange to the client. |




### TimeInForce
Time-in-force (TIF) specifies how long the order remains in effect.

| Name | Number | Description |
| ---- | ------ | ----------- |
| IMMEDIATE_OR_CANCEL | 0 | Immediate-or-cancel (IOC), also known as fill-and-kill (FAK), orders are immediately executed against resting orders. If the order cannot be fully filled, the remaining balance will be canceled, and an additional CancelOrderAck with the IOC reason will be sent. |
| GOOD_FOR_SESSION | 1 | Good-for-session (GFS) orders are active until they are completely executed, canceled, or when the session expires. |
| FILL_OR_KILL | 2 | Fill-or-kill (FOK), also known as all-or-none (AON), orders must be filled immediately against resting orders or the entire order is canceled. |




### OrderType
Order-type specifies how the order will be placed into the order book.

Limit orders refer to orders of type:
- LIMIT

Market orders refer to orders of type:
- MARKET_LIMIT
- MARKET_WITH_PROTECTION

Pre-flight quantity checks:
- Note that for LIMIT orders, there is a pre-flight check that there is
  sufficient available balance to place this order at the price and quantity
  specified. Otherwise, the order will be rejected with the
  EXCEEDED_SPOT_POSITION reason.
- For Market orders, there is no quantity-based pre-flight check and a
  submitted order will be partially filled up until the subaccount's position
  limit. The remaining quantity will be canceled with the POSITION_LIMIT
  reason.

For the following section, let

```
P_r = reference price
L = protection levels
P_ap = default protection ask price = P_r + L
P_bp = default protection bid price = P_r - L
```

Market order protections:
- Before execution, the following pre-flight slippage check is always
  performed:

    ```
    P_a = best book ask price
    P_b = best book bid price
    if side == BID:
      ensure P_a <= P_ap
    if side == ASK:
      ensure P_b >= P_bp
    ```

  Note that this calculation is irrespective of the order parameters.
- During execution, the match stops depending on the exit condition specified
  by the order type.

| Name | Number | Description |
| ---- | ------ | ----------- |
| LIMIT | 0 | A limit order is accompanied with a price (inclusive) that specifies the upper limit to buy and the lower limit to sell. If the price is not immediately available and the TIF allows resting orders, the limit order will rest until filled or canceled. |
| MARKET_LIMIT | 1 | A market limit order crosses the bid-ask spread and, if not fully filled, becomes a limit order at the best available market price. - If there is no opposing market, the order is rejected with the NO_OPPOSING_RESTING_ORDER reason. - The price must be null. |
| MARKET_WITH_PROTECTION | 2 | A market with protection order crosses the bid-ask spread and continues to cross until the order is fully filled or the protection level is reached. - The protection price is defined as: - If the price is provided, this price is used as the protection price. - If the price is null, the best market price widened by a market-specific protection point count. - If the protection price would not cross the resting market, the order is rejected with the NO_OPPOSING_RESTING_ORDER reason instead of resting at that level. |




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




### ConnectionStatus
Indicates which operations are allowed on this connection.
The ConnectionStatus may change during a single connection's lifetime.

| Name | Number | Description |
| ---- | ------ | ----------- |
| READ_ONLY | 0 | This connection may query balances and see resting orders but may not create, modify, or cancel orders e.g. |
| READ_WRITE | 1 | There are no restrictions imposed by this connection (though restrictions may apply from elsewhere in the system). |




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
| LIQUIDATION | 8 | This order was canceled because the subaccount health was insufficient and a liquidation event was triggered. |




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
| ONLY_ORDER_CANCEL_ACCEPTED | 17 | The given market accepts no new orders at this time |
| PROTECTION_PRICE_WOULD_NOT_TRADE | 18 | A more specific error code for market-with-protection orders that could trade but have a user-specified protection price that is too tight. |
| NO_REFERENCE_PRICE | 19 | Market orders cannot be place because there is currently no internal reference price |
| SLIPPAGE_TOO_HIGH | 20 | A market order would trade beyond the internal reference price offset by protection levels in the direction of aggress. |
| OUTSIDE_PRICE_BAND | 21 | Limit orders cannot have bid price too low or ask price too high that is multiple times away from the internal reference price. |
| LIMIT_ORDER_WITHOUT_PRICE | 22 |  |
| CONFLICTING_QUANTITY_TYPE | 23 | Both `quantity` and `quote_quantity` were specified. |
| NO_QUANTITY_TYPE | 24 | Neither `quantity` nor `quote_quantity` was specified. |
| ORDER_QUANTITY_TOO_LOW | 25 | The quantity of this order, if traded fully, would represent less than the minimum amount allowed for this market. See `minOrderQuoteAmt` in the market definitions. |
| ORDER_QUANTITY_TOO_HIGH | 26 | The quantity of this order, if traded fully, would represent greater than the maximum amount allowed for this market. See `maxOrderQuoteAmt` in the market definitions. |
| MARGIN_TRADING_UNAVAILABLE | 27 | This subaccount is not enabled for margin trading. |
| EXCEEDS_FREE_BALANCE | 28 | The spot balance required to place this order exceeds the free balance usable given current open positions and margin requirements. |
| INSUFFICIENT_INITIAL_MARGIN | 29 | The subaccount does not have sufficient additional initial margin to place this order. |
| INSUFFICIENT_MAINTENANCE_MARGIN | 30 | The subaccount does not have sufficient additional maintenance margin to place this order. |
| EXCEEDS_INITIAL_NOTIONAL_LIMIT | 31 | The value of the order, if executed, would cause the subaccount's total position to exceed the initial notional limit for the configured leverage. |




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
| ONLY_ORDER_CANCEL_ACCEPTED | 17 | The given market accepts no order modifications at this time |
| OUTSIDE_PRICE_BAND | 11 | Limit orders cannot have bid price too low or ask price too high that is multiple times away from the internal reference price. |
| ORDER_QUANTITY_TOO_LOW | 12 | The value of the modified order, if traded fully, would be less than the minimum value allowed for this market. See `minOrderQuoteAmt` in the market definitions. |
| ORDER_QUANTITY_TOO_HIGH | 13 | The value of the modified order, if traded fully, would be greater than the maximum value allowed for this market. See `maxOrderQuoteAmt` in the market definitions. |
| MARGIN_TRADING_UNAVAILABLE | 14 | This subaccount is not enabled for margin trading. |
| EXCEEDS_FREE_BALANCE | 15 | The spot balance required to place this order exceeds the free balance usable given current open positions and margin requirements. |
| INSUFFICIENT_INITIAL_MARGIN | 16 | The subaccount does not have sufficient additional initial margin to place this order. |
| INSUFFICIENT_MAINTENANCE_MARGIN | 18 | The subaccount does not have sufficient additional maintenance margin to place this order. |
| EXCEEDS_INITIAL_NOTIONAL_LIMIT | 19 | The value of the order, if executed, would cause the subaccount's total position to exceed the initial notional limit for the configured leverage. |








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

