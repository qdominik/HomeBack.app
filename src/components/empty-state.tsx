import type { ReactNode } from "react";

type EmptyStateProps = {
  action?: ReactNode;
  description?: string;
  text?: string;
  title?: string;
};

export function EmptyState({
  action,
  description,
  text,
  title,
}: EmptyStateProps) {
  return (
    <div className="rounded-control border border-dashed border-line bg-surface-muted px-5 py-10 text-center">
      {title ? (
        <p className="text-base font-semibold text-foreground">{title}</p>
      ) : null}
      {text || description ? (
        <p className="mx-auto max-w-md text-sm leading-6 text-muted">
          {text ?? description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}