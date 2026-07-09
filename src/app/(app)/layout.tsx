import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect(routes.login);
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("household_id, imie, rola")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    redirect(`${routes.register}?step=household`);
  }

  const { data: household } = await supabase
    .from("household")
    .select("nazwa")
    .eq("id", profile.household_id)
    .single();

  if (!household) {
    redirect(`${routes.register}?error=household_failed`);
  }

  return (
    <AppShell
      householdName={household.nazwa}
      role={profile.rola}
      userName={profile.imie}
    >
      {children}
    </AppShell>
  );
}
