import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { activeLocale, t } from "@/lib/i18n";
import type { DashboardModuleDefinition } from "@/lib/dashboard/module-registry";
import { uiTokens } from "@/lib/ui/tokens";

type DashboardModuleCardProps = {
  module: DashboardModuleDefinition;
};

export function DashboardModuleCard({ module }: DashboardModuleCardProps) {
  const isDisabled = module.status === "soon";

  return (
    <Card
      as="section"
      aria-disabled={isDisabled || undefined}
      className={`flex flex-col ${uiTokens.cardContent} ${
        isDisabled ? "bg-surface-muted/40" : "hover:border-primary/50"
      }`}
      data-module-status={module.status}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="text-base font-semibold text-foreground">
          {module.title[activeLocale]}
        </h2>
        {isDisabled ? <StatusBadge status="soon" /> : null}
      </div>
      <p className={`mt-2 ${uiTokens.mutedText}`}>
        {module.description?.[activeLocale]}
      </p>
      {isDisabled ? (
        <div className="mt-auto pt-4">
          <p className="rounded-control border border-dashed border-line bg-surface-muted/60 px-4 py-3 text-center text-sm font-medium text-muted">
            {t.status.soonDescription}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
