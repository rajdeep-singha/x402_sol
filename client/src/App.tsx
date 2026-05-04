import { Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { NetworkBanner } from "@/components/NetworkBanner";
import { HomePage } from "@/pages/HomePage";
import { BatchPage } from "@/pages/BatchPage";
import { MonitorPage } from "@/pages/MonitorPage";

export function App() {
  return (
    <div className="min-h-screen bg-nb-bg font-body">
      {/* Devnet warning */}
      <NetworkBanner />

      {/* Sticky nav */}
      <Navbar />

      {/* Page content */}
      <main className="pb-16">
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/batch"   element={<BatchPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="*" element={
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
              <div className="inline-block bg-nb-red border-3 border-nb-black shadow-nb-lg px-8 py-6">
                <p className="font-display font-black text-6xl text-white mb-2">404</p>
                <p className="font-body text-white font-semibold">Page not found</p>
              </div>
            </div>
          } />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-nb-black bg-nb-black py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="font-mono text-xs text-white opacity-50">
            x402 Trust Oracle · Solana Devnet
          </p>
          <p className="font-mono text-xs text-white opacity-50">
            Built with x402 · Covalent GoldRush · @solana/web3.js
          </p>
        </div>
      </footer>
    </div>
  );
}