import { useState, FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTrustQuery } from "@/hooks/useTrustQuery";
import { PaymentToken } from "@/types";
import { Button } from "@/components/ui/Button";
import { TokenSelector } from "@/components/TokenSelector";
import { TrustScoreCard } from "@/components/TrustScoreCard";
import { PaymentFlow } from "@/components/PaymentFlow";

const EXAMPLES = [
  "So11111111111111111111111111111111111111112",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
];

const HOW_IT_WORKS = [
  { n: "01", color: "bg-pill-pink",   label: "Request",  desc: "Client calls /trust/:wallet — server returns 402 with payment instructions" },
  { n: "02", color: "bg-pill-amber",  label: "Pay",      desc: "Wallet sends micro-payment in USDC or SOL on Solana Devnet" },
  { n: "03", color: "bg-pill-cyan",   label: "Verify",   desc: "Server checks tx on-chain: receiver, amount, time window, anti-replay guard" },
  { n: "04", color: "bg-pill-green",  label: "Score",    desc: "Trust score computed from tx history, token diversity, wallet age, recent behavior" },
];

export function HomePage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { flowState, result, query, reset } = useTrustQuery();
  const [address, setAddress] = useState("");
  const [token, setToken]     = useState<PaymentToken>("USDC");
  const [addrErr, setAddrErr] = useState("");

  const isRunning = ["requesting","payment_required","sending_tx","confirming_tx","verifying"].includes(flowState.step);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = address.trim();
    if (!v)        { setAddrErr("Enter a wallet address"); return; }
    if (v.length < 32) { setAddrErr("Address looks too short"); return; }
    setAddrErr("");
    query(v, token);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* ── Hero section — mimics Taurus dark card + big text ── */}
      <div className="bg-forest rounded-card-lg border-2 border-ink shadow-card-lg overflow-hidden mb-8">
        <div className="flex flex-col lg:flex-row min-h-[440px]">

          {/* Left — big headline */}
          <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center">
            <p className="font-display font-black text-xs uppercase tracking-widest text-lime/50 mb-4">
              x402 · Solana Devnet · Covalent GoldRush
            </p>
            <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl uppercase leading-[0.9] tracking-tight text-lime mb-6">
              Counterparty<br/>Trust<br/>Oracle
            </h1>
            <p className="font-body text-base text-lime/60 max-w-sm leading-relaxed">
              Pay once, get an on-chain trust score for any Solana wallet.
              Powered by x402 micropayments — no API key needed.
            </p>
          </div>

          {/* Right — swap-style query form */}
          <div className="lg:w-[420px] bg-cream border-l-0 lg:border-l-2 border-t-2 lg:border-t-0 border-ink p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-black text-base uppercase tracking-wider text-ink">Query</h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink/40">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2"/>
              </svg>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Address field styled like a swap panel */}
              <div>
                <label className="font-display font-black text-xs uppercase tracking-widest text-ink/50 mb-2 block">
                  Wallet Address
                </label>
                <div className={["bg-white border-2 rounded-card p-3 transition-all", addrErr ? "border-score-low" : "border-ink/20 focus-within:border-ink"].join(" ")}>
                  <input
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setAddrErr(""); reset(); }}
                    placeholder="Enter any Solana address…"
                    disabled={isRunning}
                    className="w-full bg-transparent font-mono text-sm text-ink placeholder:text-ink/30 outline-none"
                    spellCheck={false}
                  />
                </div>
                {addrErr && <p className="text-score-low text-xs font-semibold mt-1">{addrErr}</p>}

                {/* Example wallets */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {EXAMPLES.map((w) => (
                    <button
                      key={w} type="button"
                      onClick={() => { setAddress(w); setAddrErr(""); reset(); }}
                      disabled={isRunning}
                      className="font-mono text-xs text-ink/40 underline hover:text-ink/80 disabled:opacity-40"
                    >
                      {w.slice(0, 8)}…
                    </button>
                  ))}
                </div>
              </div>

              <TokenSelector value={token} onChange={setToken} disabled={isRunning} />

              {publicKey ? (
                <Button type="submit" variant="amber" size="lg" loading={isRunning}
                  disabled={isRunning || !address.trim()} className="w-full">
                  {isRunning ? "Processing…" : "Get Score →"}
                </Button>
              ) : (
                <Button type="button" variant="amber" size="lg" className="w-full"
                  onClick={() => setVisible(true)}>
                  Connect Wallet →
                </Button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ── Payment flow + result ── */}
      {(flowState.step !== "idle" || result) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {flowState.step !== "idle" && (
            <div><PaymentFlow state={flowState} /></div>
          )}
          {result && (
            <div className={flowState.step === "idle" ? "lg:col-span-2" : ""}>
              <TrustScoreCard score={result} />
            </div>
          )}
        </div>
      )}

      {/* ── How it works cards — like Taurus pool cards ── */}
      {flowState.step === "idle" && !result && (
        <div>
          <p className="font-display font-black text-xs uppercase tracking-widest text-ink/50 mb-4">How It Works</p>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map(({ n, color, label, desc }) => (
              <div key={n} className="bg-forest rounded-card border-2 border-lime/10 shadow-card p-5 hover:border-lime/30 transition-colors">
                <div className={["w-10 h-10 rounded-full border-2 border-ink font-display font-black text-sm flex items-center justify-center text-ink mb-4 shadow-btn-sm", color].join(" ")}>
                  {n}
                </div>
                <p className="font-display font-black text-sm uppercase tracking-wide text-lime mb-2">{label}</p>
                <p className="font-body text-xs text-lime/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
