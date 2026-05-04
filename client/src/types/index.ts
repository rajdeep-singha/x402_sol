

export type TrustRating = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export interface TrustScore {
  walletAddress: string;
  score: number;          // 0–100
  rating: TrustRating;
  breakdown: TrustBreakdown;
  fetchedAt: number;      // Unix ms
}

export interface TrustBreakdown {
  transactionHistory: number;   // sub-score 0–100
  tokenActivity: number;        // sub-score 0–100
  walletAge: number;            // sub-score 0–100
  recentBehavior: number;       // sub-score 0–100
}


export interface ParsedTransaction {
  signature: string;
  blockTime: number;
  slot: number;
  fee: number;
  status: "success" | "failed";
  type: "transfer" | "swap" | "mint" | "burn" | "other";
  fromAddress?: string;
  toAddress?: string;
  amount?: number;
  tokenMint?: string;
}

export interface WalletMetadata {
  address: string;
  lamportBalance: number;
  solBalance: number;
  tokenAccounts: TokenAccount[];
  firstTransactionAt?: number;
  totalTransactions: number;
}

export interface TokenAccount {
  mint: string;
  balance: number;
  decimals: number;
  symbol?: string;
}

// Payment / x402 Types 

export type PaymentToken = "USDC" | "SOL";

export interface PaymentHeader {
  txSignature: string;
  token: PaymentToken;
}

export interface PaymentValidationResult {
  valid: boolean;
  reason?: string;
  txSignature?: string;
  amount?: number;
  token?: PaymentToken;
}

export interface UsedTransaction {
  signature: string;
  usedAt: number;           // Unix ms
  walletAddress?: string;
}


export interface TrustQueryRequest {
  walletAddress: string;
}

export interface TrustQueryResponse {
  success: boolean;
  data?: TrustScore;
  error?: string;
}

export interface X402PaymentRequiredResponse {
  error: "Payment Required";
  message: string;
  payment: {
    token: PaymentToken[];
    amount: {
      USDC?: number;
      SOL?: number;
    };
    receiver: string;
    network: "mainnet-beta" | "devnet";
  };
}

export interface ApiError {
  success: false;
  error: string;
  statusCode: number;
}


export interface CachedWalletScore {
  walletAddress: string;
  trustScore: TrustScore;
  cachedAt: number;
  ttlMs: number;
}


export type PaymentFlowStep =
  | "idle"
  | "requesting"       // initial GET → waiting for 402
  | "payment_required" // 402 received, showing payment prompt
  | "sending_tx"       // broadcasting Solana tx
  | "confirming_tx"    // waiting for on-chain confirmation
  | "verifying"        // retrying API with txSignature
  | "success"          // data received
  | "error";           // something went wrong

export interface PaymentFlowState {
  step: PaymentFlowStep;
  txSignature?: string;
  token?: PaymentToken;
  paymentInstructions?: X402PaymentRequiredResponse;
  error?: string;
}

export interface BatchQueryItem {
  walletAddress: string;
  status: "pending" | "loading" | "success" | "error";
  result?: TrustScore;
  error?: string;
}