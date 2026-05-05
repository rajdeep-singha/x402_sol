import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  dark?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, dark, id, className = "", ...rest }, ref) => {
    const uid = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={uid} className={["font-display font-black text-xs uppercase tracking-widest", dark ? "text-lime/70" : "text-ink/60"].join(" ")}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={uid}
          className={[
            "font-mono text-sm w-full px-4 py-3 rounded-card border-2 outline-none transition-all duration-150",
            dark
              ? "bg-forest-mid text-lime placeholder:text-lime/30 border-lime/20 focus:border-lime/60"
              : "bg-white text-ink placeholder:text-ink/30 border-ink/30 focus:border-ink focus:shadow-card",
            error && "border-score-low",
            className,
          ].filter(Boolean).join(" ")}
          {...rest}
        />
        {error && <p className="text-score-low text-xs font-semibold font-body">{error}</p>}
        {hint && !error && <p className="text-ink/40 text-xs font-body">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
