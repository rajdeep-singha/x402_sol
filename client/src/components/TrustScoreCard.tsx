import { type TrustScore, type TrustRating } from "@/types";
import { Card } from "./ui/Card";
import { RatingBadge } from "./ui/Badge";

interface TrustScoreCardProps {
  score: TrustScore;
}

const breakdownLabels: Record<keyof TrustScore["breakdown"], string> = {
  transactionHistory: "TX History",
  tokenActivity:      "Token Activity",
  walletAge:          "Wallet Age",
  recentBehavior:     "Recent Behavior",
};

const breakdownWeights: Record<keyof TrustScore["breakdown"], string> = {
  transactionHistory: "35%",
  tokenActivity:      "20%",
  walletAge:          "25%",
  recentBehavior:     "20%",
};

function scoreToColor(score: number): string {
  if (score >= 80) return "bg-nb-lime";
  if (score >= 50) return "bg-nb-orange";
  if (score >= 20) return "bg-nb-red";
  return "bg-nb-purple";
}

function ratingToAccent(rating: TrustRating): "lime" | "yellow" | "pink" | "cyan" {
  if (rating === "HIGH")    return "lime";
  if (rating === "MEDIUM")  return "yellow";
  if (rating === "LOW")     return "pink";
  return "cyan";
}

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function TrustScoreCard({ score }: TrustScoreCardProps) {
  const accent = ratingToAccent(score.rating);

  return (
    <Card accent={accent} className="animate-slide-in overflow-hidden">
      {/* ── Header stripe ── */}
      <div className="bg-nb-black px-5 py-3 flex items-center justify-between">
        <span className="font-mono text-xs text-white opacity-70 tracking-wider">
          TRUST ORACLE REPORT
        </span>
        <span className="font-mono text-xs text-white opacity-50">
          {formatDate(score.fetchedAt)}
        </span>
      </div>

      <div className="p-5">
        {/* ── Wallet address ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-display font-black text-xs uppercase tracking-widest text-gray-400 mb-0.5">
              Wallet
            </p>
            <p className="font-mono text-sm font-semibold text-nb-black">
              {formatAddress(score.walletAddress)}
            </p>
          </div>
          <RatingBadge rating={score.rating} large />
        </div>

        {/* ── Big score number ── */}
        <div className="flex items-end gap-4 mb-6">
          <div
            className={[
              "flex items-center justify-center w-28 h-28",
              "border-3 border-nb-black shadow-nb-md font-display font-black text-5xl",
              scoreToColor(score.score),
            ].join(" ")}
          >
            {score.score}
          </div>
          <div className="flex-1">
            <p className="font-display font-black text-xs uppercase tracking-widest text-gray-400 mb-1">
              Overall Score
            </p>
            {/* Full-width progress bar */}
            <div className="w-full h-6 bg-nb-gray border-3 border-nb-black shadow-nb-sm overflow-hidden">
              <div
                className={["h-full border-r-3 border-nb-black", scoreToColor(score.score)].join(" ")}
                style={{
                  width: `${score.score}%`,
                  transition: "width 1s ease-out",
                }}
              />
            </div>
            <p className="font-mono text-xs text-gray-400 mt-1">{score.score} / 100</p>
          </div>
        </div>

        {/* ── Breakdown bars ── */}
        <div className="border-t-3 border-nb-black pt-4">
          <p className="font-display font-black text-xs uppercase tracking-widest text-gray-500 mb-3">
            Score Breakdown
          </p>
          <div className="flex flex-col gap-3">
            {(Object.keys(breakdownLabels) as (keyof TrustScore["breakdown"])[]).map((key) => {
              const val = score.breakdown[key];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-xs font-semibold text-nb-black uppercase tracking-wide">
                      {breakdownLabels[key]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">
                        weight {breakdownWeights[key]}
                      </span>
                      <span className="font-mono text-xs font-bold text-nb-black">
                        {val}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-4 bg-nb-gray border-2 border-nb-black overflow-hidden">
                    <div
                      className={["h-full", scoreToColor(val)].join(" ")}
                      style={{
                        width: `${val}%`,
                        transition: "width 1.2s ease-out",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}