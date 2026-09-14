import Link from "next/link";
import { DashboardModuleCard } from "@/components/dashboard-module-card";
import {
  dashboardModuleRegistrations,
} from "@/components/dashboard/module-runtime";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClassName } from "@/components/ui/button";
import { getAppContext } from "@/lib/app-context";
import { resolveVisibleDashboardModules } from "@/lib/dashboard/dashboard-preferences";
import { filterDashboardModulesForRole } from "@/lib/dashboard/module-access";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { uiTokens } from "@/lib/ui/tokens";
import { loadDashboardWidgets } from "./widgets";

export default async function DashboardPage() {
  const context = await getAppContext();
  const { profile, supabase, userId } = context;
  const greeting = profile?.imie
    ? `${t.dashboard.greeting}, ${profile.imie}`
    : t.app.tagline;

  let storedVisibleModules: string[] | null = null;

  if (userId && profile) {
    const { data: preferences } = await supabase
      .from("profile_dashboard_preferences")
      .select("visible_modules")
      .eq("profil_id", userId)
      .maybeSingle();

    storedVisibleModules = preferences?.visible_modules ?? null;
  }

  const visibleModules = filterDashboardModulesForRole(
    resolveVisibleDashboardModules(storedVisibleModules),
    profile?.rola ?? null,
  );

  const registrationsByKey = new Map(
    dashboardModuleRegistrations.map((registration) => [
      registration.definition.key,
      registration,
    ]),
  );

  const registrations = visibleModules.flatMap((definition) => {
    const registration = registrationsByKey.get(definition.key);

    return registration ? [{ definition, registration }] : [];
  });
  const widgetData = await loadDashboardWidgets(context);

  return (
    <div className="space-y-8">
      <PageHeader
        description={greeting}
        title={t.dashboard.title}
      />

      {registrations.length > 0 ? (
        <section
          aria-label={t.dashboard.title}
          className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2"
        >
          {registrations.map(({ definition, registration }) => (
            <DashboardModuleCard
              data={widgetData}
              key={definition.key}
              definition={definition}
              Render={registration.Render}
            />
          ))}
        </section>
      ) : (
        <section
          aria-label={t.dashboard.title}
          className="rounded-control border border-dashed border-line bg-surface px-6 py-10 text-center shadow-card"
        >
          <p className="text-base font-semibold text-foreground">
            {t.dashboard.allHidden}
          </p>
          <p className="mx-auto mt-2 max-w-prose text-sm leading-6 text-muted">
            {t.dashboard.allHiddenHint}
          </p>
          <Link
            className={`${buttonClassName({ variant: "secondary" })} ${uiTokens.focusRing} mt-5`}
            href={`${routes.settings}?tab=dashboard-personalization`}
          >
            {t.modules.settings.dashboardPersonalization}
          </Link>
        </section>
      )}
    </div>
  );
}
