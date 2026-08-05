import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getAppContext } from "@/lib/app-context";
import { routes } from "@/lib/routes";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { household, profile, userId } = await getAppContext();

  if (!userId) {
    redirect(routes.login);
  }

  if (!profile) {
    redirect(`${routes.register}?step=household`);
  }

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
