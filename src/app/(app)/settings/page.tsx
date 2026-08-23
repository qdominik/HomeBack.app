import Link from "next/link";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { FlaskIcon } from "@phosphor-icons/react/dist/ssr/Flask";
import { GearSixIcon } from "@phosphor-icons/react/dist/ssr/GearSix";
import { ModulePage } from "@/components/module-page";
import { Alert } from "@/components/ui/alert";
import {
  resolveVisibleDashboardModules,
} from "@/lib/dashboard/dashboard-preferences";
import { dashboardModuleDefinitions } from "@/lib/dashboard/module-registry";
import { getAppContext } from "@/lib/app-context";
import { t } from "@/lib/i18n";
import { isQaTestDataEnvironment } from "@/lib/settings/qa-test-data";
import { TestDataContent, TestDataGuard } from "@/app/(app)/settings/test-data-content";
import {
  DashboardPersonalizationContent,
} from "@/app/(app)/settings/dashboard-personalization-content";
import type { ReactNode } from "react";

type SettingsTab =
  | "household"
  | "account"
  | "export"
  | "dashboard-personalization"
  | "test-data";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
    tab?: string;
  }>;
};

function parseSettingsTab(raw: string | undefined): SettingsTab {
  if (
    raw === "account" ||
    raw === "export" ||
    raw === "dashboard-personalization" ||
    raw === "test-data"
  ) {
    return raw;
  }
  return "household";
}

const tabs: { id: SettingsTab; label: string; href: string; icon: ReactNode }[] = [
  { id: "household", label: t.modules.settings.household, href: "/settings", icon: <HouseIcon aria-hidden="true" size={18} /> },
  { id: "account", label: t.modules.settings.account, href: "/settings?tab=account", icon: <UserIcon aria-hidden="true" size={18} /> },
  { id: "export", label: t.modules.settings.export, href: "/settings?tab=export", icon: <DownloadSimpleIcon aria-hidden="true" size={18} /> },
  { id: "dashboard-personalization", label: t.modules.settings.dashboardPersonalization, href: "/settings?tab=dashboard-personalization", icon: <GearSixIcon aria-hidden="true" size={18} /> },
  { id: "test-data", label: t.modules.settings.testData, href: "/settings?tab=test-data", icon: <FlaskIcon aria-hidden="true" size={18} /> },
];

function parseEnvGuard() {
  return isQaTestDataEnvironment({
    nodeEnv: process.env.NODE_ENV,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    vercelEnv: process.env.VERCEL_ENV,
  });
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const currentTab = parseSettingsTab(params.tab);
  const isDevEnv = parseEnvGuard();
  const visibleTabs = tabs.filter(
    (tab) => tab.id !== "test-data" || isDevEnv,
  );

  let dashboardPersonalizationContent: ReactNode = null;

  if (currentTab === "dashboard-personalization") {
    const { profile, supabase, userId } = await getAppContext();

    let storedVisibleModules: string[] | null = null;

    if (userId && profile) {
      const { data: preferences } = await supabase
        .from("profile_dashboard_preferences")
        .select("visible_modules")
        .eq("profil_id", userId)
        .maybeSingle();

      storedVisibleModules = preferences?.visible_modules ?? null;
    }

    dashboardPersonalizationContent = (
      <DashboardPersonalizationContent
        modules={dashboardModuleDefinitions.map((definition) => ({
          key: definition.key,
          title: t.dashboardModules[definition.titleKey].title,
          description:
            t.dashboardModules[definition.descriptionKey].description,
          soon: definition.status === "soon",
        }))}
        initiallyVisibleKeys={resolveVisibleDashboardModules(
          storedVisibleModules,
        ).map((module) => module.key)}
      />
    );
  }

  const errorMessage = params.error
    ? (params.error === "action_failed"
        ? t.modules.settings.errors.actionFailed
        : params.error === "admin_required"
          ? t.modules.settings.errors.adminRequired
          : params.error === "production_only"
            ? t.modules.settings.errors.productionOnly
            : params.error === "invalid_dataset"
              ? t.modules.settings.errors.invalidDataset
              : params.error === "dashboard_invalid_payload"
                ? t.modules.settings.errors.dashboardInvalidPayload
                : params.error === "dashboard_save_failed"
                  ? t.modules.settings.errors.dashboardSaveFailed
                  : null)
    : null;

  const statusMessage = params.status === "test_data_generated"
    ? t.modules.settings.feedback.generated
    : params.status === "test_data_failed"
      ? t.modules.settings.feedback.failed
      : params.status === "dashboard_preferences_saved"
        ? t.modules.settings.feedback.dashboardSaved
        : null;

  return (
    <ModulePage title={t.modules.settings.title}>
      <nav
        aria-label="Zakładki ustawień"
        className="flex flex-wrap gap-2 border-b border-line pb-4"
      >
        {visibleTabs.map((tab) => (
          <Link
            className={`inline-flex items-center rounded-control border px-3 py-2 text-sm font-semibold ${
              currentTab === tab.id
                ? "border-primary bg-primary text-white"
                : "border-line bg-surface text-primary-strong hover:border-primary/60"
            }`}
            href={tab.href}
            key={tab.id}
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
          </Link>
        ))}
      </nav>

      {errorMessage ? (
        <Alert variant="danger">{errorMessage}</Alert>
      ) : null}
      {statusMessage ? (
        <Alert variant="success">{statusMessage}</Alert>
      ) : null}

      <section className="mt-6">
        {currentTab === "household" ? (
          <div className="rounded-control border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">{t.modules.settings.household}</h2>
          </div>
        ) : currentTab === "account" ? (
          <div className="rounded-control border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">{t.modules.settings.account}</h2>
          </div>
        ) : currentTab === "export" ? (
          <div className="rounded-control border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">{t.modules.settings.export}</h2>
          </div>
        ) : currentTab === "dashboard-personalization" ? (
          <div className="space-y-4">
            <p className="max-w-prose text-sm leading-6 text-muted">
              {t.modules.settings.dashboardPersonalizationDescription}
            </p>
            {dashboardPersonalizationContent}
          </div>
        ) : currentTab === "test-data" ? (
          isDevEnv ? (
            <TestDataContent />
          ) : (
            <TestDataGuard>{t.modules.settings.envGuard}</TestDataGuard>
          )
        ) : null}
      </section>
    </ModulePage>
  );
}
