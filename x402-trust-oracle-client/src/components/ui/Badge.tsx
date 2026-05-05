import { TrustRating } from "@/types";

// ── Rating badge ──────────────────────────────────────────────────────────────
const ratingCfg: Record<TrustRating, { bg: string; text: string; dot: string; label: string }> = {
  HIGH:    { bg: "bg-score-high/20 border-score-high", text: "text-ink",      dot: "bg-score-high", label: "HIGH TRUST" },
  MEDIUM:  { bg: "bg-score-mid/20  border-score-mid",  text: "text-ink",      dot: "bg-score-mid",  label: "MEDIUM TRUST" },
  LOW:     { bg: "bg-score-low/20  border-score-low",  text: "text-score-low",dot: "bg-score-low",  label: "LOW TRUST" },
  UNKNOWN: { bg: "bg-score-unk/20  border-score-unk",  text: "text-score-unk",dot: "bg-score-unk",  label: "UNKNOWN" },
};

export function RatingBadge({ rating, large }: { rating: TrustRating; large?: boolean }) {
  const { bg, text, dot, label } = ratingCfg[rating];
  return (
    <span className={[
      "inline-flex items-center gap-1.5 font-display font-black uppercase tracking-widest border-2",
      large ? "px-4 py-2 text-sm rounded-pill" : "px-3 py-1 text-xs rounded-pill",
      bg, text,
    ].join(" ")}>
      <span className={["rounded-full flex-shrink-0", large ? "w-2.5 h-2.5" : "w-2 h-2", dot].join(" ")} />
      {label}
    </span>
  );
}

// ── Flow step dot ─────────────────────────────────────────────────────────────
const stepDot: Record<string, string> = {
  idle:             "bg-white/30",
  requesting:       "bg-pill-cyan animate-blink",
  payment_required: "bg-pill-amber animate-blink",
  sending_tx:       "bg-pill-pink animate-blink",
  confirming_tx:    "bg-pill-yellow animate-blink",
  verifying:        "bg-lime-light animate-blink",
  success:          "bg-score-high",
  error:            "bg-score-low",
};

export function StatusDot({ step }: { step: string }) {
  return (
    <span className={["inline-block w-2.5 h-2.5 rounded-full border border-ink/30", stepDot[step] ?? stepDot.idle].join(" ")} />
  );
}
