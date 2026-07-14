import type { ReactNode } from "react";

type EmptyStateProps = {
  action?: ReactNode;
  description?: string;
  icon?: ReactNode;
  text?: string;
  title?: string;
};

export function EmptyState({
  action,
  description,
  icon,
  text,
  title,
}: EmptyStateProps) {
  return (
    <div className="rounded-control border border-dashed border-line bg-surface-muted px-5 py-10 text-center">
      {icon ? (
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      ) : null}
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