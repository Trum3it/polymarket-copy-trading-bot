import Bottleneck from 'bottleneck';

// Rate limiters for different API endpoints
export const polymarketLimiter = new Bottleneck({
  minTime: 100, // Minimum 100ms between requests (10 req/sec)
  maxConcurrent: 5,
});

export const rpcLimiter = new Bottleneck({
  minTime: 50, // Minimum 50ms between requests (20 req/sec)
  maxConcurrent: 10,
});

export async function withRateLimit<T>(
  limiter: Bottleneck,
  fn: () => Promise<T>,
): Promise<T> {
  return limiter.schedule(fn);
}
