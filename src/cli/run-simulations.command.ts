import 'dotenv/config';
import { ConsoleLogger } from '../utils/logger.util';

async function run(): Promise<void> {
  const logger = new ConsoleLogger();
  logger.info('Simulation runner starting...');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

