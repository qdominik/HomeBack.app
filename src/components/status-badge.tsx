import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";

type StatusBadgeProps = {
  status: "soon";
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status !== "soon") {
    return null;
  }

  return <Badge tone="warning">{t.status.soon}</Badge>;
}
