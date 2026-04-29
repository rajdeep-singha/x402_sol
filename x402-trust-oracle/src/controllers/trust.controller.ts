import { Request, Response, NextFunction } from "express";
import { PublicKey } from "@solana/web3.js";
import { trustService } from "../services/trust.service";
import { walletCache } from "../models/wallet.model";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";
import { TrustQueryResponse } from "../types";

//  Helpers 

function assertValidWallet(address: string): void {
  try {
    new PublicKey(address);
  } catch {
    throw new AppError(`Invalid Solana wallet address: ${address}`, 400);
  }
}

//  Controller 

/**
 * GET /trust/:walletAddress
 * Returns the trust score for the given wallet.
 * Route is protected upstream by paymentMiddleware.
 */
export async function getTrustScore(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const walletAddress = req.params["walletAddress"] as string;
    assertValidWallet(walletAddress);

    logger.info(`[Controller] Trust query → ${walletAddress.slice(0, 8)}…`);

    const trustScore = await trustService.getTrustScore(walletAddress);

    const body: TrustQueryResponse = { success: true, data: trustScore };
    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /trust/batch
 * Body: { wallets: string[] }
 * Score multiple wallets in one payment-gated request.
 * Useful for counterparty risk dashboards.
 */
export async function getBatchTrustScores(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { wallets } = req.body as { wallets?: unknown };

    if (!Array.isArray(wallets) || wallets.length === 0) {
      throw new AppError("Body must contain a non-empty wallets array", 400);
    }
    if (wallets.length > 10) {
      throw new AppError("Batch limit is 10 wallets per request", 400);
    }

    const addresses = wallets as string[];
    addresses.forEach(assertValidWallet);

    logger.info(`[Controller] Batch trust query → ${addresses.length} wallets`);

    // Fan-out concurrently
    const results = await Promise.allSettled(
      addresses.map((addr) => trustService.getTrustScore(addr))
    );

    const data = results.map((result, i) => {
      if (result.status === "fulfilled") {
        return { walletAddress: addresses[i], success: true, data: result.value };
      }
      return {
        walletAddress: addresses[i],
        success: false,
        error: (result.reason as Error).message,
      };
    });

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /trust/cache/:walletAddress
 * Invalidates the cached score for a wallet (admin use).
 */
export async function invalidateCache(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const walletAddress = req.params["walletAddress"] as string;
    assertValidWallet(walletAddress);

    walletCache.invalidate(walletAddress);
    logger.info(`[Controller] Cache invalidated: ${walletAddress.slice(0, 8)}…`);

    res.status(200).json({ success: true, message: "Cache entry cleared" });
  } catch (err) {
    next(err);
  }
}
