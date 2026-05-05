import { TrustScore, TrustRating } from "@/types";
import { RatingBadge } from "./ui/Badge";

const breakdownMeta: { key: keyof TrustScore["breakdown"]; label: string; weight: string }[] = [
  { key: "transactionHistory", label: "TX History",     weight: "35%" },
  { key: "tokenActivity",      label: "Token Activity", weight: "20%" },
  { key: "walletAge",          label: "Wallet Age",     weight: "25%" },
  { key: "recentBehavior",     label: "Recent Behavior",weight: "20%" },
];

function scoreBg(s: number) {
  if (s >= 80) return "bg-score-high";
  if (s >= 50) return "bg-score-mid";
  if (s >= 20) return "bg-score-low";
  return "bg-score-unk";
}
function scoreText(s: number) {
  if (s >= 80) return "text-score-high";
  if (s >= 50) return "text-score-mid";
  if (s >= 20) return "text-score-low";
  return "text-score-unk";
}
function ratingAccent(r: TrustRating): string {
  return { HIGH: "border-score-high/40", MEDIUM: "border-score-mid/40", LOW: "border-score-low/40", UNKNOWN: "border-score-unk/40" }[r];
}

function Addr({ s }: { s: string }) {
  return <span className="font-mono text-sm">{s.slice(0, 6)}…{s.slice(-6)}</span>;
}

export function TrustScoreCard({ score }: { score: TrustScore }) {
  return (
    <div className="animate-slide-up">
      {/* ── Dark hero card ── */}
      <div className={["bg-forest rounded-card-lg border-2 shadow-card-lg overflow-hidden", ratingAccent(score.rating)].join(" ")}>

        {/* Header strip */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-lime/10">
          <span className="font-mono text-xs text-lime/40 uppercase tracking-widest">Trust Oracle Report</span>
          <span className="font-mono text-xs text-lime/30">{new Date(score.fetchedAt).toLocaleTimeString()}</span>
        </div>

        <div className="p-5 sm:p-6">
          {/* Wallet + rating row */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-xs text-lime/40 font-display font-black uppercase tracking-widest mb-1">Wallet</p>
              <p className="text-lime font-semibold"><Addr s={score.walletAddress} /></p>
            </div>
            <RatingBadge rating={score.rating} large />
          </div>

          {/* Big score + bar */}
          <div className="flex items-end gap-5 mb-6">
            <div className={["w-24 h-24 rounded-card border-2 border-ink flex items-center justify-center font-display font-black text-5xl text-ink shadow-card", scoreBg(score.score)].join(" ")}>
              {score.score}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-black text-xs uppercase tracking-widest text-lime/50">Overall Score</span>
                <span className={["font-display font-black text-lg", scoreText(score.score)].join(" ")}>{score.score}<span className="text-xs text-lime/30">/100</span></span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={["h-full rounded-full transition-all duration-1000", scoreBg(score.score)].join(" ")}
                  style={{ width: `${score.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="border-t border-lime/10 pt-5">
            <p className="font-display font-black text-xs uppercase tracking-widest text-lime/40 mb-4">Score Breakdown</p>
            <div className="grid gap-3">
              {breakdownMeta.map(({ key, label, weight }) => {
                const val = score.breakdown[key];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-body text-xs font-semibold text-lime/70 uppercase tracking-wide">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-lime/30">wt {weight}</span>
                        <span className={["font-mono text-xs font-bold", scoreText(val)].join(" ")}>{val}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={["h-full rounded-full transition-all duration-1000", scoreBg(val)].join(" ")}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
