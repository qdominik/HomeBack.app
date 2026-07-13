import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonStyleOptions = {
  className?: string;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary:
    "border border-line bg-surface text-foreground hover:border-primary hover:bg-surface-muted",
  ghost: "text-primary hover:bg-primary/10 hover:text-primary-hover",
  danger: "bg-danger text-white hover:bg-danger/90",
};

export function buttonClassName({
  className,
  variant = "primary",
}: ButtonStyleOptions = {}) {
  return [
    "inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none disabled:cursor-not-allowed",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleOptions;

export function Button({
  className,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={buttonClassName({ className, variant })}
      type={type}
    />
  );
}