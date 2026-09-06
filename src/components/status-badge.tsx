import { t } from "@/lib/i18n";
import type { DashboardModuleStatus } from "@/lib/dashboard/module-registry";

type StatusBadgeProps = {
  className?: string;
  status: DashboardModuleStatus;
};

const statusStyles: Record<DashboardModuleStatus, string | null> = {
  available: null,
  soon: "border-warning/40 bg-warning/10 text-foreground",
};

export function StatusBadge({ className, status }: StatusBadgeProps) {
  const styles = statusStyles[status];

  if (status !== "soon" || styles === null) {
    return null;
  }

  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-pill border px-2.5 text-xs font-semibold ${styles} ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-warning"
      />
      {t.status.soon}
    </span>
  );
}
