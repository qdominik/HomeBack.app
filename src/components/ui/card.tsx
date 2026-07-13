import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
};

export function Card({ as: Component = "div", className, ...props }: CardProps) {
  return (
    <Component
      {...props}
      className={[
        "rounded-control border border-line bg-surface shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}