import Link from "next/link";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { FlaskIcon } from "@phosphor-icons/react/dist/ssr/Flask";
import { ModulePage } from "@/components/module-page";
import { Alert } from "@/components/ui/alert";
import { t } from "@/lib/i18n";
import { isQaTestDataEnvironment } from "@/lib/settings/qa-test-data";
import { TestDataContent, TestDataGuard } from "@/app/(app)/settings/test-data-content";
import type { ReactNode } from "react";

type SettingsTab = "household" | "account" | "export" | "test-data";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
    tab?: string;
  }>;
};

function parseSettingsTab(raw: string | undefined): SettingsTab {
  if (raw === "account" || raw === "export" || raw === "test-data") {
    return raw;
  }
  return "household";
}

const tabs: { id: SettingsTab; label: string; href: string; icon: ReactNode }[] = [
  { id: "household", label: t.modules.settings.household, href: "/settings", icon: <HouseIcon aria-hidden="true" size={18} /> },
  { id: "account", label: t.modules.settings.account, href: "/settings?tab=account", icon: <UserIcon aria-hidden="true" size={18} /> },
  { id: "export", label: t.modules.settings.export, href: "/settings?tab=export", icon: <DownloadSimpleIcon aria-hidden="true" size={18} /> },
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

  const errorMessage = params.error
    ? (params.error === "action_failed"
        ? t.modules.settings.errors.actionFailed
        : params.error === "admin_required"
          ? t.modules.settings.errors.adminRequired
          : params.error === "production_only"
            ? t.modules.settings.errors.productionOnly
            : params.error === "invalid_dataset"
              ? t.modules.settings.errors.invalidDataset
              : null)
    : null;

  const statusMessage = params.status === "test_data_generated"
    ? t.modules.settings.feedback.generated
    : params.status === "test_data_failed"
      ? t.modules.settings.feedback.failed
      : null;

  return (
    <ModulePage title={t.modules.settings.title}>
      <nav
        aria-label="Zakładki ustawień"
        className="flex flex-wrap gap-2 border-b border-line pb-4"
      >
        {visibleTabs.map((tab) => (
          <Link
            className={`inline-flex items-center rounded-md border px-3 py-2 text-sm font-semibold ${
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
          <div className="rounded-md border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">{t.modules.settings.household}</h2>
          </div>
        ) : currentTab === "account" ? (
          <div className="rounded-md border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">{t.modules.settings.account}</h2>
          </div>
        ) : currentTab === "export" ? (
          <div className="rounded-md border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">{t.modules.settings.export}</h2>
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
