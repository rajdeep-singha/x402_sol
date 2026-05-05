import { useState, KeyboardEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PaymentToken, BatchQueryItem } from "@/types";
import { useBatchQuery } from "@/hooks/useTrustQuery";
import { Button } from "./ui/Button";
import { RatingBadge } from "./ui/Badge";
import { TokenSelector } from "./TokenSelector";
import { PaymentFlow } from "./PaymentFlow";

function scoreColor(s: number) {
  if (s >= 80) return "bg-score-high";
  if (s >= 50) return "bg-score-mid";
  if (s >= 20) return "bg-score-low";
  return "bg-score-unk";
}

function ResultRow({ item }: { item: BatchQueryItem }) {
  const short = `${item.walletAddress.slice(0, 6)}…${item.walletAddress.slice(-6)}`;
  if (item.status === "pending" || item.status === "loading") {
    return (
      <tr className="border-b border-lime/10 animate-pulse">
        <td className="px-4 py-3 font-mono text-xs text-lime/50">{short}</td>
        <td colSpan={3}><div className="h-3 bg-white/10 rounded-full w-full" /></td>
      </tr>
    );
  }
  if (item.status === "error" || !item.result) {
    return (
      <tr className="border-b border-lime/10">
        <td className="px-4 py-3 font-mono text-xs text-lime/50">{short}</td>
        <td colSpan={3} className="px-4 py-3 text-score-low text-xs font-semibold">{item.error ?? "Failed"}</td>
      </tr>
    );
  }
  const s = item.result.score;
  return (
    <tr className="border-b border-lime/10 hover:bg-white/5 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-lime">{short}</td>
      <td className="px-4 py-3"><RatingBadge rating={item.result.rating} /></td>
      <td className="px-4 py-3 min-w-[120px]">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className={["h-full rounded-full", scoreColor(s)].join(" ")} style={{ width: `${s}%` }} />
          </div>
          <span className="font-mono text-xs text-lime font-bold w-6">{s}</span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-lime/30">{new Date(item.result.fetchedAt).toLocaleTimeString()}</td>
    </tr>
  );
}

export function BatchQueryPanel() {
  const { publicKey } = useWallet();
  const { items, flowState, queryBatch, reset } = useBatchQuery();
  const [token, setToken]       = useState<PaymentToken>("USDC");
  const [inputVal, setInputVal] = useState("");
  const [addresses, setAddresses] = useState<string[]>([]);
  const [inputErr, setInputErr] = useState("");

  const isRunning = ["requesting","payment_required","sending_tx","confirming_tx","verifying"].includes(flowState.step);

  const addAddr = () => {
    const v = inputVal.trim();
    if (!v) return;
    if (addresses.includes(v))   { setInputErr("Already added");           return; }
    if (addresses.length >= 10)  { setInputErr("Max 10 wallets");          return; }
    if (v.length < 32)           { setInputErr("Address looks too short"); return; }
    setAddresses((p) => [...p, v]); setInputVal(""); setInputErr("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") addAddr(); };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Input card ── */}
      <div className="bg-forest rounded-card-lg border-2 border-lime/20 shadow-card-lg p-5 sm:p-6">
        <h2 className="font-display font-black text-xl uppercase text-lime tracking-wide mb-1">Add Wallets</h2>
        <p className="font-body text-sm text-lime/40 mb-5">Enter up to 10 Solana addresses — one payment, all scored.</p>

        {/* Input row */}
        <div className="flex gap-2 mb-2">
          <input
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setInputErr(""); }}
            onKeyDown={onKey}
            placeholder="Paste a Solana wallet address…"
            disabled={isRunning}
            className={[
              "flex-1 font-mono text-sm bg-forest-mid text-lime placeholder:text-lime/20",
              "border-2 rounded-card px-4 py-3 outline-none transition-all",
              inputErr ? "border-score-low" : "border-lime/20 focus:border-lime/50",
            ].join(" ")}
          />
          <Button variant="cyan" size="md" pill onClick={addAddr} disabled={isRunning || !inputVal.trim()}>
            Add
          </Button>
        </div>
        {inputErr && <p className="text-score-low text-xs font-semibold mb-3">{inputErr}</p>}

        {/* Pill list */}
        {addresses.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {addresses.map((a, i) => (
              <span key={a} className="inline-flex items-center gap-1.5 font-mono text-xs bg-lime/10 border border-lime/20 rounded-pill px-3 py-1 text-lime">
                {a.slice(0, 6)}…{a.slice(-4)}
                <button onClick={() => setAddresses((p) => p.filter((_, j) => j !== i))}
                  disabled={isRunning} className="text-score-low hover:text-red-300 disabled:opacity-40 font-black">✕</button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <TokenSelector value={token} onChange={setToken} disabled={isRunning} dark />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="md"
              disabled={!publicKey || addresses.length === 0 || isRunning}
              loading={isRunning}
              onClick={() => queryBatch(addresses, token)}>
              {isRunning ? "Processing…" : `Score ${addresses.length || ""} Wallet${addresses.length !== 1 ? "s" : ""} →`}
            </Button>
            {(items.length > 0 || flowState.step !== "idle") && (
              <Button variant="ghost" size="md" onClick={reset} disabled={isRunning}>Reset</Button>
            )}
          </div>
        </div>

        {!publicKey && (
          <p className="mt-3 text-score-low text-sm font-semibold">Connect your wallet to query.</p>
        )}
      </div>

      {/* Payment flow */}
      {flowState.step !== "idle" && <PaymentFlow state={flowState} />}

      {/* Results */}
      {items.length > 0 && (
        <div className="bg-forest rounded-card-lg border-2 border-lime/20 shadow-card-lg overflow-hidden animate-slide-up">
          <div className="px-5 py-3 border-b border-lime/10 flex items-center justify-between">
            <p className="font-display font-black text-xs uppercase tracking-widest text-lime/50">
              Results — {items.length} wallet{items.length !== 1 ? "s" : ""}
            </p>
            <span className="status-dot-live" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-lime/10">
                  {["Wallet", "Rating", "Score", "Fetched"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-display font-black text-xs uppercase tracking-wider text-lime/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => <ResultRow key={item.walletAddress} item={item} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
