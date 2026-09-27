import type { Database } from "../../types/database";
import { GLOBAL_SEARCH_LIMIT, globalSearchRank } from "../global-search/search";
import type { ItemLocationOption } from "./item-options";

export const ITEM_SORT_OPTIONS = [
  "recent",
  "name",
  "category",
  "location",
] as const;

export type ItemSort = (typeof ITEM_SORT_OPTIONS)[number];

export const ITEM_STATUS_FILTERS = ["active", "archived", "all"] as const;
export type ItemStatusFilter = (typeof ITEM_STATUS_FILTERS)[number];

export const ITEM_ADDED_FILTERS = ["today", "7d", "30d", "3m", "custom"] as const;
export type ItemAddedFilter = (typeof ITEM_ADDED_FILTERS)[number];

export type ItemSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type ItemFilters = {
  added: ItemAddedFilter | null;
  categoryId: string | null;
  categoryKey: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  positionId: string | null;
  query: string;
  roomId: string | null;
  sort: ItemSort;
  status: ItemStatusFilter;
  storageId: string | null;
};

const MAX_QUERY_LENGTH = 100;

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

export function parseItemFocusId(value: string | string[] | undefined) {
  return parseUuid(value);
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

function parseStatus(value: string | string[] | undefined): ItemStatusFilter {
  const candidate = firstValue(value)?.trim();
  return ITEM_STATUS_FILTERS.includes(candidate as ItemStatusFilter)
    ? (candidate as ItemStatusFilter)
    : "active";
}

function parseAdded(value: string | string[] | undefined): ItemAddedFilter | null {
  const candidate = firstValue(value)?.trim();
  return ITEM_ADDED_FILTERS.includes(candidate as ItemAddedFilter)
    ? (candidate as ItemAddedFilter)
    : null;
}

function parseDate(value: string | string[] | undefined) {
  const candidate = firstValue(value)?.trim() ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) && !Number.isNaN(Date.parse(`${candidate}T00:00:00.000Z`))
    ? candidate
    : null;
}

export function parseItemSearchParams(params: ItemSearchParams): ItemFilters {
  const query = (firstValue(params.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const category = parseCategory(params.category);

  return {
    ...category,
    added: parseAdded(params.added),
    dateFrom: parseDate(params.from),
    dateTo: parseDate(params.to),
    positionId: parseUuid(params.position),
    query,
    roomId: parseUuid(params.room),
    sort: parseSort(params.sort),
    status: parseStatus(params.itemStatus),
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
      filters.status !== "active" ||
      filters.added,
  );
}

export function searchPattern(query: string) {
  return `%${query.replace(/[%_]/g, "").trim()}%`;
}

type FilterableItem = {
  category_id: string;
  created_at: string;
  household_id: string;
  id: string;
  nazwa: string;
  status: Database["public"]["Enums"]["item_status"];
};

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addedRange(filters: ItemFilters, now: Date) {
  if (!filters.added) return null;
  const end = now.getTime();
  if (filters.added === "custom") {
    return {
      from: filters.dateFrom ? Date.parse(`${filters.dateFrom}T00:00:00.000Z`) : null,
      to: filters.dateTo ? Date.parse(`${filters.dateTo}T23:59:59.999Z`) : null,
    };
  }
  const start = startOfUtcDay(now);
  if (filters.added === "7d") start.setUTCDate(start.getUTCDate() - 6);
  if (filters.added === "30d") start.setUTCDate(start.getUTCDate() - 29);
  if (filters.added === "3m") start.setUTCMonth(start.getUTCMonth() - 3);
  return { from: start.getTime(), to: end };
}

export function applyItemFilters<T extends FilterableItem>({
  categoryKeyById,
  filters,
  householdId,
  items,
  locationsByItemId,
  now = new Date(),
}: {
  categoryKeyById: Map<string, string | null>;
  filters: ItemFilters;
  householdId: string;
  items: T[];
  locationsByItemId: Map<string, ItemLocationOption[]>;
  now?: Date;
}) {
  const range = addedRange(filters, now);
  const ranked = items.flatMap((item) => {
    if (item.household_id !== householdId) return [];
    if (filters.status === "active" && item.status === "archiwalne") return [];
    if (filters.status === "archived" && item.status !== "archiwalne") return [];
    if (filters.categoryId && item.category_id !== filters.categoryId) return [];
    if (filters.categoryKey && categoryKeyById.get(item.category_id) !== filters.categoryKey) return [];
    const locations = locationsByItemId.get(item.id) ?? [];
    if (filters.roomId && !locations.some((location) => location.roomId === filters.roomId)) return [];
    if (filters.storageId && !locations.some((location) => location.storageId === filters.storageId)) return [];
    if (filters.positionId && !locations.some((location) => location.id === filters.positionId && Boolean(location.positionName))) return [];
    const createdAt = Date.parse(item.created_at);
    if (range?.from !== null && range?.from !== undefined && createdAt < range.from) return [];
    if (range?.to !== null && range?.to !== undefined && createdAt > range.to) return [];
    const rank = filters.query ? globalSearchRank(item.nazwa, filters.query) : 0;
    return rank === null ? [] : [{ item, rank }];
  });

  if (filters.query) {
    ranked.sort((a, b) => a.rank - b.rank
      || a.item.nazwa.localeCompare(b.item.nazwa, "pl")
      || a.item.id.localeCompare(b.item.id));
  }
  return ranked.slice(0, filters.query ? GLOBAL_SEARCH_LIMIT : undefined).map(({ item }) => item);
}
