import type { ComponentPropsWithRef } from "react";

export type SelectProps = ComponentPropsWithRef<"select"> & {
  unstyled?: boolean;
};

export function Select({ className, unstyled = false, ...props }: SelectProps) {
  const resolvedClassName = [unstyled ? null : "ui-control", className]
    .filter(Boolean)
    .join(" ");

  return (
    <select
      {...props}
      className={resolvedClassName || undefined}
    />
  );
}
