import { CONFIG } from "@/lib/constants";

export function NetworkBanner() {
  return (
    <div className="w-full bg-nb-orange border-b-3 border-nb-black px-4 py-1.5 flex items-center justify-center gap-3">
      <span className="inline-block w-2 h-2 rounded-full bg-nb-black animate-pulse" />
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-nb-black">
        Connected to Solana{" "}
        <span className="underline decoration-2 underline-offset-2">
          {CONFIG.SOLANA_NETWORK.toUpperCase()}
        </span>{" "}
        — x402 Covalent Devnet
      </p>
      <span className="inline-block w-2 h-2 rounded-full bg-nb-black animate-pulse" />
    </div>
  );
}