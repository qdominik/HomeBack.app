import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

const dashboardSections = [
  t.dashboard.recentItems,
  t.dashboard.expiringItems,
  t.dashboard.categoryCount,
  t.dashboard.activity,
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { data: profile } = userId
    ? await supabase
        .from("profile")
        .select("imie")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  return (
    <ModulePage
      action={
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-strong"
          href={routes.items}
        >
          {t.dashboard.addItem}
        </Link>
      }
      title={t.dashboard.title}
    >
      <div className="mb-6 border-b border-line pb-5">
        <p className="text-sm text-muted">{t.dashboard.greeting}</p>
        <p className="mt-1 text-xl font-semibold text-foreground">
          {profile?.imie ?? ""}
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        {dashboardSections.map((section) => (
          <div className="rounded-md border border-line bg-surface p-4" key={section}>
            <h2 className="text-base font-semibold text-foreground">{section}</h2>
            <div className="mt-4">
              <EmptyState text={t.dashboard.empty} />
            </div>
          </div>
        ))}
      </section>
    </ModulePage>
  );
}
