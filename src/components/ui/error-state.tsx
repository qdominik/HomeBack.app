import type { ReactNode } from "react";
import { stateVariants } from "@/lib/ui/variants";

type ErrorStateProps = {
  children: ReactNode;
  className?: string;
};

export function ErrorState({ children, className }: ErrorStateProps) {
  return (
    <div
      className={[`rounded-control border px-3 py-2 text-sm ${stateVariants.error}`, className]
        .filter(Boolean)
        .join(" ")}
      role="alert"
    >
      {children}
    </div>
  );
}
