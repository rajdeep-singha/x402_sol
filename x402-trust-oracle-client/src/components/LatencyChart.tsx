interface HistoryPoint { ts: number; latencyMs: number; status: string; }

const statusColor: Record<string, string> = {
  ok:          "#4ADE80",
  degraded:    "#FB923C",
  unreachable: "#F87171",
  down:        "#F87171",
  loading:     "#ffffff20",
};

export function LatencyChart({ history }: { history: HistoryPoint[] }) {
  if (!history.length) {
    return (
      <div className="h-20 rounded-card border border-lime/10 flex items-center justify-center">
        <span className="font-mono text-xs text-lime/30">Collecting data…</span>
      </div>
    );
  }
  const max = Math.max(...history.map((h) => h.latencyMs), 300);
  const H = 64;

  return (
    <div className="rounded-card border border-lime/10 overflow-hidden">
      <div className="flex items-end gap-0.5 px-3 pt-3" style={{ height: H + 12 }}>
        {history.map((p, i) => {
          const barH = Math.max(4, (p.latencyMs / max) * H);
          return (
            <div key={i} className="group relative flex-1 min-w-0">
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-forest border border-lime/20 text-lime font-mono text-xs px-2 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 rounded">
                {p.latencyMs}ms
              </div>
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{ height: barH, background: statusColor[p.status] ?? "#ffffff20" }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between px-3 py-2 border-t border-lime/10">
        <span className="font-mono text-xs text-lime/30">{history.length} checks</span>
        <span className="font-mono text-xs text-lime/30">peak {max}ms</span>
      </div>
    </div>
  );
}
