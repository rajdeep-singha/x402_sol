import { walletCache } from "../models/wallet.model";
import { TrustScore } from "../types";

const mockScore = (address: string): TrustScore => ({
  walletAddress: address,
  score: 75,
  rating: "HIGH",
  breakdown: {
    transactionHistory: 80,
    tokenActivity: 60,
    walletAge: 75,
    recentBehavior: 85,
  },
  fetchedAt: Date.now(),
});

describe("WalletScoreCache", () => {
  const ADDR = "So11111111111111111111111111111111111111112";

  afterEach(() => {
    walletCache.invalidate(ADDR);
  });

  it("returns null for uncached wallet", () => {
    expect(walletCache.get(ADDR)).toBeNull();
  });

  it("stores and retrieves a trust score", () => {
    const score = mockScore(ADDR);
    walletCache.set(ADDR, score);

    const cached = walletCache.get(ADDR);
    expect(cached).not.toBeNull();
    expect(cached?.score).toBe(75);
    expect(cached?.rating).toBe("HIGH");
  });

  it("invalidates a specific wallet", () => {
    walletCache.set(ADDR, mockScore(ADDR));
    walletCache.invalidate(ADDR);
    expect(walletCache.get(ADDR)).toBeNull();
  });

  it("increments size when entries are added", () => {
    const sizeBefore = walletCache.size;
    walletCache.set(ADDR, mockScore(ADDR));
    expect(walletCache.size).toBe(sizeBefore + 1);
  });
});
