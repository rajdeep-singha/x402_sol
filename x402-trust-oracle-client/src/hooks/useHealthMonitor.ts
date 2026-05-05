import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { CONFIG } from "@/lib/constants";

export interface HealthData {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  rpc: {
    solana: "connected" | "error";
    helius: boolean;
  };
  cache: {
    walletScores: number;
    usedTransactions: number;
  };
}

export type HealthStatus = "ok" | "degraded" | "down" | "loading" | "unreachable";

interface MonitorState {
  data: HealthData | null;
  status: HealthStatus;
  lastChecked: number | null;
  latencyMs: number | null;
  history: { ts: number; latencyMs: number; status: HealthStatus }[];
}

const MAX_HISTORY = 20;

export function useHealthMonitor(intervalMs = 30_000) {
  const [state, setState] = useState<MonitorState>({
    data: null,
    status: "loading",
    lastChecked: null,
    latencyMs: null,
    history: [],
  });

  const check = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await axios.get<HealthData>(`${CONFIG.API_BASE_URL}/health`, {
        timeout: 8000,
      });
      const latencyMs = Date.now() - start;
      const status: HealthStatus = res.data.status === "ok" ? "ok" :
                                   res.data.status === "degraded" ? "degraded" : "down";

      setState((prev) => ({
        data: res.data,
        status,
        lastChecked: Date.now(),
        latencyMs,
        history: [
          ...prev.history.slice(-(MAX_HISTORY - 1)),
          { ts: Date.now(), latencyMs, status },
        ],
      }));
    } catch {
      const latencyMs = Date.now() - start;
      setState((prev) => ({
        ...prev,
        status: "unreachable",
        lastChecked: Date.now(),
        latencyMs,
        history: [
          ...prev.history.slice(-(MAX_HISTORY - 1)),
          { ts: Date.now(), latencyMs, status: "unreachable" },
        ],
      }));
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [check, intervalMs]);

  return { ...state, refresh: check };
}
