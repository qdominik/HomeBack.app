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
      className={`transition-colors ${
        isDisabled ? "bg-surface-muted/60" : "hover:border-primary/50"
      } ${uiTokens.cardContent}`}
      data-module-status={module.status}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          {module.title[activeLocale]}
        </h2>
        {isDisabled ? <StatusBadge status="soon" /> : null}
      </div>
      <p className={`mt-5 ${uiTokens.mutedText}`}>
        {module.description?.[activeLocale]}
      </p>
      {isDisabled ? (
        <p className="mt-3 text-xs font-medium text-muted">
          {t.status.soonDescription}
        </p>
      ) : null}
    </Card>
  );
}
