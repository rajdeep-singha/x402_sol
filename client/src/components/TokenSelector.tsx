import { type PaymentToken } from "@/types";

interface TokenSelectorProps {
  value: PaymentToken;
  onChange: (token: PaymentToken) => void;
  disabled?: boolean;
}

const tokens: { token: PaymentToken; label: string; sub: string; accent: string }[] = [
  { token: "USDC", label: "USDC", sub: "1 USDC",   accent: "bg-nb-cyan" },
  { token: "SOL",  label: "SOL",  sub: "0.001 SOL", accent: "bg-nb-pink" },
];

export function TokenSelector({ value, onChange, disabled }: TokenSelectorProps) {
  return (
    <div>
      <p className="font-display font-black text-xs uppercase tracking-widest mb-2 text-nb-black">
        Pay With
      </p>
      <div className="flex gap-2">
        {tokens.map(({ token, label, sub, accent }) => {
          const selected = value === token;
          return (
            <button
              key={token}
              type="button"
              disabled={disabled}
              onClick={() => onChange(token)}
              className={[
                "flex-1 flex flex-col items-center gap-0.5 py-3 px-4",
                "border-3 border-nb-black font-display font-black",
                "transition-all duration-100 cursor-pointer select-none",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                selected
                  ? `${accent} shadow-nb translate-x-0 translate-y-0`
                  : "bg-white shadow-nb hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-nb-sm",
              ].join(" ")}
            >
              <span className="text-base uppercase tracking-wide">{label}</span>
              <span className="text-xs font-body font-semibold text-nb-black opacity-60">{sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}