import type { ClobClient } from '@polymarket/clob-client';
import { OrderType, Side } from '@polymarket/clob-client';
import { Cache } from './cache.util';
import { BigNumber, ethers } from 'ethers';

export type OrderSide = 'BUY' | 'SELL';
export type OrderOutcome = 'YES' | 'NO';

export type PostOrderInput = {
  client: ClobClient;
  marketId?: string;
  tokenId: string;
  outcome: OrderOutcome;
  side: OrderSide;
  sizeUsd: number;
  maxAcceptablePrice?: number;
  priority?: boolean; // For frontrunning - execute with higher priority
  targetGasPrice?: string; // Gas price of target transaction for frontrunning
  gasPriceMultiplier?: number; // Gas price multiplier (e.g., 1.2 = 20% higher)
};


// Cache for order books (1 second TTL)
const orderBookCache = new Cache<any>(1000);

export async function postOrder(input: PostOrderInput): Promise<void> {
  const { client, marketId, tokenId, outcome, side, sizeUsd, maxAcceptablePrice, targetGasPrice, gasPriceMultiplier } = input;

  // Apply gas price override if provided (for frontrunning)
  if (targetGasPrice && gasPriceMultiplier && 'wallet' in client) {
    const wallet = (client as any).wallet as ethers.Wallet;
    if (wallet && wallet.provider) {
      try {
        const targetGas = BigNumber.from(targetGasPrice);
        const frontrunGas = targetGas.mul(Math.floor(gasPriceMultiplier * 100)).div(100);
        // Set gas price on provider for future transactions
        // Note: This affects the provider's default gas price
        // ClobClient orders are signed off-chain, but this helps with on-chain operations
        (wallet.provider as any).gasPrice = frontrunGas;
      } catch (err) {
        // Ignore gas price setting errors
      }
    }
  }

  // Optional: validate market exists if marketId provided
  if (marketId) {
    const market = await client.getMarket(marketId);
    if (!market) {
      throw new Error(`Market not found: ${marketId}`);
    }
  }

  // Try cache first
  let orderBook = orderBookCache.get(tokenId);
  if (!orderBook) {
    try {
      orderBook = await client.getOrderBook(tokenId);
      orderBookCache.set(tokenId, orderBook);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('No orderbook exists') || errorMessage.includes('404')) {
        throw new Error(`Market ${marketId} is closed or resolved - no orderbook available for token ${tokenId}`);
      }
      throw error;
    }
  }

  if (!orderBook) {
    throw new Error(`Failed to fetch orderbook for token ${tokenId}`);
  }

  const isBuy = side === 'BUY';
  const levels = isBuy ? orderBook.asks : orderBook.bids;

  if (!levels || levels.length === 0) {
    throw new Error(`No ${isBuy ? 'asks' : 'bids'} available for token ${tokenId} - market may be closed or have no liquidity`);
  }

  const bestPrice = parseFloat(levels[0].price);
  if (maxAcceptablePrice && ((isBuy && bestPrice > maxAcceptablePrice) || (!isBuy && bestPrice < maxAcceptablePrice))) {
    throw new Error(`Price protection: best price ${bestPrice} exceeds max acceptable ${maxAcceptablePrice}`);
  }

  const orderSide = isBuy ? Side.BUY : Side.SELL;
  let remaining = sizeUsd;
  let retryCount = 0;
  const maxRetries = 3;

  while (remaining > 0.01 && retryCount < maxRetries) {
    // Invalidate cache and fetch fresh orderbook for execution
    orderBookCache.delete(tokenId);
    const currentOrderBook = await client.getOrderBook(tokenId);
    orderBookCache.set(tokenId, currentOrderBook);
    const currentLevels = isBuy ? currentOrderBook.asks : currentOrderBook.bids;

    if (!currentLevels || currentLevels.length === 0) {
      break;
    }

    const level = currentLevels[0];
    const levelPrice = parseFloat(level.price);
    const levelSize = parseFloat(level.size);

    let orderSize: number;
    let orderValue: number;

    if (isBuy) {
      const levelValue = levelSize * levelPrice;
      orderValue = Math.min(remaining, levelValue);
      orderSize = orderValue / levelPrice;
    } else {
      const levelValue = levelSize * levelPrice;
      orderValue = Math.min(remaining, levelValue);
      orderSize = orderValue / levelPrice;
    }

    const orderArgs = {
      side: orderSide,
      tokenID: tokenId,
      amount: orderSize,
      price: levelPrice,
    };

    try {
      const signedOrder = await client.createMarketOrder(orderArgs);
      const response = await client.postOrder(signedOrder, OrderType.FOK);

      if (response.success) {
        remaining -= orderValue;
        retryCount = 0;
      } else {
        retryCount++;
      }
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        throw error;
      }
    }
  }
}

