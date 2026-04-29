import express, { Application } from "express";
import cors from "cors";
import { env } from "./config/env";
import trustRoutes from "./routes/trust.routes";
import healthRoutes from "./routes/health.routes";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/error.middleware";
import { logger } from "./utils/logger";

export function createApp(): Application {
  const app = express();

  app.use(
    cors({
      origin: env.NODE_ENV === "production" ? false : "*",
      methods: ["GET", "POST", "DELETE"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-payment-tx",
        "x-payment-token",
      ],
    })
  );

  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: false }));

  app.use((req, _res, next) => {
    logger.debug(`→ ${req.method} ${req.path}`);
    next();
  });

  // ─── Routes ───────────────────────────────────────────────────────────────
  app.get("/", (_req, res) => {
    res.json({
      name: "x402 Trust Oracle",
      version: "1.0.0",
      endpoints: {
        "GET  /health":                    "System health + RPC status (public)",
        "GET  /health/ping":               "Liveness probe (public)",
        "GET  /trust/:walletAddress":      "Single wallet trust score (x402)",
        "POST /trust/batch":               "Batch trust scores, max 10 (x402)",
        "DELETE /trust/cache/:wallet":     "Invalidate cached score (admin)",
      },
    });
  });

  app.use("/health", healthRoutes);
  app.use("/trust", trustRoutes);

  // ─── Error Handling (must be last) ────────────────────────────────────────
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
