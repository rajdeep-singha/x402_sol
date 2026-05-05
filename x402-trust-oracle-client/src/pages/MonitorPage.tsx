import { useHealthMonitor } from "@/hooks/useHealthMonitor";
import { Button } from "@/components/ui/Button";
import { LatencyChart } from "@/components/LatencyChart";

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string }> = {
    ok:          { bg: "bg-score-high/20 border-score-high/40", text: "text-score-high" },
    degraded:    { bg: "bg-score-mid/20  border-score-mid/40",  text: "text-score-mid"  },
    down:        { bg: "bg-score-low/20  border-score-low/40",  text: "text-score-low"  },
    unreachable: { bg: "bg-score-low/20  border-score-low/40",  text: "text-score-low"  },
    loading:     { bg: "bg-white/10 border-white/20",           text: "text-lime/60"    },
  };
  const { bg, text } = cfg[status] ?? cfg.loading;
  return (
    <span className={["inline-flex items-center gap-2 font-display font-black text-sm uppercase tracking-widest rounded-pill border-2 px-4 py-2", bg, text].join(" ")}>
      <span className={["w-2 h-2 rounded-full", status === "ok" ? "bg-score-high animate-blink" : "bg-current"].join(" ")} />
      {status === "ok" ? "ONLINE" : status.toUpperCase()}
    </span>
  );
}

