"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClassName } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { appModuleDefinitions, type AppModuleKey } from "@/lib/modules/module-registry";
import type { Database } from "@/types/database";

const navigation = [
  { key: "dashboard", href: routes.dashboard, label: t.navigation.dashboard },
  { key: "items", href: routes.items, label: t.navigation.items },
  { key: "home", href: routes.home, label: t.navigation.home },
  { key: "family", href: routes.family, label: t.navigation.family },
  { key: "documents", href: routes.documents, label: t.navigation.documents },
  { key: "categories", href: routes.categories, label: t.navigation.categories },
  { key: "settings", href: routes.settings, label: t.navigation.settings },
];

const roleLabels: Record<
  Database["public"]["Enums"]["profile_role"],
  string
> = {
  admin: t.auth.roles.admin,
  domownik: t.auth.roles.member,
  dziecko: t.auth.roles.child,
  "go\u015b\u0107": t.auth.roles.guest,
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
      <header className="border-b border-line bg-surface shadow-card">
        <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-2 sm:gap-5">
            <Link
              aria-label={t.app.name}
              className="block shrink-0 p-1"
              href={routes.dashboard}
            >
              <BrandLogo
                className="w-52 sm:w-64"
                priority
                variant="horizontal"
              />
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden min-w-0 text-right md:block">
                <p className="truncate text-sm font-semibold text-foreground">
                  {userName}
                </p>
                <p className="truncate text-sm text-muted">
                  {householdName} {"\u00b7"} {roleLabels[role]}
                </p>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  className={buttonClassName({ variant: "secondary" })}
                  type="submit"
                >
                  {t.auth.signOut}
                </button>
              </form>
            </div>
          </div>
          <nav
            aria-label={t.navigation.main}
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-3"
          >
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const isSoon = appModuleDefinitions[item.key as AppModuleKey].status === "soon";

              return (
                isSoon ? (
                  <button
                    aria-disabled="true"
                    className="inline-flex min-h-11 shrink-0 cursor-not-allowed items-center gap-2 rounded-control border border-transparent px-3 py-2 text-sm font-semibold text-muted opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    key={item.href}
                    title={t.status.soonDescription}
                    type="button"
                  >
                    <span>{item.label}</span>
                    <span className="rounded-control bg-warning/15 px-1.5 py-0.5 text-[11px] font-bold text-foreground">
                      {t.status.soon}
                    </span>
                  </button>
                ) : (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`relative inline-flex min-h-11 shrink-0 items-center rounded-control border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none ${
                    isActive
                      ? "border-primary-hover bg-primary text-white shadow-card after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-white"
                      : "border-transparent text-muted hover:border-line hover:bg-surface-muted hover:text-foreground"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                    <span>{item.label}</span>
                  </Link>
                )
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}
