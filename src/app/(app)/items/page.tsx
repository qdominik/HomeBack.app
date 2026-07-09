import { EmptyState } from "@/components/empty-state";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";

export default function ItemsPage() {
  return (
    <ModulePage title={t.modules.items.title}>
      <div className="grid gap-3 rounded-md border border-line bg-surface p-4 md:grid-cols-[1fr_180px_180px]">
        <input
          aria-label={t.modules.items.search}
          className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-primary"
          placeholder={t.modules.items.search}
          type="search"
        />
        <select
          aria-label={t.modules.items.category}
          className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-primary"
        >
          <option>{t.modules.items.category}</option>
        </select>
        <select
          aria-label={t.modules.items.room}
          className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-primary"
        >
          <option>{t.modules.items.room}</option>
        </select>
      </div>
      <EmptyState text={t.modules.items.empty} />
    </ModulePage>
  );
}
