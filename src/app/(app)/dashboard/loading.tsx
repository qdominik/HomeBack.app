import { t } from "@/lib/i18n";

const loadingModules = ["recent-items", "category-count", "rooms"] as const;

export default function DashboardLoading() {
  return (
    <div aria-live="polite" className="space-y-8">
      <div className="h-20 animate-pulse rounded-control bg-surface-muted" />
      <section className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {loadingModules.map((module) => (
          <div
            className="min-h-44 animate-pulse rounded-control border border-line bg-surface p-5 shadow-card"
            data-dashboard-module={module}
            key={module}
          >
            <p className="text-sm text-muted" role="status">
              {t.modules.items.loading}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
