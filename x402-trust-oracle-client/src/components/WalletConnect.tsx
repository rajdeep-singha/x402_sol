import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "./ui/Button";

export function WalletConnect() {
  const { publicKey, disconnect, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  if (connecting) {
    return (
      <Button variant="amber" size="sm" disabled loading>
        Connecting
      </Button>
    );
  }

  if (publicKey) {
    const addr = publicKey.toBase58();
    const short = `${addr.slice(0, 4)}…${addr.slice(-4)}`;
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 bg-score-high/20 border-2 border-score-high/50 text-ink font-mono text-xs font-bold rounded-pill px-3 py-1.5">
          {wallet?.adapter.icon && (
            <img src={wallet.adapter.icon} className="w-4 h-4 rounded-full" alt="" />
          )}
          <span className="status-dot-live" />
          {short}
        </div>
        <Button variant="dark" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button variant="amber" size="md" onClick={() => setVisible(true)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="2" y="5" width="20" height="14" rx="3"/>
        <path d="M16 12h2"/>
      </svg>
      Connect Wallet
    </Button>
  );
}
