import { env } from "./env";

export const CONSTANTS = {
  //  Payment 
  PAYMENT: {
    AMOUNT_USDC: env.PAYMENT_AMOUNT_USDC,
    AMOUNT_SOL: env.PAYMENT_AMOUNT_SOL,
    RECEIVER: env.RECEIVER_WALLET_ADDRESS,
    WINDOW_MS: env.PAYMENT_WINDOW_MS,
    USDC_MINT: env.USDC_MINT_ADDRESS,
    ACCEPTED_TOKENS: ["USDC", "SOL"] as const,
    NETWORK: "devnet" as const,
  },

  //  Trust Scoring 
  TRUST: {
    HIGH_THRESHOLD: env.TRUST_SCORE_HIGH,
    MEDIUM_THRESHOLD: env.TRUST_SCORE_MEDIUM,
    LOW_RISK_THRESHOLD: env.RISK_THRESHOLD_LOW,
    CACHE_TTL_MS: 10 * 60 * 1000,       // 10 min — scores cached before re-fetch
    TX_HISTORY_LIMIT: 50,               // max transactions to fetch per wallet
  },

  //  Time Limits 
  TIME: {
    REQUEST_TIMEOUT_MS: 15_000,         // external RPC call timeout
    SCORE_CACHE_TTL_MS: 10 * 60 * 1000,
    TX_REUSE_WINDOW_MS: env.PAYMENT_WINDOW_MS,
  },

  //  HTTP 
  HTTP: {
    PAYMENT_REQUIRED: 402,
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  },

  //  Headers 
  HEADERS: {
    PAYMENT_TX: "x-payment-tx",         // txSignature sent by client
    PAYMENT_TOKEN: "x-payment-token",   // "USDC" | "SOL"
  },
} as const;
