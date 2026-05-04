import { type PaymentFlowState } from "@/types";
import { StatusDot } from "./ui/Badge";

interface PaymentFlowProps {
  state: PaymentFlowState;
}

const STEPS: { key: PaymentFlowState["step"]; label: string; description: string }[] = [
  { key: "requesting",       label: "Requesting",     description: "Checking API endpoint" },
  { key: "payment_required", label: "402 Received",   description: "Payment instructions received" },
  { key: "sending_tx",       label: "Sending TX",     description: "Broadcasting Solana transaction" },
  { key: "confirming_tx",    label: "Confirming",     description: "Waiting for on-chain confirmation" },
  { key: "verifying",        label: "Verifying",      description: "Server verifying payment proof" },
  { key: "success",          label: "Done",           description: "Data returned successfully" },
];

const STEP_ORDER = STEPS.map((s) => s.key);

function getStepIndex(step: PaymentFlowState["step"]): number {
  return STEP_ORDER.indexOf(step);
}

export function PaymentFlow({ state }: PaymentFlowProps) {
  if (state.step === "idle") return null;

  const currentIdx = getStepIndex(state.step);

  return (
    <div className="animate-slide-in">
      {/* ── Payment instructions box on 402 ── */}
      {state.step === "payment_required" && state.paymentInstructions && (
        <div className="mb-4 bg-nb-yellow border-3 border-nb-black shadow-nb p-4">
          <p className="font-display font-black text-sm uppercase tracking-wider mb-2">
            Payment Required
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="bg-white border-2 border-nb-black p-2">
              <span className="font-bold">USDC</span>
              <p className="text-nb-black">
                {state.paymentInstructions.payment.amount.USDC ?? "—"} USDC
              </p>
            </div>
            <div className="bg-white border-2 border-nb-black p-2">
              <span className="font-bold">SOL</span>
              <p className="text-nb-black">
                {state.paymentInstructions.payment.amount.SOL ?? "—"} SOL
              </p>
            </div>
          </div>
          <p className="font-mono text-xs mt-2 text-nb-black opacity-70 truncate">
            → {state.paymentInstructions.payment.receiver}
          </p>
        </div>
      )}

      {/* ── Step progress ── */}
      <div className="bg-nb-gray border-3 border-nb-black shadow-nb p-4">
        <p className="font-display font-black text-xs uppercase tracking-widest mb-3 text-nb-black">
          x402 Flow
        </p>
        <ol className="flex flex-col gap-2">
          {STEPS.map((step, i) => {
            const isPast    = i < currentIdx;
            const isCurrent = i === currentIdx;
            const isFuture  = i > currentIdx;

            return (
              <li
                key={step.key}
                className={[
                  "flex items-center gap-3 font-body text-sm transition-opacity duration-200",
                  isFuture && "opacity-30",
                ].filter(Boolean).join(" ")}
              >
                <div className="flex-shrink-0">
                  {isPast ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-nb-lime border-2 border-nb-black font-black text-xs animate-tick">
                      ✓
                    </span>
                  ) : (
                    <StatusDot step={isCurrent ? state.step : "idle"} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={["font-semibold", isCurrent && "text-nb-black"].join(" ")}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <p className="text-xs text-gray-500 truncate">{step.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {/* ── TX Signature ── */}
        {state.txSignature && (
          <div className="mt-3 pt-3 border-t-2 border-nb-black">
            <p className="font-display text-xs uppercase tracking-wider font-black mb-1">
              TX Signature
            </p>
            <a
              href={`https://explorer.solana.com/tx/${state.txSignature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-blue-600 underline break-all hover:text-blue-800"
            >
              {state.txSignature}
            </a>
          </div>
        )}

        {/* ── Error ── */}
        {state.step === "error" && state.error && (
          <div className="mt-3 bg-nb-red border-2 border-nb-black p-3">
            <p className="font-display font-black text-xs uppercase text-white mb-1">Error</p>
            <p className="font-mono text-xs text-white break-all">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}