// ── Stat tile — like Taurus pool analytics tiles ──────────────────────────────
function StatTile({ icon, label, value, sub, accent }: { icon: string; label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className={["rounded-card border-2 border-ink shadow-card p-4", accent ?? "bg-white"].join(" ")}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-forest/10 border border-ink/10 flex items-center justify-center text-base">{icon}</div>
      </div>
      <p className="font-display font-black text-xs uppercase tracking-widest text-ink/50 mb-1">{label}</p>
      <p className="font-display font-black text-2xl text-ink leading-none">{value}</p>
      {sub && <p className="font-mono text-xs text-ink/40 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── RPC row ───────────────────────────────────────────────────────────────────
function RpcRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-lime/10 last:border-0">
      <span className="font-body text-sm font-semibold text-lime/70">{label}</span>
      <span className={["font-mono text-xs font-bold rounded-pill border border-current px-2.5 py-0.5", ok ? "text-score-high" : "text-score-low"].join(" ")}>
        {ok ? "● CONNECTED" : "● ERROR"}
      </span>
    </div>
  );
}

function fmtUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`; if (h) return `${h}h ${m}m`; return `${m}m ${s % 60}s`;
}

// ── API endpoint row ──────────────────────────────────────────────────────────
const ENDPOINTS = [
  { method: "GET",    path: "/trust/:wallet",    auth: "x402",   desc: "Single wallet trust score",  mc: "bg-pill-green" },
  { method: "POST",   path: "/trust/batch",      auth: "x402",   desc: "Batch scores (max 10)",       mc: "bg-pill-cyan"  },
  { method: "DELETE", path: "/trust/cache/:w",   auth: "admin",  desc: "Invalidate cached score",     mc: "bg-pill-pink"  },
  { method: "GET",    path: "/health",           auth: "public", desc: "System health + RPC status",  mc: "bg-pill-green" },
  { method: "GET",    path: "/health/ping",      auth: "public", desc: "Liveness probe",              mc: "bg-pill-green" },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export function MonitorPage() {
  const { data, status, lastChecked, latencyMs, history, refresh } = useHealthMonitor(30_000);
  const lastStr = lastChecked ? new Date(lastChecked).toLocaleTimeString() : "—";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
        <div>
          <p className="font-display font-black text-xs uppercase tracking-widest text-ink/50 mb-2">Backend Status</p>
          <h1 className="font-display font-black text-5xl sm:text-6xl uppercase leading-[0.9] tracking-tight text-ink">
            System<br/>
            <span className="text-forest bg-pill-cyan px-2 rounded">Monitor</span>
          </h1>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <StatusBadge status={status} />
          <p className="font-mono text-xs text-ink/40">
            {lastStr}{latencyMs !== null && <span className="ml-2 text-ink font-bold">{latencyMs}ms</span>}
          </p>
          <Button variant="cyan" size="sm" onClick={refresh}>↻ Refresh</Button>
        </div>
      </div>

      {/* ── Stat tiles — like Taurus pool analytics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatTile icon="⏱" label="Uptime"        value={data ? fmtUptime(data.uptime) : "—"} accent="bg-pill-yellow" />
        <StatTile icon="📡" label="Latency"       value={latencyMs !== null ? `${latencyMs}ms` : "—"} accent="bg-pill-cyan" />
        <StatTile icon="📦" label="Cached Scores" value={data?.cache.walletScores ?? "—"} accent="bg-pill-green" />
        <StatTile icon="🔐" label="Used TXs"      value={data?.cache.usedTransactions ?? "—"} accent="bg-pill-pink" />
      </div>

      {/* ── Latency chart + RPC cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Latency sparkline */}
        <div className="lg:col-span-2 bg-forest rounded-card-lg border-2 border-lime/20 shadow-card-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-black text-xs uppercase tracking-widest text-lime/50">
              Response Latency
            </p>
            <span className="font-mono text-xs text-lime/30">{history.length} checks · 30s interval</span>
          </div>
          <LatencyChart history={history} />
        </div>

        {/* RPC + server info */}
        <div className="flex flex-col gap-4">
          <div className="bg-forest rounded-card border-2 border-lime/20 shadow-card p-4 flex-1">
            <p className="font-display font-black text-xs uppercase tracking-widest text-lime/50 mb-3">RPC Services</p>
            {data ? (
              <>
                <RpcRow label="Solana RPC"   ok={data.rpc.solana === "connected"} />
                <RpcRow label="Helius"       ok={data.rpc.helius} />
              </>
            ) : (
              <div className="animate-pulse flex flex-col gap-2">
                <div className="h-8 bg-white/10 rounded" />
                <div className="h-8 bg-white/10 rounded" />
              </div>
            )}
          </div>

          <div className="bg-forest rounded-card border-2 border-lime/20 shadow-card p-4">
            <p className="font-display font-black text-xs uppercase tracking-widest text-lime/50 mb-3">Server Info</p>
            {data ? [
              ["Version",     data.version],
              ["Env",         data.environment],
              ["Network",     "Solana Devnet"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-lime/10 last:border-0">
                <span className="font-body text-xs text-lime/50">{k}</span>
                <span className="font-mono text-xs text-lime font-bold">{v}</span>
              </div>
            )) : (
              <div className="animate-pulse flex flex-col gap-2">
                {[1,2,3].map(i => <div key={i} className="h-6 bg-white/10 rounded" />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Check history ── */}
      {history.length > 0 && (
        <div className="bg-forest rounded-card-lg border-2 border-lime/20 shadow-card-lg overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-lime/10">
            <p className="font-display font-black text-xs uppercase tracking-widest text-lime/50">Check History</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lime/10">
                  {["Time","Status","Latency"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-display font-black text-xs uppercase tracking-wider text-lime/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().slice(0, 10).map((h, i) => (
                  <tr key={i} className="border-b border-lime/10 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-lime/60">{new Date(h.ts).toLocaleTimeString()}</td>
                    <td className="px-4 py-2.5">
                      <span className={["font-mono text-xs font-bold rounded-pill px-2.5 py-0.5",
                        h.status === "ok" ? "text-score-high bg-score-high/10" :
                        h.status === "degraded" ? "text-score-mid bg-score-mid/10" : "text-score-low bg-score-low/10"
                      ].join(" ")}>
                        {h.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-lime font-bold">{h.latencyMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── API reference ── */}
      <div className="bg-white rounded-card-lg border-2 border-ink shadow-card-lg overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-ink bg-lime/30">
          <p className="font-display font-black text-xs uppercase tracking-widest text-ink/60">API Endpoints</p>
        </div>
        <div className="divide-y divide-ink/10">
          {ENDPOINTS.map(({ method, path, auth, desc, mc }) => (
            <div key={path} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className={["font-mono text-xs font-black rounded-pill px-3 py-1 border-2 border-ink w-16 text-center flex-shrink-0", mc].join(" ")}>
                {method}
              </span>
              <span className="font-mono text-sm text-ink flex-1 min-w-0 truncate">{path}</span>
              <span className={[
                "font-mono text-xs rounded-pill border border-current px-2.5 py-0.5 flex-shrink-0",
                auth === "x402" ? "text-score-mid" : auth === "admin" ? "text-score-low" : "text-score-high",
              ].join(" ")}>
                {auth}
              </span>
              <span className="font-body text-xs text-ink/40 hidden sm:block">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
