"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import type { Database } from "@/types/database";

const navigation = [
  { href: routes.dashboard, label: t.navigation.dashboard },
  { href: routes.items, label: t.navigation.items },
  { href: routes.home, label: t.navigation.home },
  { href: routes.family, label: t.navigation.family },
  { href: routes.documents, label: t.navigation.documents },
  { href: routes.categories, label: t.navigation.categories },
  { href: routes.settings, label: t.navigation.settings },
];

const roleLabels: Record<
  Database["public"]["Enums"]["profile_role"],
  string
> = {
  admin: t.auth.roles.admin,
  domownik: t.auth.roles.member,
  dziecko: t.auth.roles.child,
  gość: t.auth.roles.guest,
};

type AppShellProps = {
  children: ReactNode;
  householdName: string;
  role: Database["public"]["Enums"]["profile_role"];
  userName: string;
};

export function AppShell({
  children,
  householdName,
  role,
  userName,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              aria-label={t.app.name}
              className="block w-[150px] shrink-0 sm:w-[220px]"
              href={routes.dashboard}
            >
              <span className="sm:hidden">
                <BrandLogo className="w-11" variant="icon" />
              </span>
              <span className="hidden sm:block">
                <BrandLogo className="w-full" variant="horizontal" />
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted">
                  {householdName} · {roleLabels[role]}
                </p>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  className="h-9 rounded-md border border-line px-3 text-sm font-semibold text-foreground hover:bg-surface-muted"
                  type="submit"
                >
                  {t.auth.signOut}
                </button>
              </form>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Glowne">
            {navigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-surface-muted hover:text-foreground"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
