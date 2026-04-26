import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  PORT: parseInt(optional("PORT", "3000"), 10),
  NODE_ENV: optional("NODE_ENV", "development"),

  // Solana RPC
  SOLANA_RPC_URL: optional(
    "SOLANA_RPC_URL",
    "https://api.mainnet-beta.solana.com"
  ),
  HELIUS_API_KEY: optional("HELIUS_API_KEY", ""),
  HELIUS_RPC_URL: optional("HELIUS_RPC_URL", ""),

  // Payment
  RECEIVER_WALLET_ADDRESS: required("RECEIVER_WALLET_ADDRESS"),
  PAYMENT_AMOUNT_USDC: parseInt(optional("PAYMENT_AMOUNT_USDC", "1000000"), 10), // 1 USDC
  PAYMENT_AMOUNT_SOL: parseInt(optional("PAYMENT_AMOUNT_SOL", "1000000"), 10),   // 0.001 SOL
  PAYMENT_WINDOW_MS: parseInt(optional("PAYMENT_WINDOW_MS", "300000"), 10),      // 5 min
  USDC_MINT_ADDRESS: optional(
    "USDC_MINT_ADDRESS",
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  ),

  // Trust scoring thresholds
  TRUST_SCORE_HIGH: parseInt(optional("TRUST_SCORE_HIGH", "80"), 10),
  TRUST_SCORE_MEDIUM: parseInt(optional("TRUST_SCORE_MEDIUM", "50"), 10),
  RISK_THRESHOLD_LOW: parseInt(optional("RISK_THRESHOLD_LOW", "20"), 10),
} as const;
