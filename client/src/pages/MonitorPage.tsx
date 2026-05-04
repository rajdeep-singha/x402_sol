import { useHealthMonitor } from "@/hooks/useHealthMonitor";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LatencyChart } from "@/components/LatencyChart";

// ─── Status pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; label: string }> = {
    ok:          { bg: "bg-nb-lime",   label: "ONLINE" },
    degraded:    { bg: "bg-nb-orange", label: "DEGRADED" },
    down:        { bg: "bg-nb-red text-white", label: "DOWN" },
    unreachable: { bg: "bg-nb-red text-white", label: "UNREACHABLE" },
    loading:     { bg: "bg-nb-gray",   label: "CHECKING…" },
  };
  const { bg, label } = cfg[status] ?? cfg.loading;

  return (
    <span className={[
      "inline-flex items-center gap-2 border-3 border-nb-black shadow-nb",
      "font-display font-black text-sm uppercase tracking-widest px-4 py-2",
      bg,
    ].join(" ")}>
      <span className="w-2 h-2 rounded-full bg-nb-black animate-pulse" />
      {label}
    </span>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({
  label, value, accent = "none",
}: {
  label: string; value: string | number; accent?: "yellow" | "cyan" | "lime" | "pink" | "none";
}) {
  const accents: Record<string, string> = {
    yellow: "bg-nb-yellow",
    cyan:   "bg-nb-cyan",
    lime:   "bg-nb-lime",
    pink:   "bg-nb-pink",
    none:   "bg-white",
  };
  return (
    <div className={[
      "border-3 border-nb-black shadow-nb p-4 flex flex-col gap-1",
      accents[accent],
    ].join(" ")}>
      <p className="font-display font-black text-xs uppercase tracking-widest text-nb-black opacity-60">
        {label}
      </p>
      <p className="font-display font-black text-3xl leading-none text-nb-black">
        {value}
      </p>
    </div>
  );
}

// ─── RPC status row ───────────────────────────────────────────────────────────

function RpcRow({ label, status }: { label: string; status: boolean | "connected" | "error" }) {
  const isOk = status === true || status === "connected";
  return (
    <div className="flex items-center justify-between py-2 border-b-2 border-nb-gray last:border-0">
      <span className="font-body text-sm font-semibold">{label}</span>
      <span className={[
        "font-mono text-xs font-bold px-2 py-0.5 border-2 border-nb-black",
        isOk ? "bg-nb-lime" : "bg-nb-red text-white",
      ].join(" ")}>
        {isOk ? "OK" : "ERROR"}
      </span>
    </div>
  );
}

// ─── Uptime formatter ────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MonitorPage() {
  const { data, status, lastChecked, latencyMs, history, refresh } = useHealthMonitor(30_000);

  const lastCheckedStr = lastChecked
    ? new Date(lastChecked).toLocaleTimeString()
    : "—";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-nb-cyan border-3 border-nb-black shadow-nb px-4 py-2 mb-4">
            <span className="font-display font-black text-xs uppercase tracking-widest">
              Backend Status
            </span>
          </div>
          <h1 className="font-display font-black text-4xl uppercase leading-none tracking-tight">
            System<br />
            <span className="relative inline-block">
              Monitor
              <span className="absolute -bottom-1 left-0 w-full h-3 bg-nb-cyan -z-10" />
            </span>
          </h1>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <StatusPill status={status} />
          <p className="font-mono text-xs text-gray-400">
            Last checked: {lastCheckedStr}
            {latencyMs !== null && (
              <span className="ml-2 text-nb-black font-bold">{latencyMs}ms</span>
            )}
          </p>
          <Button variant="secondary" size="sm" onClick={refresh}>
            ↻ Refresh Now
          </Button>
        </div>
      </div>

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="Uptime"
          value={data ? formatUptime(data.uptime) : "—"}
          accent="yellow"
        />
        <StatTile
          label="Latency"
          value={latencyMs !== null ? `${latencyMs}ms` : "—"}
          accent="cyan"
        />
        <StatTile
          label="Cached Scores"
          value={data?.cache.walletScores ?? "—"}
          accent="lime"
        />
        <StatTile
          label="Used TXs"
          value={data?.cache.usedTransactions ?? "—"}
          accent="pink"
        />
      </div>

      {/* ── Latency sparkline ── */}
      <Card className="p-4">
        <p className="font-display font-black text-xs uppercase tracking-widest mb-3">
          Response Latency — last {history.length} checks
          <span className="ml-2 font-body font-normal text-gray-400 normal-case tracking-normal text-xs">
            (polls every 30s)
          </span>
        </p>
        <LatencyChart history={history} />
      </Card>

      {/* ── RPC / Services ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="font-display font-black text-xs uppercase tracking-widest mb-3">
            RPC Services
          </p>
          {data ? (
            <>
              <RpcRow label="Solana RPC" status={data.rpc.solana} />
              <RpcRow label="Helius Indexer" status={data.rpc.helius} />
            </>
          ) : (
            <div className="flex flex-col gap-2 animate-pulse">
              <div className="h-8 bg-nb-gray" />
              <div className="h-8 bg-nb-gray" />
            </div>
          )}
        </Card>

        <Card className="p-4">
          <p className="font-display font-black text-xs uppercase tracking-widest mb-3">
            Server Info
          </p>
          {data ? (
            <div className="flex flex-col gap-0">
              {[
                ["Version",     data.version],
                ["Environment", data.environment],
                ["Network",     "Solana Devnet (x402)"],
                ["Timestamp",   new Date(data.timestamp).toLocaleTimeString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b-2 border-nb-gray last:border-0">
                  <span className="font-body text-sm font-semibold">{label}</span>
                  <span className="font-mono text-xs bg-nb-gray px-2 py-0.5 border-2 border-nb-black">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 animate-pulse">
              {[1,2,3,4].map((i) => <div key={i} className="h-8 bg-nb-gray" />)}
            </div>
          )}
        </Card>
      </div>

      {/* ── Check history table ── */}
      {history.length > 0 && (
        <Card className="overflow-hidden">
          <div className="bg-nb-black px-5 py-3">
            <p className="font-mono text-xs text-white opacity-70 uppercase tracking-widest">
              Check History
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-3 border-nb-black bg-nb-gray">
                  {["Time", "Status", "Latency"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-display font-black text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h, i) => (
                  <tr key={i} className="border-b-2 border-nb-gray hover:bg-nb-gray transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {new Date(h.ts).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={[
                        "font-mono text-xs font-bold px-2 py-0.5 border-2 border-nb-black",
                        h.status === "ok" ? "bg-nb-lime" :
                        h.status === "degraded" ? "bg-nb-orange" : "bg-nb-red text-white",
                      ].join(" ")}>
                        {h.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs font-bold">
                      {h.latencyMs}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── API endpoints reference ── */}
      <Card className="p-5">
        <p className="font-display font-black text-xs uppercase tracking-widest mb-4">
          API Endpoints
        </p>
        <div className="flex flex-col gap-2">
          {[
            { method: "GET",    path: "/trust/:wallet",   auth: "x402", desc: "Single wallet trust score" },
            { method: "POST",   path: "/trust/batch",     auth: "x402", desc: "Batch scores (max 10)" },
            { method: "DELETE", path: "/trust/cache/:w",  auth: "admin", desc: "Invalidate cached score" },
            { method: "GET",    path: "/health",          auth: "public", desc: "System health + RPC status" },
            { method: "GET",    path: "/health/ping",     auth: "public", desc: "Liveness probe" },
          ].map(({ method, path, auth, desc }) => (
            <div key={path} className="flex items-center gap-3 py-2 border-b-2 border-nb-gray last:border-0">
              <span className={[
                "font-mono text-xs font-bold px-2 py-0.5 border-2 border-nb-black w-16 text-center flex-shrink-0",
                method === "GET"    ? "bg-nb-lime" :
                method === "POST"   ? "bg-nb-cyan" : "bg-nb-pink",
              ].join(" ")}>
                {method}
              </span>
              <span className="font-mono text-xs flex-1 text-nb-black">{path}</span>
              <span className={[
                "font-mono text-xs px-2 py-0.5 border-2 border-nb-black flex-shrink-0",
                auth === "x402"   ? "bg-nb-yellow" :
                auth === "admin"  ? "bg-nb-orange" : "bg-nb-gray",
              ].join(" ")}>
                {auth}
              </span>
              <span className="font-body text-xs text-gray-500 hidden sm:block">{desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}