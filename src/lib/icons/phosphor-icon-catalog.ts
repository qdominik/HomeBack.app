import type { PhosphorIconManifestEntry } from "./phosphor-icon-registry";
import type { IconSearchLocalePack } from "./search-locales";

export type LocalizedPhosphorIconManifestEntry = PhosphorIconManifestEntry & {
  localizedSearch: string;
};

export function normalizeIconSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenizePhosphorIconName(name: string) {
  return name
    .replace(/Icon$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(" ")
    .map(normalizeIconSearchText)
    .filter(Boolean);
}

export function buildIconSearchDocument(
  iconName: string,
  locale: IconSearchLocalePack,
) {
  const tokens = tokenizePhosphorIconName(iconName);
  const aliases = [
    ...tokens.flatMap((token) => locale.tokenAliases[token] ?? []),
    ...(locale.iconAliases[iconName] ?? []),
  ];
  return normalizeIconSearchText([
    iconName,
    iconName.replace(/Icon$/, ""),
    tokens.join(" "),
    aliases.join(" "),
  ].join(" "));
}

export function localizePhosphorIconSearchEntries(
  entries: readonly PhosphorIconManifestEntry[],
  locale: IconSearchLocalePack,
): readonly LocalizedPhosphorIconManifestEntry[] {
  return entries.map((entry) => {
    return {
      ...entry,
      localizedSearch: buildIconSearchDocument(entry.name, locale),
    };
  });
}

export function searchIconCatalog(entries: readonly LocalizedPhosphorIconManifestEntry[], query: string) {
  const tokens = normalizeIconSearchText(query).split(" ").filter(Boolean);
  if (!tokens.length) return [...entries];
  return entries.filter((entry) => tokens.every((token) => entry.localizedSearch.includes(token)));
}

export const searchPhosphorIcons = searchIconCatalog;

export function paginatePhosphorIcons(entries: readonly LocalizedPhosphorIconManifestEntry[], page: number, pageSize = 48) {
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return { currentPage, totalPages, entries: entries.slice((currentPage - 1) * pageSize, currentPage * pageSize) };
}
