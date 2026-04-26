import { Request, Response } from "express";
import { getSolanaConnection } from "../libs/solana";
import { isHeliusEnabled } from "../libs/helius";
import { walletCache } from "../models/wallet.model";
import { transactionStore } from "../models/transaction.model";
import { env } from "../config/env";
import { logger } from "../utils/logger";

interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  rpc: {
    solana: "connected" | "error";
    helius: boolean;
  };
  cache: {
    walletScores: number;
    usedTransactions: number;
  };
}

/**
 * GET /health
 * Probes RPC connectivity and returns system stats.
 * Public — no payment required.
 */
export async function healthCheck(
  _req: Request,
  res: Response
): Promise<void> {
  let solanaStatus: "connected" | "error" = "error";

  try {
    const connection = getSolanaConnection();
    await connection.getSlot(); // Lightweight RPC probe
    solanaStatus = "connected";
  } catch (err) {
    logger.warn("Health check: Solana RPC probe failed", err);
  }

  const status: HealthStatus = {
    status: solanaStatus === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: "1.0.0",
    environment: env.NODE_ENV,
    rpc: {
      solana: solanaStatus,
      helius: isHeliusEnabled(),
    },
    cache: {
      walletScores: walletCache.size,
      usedTransactions: transactionStore.size,
    },
  };

  const httpStatus = status.status === "ok" ? 200 : 207;
  res.status(httpStatus).json(status);
}

/**
 * GET /health/ping
 * Ultra-fast liveness check (no RPC call).
 * Used by load balancers / Docker healthcheck.
 */
export function ping(_req: Request, res: Response): void {
  res.status(200).json({ pong: true });
}
