import { UsedTransaction } from "../types";
import { CONSTANTS } from "../config/constants";
import { logger } from "../utils/logger";

/**
 * In-memory store for used payment transaction signatures.
 *
 * Prevents replay attacks: once a txSignature is used to unlock the API,
 * it cannot be reused within the configured window.
 *
 * For production scale → replace with Redis or a DB.
 */
class TransactionStore {
  private store: Map<string, UsedTransaction> = new Map();

  /**
   * Check if a transaction signature has already been used.
   */
  isUsed(signature: string): boolean {
    const record = this.store.get(signature);
    if (!record) return false;

    // Expire old entries beyond the reuse window
    const isExpired =
      Date.now() - record.usedAt > CONSTANTS.TIME.TX_REUSE_WINDOW_MS;

    if (isExpired) {
      this.store.delete(signature);
      return false;
    }

    return true;
  }

  /**
   * Mark a transaction signature as used.
   */
  markUsed(signature: string, walletAddress?: string): void {
    this.store.set(signature, {
      signature,
      usedAt: Date.now(),
      walletAddress,
    });

    logger.debug(`TX marked used: ${signature.slice(0, 16)}…`);
  }

  /**
   * Purge all expired entries — call on a periodic interval in production.
   */
  purgeExpired(): number {
    const threshold = Date.now() - CONSTANTS.TIME.TX_REUSE_WINDOW_MS;
    let count = 0;

    for (const [sig, record] of this.store.entries()) {
      if (record.usedAt < threshold) {
        this.store.delete(sig);
        count++;
      }
    }

    if (count > 0) logger.debug(`Purged ${count} expired transaction(s)`);
    return count;
  }

  get size(): number {
    return this.store.size;
  }
}

// Singleton instance
export const transactionStore = new TransactionStore();

// Periodic cleanup every 10 minutes
setInterval(() => transactionStore.purgeExpired(), 10 * 60 * 1000);
