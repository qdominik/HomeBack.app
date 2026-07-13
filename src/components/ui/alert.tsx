import type { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "danger";

type AlertProps = {
  children: ReactNode;
  variant?: AlertVariant;
};

const alertClasses: Record<AlertVariant, string> = {
  info: "border-info/40 bg-info/10 text-foreground",
  success: "border-success/40 bg-success/10 text-foreground",
  warning: "border-warning/50 bg-warning/10 text-foreground",
  danger: "border-danger/40 bg-danger/10 text-foreground",
};

export function Alert({ children, variant = "info" }: AlertProps) {
  return (
    <div
      className={`rounded-control border px-4 py-3 text-sm leading-6 ${alertClasses[variant]}`}
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}