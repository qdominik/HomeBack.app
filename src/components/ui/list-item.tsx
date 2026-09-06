import type { LiHTMLAttributes } from "react";

export function ListItem({ className, ...props }: LiHTMLAttributes<HTMLLIElement>) {
  return (
    <li
      {...props}
      className={[
        "rounded-control border border-line bg-surface px-4 py-3 transition-colors hover:bg-surface-muted focus-within:border-primary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
