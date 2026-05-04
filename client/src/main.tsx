// Ensure Buffer is available globally
if (!globalThis.Buffer) {
  // @ts-ignore - Buffer is polyfilled in index.html
  globalThis.Buffer = (window as any).Buffer;
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { App } from "./App";
import { CONFIG } from "@/lib/constants";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./index.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CP = ConnectionProvider as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WP = WalletProvider as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WMP = WalletModalProvider as any;

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CP endpoint={CONFIG.SOLANA_RPC_URL}>
      <WP wallets={wallets} autoConnect>
        <WMP>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WMP>
      </WP>
    </CP>
  </React.StrictMode>
);