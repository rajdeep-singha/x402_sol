/**
 * x402 Client — Usage Example
 *
 * This mirrors the flow in Image 2:
 *   Sign up → API Request → 402 → Send TX → Retry → Get Data
 *
 * In a real app, replace `mockWallet` with your actual wallet adapter
 * (e.g., Phantom, Solflare, or a Keypair from @solana/web3.js).
 */

import { Keypair, Transaction, Connection } from "@solana/web3.js";
import { X402Client } from "./x402Client";

// ─── Mock Wallet (for local testing) ─────────────────────────────────────────

function createMockWallet(keypair: Keypair) {
  return {
    publicKey: keypair.publicKey,
    async signTransaction(tx: Transaction): Promise<Transaction> {
      tx.sign(keypair);
      return tx;
    },
  };
}

// ─── Example Usage ────────────────────────────────────────────────────────────

async function main() {
  // In production: load keypair from secure storage, not generated here
  const keypair = Keypair.generate();

  const client = new X402Client({
    serverUrl: "http://localhost:3000",
    solanaRpcUrl: "https://api.mainnet-beta.solana.com",
    wallet: createMockWallet(keypair),
    preferredToken: "USDC", // or "SOL"
  });

  const targetWallet = "So11111111111111111111111111111111111111112"; // example

  console.log("─── x402 Trust Oracle Demo ───");
  console.log(`Querying trust score for: ${targetWallet}`);
  console.log("Step 1: Initial request → will receive 402...");

  try {
    const result = await client.getTrustScore(targetWallet);

    console.log(`Step 2: Payment sent (${result.token}) → ${result.txSignature.slice(0, 16)}…`);
    console.log("Step 3: Request retried → Data received ✓");
    console.log("\n── Trust Score ──");
    console.log(`  Score:   ${result.data.score}/100`);
    console.log(`  Rating:  ${result.data.rating}`);
    console.log(`  Breakdown:`);
    Object.entries(result.data.breakdown).forEach(([key, val]) => {
      console.log(`    ${key}: ${val}`);
    });
  } catch (err) {
    console.error("Error:", (err as Error).message);
  }

  // ── Batch example ──────────────────────────────────────────────────────────
  console.log("\n── Batch Query ──");
  const wallets = [
    "So11111111111111111111111111111111111111112",
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  ];

  try {
    const batch = await client.getBatchTrustScores(wallets);
    batch.data.forEach((score) => {
      console.log(`  ${score.walletAddress.slice(0, 8)}… → ${score.score}/100 (${score.rating})`);
    });
  } catch (err) {
    console.error("Batch error:", (err as Error).message);
  }
}

main();
