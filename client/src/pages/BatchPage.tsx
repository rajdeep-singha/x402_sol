import { BatchQueryPanel } from "@/components/BatchQueryPanel";

export function BatchPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <div className="inline-flex items-center gap-2 bg-nb-pink border-3 border-nb-black shadow-nb px-4 py-2 mb-4">
          <span className="font-display font-black text-xs uppercase tracking-widest">
            One Payment · Many Wallets
          </span>
        </div>
        <h1 className="font-display font-black text-4xl uppercase leading-none tracking-tight">
          Batch<br />
          <span className="relative inline-block">
            Query
            <span className="absolute -bottom-1 left-0 w-full h-3 bg-nb-pink -z-10" />
          </span>
        </h1>
        <p className="font-body text-sm text-gray-600 mt-3 max-w-md">
          Score up to 10 wallets in a single x402 payment. Useful for
          counterparty risk dashboards and pre-trade screening.
        </p>
      </div>

      <BatchQueryPanel />
    </div>
  );
}