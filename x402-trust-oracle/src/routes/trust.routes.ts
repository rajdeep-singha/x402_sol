import { Router } from "express";
import { paymentMiddleware } from "../middleware/payment.middleware";
import {
  getTrustScore,
  getBatchTrustScores,
  invalidateCache,
} from "../controllers/trust.controller";

const router = Router();

/**
 * GET /trust/:walletAddress
 * Single wallet trust score — protected by x402.
 */
router.get("/:walletAddress", paymentMiddleware, getTrustScore);

/**
 * POST /trust/batch
 * Score up to 10 wallets in one paid request.
 * Body: { wallets: string[] }
 */
router.post("/batch", paymentMiddleware, getBatchTrustScores);


/**
 * DELETE /trust/cache/:walletAddress
 * Invalidate cached score. Add admin-key middleware before prod.
 */
router.delete("/cache/:walletAddress", invalidateCache);

export default router;
