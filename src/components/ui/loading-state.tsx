import type { ReactNode } from "react";
import { stateVariants } from "@/lib/ui/variants";

type LoadingStateProps = {
  children: ReactNode;
  className?: string;
};

export function LoadingState({ children, className }: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className={[`rounded-control border px-4 py-10 text-center text-sm ${stateVariants.loading}`, className]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      {children}
    </div>
  );
}
