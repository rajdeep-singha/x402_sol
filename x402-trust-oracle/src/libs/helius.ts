import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const HELIUS_BASE_URL = "https://api.helius.xyz/v0";

/**
 * Helius REST client — only used when HELIUS_API_KEY is set.
 * Provides faster indexed transaction parsing vs raw RPC.
 */
let _heliusClient: AxiosInstance | null = null;

export function getHeliusClient(): AxiosInstance | null {
  if (!env.HELIUS_API_KEY) return null;

  if (_heliusClient) return _heliusClient;

  _heliusClient = axios.create({
    baseURL: HELIUS_BASE_URL,
    params: { "api-key": env.HELIUS_API_KEY },
    timeout: 15_000,
  });

  logger.info("Helius client initialized");
  return _heliusClient;
}

// Helius enriched REST API only works on mainnet.
// If only an RPC URL is set (devnet), skip the REST path.
export function isHeliusEnabled(): boolean {
  if (!env.HELIUS_API_KEY) return false;
  // If pointing at devnet RPC, the enriched API won't work — skip it.
  if (env.HELIUS_RPC_URL?.includes("devnet")) return false;
  if (env.SOLANA_RPC_URL?.includes("devnet")) return false;
  return true;
}

// ─── Helius API helpers ───────────────────────────────────────────────────────

export interface HeliusEnrichedTransaction {
  signature: string;
  timestamp: number;
  type: string;
  fee: number;
  feePayer: string;
  source: string;
  nativeTransfers: { fromUserAccount: string; toUserAccount: string; amount: number }[];
  tokenTransfers: { fromUserAccount: string; toUserAccount: string; mint: string; tokenAmount: number }[];
}

/**
 * Fetch enriched (parsed) transactions for a wallet via Helius.
 * Falls back gracefully to null if Helius is not configured.
 */
export async function fetchHeliusTransactions(
  walletAddress: string,
  limit = 50
): Promise<HeliusEnrichedTransaction[] | null> {
  const client = getHeliusClient();
  if (!client) return null;

  try {
    const res = await client.get<HeliusEnrichedTransaction[]>(
      `/addresses/${walletAddress}/transactions`,
      { params: { limit } }
    );
    return res.data;
  } catch (err) {
    logger.warn(`Helius fetch failed for ${walletAddress}:`, err);
    return null;
  }
}
