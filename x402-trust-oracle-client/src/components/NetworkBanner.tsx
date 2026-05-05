export function NetworkBanner() {
  return (
    <div className="w-full bg-forest text-lime py-1.5 px-4 flex items-center justify-center gap-3 text-xs font-mono font-semibold tracking-widest">
      <span className="status-dot-live" />
      SOLANA DEVNET · x402 COVALENT INTEGRATION ACTIVE
      <span className="status-dot-live" />
    </div>
  );
}
