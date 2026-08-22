import { ModuleComingSoon } from "@/components/module-coming-soon";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";

export default function FamilyPage() {
  return (
    <ModulePage title={t.modules.family.title}>
      <ModuleComingSoon description={t.modules.family.soonDescription} title={t.modules.family.title} />
    </ModulePage>
  );
}
