import { HTMLAttributes } from "react";

type Surface = "white" | "dark" | "lime" | "cream";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: Surface;
  hover?: boolean;
  size?: "md" | "lg";
}

const surfaceMap: Record<Surface, string> = {
  white: "bg-white text-ink",
  dark:  "bg-forest text-lime",
  lime:  "bg-lime text-ink",
  cream: "bg-cream text-ink",
};

export function Card({ surface = "white", hover, size = "md", className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={[
        surfaceMap[surface],
        size === "lg" ? "rounded-card-lg shadow-card-lg" : "rounded-card shadow-card",
        "border-2 border-ink",
        hover && "transition-all duration-150 hover:translate-y-[2px] hover:shadow-btn-sm cursor-pointer",
        className,
      ].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
