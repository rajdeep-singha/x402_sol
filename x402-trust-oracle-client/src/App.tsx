import { Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { NetworkBanner } from "@/components/NetworkBanner";
import { HomePage } from "@/pages/HomePage";
import { BatchPage } from "@/pages/BatchPage";
import { MonitorPage } from "@/pages/MonitorPage";

export function App() {
  return (
    <div className="min-h-screen bg-lime font-body">
      <NetworkBanner />
      <Navbar />

      <main className="pb-16">
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/batch"   element={<BatchPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-forest rounded-card-lg border-2 border-ink shadow-card-lg p-12 text-center">
                <p className="font-display font-black text-7xl text-lime mb-2">404</p>
                <p className="font-body text-lime/60">Page not found</p>
              </div>
            </div>
          } />
        </Routes>
      </main>

      <footer className="border-t-2 border-ink/20 bg-forest py-5 px-4">
        <div className="max-w-6xl mx-auto flex flex-col xs:flex-row items-center justify-between gap-2">
          <p className="font-mono text-xs text-lime/30">x402 Trust Oracle · Solana Devnet</p>
          <div className="flex items-center gap-4">
            {["x402", "GoldRush", "@solana/web3.js"].map((t) => (
              <span key={t} className="font-mono text-xs text-lime/20">{t}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
