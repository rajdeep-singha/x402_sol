const LOCAL_API_BASE_URL = "http://localhost:3000";
// Same-origin proxy via vercel.json rewrites — avoids ad blocker blocks on the Render domain
const DEPLOYED_API_BASE_URL = "/api";

const isLocalClient =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);

const API_BASE_URLS = import.meta.env.VITE_API_BASE_URL
  ? [import.meta.env.VITE_API_BASE_URL]
  : isLocalClient
    ? [LOCAL_API_BASE_URL]
    : [DEPLOYED_API_BASE_URL];

export const CONFIG = {
  API_BASE_URL: API_BASE_URLS[0],
  API_BASE_URLS,

  // Solana devnet (for x402 / Covalent devnet integration)
  SOLANA_NETWORK: "devnet" as const,
  SOLANA_RPC_URL:
    import.meta.env.VITE_SOLANA_RPC_URL ??
    "https://api.devnet.solana.com",

  // USDC on devnet (Circle's devnet USDC)
  USDC_MINT_DEVNET: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",

  PAYMENT_HEADERS: {
    TX:    "x-payment-tx",
    TOKEN: "x-payment-token",
  },

  // How long to poll for tx confirmation (ms)
  TX_CONFIRM_TIMEOUT: 60_000,
} as const;
