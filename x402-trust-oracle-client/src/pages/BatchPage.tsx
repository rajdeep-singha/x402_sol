import { BatchQueryPanel } from "@/components/BatchQueryPanel";

export function BatchPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-display font-black text-xs uppercase tracking-widest text-ink/50 mb-2">
          One Payment · Many Wallets
        </p>
        <h1 className="font-display font-black text-5xl sm:text-6xl uppercase leading-[0.9] tracking-tight text-ink">
          Batch<br/>
          <span className="text-forest bg-pill-pink px-2 rounded">Query</span>
        </h1>
        <p className="font-body text-sm text-ink/60 mt-4 max-w-md">
          Score up to 10 wallets in a single x402 payment — perfect for
          counterparty risk dashboards and pre-trade screening.
        </p>
      </div>

      <BatchQueryPanel />
    </div>
  );
}
