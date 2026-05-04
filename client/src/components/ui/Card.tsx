import type { HTMLAttributes } from "react";

type Accent = "none" | "yellow" | "pink" | "cyan" | "lime";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
  hover?: boolean;
}

const accentClasses: Record<Accent, string> = {
  none:   "shadow-nb",
  yellow: "shadow-nb-yellow",
  pink:   "shadow-nb-pink",
  cyan:   "shadow-nb-cyan",
  lime:   "shadow-[4px_4px_0px_0px_#BEFF54]",
};

export function Card({ accent = "none", hover = false, className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={[
        "bg-white border-3 border-nb-black",
        accentClasses[accent],
        hover && "transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-nb-sm",
        className,
      ].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}