# Perpetual Assets

Cube offers perpetual futures contracts for various digital assets. Each perpetual contract is designed to track the underlying spot price while providing leverage opportunities.

## Available Perpetual Contracts

| Contract | Base Asset | Quote Asset | Maximum Leverage |
|----------|------------|-------------|------------------|
| BTC-USDT | Bitcoin    | USDT        | 100x            |
| ETH-USDT | Ethereum   | USDT        | 100x            |
// Add other available contracts

## Contract Specifications

### Contract Details
- **Contract Size**: The nominal value of one contract
- **Minimum Contract Quantity**: The smallest tradeable amount
- **Price Tick**: The minimum price movement
- **Value Tick**: The minimum value of price movement
- **Settlement Currency**: USDT

### Trading Hours
24/7 trading is available for all perpetual contracts.

### Order Types
- Market Order
- Limit Order
- Stop Loss
- Take Profit
- Trailing Stop

## Price Discovery

### Mark Price
The mark price is used for PNL calculation and liquidation purposes. It is derived from:
- Index price
- Premium/discount in the perpetual market
- Price impact estimator

### Index Price
The index price is calculated using data from multiple exchanges to ensure robust and manipulation-resistant prices.

## Trading Pairs
Each perpetual contract is quoted against USDT, providing a consistent quote currency across all pairs.

# Contract Specifications

## Contract Details
- **Contract Size**: The nominal value of one contract
- **Minimum Contract Quantity**: The smallest tradeable amount
- **Price Tick**: The minimum price movement
- **Value Tick**: The minimum value of price movement
- **Settlement Currency**: USDT

## Trading Hours
24/7 trading is available for all perpetual contracts.

## Position Types
- Long (Buy)
- Short (Sell)

## Order Types
- Market Order
- Limit Order
- Stop Loss
- Take Profit
- Trailing Stop
