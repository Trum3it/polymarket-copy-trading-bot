import express, { type Express } from 'express';
import type { Logger } from '../utils/logger.util';
import type { Wallet } from 'ethers';

export interface HealthMetrics {
  uptime: number;
  tradesExecuted: number;
  tradesFailed: number;
  lastTradeTime?: number;
  walletBalance?: {
    pol: number;
    usdc: number;
  };
  isHealthy: boolean;
  errors: string[];
}


export class HealthMonitorService {
  private app: Express;
  private logger: Logger;
  private startTime: number;
  private metrics: HealthMetrics;
  private wallet?: Wallet;
  private usdcContractAddress?: string;
  private server?: any;

  constructor(logger: Logger, port: number = 3000) {
    this.logger = logger;
    this.startTime = Date.now();
    this.metrics = {
      uptime: 0,
      tradesExecuted: 0,
      tradesFailed: 0,
      isHealthy: true,
      errors: [],
    };

    this.app = express();
    this.app.use(express.json());

    this.app.get('/health', (req: any, res: any) => {
      this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
      res.json(this.metrics);
    });

    this.app.get('/metrics', (req: any, res: any) => {
      this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
      res.json(this.metrics);
    });

    this.server = this.app.listen(port, () => {
      this.logger.info(`Health monitor started on port ${port}`);
    });
  }

  setWallet(wallet: Wallet, usdcContractAddress: string): void {
    this.wallet = wallet;
    this.usdcContractAddress = usdcContractAddress;
  }

  recordTrade(success: boolean): void {
    if (success) {
      this.metrics.tradesExecuted++;
    } else {
      this.metrics.tradesFailed++;
    }
    this.metrics.lastTradeTime = Date.now();
  }

  recordError(error: string): void {
    this.metrics.errors.push(error);
    if (this.metrics.errors.length > 10) {
      this.metrics.errors.shift();
    }
    this.metrics.isHealthy = false;
  }

  async updateBalance(): Promise<void> {
    if (!this.wallet || !this.usdcContractAddress) {
      return;
    }

    try {
      const { getPolBalance, getUsdBalanceApprox } = await import('../utils/get-balance.util');
      const pol = await getPolBalance(this.wallet);
      const usdc = await getUsdBalanceApprox(this.wallet, this.usdcContractAddress);
      this.metrics.walletBalance = { pol, usdc };
    } catch (error) {
      this.logger.error('Failed to update balance in health monitor', error as Error);
    }
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.logger.info('Health monitor stopped');
    }
  }

  getMetrics(): HealthMetrics {
    this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    return { ...this.metrics };
  }
}

