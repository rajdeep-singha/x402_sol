import { useState, type KeyboardEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { type PaymentToken, type BatchQueryItem } from "@/types";
import { useBatchQuery } from "@/hooks/useTrustQuery";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { RatingBadge } from "./ui/Badge";
import { TokenSelector } from "./TokenSelector";
import { PaymentFlow } from "./PaymentFlow";

function scoreBar(score: number) {
  const color =
    score >= 80 ? "bg-nb-lime" :
    score >= 50 ? "bg-nb-orange" :
    score >= 20 ? "bg-nb-red" : "bg-nb-purple";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-3 bg-nb-gray border-2 border-nb-black overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%`, transition: "width 0.8s ease-out" }} />
      </div>
      <span className="font-mono text-xs font-bold w-6 text-right">{score}</span>
    </div>
  );
}

function ResultRow({ item }: { item: BatchQueryItem }) {
  const short = `${item.walletAddress.slice(0, 6)}…${item.walletAddress.slice(-6)}`;

  if (item.status === "loading" || item.status === "pending") {
    return (
      <tr className="border-b-2 border-nb-gray animate-pulse">
        <td className="px-4 py-3 font-mono text-xs">{short}</td>
        <td colSpan={3} className="px-4 py-3">
          <div className="h-3 bg-nb-gray rounded w-full" />
        </td>
      </tr>
    );
  }

  if (item.status === "error" || !item.result) {
    return (
      <tr className="border-b-2 border-nb-gray bg-red-50">
        <td className="px-4 py-3 font-mono text-xs">{short}</td>
        <td colSpan={3} className="px-4 py-3 font-body text-xs text-nb-red font-semibold">
          {item.error ?? "Failed"}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b-2 border-nb-gray hover:bg-nb-gray transition-colors">
      <td className="px-4 py-3 font-mono text-xs">{short}</td>
      <td className="px-4 py-3">
        <RatingBadge rating={item.result.rating} />
      </td>
      <td className="px-4 py-3 min-w-[140px]">{scoreBar(item.result.score)}</td>
      <td className="px-4 py-3 font-mono text-xs text-gray-500">
        {new Date(item.result.fetchedAt).toLocaleTimeString()}
      </td>
    </tr>
  );
}

export function BatchQueryPanel() {
  const { publicKey } = useWallet();
  const { items, flowState, queryBatch, reset } = useBatchQuery();
  const [token, setToken]     = useState<PaymentToken>("USDC");
  const [inputVal, setInputVal] = useState("");
  const [addresses, setAddresses] = useState<string[]>([]);
  const [inputErr, setInputErr]   = useState("");

  const addAddress = () => {
    const val = inputVal.trim();
    if (!val) return;
    if (addresses.includes(val)) { setInputErr("Already added"); return; }
    if (addresses.length >= 10)  { setInputErr("Max 10 wallets"); return; }
    if (val.length < 32)         { setInputErr("Looks too short for a Solana address"); return; }
    setAddresses((prev) => [...prev, val]);
    setInputVal("");
    setInputErr("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addAddress();
  };

  const removeAt = (i: number) => setAddresses((prev) => prev.filter((_, idx) => idx !== i));

  const isRunning = ["requesting","payment_required","sending_tx","confirming_tx","verifying"].includes(flowState.step);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Input panel ── */}
      <Card className="p-5">
        <h2 className="font-display font-black text-lg uppercase tracking-wider mb-4">
          Batch Query
          <span className="ml-2 font-body font-semibold text-xs text-gray-400 normal-case tracking-normal">
            up to 10 wallets · one payment
          </span>
        </h2>

        {/* Address input */}
        <div className="flex gap-2 mb-3">
          <input
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setInputErr(""); }}
            onKeyDown={onKey}
            placeholder="Paste Solana wallet address…"
            disabled={isRunning}
            className={[
              "flex-1 font-mono text-sm bg-white border-3 border-nb-black px-3 py-2",
              "shadow-nb-sm focus:shadow-nb outline-none transition-all",
              "placeholder:text-gray-400",
              inputErr && "border-nb-red",
            ].filter(Boolean).join(" ")}
          />
          <Button
            variant="secondary"
            size="md"
            onClick={addAddress}
            disabled={isRunning || !inputVal.trim()}
          >
            Add
          </Button>
        </div>
        {inputErr && <p className="font-body text-xs text-nb-red font-semibold mb-3">{inputErr}</p>}

        {/* Pill list */}
        {addresses.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {addresses.map((addr, i) => (
              <span
                key={addr}
                className="inline-flex items-center gap-1.5 font-mono text-xs bg-nb-gray border-2 border-nb-black px-2 py-1"
              >
                {addr.slice(0, 6)}…{addr.slice(-4)}
                <button
                  onClick={() => removeAt(i)}
                  disabled={isRunning}
                  className="text-nb-red font-black hover:text-red-700 disabled:opacity-40"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <TokenSelector value={token} onChange={setToken} disabled={isRunning} />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              disabled={!publicKey || addresses.length === 0 || isRunning}
              loading={isRunning}
              onClick={() => queryBatch(addresses, token)}
            >
              {isRunning ? "Processing…" : `Query ${addresses.length || ""} Wallets`}
            </Button>
            {(items.length > 0 || flowState.step !== "idle") && (
              <Button variant="ghost" size="md" onClick={reset} disabled={isRunning}>
                Reset
              </Button>
            )}
          </div>
        </div>

        {!publicKey && (
          <p className="mt-3 font-body text-sm text-nb-red font-semibold">
            Connect your wallet to query.
          </p>
        )}
      </Card>

      {/* ── Payment flow ── */}
      {flowState.step !== "idle" && <PaymentFlow state={flowState} />}

      {/* ── Results table ── */}
      {items.length > 0 && (
        <Card className="overflow-hidden animate-slide-in">
          <div className="bg-nb-black px-5 py-3">
            <p className="font-mono text-xs text-white opacity-70 uppercase tracking-widest">
              Results — {items.length} wallet{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-3 border-nb-black bg-nb-gray">
                  {["Wallet", "Rating", "Score", "Fetched"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-display font-black text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <ResultRow key={item.walletAddress} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}