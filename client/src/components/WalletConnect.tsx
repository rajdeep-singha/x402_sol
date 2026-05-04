import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "./ui/Button";

export function WalletConnect() {
  const { publicKey, disconnect, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  if (connecting) {
    return (
      <Button variant="ghost" size="sm" disabled loading>
        Connecting
      </Button>
    );
  }

  if (publicKey) {
    const short = `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`;
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 border-3 border-nb-black bg-nb-lime px-3 py-1.5 shadow-nb-sm font-mono text-xs font-bold">
          {wallet?.adapter.icon && (
            <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-4 h-4" />
          )}
          <span>{short}</span>
        </div>
        <Button variant="danger" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button variant="primary" size="sm" onClick={() => setVisible(true)}>
      Connect Wallet
    </Button>
  );
}