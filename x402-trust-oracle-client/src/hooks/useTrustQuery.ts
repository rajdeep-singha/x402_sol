import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { x402Client } from "@/lib/x402Client";
import { TrustScore, PaymentToken, PaymentFlowState, BatchQueryItem } from "@/types";

export function useTrustQuery() {
  const wallet = useWallet();

  const [flowState, setFlowState]   = useState<PaymentFlowState>({ step: "idle" });
  const [result, setResult]         = useState<TrustScore | null>(null);

  const query = useCallback(
    async (walletAddress: string, token: PaymentToken) => {
      setResult(null);
      setFlowState({ step: "idle" });

      try {
        const score = await x402Client.getTrustScore(
          walletAddress,
          wallet,
          token,
          (state) => setFlowState(state)
        );
        setResult(score);
      } catch (err) {
        setFlowState({
          step: "error",
          error: (err as Error).message ?? "Unknown error",
        });
      }
    },
    [wallet]
  );

  const reset = useCallback(() => {
    setFlowState({ step: "idle" });
    setResult(null);
  }, []);

  return { flowState, result, query, reset, isConnected: !!wallet.publicKey };
}

export function useBatchQuery() {
  const wallet = useWallet();
  const [items, setItems]         = useState<BatchQueryItem[]>([]);
  const [flowState, setFlowState] = useState<PaymentFlowState>({ step: "idle" });

  const queryBatch = useCallback(
    async (addresses: string[], token: PaymentToken) => {
      // Seed items as pending
      setItems(addresses.map((a) => ({ walletAddress: a, status: "pending" })));
      setFlowState({ step: "idle" });

      try {
        const scores = await x402Client.getBatchTrustScores(
          addresses,
          wallet,
          token,
          (state) => setFlowState(state)
        );

        // Backend returns [{ walletAddress, success, data: TrustScore } | { walletAddress, success: false, error }]
        type BatchItem = { walletAddress: string; success: boolean; data?: TrustScore; error?: string };
        setItems(
          (scores as unknown as BatchItem[]).map((item) => ({
            walletAddress: item.walletAddress,
            status: item.success ? ("success" as const) : ("error" as const),
            result: item.data,
            error: item.error,
          }))
        );
      } catch (err) {
        setFlowState({
          step: "error",
          error: (err as Error).message,
        });
        setItems((prev) =>
          prev.map((i) => ({ ...i, status: "error", error: (err as Error).message }))
        );
      }
    },
    [wallet]
  );

  const reset = useCallback(() => {
    setItems([]);
    setFlowState({ step: "idle" });
  }, []);

  return { items, flowState, queryBatch, reset, isConnected: !!wallet.publicKey };
}
