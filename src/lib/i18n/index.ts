import { en } from "./locales/en";
import { pl } from "./locales/pl";

export const activeLocale = "pl";
export const inactiveLocales = ["en"] as const;

export const dictionaries = {
  pl,
  en,
} as const;

export const t = dictionaries[activeLocale];
