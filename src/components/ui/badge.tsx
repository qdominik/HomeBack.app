import type { ComponentPropsWithRef } from "react";

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

type BadgeProps = ComponentPropsWithRef<"span"> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted",
  primary: "bg-primary/[var(--primary-tint)] text-primary-hover",
  success: "ui-status-success",
  warning: "ui-status-warning",
  danger: "ui-status-danger",
  info: "ui-status-info",
};

export function Badge({ children, className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={[`inline-flex min-h-7 items-center rounded-control px-2 text-xs font-semibold ${toneClasses[tone]}`, className].filter(Boolean).join(" ")}
    >
      {children}
    </span>
  );
}
