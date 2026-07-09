import type { ReactNode } from "react";

type ModulePageProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

export function ModulePage({ title, action, children }: ModulePageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-normal text-foreground">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  );
}
