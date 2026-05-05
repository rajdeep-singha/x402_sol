import { NavLink } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";

const navItems = [
  { to: "/",        label: "Oracle", color: "bg-pill-pink  hover:bg-pink-200"  },
  { to: "/batch",   label: "Batch",  color: "bg-pill-cyan  hover:bg-cyan-100"  },
  { to: "/monitor", label: "Monitor",color: "bg-pill-yellow hover:bg-yellow-200"},
];

export function Navbar() {
  return (
    <header className="bg-lime border-b-2 border-ink sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-10 h-10 rounded-full bg-forest border-2 border-ink flex items-center justify-center
                          shadow-btn group-hover:translate-y-[2px] group-hover:shadow-none transition-all duration-150">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8BCE53" strokeWidth="2.2">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          </div>
          <span className="font-display font-black text-base uppercase tracking-wider text-ink hidden xs:block">
            x402 Oracle
          </span>
        </NavLink>

        {/* Nav pills */}
        <nav className="flex items-center gap-2">
          {navItems.map(({ to, label, color }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => [
                "nav-pill text-xs xs:text-sm",
                color,
                isActive ? "translate-y-[2px] shadow-none" : "",
              ].join(" ")}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Wallet + network */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 bg-white/60 border border-ink/20 rounded-pill px-3 py-1.5 text-xs font-mono font-bold">
            <span className="status-dot-live" />
            DEVNET
          </div>
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
