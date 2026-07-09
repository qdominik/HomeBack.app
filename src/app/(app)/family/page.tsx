import { EmptyState } from "@/components/empty-state";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";

export default function FamilyPage() {
  return (
    <ModulePage
      action={
        <button className="h-10 rounded-md border border-line bg-surface px-4 text-sm font-semibold text-primary-strong">
          {t.modules.family.invite}
        </button>
      }
      title={t.modules.family.title}
    >
      <section className="rounded-md border border-line bg-surface p-4">
        <h2 className="text-base font-semibold">{t.modules.family.members}</h2>
        <div className="mt-4">
          <EmptyState text={t.modules.family.empty} />
        </div>
      </section>
    </ModulePage>
  );
}
