import type { ReactNode } from "react";

type PageHeaderProps = {
  action?: ReactNode;
  description?: string;
  meta?: ReactNode;
  title: string;
};

export function PageHeader({
  action,
  description,
  meta,
  title,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[2rem] font-bold leading-tight text-foreground sm:text-[2.5rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-base leading-7 text-muted">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-3 text-sm text-muted">{meta}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}