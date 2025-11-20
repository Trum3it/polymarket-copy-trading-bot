# Polymarket Copy Trading Bot

Automated copy trading bot for Polymarket. Monitors selected traders and automatically mirrors their positions with proportional sizing.

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
USER_ADDRESSES=0xabc...,0xdef...    # Traders to copy (comma-separated)
PUBLIC_KEY=0xyour_wallet          # Your Polygon wallet
PRIVATE_KEY=your_private_key        # Without 0x prefix
RPC_URL=https://polygon-mainnet...  # Polygon RPC endpoint
```

Optional settings:

```env
FETCH_INTERVAL=1                    # Polling interval (seconds)
TRADE_MULTIPLIER=1.0                # Position size multiplier
USDC_CONTRACT_ADDRESS=0x2791...     # USDC contract (default: Polygon mainnet)
```

## Features

- Multi-trader monitoring
- Proportional position sizing
- Real-time trade detection
- Automatic order execution
- Error handling and retries

## Requirements

- Node.js 18+
- Polygon wallet with USDC balance
- POL/MATIC for gas fees

## Scripts

- `npm run dev` - Development mode
- `npm run build` - Compile TypeScript
- `npm start` - Production mode
- `npm run lint` - Run linter

## Documentation

See [GUIDE.md](./GUIDE.md) for detailed setup, configuration, and troubleshooting.

## License

Apache-2.0

## Disclaimer

This software is provided as-is. Trading involves substantial risk. Use at your own risk.
