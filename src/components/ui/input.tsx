import type { ComponentPropsWithRef } from "react";

export type InputProps = ComponentPropsWithRef<"input"> & {
  unstyled?: boolean;
};

export function Input({ className, unstyled = false, ...props }: InputProps) {
  const resolvedClassName = [unstyled ? null : "ui-control", className]
    .filter(Boolean)
    .join(" ");

  return (
    <input
      {...props}
      className={resolvedClassName || undefined}
    />
  );
}
