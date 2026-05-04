import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:   "bg-nb-yellow text-nb-black hover:bg-yellow-300",
  secondary: "bg-nb-cyan   text-nb-black hover:bg-cyan-300",
  danger:    "bg-nb-red    text-white     hover:bg-red-500",
  ghost:     "bg-white     text-nb-black hover:bg-nb-gray",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, className = "", ...rest }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "font-display font-black uppercase tracking-wide",
          "border-3 border-nb-black",
          "shadow-nb transition-all duration-100",
          "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
          "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-nb-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-nb",
          "select-none cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...rest}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-3 border-nb-black border-t-transparent rounded-full animate-spin" />
            {children}
          </span>
        ) : children}
      </button>
    );
  }
);

Button.displayName = "Button";