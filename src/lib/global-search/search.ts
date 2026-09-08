import { getItemNameSearchQuery, normalizeItemSearchText } from "../items/item-search";
import { routes } from "../routes";

export const GLOBAL_SEARCH_FILTERS = ["all", "item", "room", "furniture", "storage"] as const;
export type GlobalSearchFilter = (typeof GLOBAL_SEARCH_FILTERS)[number];
export type GlobalSearchEntityType = Exclude<GlobalSearchFilter, "all">;
export const GLOBAL_SEARCH_LIMIT = 40;

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchEntityType;
  name: string;
  href: string;
  breadcrumb: string[];
  icon?: string | null;
  previewUrl?: string | null;
};
export type GlobalSearchResponse =
  | { kind: "empty" }
  | { kind: "error" }
  | { kind: "success"; query: string; filter: GlobalSearchFilter; results: GlobalSearchResult[]; total: number };

type Named = { id: string; nazwa: string; ikona?: string | null };
export type SearchSources = {
  items: (Named & { household_id: string; status: string; miniatura_url?: string | null; category?: { key: string | null } | null })[];
  rooms: (Named & { household_id: string })[];
  furniture: (Named & { room_id: string })[];
  storage: (Named & { storage_location_l2_id: string })[];
  locations: { item_id: string; storage_location_l3_id: string; czy_glowna: boolean }[];
};

export function parseGlobalSearchFilter(value: unknown): GlobalSearchFilter {
  return GLOBAL_SEARCH_FILTERS.includes(value as GlobalSearchFilter) ? value as GlobalSearchFilter : "all";
}

// Literal matches precede matches requiring the existing Polish normalization.
export function globalSearchRank(name: string, query: string): number | null {
  const literalQuery = getItemNameSearchQuery(query).toLowerCase();
  const normalizedQuery = normalizeItemSearchText(literalQuery);
  if (!normalizedQuery) return null;
  const literalName = name.trim().toLowerCase();
  if (literalName === literalQuery) return 0;
  if (literalName.startsWith(literalQuery)) return 1;
  if (literalName.includes(literalQuery)) return 2;
  return normalizeItemSearchText(name).includes(normalizedQuery) ? 3 : null;
}

export function searchGlobalSources(sources: SearchSources, householdId: string, query: string, filter: GlobalSearchFilter = "all") {
  if (!householdId || !normalizeItemSearchText(getItemNameSearchQuery(query))) return [];
  const rooms = new Map(sources.rooms.filter((room) => room.household_id === householdId).map((room) => [room.id, room]));
  const furniture = new Map(sources.furniture.filter((entry) => rooms.has(entry.room_id)).map((entry) => [entry.id, entry]));
  const storage = new Map(sources.storage.filter((entry) => furniture.has(entry.storage_location_l2_id)).map((entry) => [entry.id, entry]));
  // Only complete, household-scoped paths are eligible. Prefer the primary
  // assignment; otherwise use the lowest storage UUID, independent of read order.
  const locations = new Map<string, string>();
  const validLocations = sources.locations
    .filter((entry) => storage.has(entry.storage_location_l3_id))
    .sort((a, b) => Number(b.czy_glowna) - Number(a.czy_glowna)
      || a.storage_location_l3_id.localeCompare(b.storage_location_l3_id));
  for (const entry of validLocations) {
    if (!locations.has(entry.item_id)) locations.set(entry.item_id, entry.storage_location_l3_id);
  }
  const roomPath = (roomId: string) => [rooms.get(roomId)!.nazwa];
  const furniturePath = (id: string) => {
    const entry = furniture.get(id)!;
    return [...roomPath(entry.room_id), entry.nazwa];
  };
  const storagePath = (id: string) => {
    const entry = storage.get(id)!;
    return [...furniturePath(entry.storage_location_l2_id), entry.nazwa];
  };
  const candidates: GlobalSearchResult[] = [
    ...sources.items.filter((item) => item.household_id === householdId && item.status !== "archiwalne").map((item): GlobalSearchResult => ({
      id: item.id, type: "item", name: item.nazwa, icon: item.ikona,
      href: `${routes.items}#item-${item.id}`,
      breadcrumb: locations.has(item.id) ? storagePath(locations.get(item.id)!) : [],
    })),
    ...Array.from(rooms.values(), (room): GlobalSearchResult => ({
      id: room.id, type: "room", name: room.nazwa, icon: room.ikona,
      href: `${routes.home}#room-${room.id}`, breadcrumb: roomPath(room.id),
    })),
    ...Array.from(furniture.values(), (entry): GlobalSearchResult => ({
      id: entry.id, type: "furniture", name: entry.nazwa, icon: entry.ikona,
      href: `${routes.home}#furniture-${entry.id}`, breadcrumb: furniturePath(entry.id),
    })),
    ...Array.from(storage.values(), (entry): GlobalSearchResult => ({
      id: entry.id, type: "storage", name: entry.nazwa, icon: entry.ikona,
      href: `${routes.home}#storage-${entry.id}`, breadcrumb: storagePath(entry.id),
    })),
  ];
  return candidates.flatMap((result) => {
    const rank = globalSearchRank(result.name, query);
    return (filter === "all" || result.type === filter) && rank !== null ? [{ result, rank }] : [];
  }).sort((a, b) => a.rank - b.rank
    || GLOBAL_SEARCH_FILTERS.indexOf(a.result.type) - GLOBAL_SEARCH_FILTERS.indexOf(b.result.type)
    || a.result.name.localeCompare(b.result.name, "pl")
    || a.result.id.localeCompare(b.result.id))
    .map(({ result }) => result);
}
