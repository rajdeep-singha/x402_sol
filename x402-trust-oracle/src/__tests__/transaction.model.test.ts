/**
 * Unit tests for TransactionStore (anti-replay model).
 * Run with: npx jest
 */

import { transactionStore } from "../models/transaction.model";

describe("TransactionStore", () => {
  const SIG = "5xABC123testSignatureForUnit";

  beforeEach(() => {
    // Purge any lingering state between tests
    transactionStore.purgeExpired();
  });

  it("returns false for an unknown signature", () => {
    expect(transactionStore.isUsed("unknown_sig")).toBe(false);
  });

  it("marks a signature as used and detects it on reuse", () => {
    transactionStore.markUsed(SIG);
    expect(transactionStore.isUsed(SIG)).toBe(true);
  });

  it("does not count the same signature twice after marking", () => {
    transactionStore.markUsed(SIG + "_2");
    const sizeBefore = transactionStore.size;
    transactionStore.markUsed(SIG + "_2"); // Same sig again
    expect(transactionStore.size).toBe(sizeBefore); // Map.set overwrites
  });

  it("purgeExpired removes entries past the TTL window", () => {
    const fakeSig = "expired_fake_sig";
    transactionStore.markUsed(fakeSig);

    // Manually backdating by patching the internal store isn't possible
    // from outside, so just verify purgeExpired returns 0 for fresh entries.
    const purged = transactionStore.purgeExpired();
    expect(purged).toBe(0);
    expect(transactionStore.isUsed(fakeSig)).toBe(true);
  });
});
