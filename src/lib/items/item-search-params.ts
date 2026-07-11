import type { Database } from "../../types/database";

export const ITEM_SORT_OPTIONS = [
  "recent",
  "name",
  "category",
  "location",
] as const;

export type ItemSort = (typeof ITEM_SORT_OPTIONS)[number];

export type ItemSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type ItemFilters = {
  categoryId: string | null;
  categoryKey: string | null;
  positionId: string | null;
  query: string;
  roomId: string | null;
  sort: ItemSort;
  status: Database["public"]["Enums"]["item_status"] | null;
  storageId: string | null;
};

const MAX_QUERY_LENGTH = 100;

const ITEM_STATUSES: readonly Database["public"]["Enums"]["item_status"][] = [
  "w domu",
  "zużyte",
  "pożyczone",
  "archiwalne",
];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseUuid(value: string | string[] | undefined) {
  const candidate = firstValue(value)?.trim().toLowerCase() ?? "";

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
    candidate,
  )
    ? candidate
    : null;
}

function parseCategory(value: string | string[] | undefined) {
  const candidate = firstValue(value)?.trim().toLowerCase() ?? "";
  const categoryId = parseUuid(candidate);

  if (categoryId) {
    return { categoryId, categoryKey: null };
  }

  return /^[a-z][a-z0-9_]*$/.test(candidate)
    ? { categoryId: null, categoryKey: candidate }
    : { categoryId: null, categoryKey: null };
}

function parseSort(value: string | string[] | undefined): ItemSort {
  const candidate = firstValue(value)?.trim();

  return ITEM_SORT_OPTIONS.includes(candidate as ItemSort)
    ? (candidate as ItemSort)
    : "recent";
}

function parseStatus(value: string | string[] | undefined) {
  const candidate = firstValue(value)?.trim();
  const normalizedCandidate =
    candidate === "w_domu"
      ? "w domu"
      : candidate === "zuzyte"
        ? "zużyte"
        : candidate === "pozyczone"
          ? "pożyczone"
          : candidate;

  return ITEM_STATUSES.includes(
    normalizedCandidate as Database["public"]["Enums"]["item_status"],
  )
    ? (normalizedCandidate as Database["public"]["Enums"]["item_status"])
    : null;
}

export function parseItemSearchParams(params: ItemSearchParams): ItemFilters {
  const query = (firstValue(params.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const category = parseCategory(params.category);

  return {
    ...category,
    positionId: parseUuid(params.position),
    query,
    roomId: parseUuid(params.room),
    sort: parseSort(params.sort),
    status: parseStatus(params.status),
    storageId: parseUuid(params.storage),
  };
}

export function hasItemFilters(filters: ItemFilters) {
  return Boolean(
    filters.query ||
      filters.categoryId ||
      filters.categoryKey ||
      filters.roomId ||
      filters.storageId ||
      filters.positionId ||
      filters.status,
  );
}

export function searchPattern(query: string) {
  return `%${query.replace(/[%_]/g, "").trim()}%`;
}
