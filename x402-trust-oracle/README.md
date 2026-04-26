# x402 Trust Oracle

A payment-gated counterparty trust scoring API on Solana. Clients pay micro-fees in USDC or SOL to query on-chain wallet risk scores via the x402 protocol.

---

## Architecture

```
server.ts
└── app.ts (Entry Layer)
    ├── /health         → health.routes.ts → health.controller.ts
    └── /trust          → trust.routes.ts  → trust.controller.ts
                                              ├── trust.service.ts       (scoring logic)
                                              ├── payment.service.ts     (tx validation)
                                              └── blockchain.service.ts  (on-chain fetch)
        Middleware:
        ├── payment.middleware.ts  (x402 gatekeeper)
        └── error.middleware.ts   (global error handler)
        Config:
        ├── config/env.ts
        └── config/constants.ts
        Data:
        ├── models/transaction.model.ts  (anti-replay store)
        └── models/wallet.model.ts       (score cache)
        Libs:
        ├── libs/solana.ts   (RPC connection)
        └── libs/helius.ts   (optional indexer)
```

## x402 Payment Flow

```
Client                              Server
  │                                   │
  │──── GET /trust/:wallet ──────────>│
  │<─── 402 Payment Required ─────────│
  │     { token, amount, receiver }   │
  │                                   │
  │──── Send Solana TX (USDC/SOL) ──> Blockchain
  │<─── txSignature ──────────────────│
  │                                   │
  │──── GET /trust/:wallet ──────────>│
  │     x-payment-tx: <signature>     │  verifies TX on-chain
  │     x-payment-token: USDC         │  checks amount + receiver
  │                                   │  marks signature used (anti-replay)
  │<─── 200 { score, rating, ... } ───│
```

---

## Setup

```bash
cp .env.example .env
# Fill in RECEIVER_WALLET_ADDRESS (your Solana wallet)
# Add HELIUS_API_KEY for faster tx parsing (optional)

npm install
npm run dev
```

## Docker

```bash
docker compose up
```

## API

### `GET /trust/:walletAddress` — x402 protected

**First call:** Returns `402 Payment Required`:
```json
{
  "error": "Payment Required",
  "payment": {
    "token": ["USDC", "SOL"],
    "amount": { "USDC": 1, "SOL": 0.001 },
    "receiver": "YOUR_WALLET",
    "network": "mainnet-beta"
  }
}
```

**After payment:** Retry with headers:
```
x-payment-tx: <solana-tx-signature>
x-payment-token: USDC
```

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "...",
    "score": 74,
    "rating": "HIGH",
    "breakdown": {
      "transactionHistory": 80,
      "tokenActivity": 65,
      "walletAge": 75,
      "recentBehavior": 90
    },
    "fetchedAt": 1714123456789
  }
}
```

### `POST /trust/batch` — x402 protected

```json
{ "wallets": ["wallet1", "wallet2"] }
```

Max 10 wallets per request.

### `GET /health` — public

```json
{
  "status": "ok",
  "rpc": { "solana": "connected", "helius": true },
  "cache": { "walletScores": 3, "usedTransactions": 7 }
}
```

### `DELETE /trust/cache/:walletAddress` — admin

Invalidates the cached score for a wallet.

---

## Client SDK

```typescript
import { X402Client } from "./src/client/x402Client";

const client = new X402Client({
  serverUrl: "http://localhost:3000",
  solanaRpcUrl: "https://api.mainnet-beta.solana.com",
  wallet: yourWalletAdapter,   // Phantom, Solflare, Keypair, etc.
  preferredToken: "USDC",
});

// Automatically handles 402 → pay → retry
const result = await client.getTrustScore("wallet_address_here");
console.log(result.data.score);    // 74
console.log(result.data.rating);   // "HIGH"
```

---

## Trust Score Breakdown

| Component | Weight | Description |
|---|---|---|
| Transaction History | 35% | Volume + success rate (log scale) |
| Token Activity | 20% | Token diversity + SOL balance |
| Wallet Age | 25% | Age of first on-chain transaction |
| Recent Behavior | 20% | Failure rate of last 10 transactions |

Scores map to ratings:
- `HIGH` → 80–100
- `MEDIUM` → 50–79
- `LOW` → 20–49
- `UNKNOWN` → 0–19

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `RECEIVER_WALLET_ADDRESS` | ✅ | — | Your Solana wallet to receive payments |
| `SOLANA_RPC_URL` | — | mainnet-beta public | RPC endpoint |
| `HELIUS_API_KEY` | — | — | Faster tx parsing (optional) |
| `PAYMENT_AMOUNT_USDC` | — | 1000000 | Cost in USDC raw units (1 USDC) |
| `PAYMENT_AMOUNT_SOL` | — | 1000000 | Cost in lamports (0.001 SOL) |
| `PAYMENT_WINDOW_MS` | — | 300000 | TX validity window (5 min) |

## Tests

```bash
npm test
```
