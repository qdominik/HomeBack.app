import { ModuleComingSoon } from "@/components/module-coming-soon";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";

export default function DocumentsPage() {
  return (
    <ModulePage title={t.modules.documents.title}>
      <ModuleComingSoon description={t.modules.documents.soonDescription} title={t.modules.documents.title} />
    </ModulePage>
  );
}
