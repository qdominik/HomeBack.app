import type { ComponentPropsWithoutRef } from "react";

export type LoadingStateProps = ComponentPropsWithoutRef<"div">;

export function LoadingState({
  children,
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      {...props}
      aria-busy={props["aria-busy"] ?? true}
      aria-live={props["aria-live"] ?? "polite"}
      className={[
        "rounded-md border border-line bg-surface px-4 py-10 text-center text-sm text-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role={props.role ?? "status"}
    >
      {children}
    </div>
  );
}
