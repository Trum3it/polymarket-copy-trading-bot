# Complete Guide

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Funding Your Wallet](#funding-your-wallet)
4. [Running the Bot](#running-the-bot)
5. [How It Works](#how-it-works)
6. [Position Tracking](#position-tracking)
7. [Simulation & Backtesting](#simulation--backtesting)
8. [Troubleshooting](#troubleshooting)
9. [Deployment](#deployment)

---

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Polygon wallet with USDC balance
- POL/MATIC for gas fees

### Steps

1. Clone the repository:
```bash
git clone https://github.com/kinexbt/polymarket-trading-bot.git
cd polymarket-trading-bot
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

#### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `USER_ADDRESSES` | Comma-separated trader addresses to set as target | `0xabc...,0xdef...` |
| `PUBLIC_KEY` | Your Polygon wallet address | `your_wallet_address` |
| `PRIVATE_KEY` | Your wallet private key | `your_private_key` |
| `RPC_URL` | Polygon RPC endpoint | `https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID`|

#### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `FETCH_INTERVAL` | `1` | Polling frequency in seconds |
| `TRADE_MULTIPLIER` | `1.0` | Position size multiplier (1.0 = same ratio, 2.0 = double) |
| `RETRY_LIMIT` | `3` | Maximum retry attempts for failed orders |
| `TRADE_AGGREGATION_ENABLED` | `false` | Enable trade aggregation |
| `TRADE_AGGREGATION_WINDOW_SECONDS` | `300` | Time window for aggregating trades (seconds) |
| `USDC_CONTRACT_ADDRESS` | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` | USDC contract on Polygon |
| `MONGO_URI` | - | MongoDB connection string (optional) |

### Example `.env` File

```env
USER_ADDRESSES=0x1234567890abcdef1234567890abcdef12345678,0xabcdef1234567890abcdef1234567890abcdef12
PUBLIC_KEY=your_wallet_address_here
PRIVATE_KEY=your_privatekey_key_here
RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
FETCH_INTERVAL=1
TRADE_MULTIPLIER=1.0
RETRY_LIMIT=3
USDC_CONTRACT_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
```

---

## Funding Your Wallet

### Requirements

You need two types of funds on your Polygon wallet:

1. **USDC** - For trading positions
2. **POL/MATIC** - For gas fees

### Steps

1. **Bridge or acquire USDC on Polygon:**
   - Use Polygon Bridge to transfer USDC from Ethereum
   - Or purchase USDC directly on Polygon via DEX
   - Recommended minimum: $100-500 USDC for testing

2. **Fund gas (POL/MATIC):**
   - Ensure you have at least 0.1-0.5 POL/MATIC for gas
   - You can buy POL/MATIC on exchanges or use Polygon faucets

3. **Verify funding:**
   - Check your wallet balance on PolygonScan
   - Confirm both USDC and POL/MATIC are present
   - Set `PUBLIC_KEY` in `.env` to this funded address

### Getting RPC URL

You can get a free RPC endpoint from:
- [Infura](https://infura.io) - Free tier available
- [Alchemy](https://alchemy.com) - Free tier available
- [QuickNode](https://quicknode.com) - Free tier available

---

## Running the Bot

### Development Mode

```bash
npm run dev
```

Runs with TypeScript directly using `ts-node`. Useful for development and debugging.

### Production Mode

```bash
npm run build
npm start
```

Compiles TypeScript to JavaScript first, then runs the compiled code. Recommended for production.

### Docker Deployment

**Build and run:**
```bash
docker build -t polymarket-copy-bot .
docker run --env-file .env polymarket-copy-bot
```

**Using Docker Compose:**
```bash
docker-compose up -d
```

### Cloud Deployment

Set environment variables through your platform's configuration:

- **Render:** Add environment variables in dashboard
- **Fly.io:** `fly secrets set KEY=value`
- **Kubernetes:** Use ConfigMaps and Secrets
- **AWS/GCP/Azure:** Use their respective secret management services

---

## How It Works

### Workflow

1. **Discovery** - Bot polls Polymarket activity feeds for tracked trader addresses
2. **Signal Detection** - When new trades are detected, creates `TradeSignal` objects
3. **Position Sizing** - Calculates proportional USD size based on:
   - Your USDC balance
   - Trader's portfolio value
   - Trade multiplier setting
4. **Order Execution** - Submits market orders via Polymarket CLOB client
5. **Error Handling** - Retries failed orders up to `RETRY_LIMIT`

### Position Sizing Formula

```
ratio = your_balance / (trader_balance + trader_trade_size)
target_size = trader_trade_size * ratio * multiplier
```

### Order Types

- **FOK (Fill-or-Kill)** - Order must fill completely or be cancelled
- Orders are placed at best available price (market orders)

---

## Position Tracking

### Current Implementation

The bot automatically:
- Tracks processed trades to avoid duplicates
- Calculates proportional position sizes
- Handles both BUY and SELL signals

### Planned Features

Future enhancements may include:
- MongoDB persistence for trade history
- Position aggregation per market/outcome
- Proportional sell engine that mirrors trader exits
- Realized vs unrealized PnL breakdown
- Position tracking dashboard

### Manual Position Management

You can check your positions on:
- Polymarket website (your profile)
- PolygonScan (token balances)
- Polymarket API: `https://data-api.polymarket.com/positions?user=YOUR_ADDRESS`

---

## Simulation & Backtesting

### Overview

The bot includes infrastructure for simulation and backtesting, allowing you to:
- Test different `TRADE_MULTIPLIER` values
- Evaluate polling frequency impact
- Measure performance metrics

### Running Simulations

```bash
npm run simulate
```

### Implementation Steps

To implement full backtesting:

1. **Data Collection:**
   - Fetch historical trades for tracked traders
   - Get historical market prices
   - Collect order book snapshots

2. **Simulation Logic:**
   - Reconstruct sequences of buys/sells
   - Apply your sizing rules
   - Include transaction costs
   - Handle slippage

3. **Metrics:**
   - Total PnL
   - Win rate
   - Maximum drawdown
   - Sharpe ratio
   - Capacity limits

### Suggested Approach

- Start with small time windows (1 day, 1 week)
- Test different multipliers (0.5, 1.0, 2.0)
- Compare results across different traders
- Identify optimal settings before going live

---

## Troubleshooting

### Bot Not Detecting Trades

**Symptoms:** Bot runs but no trades are copied

**Solutions:**
1. Verify `USER_ADDRESSES` are correct and active traders
2. Check that traders have recent activity on Polymarket
3. Increase `FETCH_INTERVAL` if network is slow
4. Check logs for API errors
5. Verify RPC URL is working: `curl $RPC_URL`

### Orders Not Submitting

**Symptoms:** Trades detected but orders fail

**Solutions:**
1. **Check USDC balance:**
   - Ensure sufficient USDC in wallet
   - Verify balance on PolygonScan

2. **Check gas funds:**
   - Ensure POL/MATIC balance > 0.1
   - Top up if needed

3. **Verify RPC URL:**
   - Test endpoint is accessible
   - Check rate limits
   - Try alternative RPC provider

4. **Verify credentials:**
   - Confirm `PRIVATE_KEY` matches `PUBLIC_KEY`
   - Check private key format (no 0x prefix)
   - Ensure wallet has proper permissions

5. **Check market conditions:**
   - Verify market is still active
   - Check if order book has liquidity
   - Ensure price hasn't moved significantly

### Connection Issues

**Symptoms:** Bot can't connect to APIs

**Solutions:**
1. Check internet connection
2. Verify RPC URL is correct
3. Check if Polymarket API is accessible
4. Review firewall settings
5. Try different RPC provider

### High Gas Costs

**Solutions:**
1. Reduce `FETCH_INTERVAL` to batch operations
2. Use Polygon's lower gas fees (already on Polygon)
3. Monitor gas prices and trade during low-traffic periods

### Performance Issues

**Solutions:**
1. Increase `FETCH_INTERVAL` if CPU usage is high
2. Reduce number of tracked traders
3. Optimize RPC endpoint (use premium providers)
4. Consider using WebSocket subscriptions (future feature)

---

## Deployment

### Local Deployment

```bash
npm run build
npm start
```

### Docker

**Build:**
```bash
docker build -t polymarket-copy-bot .
```

**Run:**
```bash
docker run --env-file .env -d --name polymarket-bot polymarket-copy-bot
```

**Stop:**
```bash
docker stop polymarket-bot
```

### Production Considerations

1. **Security:**
   - Never commit `.env` file
   - Use environment variable management
   - Rotate private keys regularly
   - Use hardware wallets if possible

2. **Monitoring:**
   - Set up logging aggregation
   - Monitor bot health
   - Track trade execution rates
   - Alert on errors

3. **Reliability:**
   - Use process managers (PM2, systemd)
   - Set up auto-restart on crashes
   - Monitor system resources
   - Keep dependencies updated

4. **Backup:**
   - Backup configuration files
   - Document your setup
   - Keep wallet recovery phrases secure

---

## Additional Resources

- [Polymarket Documentation](https://docs.polymarket.com)
- [CLOB Client Library](https://github.com/Polymarket/clob-client)
- [Polygon Documentation](https://docs.polygon.technology)

---

## Support

For issues and questions:
- **Email:** piter.jb0817@gmail.com
- **Telegram:** [@kinexbt](https://t.me/kinexbt)
- **Twitter:** [@kinexbt](https://x.com/kinexbt)

