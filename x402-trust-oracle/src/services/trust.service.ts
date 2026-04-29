import { blockchainService } from "./blockchain.service";
import { walletCache } from "../models/wallet.model";
import { CONSTANTS } from "../config/constants";
import { logger } from "../utils/logger";
import {
  TrustScore,
  TrustRating,
  TrustBreakdown,
  ParsedTransaction,
  WalletMetadata,
} from "../types";

class TrustService {
 
  async getTrustScore(walletAddress: string): Promise<TrustScore> {
    const cached = walletCache.get(walletAddress);
    if (cached) return cached;

    logger.info(`Scoring wallet: ${walletAddress.slice(0, 8)}…`);

    const [metadata, transactions] = await Promise.all([
      blockchainService.getWalletMetadata(walletAddress),
      blockchainService.getWalletTransactions(walletAddress),
    ]);

    const score = this._computeScore(metadata, transactions);

    walletCache.set(walletAddress, score);
    return score;
  }


  private _computeScore(
    metadata: WalletMetadata,
    transactions: ParsedTransaction[]
  ): TrustScore {
    const breakdown: TrustBreakdown = {
      transactionHistory: this._scoreTransactionHistory(transactions),
      tokenActivity: this._scoreTokenActivity(metadata, transactions),
      walletAge: this._scoreWalletAge(metadata.firstTransactionAt),
      recentBehavior: this._scoreRecentBehavior(transactions),
    };

    // Weighted average
    const weights = {
      transactionHistory: 0.35,
      tokenActivity: 0.2,
      walletAge: 0.25,
      recentBehavior: 0.2,
    };

    const score = Math.round(
      breakdown.transactionHistory * weights.transactionHistory +
        breakdown.tokenActivity * weights.tokenActivity +
        breakdown.walletAge * weights.walletAge +
        breakdown.recentBehavior * weights.recentBehavior
    );

    const rating = this._ratingFromScore(score);

    logger.debug(
      `Score for ${metadata.address.slice(0, 8)}…: ${score} (${rating})`
    );

    return {
      walletAddress: metadata.address,
      score,
      rating,
      breakdown,
      fetchedAt: Date.now(),
    };
  }

  
  private _scoreTransactionHistory(txs: ParsedTransaction[]): number {
    if (txs.length === 0) return 0;

    const successRate =
      txs.filter((t) => t.status === "success").length / txs.length;

    // Log scale: 50 txs → ~80 points, 10 txs → ~60 points
    const countScore = Math.min(100, Math.log10(txs.length + 1) * 50);

    return Math.round(countScore * successRate);
  }


  private _scoreTokenActivity(
    metadata: WalletMetadata,
    txs: ParsedTransaction[]
  ): number {
    const tokenTxs = txs.filter((t) => t.tokenMint);
    const uniqueTokens = new Set(tokenTxs.map((t) => t.tokenMint)).size;

    const diversityScore = Math.min(100, uniqueTokens * 15);

    const balanceBonus = metadata.solBalance > 0.1 ? 20 : 0;

    return Math.min(100, Math.round(diversityScore + balanceBonus));
  }

  
  private _scoreWalletAge(firstTransactionAt?: number): number {
    if (!firstTransactionAt) return 10; // Unknown age = minimal trust

    const ageMs = Date.now() - firstTransactionAt;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // 365 days+ → 100, 30 days → ~40, <7 days → <15
    if (ageDays >= 365) return 100;
    if (ageDays >= 90) return 75;
    if (ageDays >= 30) return 50;
    if (ageDays >= 7) return 25;
    return 10;
  }

  
  private _scoreRecentBehavior(txs: ParsedTransaction[]): number {
    if (txs.length === 0) return 50; // Neutral for no data

    // Look at last 10 transactions
    const recent = txs.slice(0, 10);
    const failRate =
      recent.filter((t) => t.status === "failed").length / recent.length;

    // High recent failure rate = suspicious
    const baseScore = 100 - Math.round(failRate * 80);

    return Math.max(0, Math.min(100, baseScore));
  }

  private _ratingFromScore(score: number): TrustRating {
    if (score >= CONSTANTS.TRUST.HIGH_THRESHOLD) return "HIGH";
    if (score >= CONSTANTS.TRUST.MEDIUM_THRESHOLD) return "MEDIUM";
    if (score >= CONSTANTS.TRUST.LOW_RISK_THRESHOLD) return "LOW";
    return "UNKNOWN";
  }
}

export const trustService = new TrustService();
