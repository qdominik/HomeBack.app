import { EmptyState } from "@/components/empty-state";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";

export default function ItemsPage() {
  return (
    <ModulePage title={t.modules.items.title}>
      <EmptyState text={t.modules.items.empty} />
    </ModulePage>
  );
}
