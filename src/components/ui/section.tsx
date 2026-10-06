import type { ComponentPropsWithRef } from "react";

export function Section({ className, ...props }: ComponentPropsWithRef<"section">) {
  return <section {...props} className={["min-w-0 rounded-md border border-line bg-surface p-4 shadow-card sm:p-5", className].filter(Boolean).join(" ")} />;
}
