import { type TrustRating } from "@/types";

interface RatingBadgeProps {
  rating: TrustRating;
  large?: boolean;
}

const config: Record<TrustRating, { bg: string; label: string; icon: string }> = {
  HIGH:    { bg: "bg-nb-lime",   label: "HIGH TRUST",    icon: "✓" },
  MEDIUM:  { bg: "bg-nb-orange", label: "MEDIUM TRUST",  icon: "~" },
  LOW:     { bg: "bg-nb-red text-white", label: "LOW TRUST", icon: "✗" },
  UNKNOWN: { bg: "bg-nb-purple", label: "UNKNOWN",        icon: "?" },
};

export function RatingBadge({ rating, large = false }: RatingBadgeProps) {
  const { bg, label, icon } = config[rating];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-display font-black uppercase tracking-widest",
        "border-3 border-nb-black",
        large ? "px-4 py-2 text-base shadow-nb" : "px-2.5 py-1 text-xs shadow-nb-sm",
        bg,
      ].join(" ")}
    >
      <span className={large ? "text-lg" : "text-sm"}>{icon}</span>
      {label}
    </span>
  );
}

interface StatusDotProps {
  step: string;
}

export function StatusDot({ step }: StatusDotProps) {
  const dots: Record<string, string> = {
    idle:             "bg-nb-gray",
    requesting:       "bg-nb-cyan animate-pulse",
    payment_required: "bg-nb-orange animate-pulse",
    sending_tx:       "bg-nb-yellow animate-pulse",
    confirming_tx:    "bg-nb-yellow animate-pulse",
    verifying:        "bg-nb-cyan animate-pulse",
    success:          "bg-nb-lime",
    error:            "bg-nb-red",
  };

  return (
    <span className={["inline-block w-3 h-3 rounded-full border-2 border-nb-black", dots[step] ?? "bg-nb-gray"].join(" ")} />
  );
}