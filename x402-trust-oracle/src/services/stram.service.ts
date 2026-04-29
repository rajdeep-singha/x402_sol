// src/services/stream.service.ts  (new file)
import { createClient } from "graphql-ws";
import { walletCache } from "../models/wallet.model";
import { trustService } from "./trust.service";
import { logger } from "../utils/logger";

const WALLET_ACTIVITY_SUBSCRIPTION = `
  subscription WalletActivity($address: String!) {
    walletActivity(address: $address) {
      txHash
      blockSignedAt
      successful
      transfers { fromAddress toAddress amount tokenSymbol }
    }
  }
`;

export class StreamService {
  private client = createClient({
    url: "wss://streaming.goldrush.dev/graphql",
    connectionParams: { apiKey: process.env.GOLDRUSH_API_KEY },
  });

  // Call this when a wallet is first paid-for scored
  // so future lookups are always fresh from cache
  watchWallet(walletAddress: string): () => void {
    const unsubscribe = this.client.subscribe(
      { query: WALLET_ACTIVITY_SUBSCRIPTION, variables: { address: walletAddress } },
      {
        next: () => {
          // New on-chain activity → invalidate stale cache → re-score
          walletCache.invalidate(walletAddress);
          trustService.getTrustScore(walletAddress); // warms cache async
        },
        error: (err) => logger.warn(`Stream error for ${walletAddress}:`, err),
        complete: () => {},
      }
    );
    return unsubscribe;
  }
}