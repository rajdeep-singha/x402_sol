import { PaymentFlowState } from "@/types";
import { StatusDot } from "./ui/Badge";

interface PaymentFlowProps { state: PaymentFlowState; }

const STEPS: { key: PaymentFlowState["step"]; label: string; desc: string }[] = [
  { key: "requesting",       label: "Request",    desc: "Hitting API endpoint" },
  { key: "payment_required", label: "402 Issued", desc: "Server returned payment instructions" },
  { key: "sending_tx",       label: "Send TX",    desc: "Broadcasting Solana transaction" },
  { key: "confirming_tx",    label: "Confirm",    desc: "Waiting for on-chain confirmation" },
  { key: "verifying",        label: "Verify",     desc: "Server checking payment proof" },
  { key: "success",          label: "Done ✓",     desc: "Data received" },
];

const ORDER = STEPS.map((s) => s.key);

export function PaymentFlow({ state }: PaymentFlowProps) {
  if (state.step === "idle") return null;
  const idx = ORDER.indexOf(state.step);

  return (
    <div className="animate-slide-up">
      {/* Payment instructions box */}
      {state.step === "payment_required" && state.paymentInstructions && (
        <div className="mb-3 bg-forest rounded-card border-2 border-lime/30 p-4">
          <p className="font-display font-black text-xs uppercase tracking-widest text-lime mb-3">
            Payment Instructions
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: "USDC", val: `${state.paymentInstructions.payment.amount.USDC ?? "—"} USDC`, color: "bg-pill-cyan/20 border-pill-cyan/40" },
              { label: "SOL",  val: `${state.paymentInstructions.payment.amount.SOL  ?? "—"} SOL`,  color: "bg-pill-pink/20 border-pill-pink/40" },
            ].map(({ label, val, color }) => (
              <div key={label} className={["rounded-card border p-3", color].join(" ")}>
                <p className="font-display font-black text-xs text-lime/60 mb-0.5">{label}</p>
                <p className="font-mono text-sm text-lime font-bold">{val}</p>
              </div>
            ))}
          </div>
          <p className="font-mono text-xs text-lime/40 truncate">
            → {state.paymentInstructions.payment.receiver}
          </p>
        </div>
      )}

      {/* Step progress */}
      <div className="bg-forest rounded-card border-2 border-lime/20 p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display font-black text-xs uppercase tracking-widest text-lime/60">x402 Flow</p>
          {state.token && (
            <span className="font-mono text-xs bg-lime/10 border border-lime/20 text-lime rounded-pill px-2 py-0.5">
              {state.token}
            </span>
          )}
        </div>

        <ol className="flex flex-col gap-2">
          {STEPS.map((step, i) => {
            const isPast = i < idx;
            const isCurrent = i === idx;
            return (
              <li key={step.key} className={["flex items-center gap-3 text-sm transition-opacity duration-200", i > idx && "opacity-25"].join(" ")}>
                <div className="flex-shrink-0 w-5 flex justify-center">
                  {isPast ? (
                    <span className="w-5 h-5 rounded-full bg-score-high border border-ink flex items-center justify-center text-xs font-black text-ink animate-pop">✓</span>
                  ) : (
                    <StatusDot step={isCurrent ? state.step : "idle"} />
                  )}
                </div>
                <div>
                  <span className={["font-display font-black text-xs uppercase tracking-wide", isCurrent ? "text-lime" : isPast ? "text-lime/60" : "text-lime/30"].join(" ")}>
                    {step.label}
                  </span>
                  {isCurrent && <p className="font-body text-xs text-lime/40 mt-0.5">{step.desc}</p>}
                </div>
              </li>
            );
          })}
        </ol>

        {/* TX link */}
        {state.txSignature && (
          <div className="mt-4 pt-3 border-t border-lime/10">
            <p className="font-display font-black text-xs uppercase tracking-wider text-lime/50 mb-1">Transaction</p>
            <a
              href={`https://explorer.solana.com/tx/${state.txSignature}?cluster=devnet`}
              target="_blank" rel="noreferrer"
              className="font-mono text-xs text-pill-cyan underline break-all hover:text-lime"
            >
              {state.txSignature}
            </a>
          </div>
        )}

        {/* Error */}
        {state.step === "error" && state.error && (
          <div className="mt-3 bg-score-low/10 border border-score-low/40 rounded-card p-3">
            <p className="font-display font-black text-xs text-score-low uppercase mb-1">Error</p>
            <p className="font-mono text-xs text-score-low/80 break-all">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
