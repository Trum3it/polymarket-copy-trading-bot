import type { Logger } from '../utils/logger.util';
import type { TradeSignal } from '../domain/trade.types';

export interface Position {
  marketId: string;
  tokenId: string;
  outcome: 'YES' | 'NO';
  side: 'BUY' | 'SELL';
  sizeUsd: number;
  entryPrice: number;
  entryTime: number;
  trader: string;
}

export class PositionTrackerService {
  private positions: Map<string, Position[]> = new Map(); // key: marketId-tokenId
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  
  addPosition(signal: TradeSignal, executedSize: number, executedPrice: number): void {
    const key = `${signal.marketId}-${signal.tokenId}`;
    const positions = this.positions.get(key) || [];

    const position: Position = {
      marketId: signal.marketId,
      tokenId: signal.tokenId,
      outcome: signal.outcome,
      side: signal.side,
      sizeUsd: executedSize,
      entryPrice: executedPrice,
      entryTime: Date.now(),
      trader: signal.trader,
    };

    positions.push(position);
    this.positions.set(key, positions);

    this.logger.info(
      `[Position] Added ${signal.side} position: ${executedSize.toFixed(2)} USD @ ${executedPrice.toFixed(4)} on ${signal.marketId}`,
    );
  }

  getPositions(marketId: string, tokenId: string): Position[] {
    const key = `${marketId}-${tokenId}`;
    return this.positions.get(key) || [];
  }

  getAllPositions(): Position[] {
    const all: Position[] = [];
    for (const positions of this.positions.values()) {
      all.push(...positions);
    }
    return all;
  }

  getTotalExposure(): number {
    return this.getAllPositions().reduce((sum, pos) => sum + pos.sizeUsd, 0);
  }

  shouldExit(trader: string, marketId: string, tokenId: string, side: 'BUY' | 'SELL'): boolean {
    const positions = this.getPositions(marketId, tokenId);
    const relevantPositions = positions.filter((p) => p.trader === trader && p.side !== side);
    return relevantPositions.length > 0;
  }

  removePosition(marketId: string, tokenId: string, index: number): void {
    const key = `${marketId}-${tokenId}`;
    const positions = this.positions.get(key) || [];
    if (index >= 0 && index < positions.length) {
      positions.splice(index, 1);
      if (positions.length === 0) {
        this.positions.delete(key);
      } else {
        this.positions.set(key, positions);
      }
    }
  }
}

