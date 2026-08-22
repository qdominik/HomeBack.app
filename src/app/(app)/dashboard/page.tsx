import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClassName } from "@/components/ui/button";
import { getAppContext } from "@/lib/app-context";
import { t } from "@/lib/i18n";
import { activeLocale } from "@/lib/i18n";
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
        {dashboardModuleDefinitions.filter((module) => module.defaultVisible).map((module) => (
          <Card as="section" className="p-5 sm:p-6" key={module.key}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">{module.title[activeLocale]}</h2>
              {module.status === "soon" ? <Badge tone="warning">{t.status.soon}</Badge> : null}
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">{module.description?.[activeLocale]}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
