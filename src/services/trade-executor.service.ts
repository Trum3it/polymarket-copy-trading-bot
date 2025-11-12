import type { ClobClient } from '@polymarket/clob-client';
import type { RuntimeEnv } from '../config/env';
import type { Logger } from '../utils/logger.util';
import type { TradeSignal } from '../domain/trade.types';
import { computeProportionalSizing } from '../config/copy-strategy';
import { postOrder } from '../utils/post-order.util';
import { getUsdBalanceApprox } from '../utils/get-balance.util';

export type TradeExecutorDeps = {
  client: ClobClient;
  proxyWallet: string;
  env: RuntimeEnv;
  logger: Logger;
};

export class TradeExecutorService {
  private readonly deps: TradeExecutorDeps;

  constructor(deps: TradeExecutorDeps) {
    this.deps = deps;
  }

  async copyTrade(signal: TradeSignal): Promise<void> {
    const { logger, env, client } = this.deps;
    try {
      const yourUsdBalance = await getUsdBalanceApprox(client.wallet);
      const sizing = computeProportionalSizing({
        yourUsdBalance,
        traderUsdBalance: Math.max(1, signal.sizeUsd * 20), // rough guess; replace with real data
        traderTradeUsd: signal.sizeUsd,
        multiplier: env.tradeMultiplier,
      });

      logger.info(`Sizing ratio ${(sizing.ratio * 100).toFixed(2)}% => ${sizing.targetUsdSize.toFixed(2)} USD`);

      await postOrder({
        client,
        marketId: signal.marketId,
        outcome: signal.outcome,
        side: signal.side,
        sizeUsd: sizing.targetUsdSize,
      });
    } catch (err) {
      logger.error('Failed to copy trade', err as Error);
    }
  }
}

