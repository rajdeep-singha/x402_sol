import { NavLink } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";

const navItems = [
  { to: "/",        label: "Oracle" },
  { to: "/batch",   label: "Batch" },
  { to: "/monitor", label: "Monitor" },
];

export function Navbar() {
  return (
    <header className="bg-white border-b-3 border-nb-black sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-nb-yellow border-3 border-nb-black shadow-nb-sm w-8 h-8 flex items-center justify-center font-display font-black text-sm leading-none select-none">
            x4
          </div>
          <span className="font-display font-black text-sm uppercase tracking-wider hidden sm:block">
            Trust Oracle
          </span>
        </NavLink>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                [
                  "font-display font-black text-xs uppercase tracking-widest px-3 py-1.5",
                  "border-3 border-transparent transition-all duration-100",
                  "hover:border-nb-black hover:shadow-nb-sm hover:bg-nb-gray",
                  isActive && "border-nb-black bg-nb-yellow shadow-nb-sm",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Wallet */}
        <WalletConnect />
      </div>
    </header>
  );
}