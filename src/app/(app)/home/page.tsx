import { EmptyState } from "@/components/empty-state";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";

export default function HomeStructurePage() {
  return (
    <ModulePage title={t.modules.home.title}>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-line bg-surface p-4">
          <h2 className="text-base font-semibold">{t.modules.home.rooms}</h2>
          <div className="mt-4">
            <EmptyState text={t.modules.home.empty} />
          </div>
        </section>
        <section className="rounded-md border border-line bg-surface p-4">
          <h2 className="text-base font-semibold">{t.modules.home.locations}</h2>
          <div className="mt-4">
            <EmptyState text={t.modules.home.empty} />
          </div>
        </section>
      </div>
    </ModulePage>
  );
}
