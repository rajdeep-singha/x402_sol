import { PaymentToken } from "@/types";

interface TokenSelectorProps {
  value: PaymentToken;
  onChange: (token: PaymentToken) => void;
  disabled?: boolean;
  dark?: boolean;
}

const tokens = [
  { token: "USDC" as PaymentToken, label: "USDC", sub: "1.00 USDC", bg: "bg-pill-cyan",   sel: "bg-pill-cyan" },
  { token: "SOL"  as PaymentToken, label: "SOL",  sub: "0.001 SOL", bg: "bg-pill-pink",   sel: "bg-pill-pink" },
];

export function TokenSelector({ value, onChange, disabled, dark }: TokenSelectorProps) {
  return (
    <div>
      <p className={["font-display font-black text-xs uppercase tracking-widest mb-2", dark ? "text-lime/60" : "text-ink/60"].join(" ")}>
        Pay With
      </p>
      <div className="flex gap-2">
        {tokens.map(({ token, label, sub, sel }) => {
          const selected = value === token;
          return (
            <button
              key={token}
              type="button"
              disabled={disabled}
              onClick={() => onChange(token)}
              className={[
                "flex-1 flex flex-col items-center gap-0.5 py-3 px-4 rounded-card",
                "border-2 border-ink font-display font-black",
                "transition-all duration-150 cursor-pointer select-none",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                selected
                  ? `${sel} shadow-none translate-y-[2px]`
                  : `${dark ? "bg-forest-mid text-lime" : "bg-white text-ink"} shadow-card hover:translate-y-[1px] hover:shadow-btn-sm`,
              ].join(" ")}
            >
              <span className="text-sm uppercase tracking-wide">{label}</span>
              <span className="text-xs font-body font-semibold opacity-60">{sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
