# Polymarket Frontrun Bot

Automated frontrunning bot for Polymarket. Monitors the mempool and Polymarket API for pending trades, then executes orders with higher priority to frontrun target transactions.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your wallet and trader addresses

# Run the bot
npm run build && npm start
```

## Configuration

Required environment variables:

```env
TARGET_ADDRESSES=0xabc...,0xdef...    # Target addresses to frontrun (comma-separated)
PUBLIC_KEY=your_bot_wallet            # Public address of ur bot wallet will be used for copytrading
PRIVATE_KEY=your_bot_wallet_privatekey   # Privatekey of above address
RPC_URL=https://polygon-mainnet...  # Polygon RPC endpoint (must support pending tx monitoring)
```

Optional settings:

```env
FETCH_INTERVAL=1                    # Polling interval (seconds)
MIN_TRADE_SIZE_USD=100              # Minimum trade size to frontrun (USD)
FRONTRUN_SIZE_MULTIPLIER=0.5        # Frontrun size as % of target (0.0-1.0)
GAS_PRICE_MULTIPLIER=1.2            # Gas price multiplier for priority (e.g., 1.2 = 20% higher)
USDC_CONTRACT_ADDRESS=0x2791...     # USDC contract (default: Polygon mainnet)
MAX_SLIPPAGE_PERCENT=2.0            # Maximum acceptable slippage percentage (default: 2.0%)
MAX_POSITION_SIZE_USD=10000         # Maximum position size per market (USD, default: 10000)
MAX_TOTAL_EXPOSURE_USD=50000        # Maximum total exposure across all positions (USD, default: 50000)
HEALTH_CHECK_PORT=3000              # Health monitoring HTTP server port (default: 3000)
MONGO_URI=mongodb://...             # MongoDB connection string (optional, for duplicate detection persistence)
RETRY_LIMIT=3                       # Maximum retry attempts for failed orders (default: 3)
```

## Features

- **Mempool Monitoring** - Real-time monitoring of pending transactions
- **Gas Price Extraction** - Automatically extracts and applies higher gas prices for frontrunning
- **Position Tracking** - Tracks open positions with size limits and total exposure controls
- **Slippage Protection** - Configurable slippage protection to avoid bad executions
- **MongoDB Persistence** - Optional MongoDB integration for duplicate detection (prevents re-execution after restart)
- **Rate Limiting** - Built-in rate limiting to prevent API bans and respect rate limits
- **Health Monitoring** - HTTP health check endpoints (`/health` and `/metrics`) for monitoring
- **Connection Pooling** - Optimized HTTP connections with keep-alive for better performance
- **Order Book Caching** - Intelligent caching to reduce API calls and improve latency
- **Error Handling** - Comprehensive error handling with retries and exponential backoff
- **Graceful Shutdown** - Proper cleanup on shutdown signals (SIGTERM/SIGINT)

## Requirements

- Node.js 18+
- Polygon wallet with USDC balance
- POL/MATIC for gas fees
- MongoDB (optional, recommended for production to prevent duplicate trades)

## Scripts

- `npm run dev` - Development mode (TypeScript direct execution)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Production mode (runs compiled JavaScript)
- `npm run lint` - Run linter
- `npm run lint:fix` - Fix linting errors automatically

## Health Monitoring

The bot includes a health monitoring HTTP server (default port: 3000) with the following endpoints:

- `GET /health` - Returns health status and basic metrics
- `GET /metrics` - Returns detailed metrics including:
  - Uptime (seconds)
  - Trades executed/failed
  - Last trade timestamp
  - Wallet balances (POL and USDC)
  - Error history
  - Health status

Access: `http://localhost:3000/health` (or your configured port)

## MongoDB Setup (Optional but Recommended)

MongoDB is optional but highly recommended for production to prevent duplicate trade execution after restarts.

1. Install MongoDB or use a cloud service (MongoDB Atlas, etc.)
2. Get your connection string
3. Add to `.env`: `MONGO_URI=mongodb://localhost:27017/polymarket-bot` (or your connection string)
4. The bot will automatically connect and use MongoDB for duplicate detection

If MongoDB is not configured, the bot will run with in-memory duplicate detection (lost on restart).

## Documentation

See [GUIDE.md](./GUIDE.md) for detailed setup, configuration, and troubleshooting.

## License

Apache-2.0

## Contact

For support or questions, reach out on Telegram: [@trum3it](https://t.me/trum3it)

## Disclaimer

This software is provided as-is. Trading involves substantial risk. Use at your own risk.
