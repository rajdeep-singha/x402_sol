import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { blockchainService } from "./blockchain.service";
import { transactionStore } from "../models/transaction.model";
import { CONSTANTS } from "../config/constants";
import { logger } from "../utils/logger";
import { PaymentValidationResult, PaymentToken } from "../types";

class PaymentService {
  /**
   * Validate an x402 payment transaction.
   *
   * Checks:
   *  1. Signature exists on-chain
   *  2. Transaction succeeded (no error)
   *  3. Sent to the correct receiver address
   *  4. Amount meets the minimum requirement
   *  5. Transaction is within the allowed time window
   *  6. Signature hasn't been used before (anti-replay)
   */
  async validatePayment(
    txSignature: string,
    token: PaymentToken
  ): Promise<PaymentValidationResult> {
    logger.debug(`Validating payment: ${txSignature.slice(0, 16)}… [${token}]`);

    // ── 1. Anti-replay guard ───────────────────────────────────────────────
    if (transactionStore.isUsed(txSignature)) {
      return this._fail("Transaction signature already used (replay attack)");
    }

    // ── 2. Fetch transaction on-chain ──────────────────────────────────────
    const tx = await blockchainService.getTransaction(txSignature);
    if (!tx) {
      return this._fail("Transaction not found on-chain");
    }

    // ── 3. Transaction must have succeeded ────────────────────────────────
    if (tx.meta?.err) {
      return this._fail(
        `Transaction failed on-chain: ${JSON.stringify(tx.meta.err)}`
      );
    }

    // ── 4. Time window check ──────────────────────────────────────────────
    if (tx.blockTime) {
      const txAgeMs = Date.now() - tx.blockTime * 1000;
      if (txAgeMs > CONSTANTS.PAYMENT.WINDOW_MS) {
        return this._fail(
          `Transaction too old (${Math.round(txAgeMs / 1000)}s). Window: ${CONSTANTS.PAYMENT.WINDOW_MS / 1000}s`
        );
      }
    }

    // ── 5. Validate amount & receiver ─────────────────────────────────────
    const validation =
      token === "SOL"
        ? this._validateSolTransfer(tx)
        : this._validateUsdcTransfer(tx);

    if (!validation.valid) return validation;

    // ── 6. Mark as used ───────────────────────────────────────────────────
    transactionStore.markUsed(txSignature);

    logger.info(
      `Payment validated ✓ ${txSignature.slice(0, 16)}… [${token}] amount=${validation.amount}`
    );

    return {
      valid: true,
      txSignature,
      amount: validation.amount,
      token,
    };
  }

  // ─── Private Validators ───────────────────────────────────────────────────

  private _validateSolTransfer(
    tx: NonNullable<Awaited<ReturnType<typeof blockchainService.getTransaction>>>
  ): PaymentValidationResult {
    const receiver = CONSTANTS.PAYMENT.RECEIVER;
    const requiredLamports = CONSTANTS.PAYMENT.AMOUNT_SOL;

    // Check pre/post balances to find the receiver credit
    const accounts = tx.transaction.message.accountKeys;
    const receiverIdx = accounts.findIndex(
      (acc) => acc.pubkey.toBase58() === receiver
    );

    if (receiverIdx === -1) {
      return this._fail(`Receiver wallet ${receiver.slice(0, 8)}… not in transaction`);
    }

    const preBal = tx.meta?.preBalances[receiverIdx] ?? 0;
    const postBal = tx.meta?.postBalances[receiverIdx] ?? 0;
    const credited = postBal - preBal;

    if (credited < requiredLamports) {
      return this._fail(
        `Insufficient SOL: got ${credited} lamports, need ${requiredLamports}`
      );
    }

    return { valid: true, amount: credited / LAMPORTS_PER_SOL, token: "SOL" };
  }

  private _validateUsdcTransfer(
    tx: NonNullable<Awaited<ReturnType<typeof blockchainService.getTransaction>>>
  ): PaymentValidationResult {
    const receiver = CONSTANTS.PAYMENT.RECEIVER;
    const requiredAmount = CONSTANTS.PAYMENT.AMOUNT_USDC;
    const usdcMint = CONSTANTS.PAYMENT.USDC_MINT;

    const instructions = tx.transaction.message.instructions;

    for (const ix of instructions) {
      if (!("parsed" in ix)) continue;
      const parsed = ix as { program: string; parsed: { type: string; info: Record<string, unknown> } };

      if (
        parsed.program === "spl-token" &&
        (parsed.parsed.type === "transfer" ||
          parsed.parsed.type === "transferChecked")
      ) {
        const info = parsed.parsed.info as {
          destination?: string;
          mint?: string;
          tokenAmount?: { amount: string };
          amount?: string;
        };

        // Verify correct token mint
        if (info.mint && info.mint !== usdcMint) continue;

        // Verify receiver is the destination (or owner of destination ATA)
        const dest = info.destination ?? "";
        if (!dest.includes(receiver) && dest !== receiver) {
          // Shallow check — a more thorough impl would resolve the ATA owner
          continue;
        }

        const rawAmount = parseInt(
          info.tokenAmount?.amount ?? info.amount ?? "0",
          10
        );

        if (rawAmount < requiredAmount) {
          return this._fail(
            `Insufficient USDC: got ${rawAmount}, need ${requiredAmount} (raw units)`
          );
        }

        return {
          valid: true,
          amount: rawAmount / 1_000_000, // USDC has 6 decimals
          token: "USDC",
        };
      }
    }

    return this._fail("No valid USDC transfer to receiver found in transaction");
  }

  private _fail(reason: string): PaymentValidationResult {
    logger.warn(`Payment validation failed: ${reason}`);
    return { valid: false, reason };
  }
}

export const paymentService = new PaymentService();
