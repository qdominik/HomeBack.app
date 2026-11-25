import type { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "danger";

type AlertProps = {
  children: ReactNode;
  variant?: AlertVariant;
};

const alertClasses: Record<AlertVariant, string> = {
  info: "ui-status-info",
  success: "ui-status-success",
  warning: "ui-status-warning",
  danger: "ui-status-danger",
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
