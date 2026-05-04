interface HistoryPoint {
  ts: number;
  latencyMs: number;
  status: string;
}

interface LatencyChartProps {
  history: HistoryPoint[];
}

const STATUS_COLOR: Record<string, string> = {
  ok:          "#BEFF54",
  degraded:    "#FF8C42",
  unreachable: "#FF4D6D",
  down:        "#FF4D6D",
  loading:     "#E8E8E0",
};

export function LatencyChart({ history }: LatencyChartProps) {
  if (history.length === 0) {
    return (
      <div className="h-16 bg-nb-gray border-3 border-nb-black flex items-center justify-center">
        <span className="font-mono text-xs text-gray-400">Collecting data…</span>
      </div>
    );
  }

  const maxLatency = Math.max(...history.map((h) => h.latencyMs), 500);
  const BAR_W = 16;
  const HEIGHT = 64;

  return (
    <div className="border-3 border-nb-black bg-nb-gray overflow-hidden">
      <div className="flex items-end gap-0.5 px-2 pt-2 pb-0 h-16">
        {history.map((point, i) => {
          const barH = Math.max(4, (point.latencyMs / maxLatency) * (HEIGHT - 8));
          const color = STATUS_COLOR[point.status] ?? "#E8E8E0";
          return (
            <div key={i} className="group relative flex-shrink-0" style={{ width: BAR_W }}>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-nb-black text-white font-mono text-xs px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 border border-white">
                {point.latencyMs}ms
              </div>
              <div
                className="w-full border-t-2 border-nb-black transition-all duration-300"
                style={{ height: barH, background: color }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between px-2 py-1 border-t-2 border-nb-black">
        <span className="font-mono text-xs text-gray-400">
          {history.length} checks
        </span>
        <span className="font-mono text-xs text-gray-400">
          max {maxLatency}ms
        </span>
      </div>
    </div>
  );
}