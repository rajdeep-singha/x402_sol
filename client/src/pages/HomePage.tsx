import { useState, type FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTrustQuery } from "@/hooks/useTrustQuery";
import { type PaymentToken } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { TokenSelector } from "@/components/TokenSelector";
import { TrustScoreCard } from "@/components/TrustScoreCard";
import { PaymentFlow } from "@/components/PaymentFlow";

const EXAMPLE_WALLETS = [
  "So11111111111111111111111111111111111111112",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
];

export function HomePage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { flowState, result, query, reset } = useTrustQuery();
  const [address, setAddress] = useState("");
  const [token, setToken]     = useState<PaymentToken>("USDC");
  const [addrErr, setAddrErr] = useState("");

  const isRunning = ["requesting","payment_required","sending_tx","confirming_tx","verifying"]
    .includes(flowState.step);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = address.trim();
    if (!val)          { setAddrErr("Enter a wallet address"); return; }
    if (val.length < 32) { setAddrErr("Too short — check the address"); return; }
    setAddrErr("");
    query(val, token);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* ── Hero header ── */}
      <div>
        <div className="inline-flex items-center gap-2 bg-nb-yellow border-3 border-nb-black shadow-nb px-4 py-2 mb-4">
          <span className="font-display font-black text-xs uppercase tracking-widest">
            x402 · Solana Devnet
          </span>
        </div>
        <h1 className="font-display font-black text-4xl sm:text-5xl uppercase leading-none tracking-tight text-nb-black">
          Counterparty<br />
          <span className="relative inline-block">
            Trust Oracle
            <span className="absolute -bottom-1 left-0 w-full h-3 bg-nb-yellow -z-10" />
          </span>
        </h1>
        <p className="font-body text-sm text-gray-600 mt-3 max-w-md">
          Pay once, query a Solana wallet's on-chain trust score. Powered by
          x402 micropayments — no API key needed.
        </p>
      </div>

      {/* ── Query form ── */}
      <Card accent="yellow" className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Wallet Address"
            placeholder="Enter any Solana wallet address…"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setAddrErr(""); reset(); }}
            error={addrErr}
            hint="Mainnet or devnet wallet address"
            disabled={isRunning}
            spellCheck={false}
          />

          {/* Example wallets */}
          <div className="flex flex-wrap gap-2">
            <span className="font-display font-black text-xs uppercase tracking-wider text-gray-400">
              Examples:
            </span>
            {EXAMPLE_WALLETS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => { setAddress(w); setAddrErr(""); reset(); }}
                disabled={isRunning}
                className="font-mono text-xs text-blue-600 underline decoration-1 hover:text-blue-800 disabled:opacity-40"
              >
                {w.slice(0, 8)}…
              </button>
            ))}
          </div>

          <TokenSelector value={token} onChange={setToken} disabled={isRunning} />

          {publicKey ? (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isRunning}
              disabled={isRunning || !address.trim()}
              className="w-full"
            >
              {isRunning ? "Processing Payment…" : "Query Trust Score →"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setVisible(true)}
            >
              Connect Wallet to Query →
            </Button>
          )}
        </form>
      </Card>

      {/* ── x402 Flow progress ── */}
      {flowState.step !== "idle" && <PaymentFlow state={flowState} />}

      {/* ── Result ── */}
      {result && <TrustScoreCard score={result} />}

      {/* ── How it works ── */}
      {flowState.step === "idle" && !result && (
        <Card className="p-5">
          <p className="font-display font-black text-xs uppercase tracking-widest mb-4 text-gray-500">
            How It Works
          </p>
          <ol className="flex flex-col gap-3">
            {[
              { n: "01", label: "Request",  desc: "Client queries the API — server returns HTTP 402 with payment instructions" },
              { n: "02", label: "Pay",      desc: "Your wallet sends a micro-payment in USDC or SOL on Solana devnet" },
              { n: "03", label: "Verify",   desc: "Server verifies the on-chain tx: amount, receiver, time window, anti-replay" },
              { n: "04", label: "Score",    desc: "Trust score computed from tx history, token activity, wallet age, recent behavior" },
            ].map(({ n, label, desc }) => (
              <li key={n} className="flex items-start gap-3">
                <span className="flex-shrink-0 bg-nb-black text-nb-yellow font-display font-black text-xs w-8 h-8 flex items-center justify-center border-2 border-nb-black">
                  {n}
                </span>
                <div>
                  <p className="font-display font-black text-sm uppercase tracking-wide">{label}</p>
                  <p className="font-body text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}