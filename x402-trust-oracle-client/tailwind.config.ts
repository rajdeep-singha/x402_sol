import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Taurus-style vibrant palette ──────────────────────────────────
        lime:    "#8BCE53",   // primary bg — vivid lime green
        "lime-dark": "#6BAF35",
        "lime-light": "#AEDD77",
        forest:  "#0D1F0D",   // dark hero bg
        "forest-mid": "#1A3A1A",
        cream:   "#FFFEF0",   // off-white cards
        // pill nav accents
        "pill-pink":   "#F9A8D4",   // pink
        "pill-cyan":   "#A5F3FC",   // cyan
        "pill-yellow": "#FDE68A",   // yellow
        "pill-amber":  "#FCD34D",   // amber connect wallet
        "pill-green":  "#BBF7D0",   // green
        // score / status colors
        "score-high":  "#4ADE80",   // green
        "score-mid":   "#FB923C",   // orange
        "score-low":   "#F87171",   // red
        "score-unk":   "#C084FC",   // purple
        ink:     "#0D1F0D",   // text / borders
      },
      fontFamily: {
        display: ["'Archivo Black'", "Impact", "sans-serif"],
        body:    ["'Barlow'", "system-ui", "sans-serif"],
        mono:    ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        "pill": "9999px",
        "card": "20px",
        "card-lg": "28px",
      },
      boxShadow: {
        "card":    "0 4px 0 0 #0D1F0D",
        "card-lg": "0 6px 0 0 #0D1F0D",
        "pill":    "0 3px 0 0 #0D1F0D",
        "btn":     "0 4px 0 0 #0D1F0D",
        "btn-sm":  "0 2px 0 0 #0D1F0D",
        "inset":   "inset 0 2px 0 0 rgba(255,255,255,0.15)",
      },
      keyframes: {
        "slide-up":  { from: { transform: "translateY(20px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        "pop":       { "0%": { transform: "scale(0.9)" }, "60%": { transform: "scale(1.05)" }, "100%": { transform: "scale(1)" } },
        "blink":     { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.3" } },
        "bar-grow":  { from: { width: "0%" }, to: { width: "var(--w)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "slide-up":  "slide-up 0.4s cubic-bezier(.22,1,.36,1)",
        "pop":       "pop 0.35s ease-out",
        "blink":     "blink 1.4s ease-in-out infinite",
        "bar-grow":  "bar-grow 1s ease-out forwards",
        "spin-slow": "spin-slow 2s linear infinite",
      },
      screens: {
        xs: "380px",
      },
    },
  },
  plugins: [],
} satisfies Config;
