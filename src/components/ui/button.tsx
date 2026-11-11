import type { ComponentPropsWithRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonStyleOptions = {
  className?: string;
  size?: "default" | "icon";
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary:
    "border border-line bg-surface text-foreground hover:border-primary hover:bg-surface-muted",
  ghost: "text-primary hover:bg-primary/10 hover:text-primary-hover",
  danger: "bg-danger text-on-danger hover:bg-danger/90",
};

export function buttonClassName({
  className,
  size = "default",
  variant = "primary",
}: ButtonStyleOptions = {}) {
  return [
    "ui-button inline-flex min-h-11 items-center justify-center gap-2 rounded-control text-sm font-semibold transition-colors disabled:cursor-not-allowed",
    size === "icon" ? "ui-icon-action relative w-11 shrink-0" : "px-4 py-2",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ComponentPropsWithRef<"button"> & ButtonStyleOptions;

export function Button({
  className,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={buttonClassName({ className, size, variant })}
      type={type}
    />
  );
}
