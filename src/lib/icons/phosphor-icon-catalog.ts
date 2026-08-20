import type { PhosphorIconManifestEntry } from "./phosphor-icon-registry";

export function searchPhosphorIcons(entries: readonly PhosphorIconManifestEntry[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...entries];
  return entries.filter((entry) => entry.name.toLowerCase().includes(normalized) || entry.search.includes(normalized));
}

export function paginatePhosphorIcons(entries: readonly PhosphorIconManifestEntry[], page: number, pageSize = 48) {
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return { currentPage, totalPages, entries: entries.slice((currentPage - 1) * pageSize, currentPage * pageSize) };
}
