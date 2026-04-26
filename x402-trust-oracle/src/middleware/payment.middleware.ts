import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service";
import { CONSTANTS } from "../config/constants";
import { logger } from "../utils/logger";
import { PaymentToken, X402PaymentRequiredResponse } from "../types";

/**
 * x402 Payment Middleware — the gatekeeper for all paid API routes.
 *
 * Flow:
 *  1. Check if x-payment-tx header is present
 *  2. If absent → respond 402 with payment instructions
 *  3. If present → validate the tx on-chain
 *  4. If valid → allow request through
 *  5. If invalid → respond 402 with reason
 */
export async function paymentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const txSignature = req.headers[CONSTANTS.HEADERS.PAYMENT_TX] as string | undefined;
  const rawToken = req.headers[CONSTANTS.HEADERS.PAYMENT_TOKEN] as string | undefined;

  // ── Step 1: No payment header → send 402 ─────────────────────────────
  if (!txSignature) {
    logger.debug(`402 issued — no payment header on ${req.path}`);
    res.status(CONSTANTS.HTTP.PAYMENT_REQUIRED).json(paymentRequiredBody());
    return;
  }

  // ── Step 2: Validate token type ────────────────────────────────────────
  const token = normalizeToken(rawToken);
  if (!token) {
    res.status(CONSTANTS.HTTP.PAYMENT_REQUIRED).json({
      ...paymentRequiredBody(),
      message: `Invalid or missing x-payment-token header. Accepted: ${CONSTANTS.PAYMENT.ACCEPTED_TOKENS.join(", ")}`,
    });
    return;
  }

  // ── Step 3: Validate the transaction on-chain ─────────────────────────
  try {
    const result = await paymentService.validatePayment(txSignature, token);

    if (!result.valid) {
      res.status(CONSTANTS.HTTP.PAYMENT_REQUIRED).json({
        error: "Payment Required",
        message: result.reason ?? "Payment validation failed",
        payment: paymentRequiredBody().payment,
      });
      return;
    }

    // ── Step 4: Attach payment context to request for downstream use ──
    (req as Request & { paymentContext: typeof result }).paymentContext = result;

    logger.info(`✓ Payment cleared → ${req.path} [${token}]`);
    next();
  } catch (err) {
    logger.error("Payment middleware error:", err);
    res.status(CONSTANTS.HTTP.INTERNAL_ERROR).json({
      success: false,
      error: "Payment verification failed due to server error",
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeToken(raw?: string): PaymentToken | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === "USDC" || upper === "SOL") return upper as PaymentToken;
  return null;
}

function paymentRequiredBody(): X402PaymentRequiredResponse {
  return {
    error: "Payment Required",
    message: `Send a Solana transaction to ${CONSTANTS.PAYMENT.RECEIVER}, then retry with x-payment-tx and x-payment-token headers.`,
    payment: {
      token: ["USDC", "SOL"],
      amount: {
        USDC: CONSTANTS.PAYMENT.AMOUNT_USDC / 1_000_000, // human-readable
        SOL: CONSTANTS.PAYMENT.AMOUNT_SOL / 1_000_000_000,
      },
      receiver: CONSTANTS.PAYMENT.RECEIVER,
      network: CONSTANTS.PAYMENT.NETWORK,
    },
  };
}
