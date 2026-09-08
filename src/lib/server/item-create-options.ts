import { getAppContext } from "@/lib/app-context";
import { getDefaultItemCategoryId, getItemCategoryOptions } from "@/lib/categories/category-selection";
import { buildItemLocationSelectorOptions } from "@/lib/items/item-options";

export async function getItemCreateOptions() {
  const { supabase, profile } = await getAppContext();
  if (!profile || profile.rola !== "admin" || profile.status !== "aktywny") return null;
  const householdId = profile.household_id;
  const [categories, rooms] = await Promise.all([
    supabase.from("category").select("id, household_id, key, nazwa, czy_systemowa")
      .or(`household_id.eq.${householdId},and(household_id.is.null,czy_systemowa.eq.true)`)
      .order("czy_systemowa", { ascending: false }).order("created_at", { ascending: true }),
    supabase.from("room").select("id, nazwa").eq("household_id", householdId)
      .order("kolejność", { ascending: true }).order("created_at", { ascending: true }),
  ]);
  const roomIds = (rooms.data ?? []).map(room => room.id);
  const furniture = roomIds.length ? await supabase.from("storage_location_l2")
    .select("id, nazwa, room_id").in("room_id", roomIds)
    .order("kolejność", { ascending: true }).order("created_at", { ascending: true }) : { data: [], error: null };
  const furnitureIds = (furniture.data ?? []).map(item => item.id);
  const positions = furnitureIds.length ? await supabase.from("storage_location_l3")
    .select("id, nazwa, kod_lokalizacji, storage_location_l2_id").in("storage_location_l2_id", furnitureIds)
    .order("kolejność", { ascending: true }).order("created_at", { ascending: true }) : { data: [], error: null };
  if (categories.error || rooms.error || furniture.error || positions.error) throw new Error("Item form options unavailable");
  return {
    categories: getItemCategoryOptions(categories.data ?? [], householdId),
    defaultCategoryId: getDefaultItemCategoryId(categories.data ?? []),
    locationOptions: buildItemLocationSelectorOptions({ rooms: rooms.data ?? [], storageLocations: furniture.data ?? [], positions: positions.data ?? [] }),
  };
}

export type ItemCreateOptions = NonNullable<Awaited<ReturnType<typeof getItemCreateOptions>>>;
