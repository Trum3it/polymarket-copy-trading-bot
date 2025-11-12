import 'dotenv/config';
import { loadEnv } from '../config/env';
import { createPolymarketClient } from '../infrastructure/clob-client.factory';
import { ConsoleLogger } from '../utils/logger.util';

async function run(): Promise<void> {
  const logger = new ConsoleLogger();
  const env = loadEnv();
  const client = await createPolymarketClient({ rpcUrl: env.rpcUrl, privateKey: env.privateKey });
  logger.info(`Wallet: ${client.wallet.address}`);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

