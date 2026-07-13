import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonClassName } from "@/components/ui/button";
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
        {dashboardSections.map((section) => (
          <Card as="section" className="p-5 sm:p-6" key={section}>
            <SectionHeader>{section}</SectionHeader>
            <div className="mt-5">
              <EmptyState text={t.dashboard.empty} />
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}