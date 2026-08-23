"use client";

import { useFormStatus } from "react-dom";
import { saveDashboardPreferences } from "@/app/(app)/settings/actions";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/ui/alert";
import { buttonClassName } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export type PersonalizableModule = {
  key: string;
  title: string;
  description: string;
  soon: boolean;
};

type DashboardPersonalizationContentProps = {
  modules: PersonalizableModule[];
  initiallyVisibleKeys: string[];
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={buttonClassName({ variant: "primary" })}
      disabled={pending}
      type="submit"
    >
      {pending
        ? t.modules.settings.dashboardPersonalizationSaving
        : t.modules.settings.dashboardPersonalizationSave}
    </button>
  );
}

const moduleToggleClassName =
  "mt-0.5 h-6 w-10 shrink-0 cursor-pointer appearance-none rounded-full border border-line bg-line transition-colors " +
  "before:absolute before:left-0.5 before:top-1/2 before:h-5 before:w-5 before:-translate-y-1/2 " +
  "before:rounded-full before:bg-white before:shadow before:transition-transform before:content-[''] " +
  "checked:border-primary checked:bg-primary checked:before:translate-x-4 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

export function DashboardPersonalizationContent({
  modules,
  initiallyVisibleKeys,
}: DashboardPersonalizationContentProps) {
  return (
    <div className="space-y-4">
      <Alert variant="info">
        {t.modules.settings.dashboardPersonalizationScopeHint}
      </Alert>
      <form action={saveDashboardPreferences}>
        <ul className="divide-y divide-line rounded-md border border-line bg-surface">
          {modules.map((module) => (
            <li key={module.key}>
              <label className="flex cursor-pointer items-start justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {module.title}
                    </span>
                    {module.soon ? <StatusBadge status="soon" /> : null}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    {module.description}
                  </span>
                </span>
                <span className="relative inline-flex">
                  <input
                    aria-label={module.title}
                    className={`relative ${moduleToggleClassName}`}
                    defaultChecked={initiallyVisibleKeys.includes(module.key)}
                    name="modules"
                    type="checkbox"
                    value={module.key}
                  />
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <SaveButton />
        </div>
      </form>
    </div>
  );
}
