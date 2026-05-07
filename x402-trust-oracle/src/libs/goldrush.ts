import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm";
import { decodePaymentResponseHeader, wrapFetchWithPayment } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";
import { CONSTANTS } from "../config/constants";
import { env } from "../config/env";
import { logger } from "../utils/logger";

type GoldRushJson = Record<string, unknown>;

let paidFetch: ReturnType<typeof wrapFetchWithPayment> | null = null;

function getPaidFetch(): ReturnType<typeof wrapFetchWithPayment> {
  if (paidFetch) return paidFetch;

  if (!env.WALLET_PRIVATE_KEY) {
    throw new Error(
      "WALLET_PRIVATE_KEY is required for GoldRush x402 paid requests"
    );
  }

  const privateKey = env.WALLET_PRIVATE_KEY.startsWith("0x")
    ? env.WALLET_PRIVATE_KEY
    : `0x${env.WALLET_PRIVATE_KEY}`;

  const client = new x402Client().register(
    CONSTANTS.GOLDRUSH_X402.PAYMENT_NETWORK,
    new ExactEvmScheme(privateKeyToAccount(privateKey as `0x${string}`))
  );

  paidFetch = wrapFetchWithPayment(fetch, client);
  return paidFetch;
}

function buildGoldRushUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${CONSTANTS.GOLDRUSH_X402.BASE_URL}/v1${normalizedPath}`;
}

export async function goldrushX402Fetch<T = GoldRushJson>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await getPaidFetch()(buildGoldRushUrl(path), init);

  const paymentResponse = response.headers.get("PAYMENT-RESPONSE");
  if (paymentResponse) {
    logger.debug(
      "GoldRush x402 payment response:",
      decodePaymentResponseHeader(paymentResponse)
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GoldRush x402 request failed: ${response.status} ${response.statusText} ${body}`
    );
  }

  return response.json() as Promise<T>;
}

export function getGoldRushTokenBalances(
  chainName: string,
  walletAddress: string
): Promise<GoldRushJson> {
  return goldrushX402Fetch(
    `/${encodeURIComponent(chainName)}/address/${encodeURIComponent(
      walletAddress
    )}/balances_v2/`
  );
}

export function getGoldRushTransactions(
  chainName: string,
  walletAddress: string,
  tier: "small" | "medium" | "large" | "xl" = "small"
): Promise<GoldRushJson> {
  return goldrushX402Fetch(
    `/${encodeURIComponent(chainName)}/address/${encodeURIComponent(
      walletAddress
    )}/transactions_v3/?tier=${tier}`
  );
}
