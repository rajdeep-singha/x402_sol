import { Connection, clusterApiUrl, Commitment } from "@solana/web3.js";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const COMMITMENT: Commitment = "confirmed";

/**
 * Singleton Solana Connection.
 * Uses Helius RPC if configured, falls back to public mainnet.
 */
let _connection: Connection | null = null;

export function getSolanaConnection(): Connection {
  if (_connection) return _connection;

  const rpcUrl = env.HELIUS_RPC_URL || env.SOLANA_RPC_URL;
  logger.info(`Initializing Solana connection → ${rpcUrl}`);

  _connection = new Connection(rpcUrl, {
    commitment: COMMITMENT,
    confirmTransactionInitialTimeout: 60_000,
  });

  return _connection;
}

/**
 * Get a fresh connection (useful for tests or fallback scenarios).
 */
export function createFallbackConnection(): Connection {
  const fallback = clusterApiUrl("mainnet-beta");
  logger.warn(`Creating fallback Solana connection → ${fallback}`);
  return new Connection(fallback, { commitment: COMMITMENT });
}
