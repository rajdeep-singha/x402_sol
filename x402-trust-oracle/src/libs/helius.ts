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

export function isHeliusEnabled(): boolean {
  return !!env.HELIUS_API_KEY;
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
