#!/usr/bin/env bash
#
# Rebuilds markdown files in ./generated/ws-api from .proto files in the "ws-api" repo.
#
# Expects:
#   "ws-api" checked out in same directory as this repo
#   protoc-gen-doc with local changes: https://github.com/pseudomuto/protoc-gen-doc.git

set -e

# switch to script directory
cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v protoc-gen-doc; then
  echo "Did not find protoc-gen-doc. Please update"
  exit 1
fi


PLUGIN="$(command -v protoc-gen-doc)"
SCHEMAS="../ws-api/schema"
OUT_DIR="./generated/ws-api"

if [ ! -d "$SCHEMAS" ]; then
  echo "Can't find directory for schemas at $SCHEMAS"
  exit 1
fi

echo 'Removing any extant ws-api docs...'
# smack with hammer...
mkdir -p "$OUT_DIR"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo 'Generating markdown for Trade API...'
protoc \
  --plugin=protoc-gen-doc="$PLUGIN" \
  --doc_out="$OUT_DIR" \
  --doc_opt=markdown,websocket-trade-api.md \
  --proto_path="$SCHEMAS" "$SCHEMAS"/trade.proto

sed -i '' '1i\
# WebSocket: Trade API' $OUT_DIR/websocket-trade-api.md

ONCE=(
  # order request
  NewOrder
  CancelOrder
  ModifyOrder
  Heartbeat
  MassCancel
  # order response
  NewOrderAck
  CancelOrderAck
  ModifyOrderAck
  NewOrderReject
  CancelOrderReject
  ModifyOrderReject
  Fill
  FixedPointDecimal
  AssetPosition
  RawUnits
  MassCancelAck
  # bootstrap
  Done
  RestingOrders
  RestingOrder
  AssetPositions
)

for STRUCT in "${ONCE[@]}"; do
  sed -i '' "s/^\\(#*\\) $STRUCT\$/\\1# $STRUCT/" $OUT_DIR/websocket-trade-api.md
done

echo 'Generating markdown for Market Data API...'
protoc \
  --plugin=protoc-gen-doc="$PLUGIN" \
  --doc_out="$OUT_DIR" \
  --doc_opt=markdown,websocket-market-data-api.md \
  --proto_path="$SCHEMAS" "$SCHEMAS"/market_data.proto

sed -i '' '1i\
# WebSocket: Market Data API' $OUT_DIR/websocket-market-data-api.md

ONCE=(
  # md messages
  MarketByPrice
  MarketByPrice.Level
  MarketByPriceDiff
  MarketByPriceDiff.Diff
  MarketByOrder
  MarketByOrder.Order
  MarketByOrderDiff
  MarketByOrderDiff.Diff
  Trades
  Trades.Trade
  Summary
  Kline
  Heartbeat
  MdMessages
  # agg message
  TopOfBook
  TopOfBooks
  RateUpdate
  RateUpdates
  # client message
  Config
)

for STRUCT in "${ONCE[@]}"; do
  sed -i '' "s/^\\(#*\\) $STRUCT\$/\\1# $STRUCT/" $OUT_DIR/websocket-market-data-api.md
done

echo 'Success!'
