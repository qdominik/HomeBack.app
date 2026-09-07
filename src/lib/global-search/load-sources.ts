import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";
import { globalSearchRank, type GlobalSearchFilter, type SearchSources } from "./search";

const PAGE_SIZE = 500;
const ID_BATCH_SIZE = 100;

// Explicit pagination avoids silently missing names beyond PostgREST's row cap.
export async function readSearchPages<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await read(from, from + PAGE_SIZE - 1);
    if (error || !data) throw new Error("Search source unavailable");
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

async function readByIds<T>(ids: string[], read: (batch: string[], from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let start = 0; start < ids.length; start += ID_BATCH_SIZE) {
    const batch = ids.slice(start, start + ID_BATCH_SIZE);
    rows.push(...await readSearchPages((from, to) => read(batch, from, to)));
  }
  return rows;
}

export async function loadSearchSources(client: SupabaseClient<Database>, householdId: string, query: string, filter: GlobalSearchFilter): Promise<SearchSources> {
  if (!householdId) throw new Error("Household required");
  const [items, rooms] = await Promise.all([
    filter === "all" || filter === "item" ? readSearchPages((from, to) => client.from("item")
      .select("id, household_id, nazwa, status, miniatura_url, category_id")
      .eq("household_id", householdId).neq("status", "archiwalne").order("id").range(from, to)) : [],
    readSearchPages((from, to) => client.from("room").select("id, household_id, nazwa, ikona")
      .eq("household_id", householdId).order("id").range(from, to)),
  ]);
  // L2/L3 have no household_id column: scope each through already scoped parents.
  const furniture = filter === "room" ? [] : await readByIds(rooms.map((room) => room.id), (ids, from, to) => client.from("storage_location_l2")
    .select("id, room_id, nazwa, ikona").in("room_id", ids).order("id").range(from, to));
  const storage = filter === "room" || filter === "furniture" ? [] : await readByIds(furniture.map((entry) => entry.id), (ids, from, to) => client.from("storage_location_l3")
    .select("id, storage_location_l2_id, nazwa, ikona").in("storage_location_l2_id", ids).order("id").range(from, to));
  const matchingItems = items.filter((item) => globalSearchRank(item.nazwa, query) !== null);
  const categories = await readByIds([...new Set(matchingItems.map((item) => item.category_id).filter(Boolean))], (ids, from, to) => client.from("category")
    .select("id, key").in("id", ids)
    .or(`household_id.eq.${householdId},and(household_id.is.null,czy_systemowa.eq.true)`)
    .order("id").range(from, to));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const locations = await readByIds(matchingItems.map((item) => item.id), (ids, from, to) => client.from("item_location")
    .select("item_id, storage_location_l3_id, czy_glowna").in("item_id", ids).eq("czy_glowna", true).order("id").range(from, to));
  return { items: matchingItems.map((item) => ({ ...item, category: categoriesById.get(item.category_id) ?? null })), rooms, furniture, storage, locations };
}
