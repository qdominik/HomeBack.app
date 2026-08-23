import Link from "next/link";
import { DashboardModuleCard } from "@/components/dashboard-module-card";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClassName } from "@/components/ui/button";
import { getAppContext } from "@/lib/app-context";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { dashboardModuleDefinitions } from "@/lib/dashboard/module-registry";

export default async function DashboardPage() {
  const { profile } = await getAppContext();
  const greeting = profile?.imie
    ? `${t.dashboard.greeting}, ${profile.imie}`
    : t.app.tagline;

  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Link className={buttonClassName()} href={routes.items}>
            {t.dashboard.addItem}
          </Link>
        }
        description={greeting}
        title={t.dashboard.title}
      />

      <section aria-label={t.dashboard.title} className="grid gap-5 md:grid-cols-2">
        {dashboardModuleDefinitions
          .filter((module) => module.defaultVisible)
          .map((module) => (
            <DashboardModuleCard key={module.key} module={module} />
          ))}
      </section>
    </div>
  );
}
