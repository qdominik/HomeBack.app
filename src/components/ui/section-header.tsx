import type { ReactNode } from "react";

type SectionHeaderProps = {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
};

export function SectionHeader({
  action,
  children,
  description,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold leading-8 text-foreground">
          {children}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}