import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "amber" | "pink" | "cyan" | "ghost" | "dark";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  pill?: boolean;
}

const variantMap: Record<Variant, string> = {
  primary: "bg-lime-light text-ink hover:bg-lime",
  amber:   "bg-pill-amber text-ink hover:bg-yellow-300",
  pink:    "bg-pill-pink  text-ink hover:bg-pink-300",
  cyan:    "bg-pill-cyan  text-ink hover:bg-cyan-200",
  dark:    "bg-forest text-lime text-opacity-90 hover:bg-forest-mid border-lime/40",
  ghost:   "bg-white/80 text-ink hover:bg-white",
};

const sizeMap: Record<Size, string> = {
  sm: "px-4 py-1.5 text-xs",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3   text-base",
  xl: "px-10 py-4  text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, pill = true, className = "", children, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "btn-primary inline-flex items-center justify-center gap-2 font-display font-black uppercase tracking-wider",
        pill ? "rounded-pill" : "rounded-card",
        "border-2 border-ink shadow-btn",
        variantMap[variant],
        sizeMap[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
