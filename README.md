# Polymarket Copy Trading Bot

A production-grade TypeScript bot for automated copy trading on Polymarket. Monitor top traders and automatically mirror their positions with intelligent proportional sizing, safety checks, and real-time monitoring.

[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Polymarket CLOB](https://img.shields.io/badge/Polymarket-CLOB-purple?style=flat)](https://github.com/Polymarket/clob-client)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)

---

## Overview

This bot enables automated copy trading on Polymarket by:

- Monitoring selected trader addresses in real-time
- Detecting new trades (BUY/SELL signals)
- Calculating proportional position sizes based on your capital
- Executing trades automatically via the Polymarket CLOB API
- Providing safety checks and retry mechanisms

**Keywords:** polymarket copy trading bot, polymarket trading bot, polymarket copytrading, prediction markets bot

---

## Features

- ✅ Multi-trader support with proportional position sizing
- ✅ Real-time polling with configurable intervals
- ✅ Safety checks (min order size, slippage protection, retry limits)
- ✅ Modular, extensible architecture
- ✅ CLI utilities for allowance management and simulations
- ✅ Docker-ready for easy deployment
- ✅ TypeScript with strict type checking

---

## Quick Start

### Prerequisites

- Node.js 18 or higher
- Polygon wallet with USDC balance
- POL/MATIC for gas fees
- (Optional) MongoDB for position tracking

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/polymarket-copy-trading-bot.git
cd polymarket-copy-trading-bot

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
# Required Configuration
USER_ADDRESSES=0xabc...,0xdef...
PROXY_WALLET=0xyour_wallet_address
PRIVATE_KEY=your_private_key_without_0x
RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID

# Optional Settings
FETCH_INTERVAL=1
TRADE_MULTIPLIER=1.0
RETRY_LIMIT=3
TRADE_AGGREGATION_ENABLED=false
TRADE_AGGREGATION_WINDOW_SECONDS=300
```

### Running the Bot

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

---

## How It Works

The bot follows a simple workflow:

1. **Discovery** → Polls Polymarket activity feeds for tracked trader addresses
2. **Signal Detection** → Creates `TradeSignal` objects when new trades are detected
3. **Position Sizing** → Calculates proportional USD size using your balance and multiplier
4. **Order Execution** → Submits market orders via Polymarket CLOB client
5. **Tracking** → (Optional) Records fills and computes PnL for reporting

> **Note:** This is a scaffold implementation. You'll need to wire real activity feeds and complete order routing to go fully live.

---

## Architecture

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript (strict mode) |
| Runtime | Node.js 18+ |
| Trading API | `@polymarket/clob-client` |
| Blockchain | `ethers` (wallet/provider) |
| HTTP Client | `axios` |
| Logging | `chalk`, `ora` |
| Database | `mongoose` (optional, MongoDB) |
| Code Quality | ESLint + Prettier |
| Containerization | Docker + docker-compose |

### Directory Structure

```
src/
├── app/
│   └── main.ts                      # Application entry point
├── config/
│   ├── env.ts                       # Environment configuration
│   └── copy-strategy.ts             # Position sizing logic
├── domain/
│   ├── trade.types.ts               # Trade signal types
│   └── user.types.ts                # User/trader types
├── infrastructure/
│   └── clob-client.factory.ts       # Polymarket client factory
├── services/
│   ├── trade-monitor.service.ts     # Trade monitoring service
│   └── trade-executor.service.ts    # Trade execution service
├── utils/
│   ├── logger.util.ts               # Logging utilities
│   ├── fetch-data.util.ts           # HTTP helpers
│   ├── get-balance.util.ts          # Balance queries
│   ├── post-order.util.ts           # Order submission
│   └── spinner.util.ts              # CLI spinners
└── cli/
    ├── check-allowance.command.ts
    ├── verify-allowance.command.ts
    ├── set-token-allowance.command.ts
    ├── manual-sell.command.ts
    └── run-simulations.command.ts
```

---

## Configuration Reference

### Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `USER_ADDRESSES` | string | Yes | - | Comma-separated trader addresses to copy |
| `PROXY_WALLET` | string | Yes | - | Your Polygon wallet address |
| `PRIVATE_KEY` | string | Yes | - | Private key (without 0x prefix) |
| `RPC_URL` | string | Yes | - | Polygon RPC endpoint URL |
| `FETCH_INTERVAL` | number | No | `1` | Poll frequency in seconds |
| `TRADE_MULTIPLIER` | number | No | `1.0` | Position size multiplier |
| `RETRY_LIMIT` | number | No | `3` | Maximum retry attempts |
| `TRADE_AGGREGATION_ENABLED` | boolean | No | `false` | Enable trade aggregation |
| `TRADE_AGGREGATION_WINDOW_SECONDS` | number | No | `300` | Aggregation window (seconds) |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run in development mode (ts-node) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production build |
| `npm run check-allowance` | Check token allowance |
| `npm run verify-allowance` | Verify token allowance |
| `npm run set-token-allowance` | Set token allowance |
| `npm run manual-sell` | Manual sell utility |
| `npm run simulate` | Run backtesting simulations |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |

---

## Deployment

### Local Deployment

```bash
npm run build
npm start
```

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
- **Render:** Environment variables in dashboard
- **Fly.io:** `fly secrets set KEY=value`
- **Kubernetes:** ConfigMaps and Secrets

---

## Roadmap

- [ ] Complete trade fetching from Polymarket activity feeds
- [ ] Implement price protection and min-size enforcement
- [ ] Add MongoDB persistence with position tracking
- [ ] Build comprehensive simulation/backtesting toolkit
- [ ] Develop web dashboard for monitoring and control

---

## Contact & Support

**Email:** [xsui46941@gmail.com](mailto:xsui46941@gmail.com)  
**Telegram:** [@lorine93s](https://t.me/lorine93s)  
**Twitter:** [@kakamajo_btc](https://twitter.com/kakamajo_btc)

---

## License

Apache-2.0

---

## Disclaimer

This software is provided as-is for educational and research purposes. Trading cryptocurrencies and prediction markets involves substantial risk. Use at your own risk and never trade with funds you cannot afford to lose.
