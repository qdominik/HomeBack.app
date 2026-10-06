import type { ComponentPropsWithRef } from "react";

export function FormActions({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")} />;
}
