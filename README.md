# x402 Trust Oracle

A payment-gated counterparty trust scoring API for Solana wallets. Clients pay a small fee in USDC or SOL through an x402-style payment flow, then receive an on-chain trust score derived from indexed wallet balances and transaction activity.

This project is designed for applications that need a simple trust primitive before interacting with an unknown wallet, counterparty, merchant, or automated agent.

## GoldRush Usage

GoldRush is the primary indexed data layer for the trust oracle

The backend uses GoldRush x402 endpoints to fetch wallet state before calculating a score:

- `balances_v2`: retrieves token balances, token metadata, and SOL/WSOL balance signals.
- `transactions_v3`: retrieves recent wallet transactions and execution status.
- `streaming.goldrush.dev/graphql`: provides an optional wallet activity stream for cache invalidation and score refresh.

The GoldRush integration is implemented in:

- `src/libs/goldrush.ts`: wraps `fetch` with x402 payment support and calls GoldRush x402 APIs.
- `src/services/blockchain.service.ts`: uses GoldRush first for wallet metadata and transaction history, with Solana RPC and Helius as resilience fallbacks.
- `src/services/trust.service.ts`: converts GoldRush-derived wallet data into weighted trust score components.
- `src/services/stram.service.ts`: subscribes to GoldRush streaming wallet activity and invalidates cached scores when new activity appears.

The core architecture is:

```text
Client pays oracle through Solana payment headers
        |
        v
Trust Oracle validates the client payment
        |
        v
Trust Oracle pays GoldRush x402 endpoints for indexed wallet data
        |
        v
GoldRush returns balances and transaction history
        |
        v
Trust service computes score, rating, and component breakdown
```

## Product Flow

```text
Client                              Trust Oracle                         GoldRush
  |                                     |                                  |
  |-- GET /trust/:wallet -------------->|                                  |
  |<-- 402 Payment Required ------------|                                  |
  |    { token, amount, receiver }      |                                  |
  |                                     |                                  |
  |-- Send USDC/SOL payment -----------> Solana                            |
  |<-- transaction signature -----------|                                  |
  |                                     |                                  |
  |-- GET /trust/:wallet -------------->|                                  |
  |   x-payment-tx: <signature>         |                                  |
  |   x-payment-token: USDC             |                                  |
  |                                     |-- x402 paid fetch ---------------|
  |                                     |   /balances_v2, /transactions_v3 |
  |                                     |     indexed wallet data ---------|
  |                                     |                                  |
  |<-- 200 { score, rating, breakdown }-|                                  |
```

## Architecture

```text
server.ts
`-- app.ts
    |-- /health
    |   `-- health.routes.ts -> health.controller.ts
    `-- /trust
        `-- trust.routes.ts -> trust.controller.ts
            |-- trust.service.ts       # scoring logic
            |-- payment.service.ts     # Solana payment validation
            `-- blockchain.service.ts  # GoldRush-first on-chain data access

Middleware
|-- payment.middleware.ts              # 402 payment gate
`-- error.middleware.ts                # global error handling

Data
|-- models/transaction.model.ts         # anti-replay transaction store
`-- models/wallet.model.ts              # trust score cache

Libraries
|-- libs/goldrush.ts                    # GoldRush x402 paid data client
|-- libs/solana.ts                      # Solana RPC connection
`-- libs/helius.ts                      # optional fallback indexer
```

## Trust Score Model

The score is a weighted 0-100 rating built from wallet history and token activity.

| Component | Weight | Signal |
| --- | ---: | --- |
| Transaction history | 35% | Recent transaction count and success rate |
| Token activity | 20% | Token diversity and SOL balance |
| Wallet age | 25% | Age of first known wallet activity when available |
| Recent behavior | 20% | Failure rate across the latest transactions |

Ratings:

| Score Range | Rating |
| ---: | --- |
| 80-100 | HIGH |
| 50-79 | MEDIUM |
| 20-49 | LOW |
| 0-19 | UNKNOWN |

## API

### `GET /trust/:walletAddress`

Protected by the payment middleware.

First request:

```http
GET /trust/<walletAddress>
```

Response:

```json
{
  "error": "Payment Required",
  "payment": {
    "token": ["USDC", "SOL"],
    "amount": {
      "USDC": 1,
      "SOL": 0.001
    },
    "receiver": "YOUR_WALLET",
    "network": "devnet"
  }
}
```

After payment, retry with:

```http
x-payment-tx: <solana-transaction-signature>
x-payment-token: USDC
```

Success response:

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

### `POST /trust/batch`

Protected by the payment middleware.

```json
{
  "wallets": ["wallet1", "wallet2"]
}
```

The batch endpoint accepts up to 10 wallet addresses per request.

### `GET /health`

Public health endpoint.

```json
{
  "status": "ok",
  "rpc": {
    "solana": "connected",
    "helius": true
  },
  "cache": {
    "walletScores": 3,
    "usedTransactions": 7
  }
}
```

### `DELETE /trust/cache/:walletAddress`

Admin cache invalidation endpoint for a single wallet score.

## Client SDK

```typescript
import { X402Client } from "./src/client/x402Client";

const client = new X402Client({
  serverUrl: "http://localhost:3000",
  solanaRpcUrl: "https://api.devnet.solana.com",
  wallet: yourWalletAdapter,
  preferredToken: "USDC",
});

const result = await client.getTrustScore("wallet_address_here");

console.log(result.data.score);
console.log(result.data.rating);
```

The client handles the payment flow:

```text
request protected resource
receive 402 payment instructions
send USDC or SOL transaction
retry with payment headers
receive trust score
```

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `RECEIVER_WALLET_ADDRESS` | Yes | none | Solana wallet that receives client payments |
| `SOLANA_RPC_URL` | No | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `HELIUS_API_KEY` | No | empty | Optional fallback indexer key |
| `HELIUS_RPC_URL` | No | empty | Optional Helius RPC URL |
| `WALLET_PRIVATE_KEY` | Yes for GoldRush x402 | empty | EVM private key used by the server to pay GoldRush x402 endpoints |
| `GOLDRUSH_X402_BASE_URL` | No | `https://x402.goldrush.dev` | GoldRush x402 API base URL |
| `PAYMENT_AMOUNT_USDC` | No | `1000000` | USDC payment amount in raw units |
| `PAYMENT_AMOUNT_SOL` | No | `1000000` | SOL payment amount in lamports |
| `PAYMENT_WINDOW_MS` | No | `300000` | Payment validity window |
| `USDC_MINT_ADDRESS` | No | mainnet USDC mint | SPL token mint used for USDC validation |

## Local Development

```bash
npm install
npm run dev
```

The API runs on `http://localhost:3000` by default.

## Docker

```bash
docker compose up
```

## Tests

```bash
npm test
```

## Hackathon Positioning

The project combines two payment-gated layers:

1. Application users pay the oracle through a Solana USDC or SOL payment.
2. The oracle uses x402-enabled GoldRush endpoints to purchase indexed wallet data.

GoldRush is not just a data source in this project. It is the infrastructure layer that makes the trust oracle practical: instead of manually reconstructing wallet state from raw RPC calls, the oracle uses indexed balances and transaction history to calculate a score quickly and consistently.

## License

This project is licensed under the MIT License. See [LICENSE](../LICENSE).
