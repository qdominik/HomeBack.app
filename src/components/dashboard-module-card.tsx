import { Card } from "@/components/ui/card";
import {
  DashboardModuleIcon,
  type DashboardModuleRenderer,
} from "@/components/dashboard/module-runtime";
import { StatusBadge } from "@/components/status-badge";
import { t } from "@/lib/i18n";
import type { DashboardModuleDefinition } from "@/lib/dashboard/module-registry";
import { uiTokens } from "@/lib/ui/tokens";

type DashboardModuleCardProps = {
  definition: DashboardModuleDefinition;
  Render: DashboardModuleRenderer;
};

export function DashboardModuleCard({
  definition,
  Render,
}: DashboardModuleCardProps) {
  const isDisabled = definition.status === "soon";
  const copy = t.dashboardModules[definition.titleKey];

  return (
    <Card
      as="section"
      aria-disabled={isDisabled || undefined}
      className={`flex flex-col ${uiTokens.cardContent} ${
        isDisabled ? "bg-surface-muted/40" : "hover:border-primary/50"
      }`}
      data-module-status={definition.status}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
          <DashboardModuleIcon definition={definition} />
          {copy.title}
        </h2>
        {isDisabled ? <StatusBadge status={definition.status} /> : null}
      </div>
      <p className={`mt-2 ${uiTokens.mutedText}`}>
        {t.dashboardModules[definition.descriptionKey].description}
      </p>
      <Render definition={definition} />
    </Card>
  );
}
