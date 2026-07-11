import { t } from "@/lib/i18n";

export default function ItemsLoading() {
  return (
    <div
      aria-live="polite"
      className="rounded-md border border-line bg-surface px-4 py-10 text-center text-sm text-muted"
    >
      {t.modules.items.loading}
    </div>
  );
}
