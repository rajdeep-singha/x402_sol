import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-display font-black uppercase text-sm tracking-wider text-nb-black"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "font-mono text-sm bg-white text-nb-black",
            "border-3 border-nb-black px-3 py-2.5",
            "shadow-nb-sm focus:shadow-nb",
            "outline-none focus:translate-x-[-2px] focus:translate-y-[-2px]",
            "transition-all duration-100",
            "placeholder:text-gray-400",
            error && "border-nb-red shadow-[4px_4px_0px_0px_#FF4D6D]",
            className,
          ].filter(Boolean).join(" ")}
          {...rest}
        />
        {error && (
          <p className="font-body text-xs text-nb-red font-semibold">{error}</p>
        )}
        {hint && !error && (
          <p className="font-body text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";