import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { t } from "@/lib/i18n";

type ModuleComingSoonProps = { title: string; description?: string };

export function ModuleComingSoon({ title, description }: ModuleComingSoonProps) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Badge tone="warning">{t.status.soon}</Badge>
      </div>
      <p className="mt-3 max-w-prose text-sm leading-6 text-muted">
        {description ?? t.status.soonDescription}
      </p>
    </Card>
  );
}
