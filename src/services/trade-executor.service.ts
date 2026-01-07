import type { ClobClient } from '@polymarket/clob-client';
import type { Wallet } from 'ethers';
import type { RuntimeEnv } from '../config/env';
import type { Logger } from '../utils/logger.util';
import type { TradeSignal } from '../domain/trade.types';
import { postOrder } from '../utils/post-order.util';
import { getUsdBalanceApprox, getPolBalance } from '../utils/get-balance.util';
import { httpGet } from '../utils/fetch-data.util';
import { PositionTrackerService } from './position-tracker.service';

export type TradeExecutorDeps = {
  client: ClobClient & { wallet: Wallet };
  proxyWallet: string;
  env: RuntimeEnv;
  logger: Logger;
  positionTracker?: PositionTrackerService;
};


interface Position {
  conditionId: string;
  initialValue: number;
  currentValue: number;
}

export class TradeExecutorService {
  private readonly deps: TradeExecutorDeps;

  constructor(deps: TradeExecutorDeps) {
    this.deps = deps;
  }

  async frontrunTrade(signal: TradeSignal): Promise<void> {
    const { logger, env, client, positionTracker } = this.deps;
    try {
      const yourUsdBalance = await getUsdBalanceApprox(client.wallet, env.usdcContractAddress);
      const polBalance = await getPolBalance(client.wallet);

      logger.info(`[Frontrun] Balance check - POL: ${polBalance.toFixed(4)} POL, USDC: ${yourUsdBalance.toFixed(2)} USDC`);

      // Check total exposure limit
      if (positionTracker) {
        const totalExposure = positionTracker.getTotalExposure();
        const maxExposure = env.maxTotalExposureUsd || 50000;
        if (totalExposure >= maxExposure) {
          logger.warn(
            `[Frontrun] Total exposure limit reached: ${totalExposure.toFixed(2)} USD (max: ${maxExposure} USD)`,
          );
          return;
        }
      }

      // For frontrunning, we execute the same trade but with higher priority
      // Calculate frontrun size (typically smaller or same as target)
      const frontrunSize = this.calculateFrontrunSize(signal.sizeUsd, env);

      // Check position size limit
      if (positionTracker) {
        const existingPositions = positionTracker.getPositions(signal.marketId, signal.tokenId);
        const existingSize = existingPositions.reduce((sum, p) => sum + p.sizeUsd, 0);
        const maxPositionSize = env.maxPositionSizeUsd || 10000;
        if (existingSize + frontrunSize > maxPositionSize) {
          logger.warn(
            `[Frontrun] Position size limit would be exceeded: ${(existingSize + frontrunSize).toFixed(2)} USD (max: ${maxPositionSize} USD)`,
          );
          return;
        }
      }

      logger.info(
        `[Frontrun] Executing ${signal.side} ${frontrunSize.toFixed(2)} USD (target: ${signal.sizeUsd.toFixed(2)} USD)`,
      );

      // Balance validation
      const requiredUsdc = frontrunSize;
      const minPolForGas = 0.05; // Higher gas needed for frontrunning

      if (signal.side === 'BUY') {
        if (yourUsdBalance < requiredUsdc) {
          logger.error(
            `[Frontrun] Insufficient USDC balance. Required: ${requiredUsdc.toFixed(2)} USDC, Available: ${yourUsdBalance.toFixed(2)} USDC`,
          );
          return;
        }
      }

      if (polBalance < minPolForGas) {
        logger.error(
          `[Frontrun] Insufficient POL balance for gas. Required: ${minPolForGas} POL, Available: ${polBalance.toFixed(4)} POL`,
        );
        return;
      }

      // Calculate max acceptable price with slippage protection
      const maxSlippage = env.maxSlippagePercent || 2.0;
      const maxAcceptablePrice = signal.side === 'BUY' 
        ? signal.price * (1 + maxSlippage / 100)
        : signal.price * (1 - maxSlippage / 100);

      // Execute frontrun order with priority
      await postOrder({
        client,
        marketId: signal.marketId,
        tokenId: signal.tokenId,
        outcome: signal.outcome,
        side: signal.side,
        sizeUsd: frontrunSize,
        maxAcceptablePrice,
        priority: true,
        targetGasPrice: signal.targetGasPrice,
        gasPriceMultiplier: env.gasPriceMultiplier,
      });

      // Track position
      if (positionTracker) {
        positionTracker.addPosition(signal, frontrunSize, signal.price);
      }
      
      logger.info(`[Frontrun] Successfully executed ${signal.side} order for ${frontrunSize.toFixed(2)} USD`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('closed') || errorMessage.includes('resolved') || errorMessage.includes('No orderbook')) {
        logger.warn(`[Frontrun] Skipping trade - Market ${signal.marketId} is closed or resolved: ${errorMessage}`);
      } else if (errorMessage.includes('slippage') || errorMessage.includes('Price protection')) {
        logger.warn(`[Frontrun] Skipping trade due to slippage: ${errorMessage}`);
      } else {
        logger.error(`[Frontrun] Failed to frontrun trade: ${errorMessage}`, err as Error);
      }
    }
  }

  private calculateFrontrunSize(targetSize: number, env: RuntimeEnv): number {
    // Frontrun with a percentage of the target size
    // This can be configured via env variable
    const frontrunMultiplier = env.frontrunSizeMultiplier || 0.5; // Default to 50% of target
    return targetSize * frontrunMultiplier;
  }

  // Keep copyTrade for backward compatibility, but redirect to frontrun
  async copyTrade(signal: TradeSignal): Promise<void> {
    return this.frontrunTrade(signal);
  }

  private async getTraderBalance(trader: string): Promise<number> {
    try {
      const positions: Position[] = await httpGet<Position[]>(
        `https://data-api.polymarket.com/positions?user=${trader}`,
      );
      const totalValue = positions.reduce((sum, pos) => sum + (pos.currentValue || pos.initialValue || 0), 0);
      return Math.max(100, totalValue);
    } catch {
      return 1000;
    }
  }
}


