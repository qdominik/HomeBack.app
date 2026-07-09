import { EmptyState } from "@/components/empty-state";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";

const systemCategories = [
  "Leki",
  "Żywność",
  "Dokumenty",
  "Ubrania zimowe",
  "Elektronika",
  "Narzędzia",
  "Książki",
  "Części zapasowe",
];

export default function CategoriesPage() {
  return (
    <ModulePage title={t.modules.categories.title}>
      <section className="rounded-md border border-line bg-surface p-4">
        <h2 className="text-base font-semibold">{t.modules.categories.system}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {systemCategories.map((category) => (
            <span
              className="rounded-md border border-line bg-surface-muted px-3 py-2 text-sm text-foreground"
              key={category}
            >
              {category}
            </span>
          ))}
        </div>
      </section>
      <section className="rounded-md border border-line bg-surface p-4">
        <h2 className="text-base font-semibold">{t.modules.categories.custom}</h2>
        <div className="mt-4">
          <EmptyState text={t.modules.categories.empty} />
        </div>
      </section>
    </ModulePage>
  );
}
