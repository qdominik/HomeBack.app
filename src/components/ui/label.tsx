import type { ComponentPropsWithRef } from "react";

export function Label({ className, ...props }: ComponentPropsWithRef<"label">) {
  return <label {...props} className={["ui-label", className].filter(Boolean).join(" ")} />;
}
