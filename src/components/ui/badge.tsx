import type { ReactNode } from "react";

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted",
  primary: "bg-primary/10 text-primary-hover",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-foreground",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-control px-2 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}