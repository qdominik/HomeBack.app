"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ItemCreateDialog } from "@/components/items/item-create-dialog";
import type { ItemCreateOptions } from "@/lib/server/item-create-options";
import { ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { GlobalSearch } from "@/components/dashboard/item-search";
import { BrandLogo } from "@/components/brand-logo";
import { StatusBadge } from "@/components/status-badge";
import { buttonClassName } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { appModuleDefinitions } from "@/lib/modules/module-registry";
import { navigationKeys, isNavigationActive } from "@/lib/modules/navigation";
import type { ProfileRole } from "@/lib/auth/profile-role";


const iconButton = "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const roleLabels = {
  admin: t.auth.roles.admin,
  dorosły: t.auth.roles.member,
  domownik: t.auth.roles.member,
  dziecko: t.auth.roles.child,
  "gość": t.auth.roles.guest,
};
type AppShellProps = {
  children: ReactNode;
  householdName: string;
  role: ProfileRole;
  userName: string;
  itemCreateOptions: ItemCreateOptions | null;
};

export function AppHeader({ authenticated = false, account }: { authenticated?: boolean; account?: Omit<AppShellProps, "children"> }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRoot = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const searchBackdropPress = useRef(false);

  useEffect(() => {
    if (!menuOpen) return;
    function outside(event: PointerEvent) {
      if (!menuRoot.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuTrigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);

  return <>
    <header className="relative z-20 border-b border-line bg-surface shadow-card">
      <div className="mx-auto flex h-24 w-full max-w-content sm:h-28 items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link aria-label={t.app.name} className="block min-w-0 p-1 focus-visible:outline-2 focus-visible:outline-primary" href={routes.dashboard} onClick={() => setMenuOpen(false)}>
          <BrandLogo className="w-52 max-w-full sm:w-64" priority variant="horizontal" />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          {account?.itemCreateOptions ? <ItemCreateDialog options={account.itemCreateOptions} /> : null}
          <button aria-label={t.globalSearch.title} aria-haspopup="dialog" aria-controls="global-search-dialog" className={`${iconButton} hover:bg-surface-muted`} ref={searchTrigger} type="button" onClick={() => {
            setMenuOpen(false);
            searchDialog.current?.showModal();
            searchDialog.current?.querySelector("input")?.focus();
          }}>
            <MagnifyingGlassIcon aria-hidden="true" size={22} weight="bold" />
          </button>
          <div ref={menuRoot} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
          }}>
            <button aria-label={menuOpen ? t.navigation.closeMenu : t.navigation.openMenu} aria-expanded={menuOpen} aria-controls="main-navigation" className={`${iconButton} ${menuOpen ? "border-primary bg-primary text-white hover:bg-primary-hover" : "hover:bg-surface-muted"}`} ref={menuTrigger} type="button" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <XIcon aria-hidden="true" size={22} weight="bold" /> : <ListIcon aria-hidden="true" size={22} weight="bold" />}
            </button>
            <nav aria-label={t.navigation.main} id="main-navigation" hidden={!menuOpen} className="absolute right-4 top-full mt-2 max-h-[calc(100dvh-7rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-control border border-line bg-surface p-2 shadow-card sm:right-6 lg:right-8">
              {account ? <div className="mb-2 break-words border-b border-line px-3 py-2 text-sm">
                <p className="font-semibold">{account.userName}</p>
                <p className="text-muted">{account.householdName} · {roleLabels[account.role]}</p>
              </div> : null}
              {navigationKeys.map((key) => {
                const href = routes[key];
                const active = isNavigationActive(pathname, href);
                const row = "flex min-h-11 w-full items-center gap-2 rounded-control border px-3 py-2 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary";
                return appModuleDefinitions[key].status === "soon" ?
                  <button aria-disabled="true" className={`${row} cursor-not-allowed border-transparent text-muted`} key={key} title={t.status.soonDescription} type="button">
                    <span>{t.navigation[key]}</span><StatusBadge status="soon" />
                  </button> :
                  <Link aria-current={active ? "page" : undefined} className={`${row} ${active ? "border-primary-hover bg-primary text-white" : "border-transparent text-muted hover:bg-surface-muted hover:text-foreground"}`} href={href} key={key} onClick={() => setMenuOpen(false)}>{t.navigation[key]}</Link>;
              })}
              <div className="mt-2 border-t border-line pt-2">
                {authenticated ? <form action="/auth/signout" method="post" onSubmit={() => setMenuOpen(false)}>
                  <button className={`${buttonClassName({ variant: "secondary" })} min-h-11 w-full`} type="submit">{t.auth.signOut}</button>
                </form> : <Link className={`${buttonClassName({ variant: "secondary" })} min-h-11 w-full`} href={routes.login} onClick={() => setMenuOpen(false)}>{t.auth.signIn}</Link>}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
    <dialog
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        searchBackdropPress.current = event.target === event.currentTarget &&
          (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
      }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        if (searchBackdropPress.current && event.target === event.currentTarget &&
          (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) {
          searchDialog.current?.close();
        }
        searchBackdropPress.current = false;
      }}
      aria-label={t.globalSearch.title} id="global-search-dialog" className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-control border border-line bg-surface p-3 text-foreground shadow-card backdrop:bg-black/40 sm:p-5" onClose={() => searchTrigger.current?.focus()} ref={searchDialog}>
      <div className="mb-3 flex justify-end gap-2">
        <button className={buttonClassName({ variant: "secondary" })} onClick={() => searchDialog.current?.close()} type="button">{t.globalSearch.close}</button>
        <button aria-label={t.globalSearch.close} className={`${iconButton} hover:bg-surface-muted`} onClick={() => searchDialog.current?.close()} type="button"><XIcon aria-hidden="true" size={22} /></button>
      </div>
      <GlobalSearch onNavigate={() => searchDialog.current?.close()} />
    </dialog>
  </>;
}

export function AppShell({ children, ...account }: AppShellProps) {
  return <div className="min-h-dvh bg-background text-foreground">
    <AppHeader authenticated account={account} />
    <main className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>
  </div>;
}
