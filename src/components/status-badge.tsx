import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import type { DashboardModuleStatus } from "@/lib/dashboard/module-registry";

type StatusBadgeProps = {
  status: DashboardModuleStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status !== "soon") {
    return null;
  }

  return (
    <Badge className="shrink-0" tone="warning">
      {t.status.soon}
    </Badge>
  );
}
