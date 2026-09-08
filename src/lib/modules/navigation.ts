import type { AppModuleKey } from "./module-registry";

export const navigationKeys: AppModuleKey[] = ["dashboard", "items", "home", "family", "documents", "categories", "settings"];

export function isNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
