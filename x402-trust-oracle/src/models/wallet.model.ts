import { CachedWalletScore, TrustScore } from "../types";
import { CONSTANTS } from "../config/constants";
import { logger } from "../utils/logger";


 // In-memory LRU-style cache for computed trust scores. Avoids re-fetching on-chain data for recently scored wallets. For production scale → replace with Redis.
 
class WalletScoreCache {
  private cache: Map<string, CachedWalletScore> = new Map();
  private readonly TTL_MS = CONSTANTS.TRUST.CACHE_TTL_MS;

  
    //Retrieve a cached score for a wallet address, or null if expired/absent.
   
  get(walletAddress: string): TrustScore | null {
    const record = this.cache.get(walletAddress);
    if (!record) return null;

    const isExpired = Date.now() - record.cachedAt > record.ttlMs;
    if (isExpired) {
      this.cache.delete(walletAddress);
      logger.debug(`Cache MISS (expired): ${walletAddress.slice(0, 8)}…`);
      return null;
    }

    logger.debug(`Cache HIT: ${walletAddress.slice(0, 8)}…`);
    return record.trustScore;
  }

  
    //Store a trust score for a wallet address.
   
  set(walletAddress: string, trustScore: TrustScore): void {
    this.cache.set(walletAddress, {
      walletAddress,
      trustScore,
      cachedAt: Date.now(),
      ttlMs: this.TTL_MS,
    });

    logger.debug(
      `Cache SET: ${walletAddress.slice(0, 8)}… (score=${trustScore.score})`
    );
  }

  /**
   * Invalidate cache entry for a specific wallet.
   */
  invalidate(walletAddress: string): void {
    this.cache.delete(walletAddress);
  }

  //  Purge all expired cache entries.

  purgeExpired(): number {
    const now = Date.now();
    let count = 0;

    for (const [addr, record] of this.cache.entries()) {
      if (now - record.cachedAt > record.ttlMs) {
        this.cache.delete(addr);
        count++;
      }
    }

    return count;
  }

  get size(): number {
    return this.cache.size;
  }
}

export const walletCache = new WalletScoreCache();

// Periodic cleanup every 15 minutes
setInterval(() => walletCache.purgeExpired(), 15 * 60 * 1000);
