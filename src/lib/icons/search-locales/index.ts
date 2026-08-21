import type { IconSearchLocalePack } from "./types";

export type { IconSearchLocalePack, IconSearchTheme } from "./types";

const localeLoaders: Record<string, () => Promise<IconSearchLocalePack>> = {
  en: async () => (await import("./en")).enIconSearchLocale,
  pl: async () => (await import("./pl")).plIconSearchLocale,
};

export async function loadIconSearchLocale(locale: string): Promise<IconSearchLocalePack> {
  return (localeLoaders[locale] ?? localeLoaders.en)();
}
