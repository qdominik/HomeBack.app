import type { ButtonHTMLAttributes } from "react";
import { buttonVariants } from "@/lib/ui/variants";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonStyleOptions = {
  className?: string;
  variant?: ButtonVariant;
};

export function buttonClassName({
  className,
  variant = "primary",
}: ButtonStyleOptions = {}) {
  return [
    "inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none disabled:cursor-not-allowed",
    buttonVariants[variant],
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
