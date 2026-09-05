"use server";

import { getAppContext } from "@/lib/app-context";
import {
  buildItemSearchLocationPath,
  DASHBOARD_ITEM_SEARCH_LIMIT,
  filterItemSearchCandidates,
  getItemNameSearchQuery,
  normalizeItemSearchQuery,
  type DashboardItemSearchResponse,
} from "@/lib/items/item-search";

export async function searchDashboardItems(
  rawQuery: string,
): Promise<DashboardItemSearchResponse> {
  const query = normalizeItemSearchQuery(rawQuery);
  const searchableQuery = getItemNameSearchQuery(query);

  if (!searchableQuery) {
    return { kind: "empty" };
  }

  const { profile, supabase } = await getAppContext();
  const householdId = profile?.household_id;

  if (!householdId) {
    return { kind: "error" };
  }

  const { data: itemData, error: itemError } = await supabase
    .from("item")
    .select("id, household_id, nazwa")
    .eq("household_id", householdId)
    .neq("status", "archiwalne")
    .order("nazwa", { ascending: true });

  if (itemError) {
    return { kind: "error" };
  }

  const items = filterItemSearchCandidates(
    itemData ?? [],
    householdId,
    searchableQuery,
  ).slice(0, DASHBOARD_ITEM_SEARCH_LIMIT);
  const itemIds = items.map((item) => item.id);

  if (!itemIds.length) {
    return { kind: "success", query, results: [] };
  }

  const { data: primaryLocationData, error: primaryLocationError } =
    await supabase
      .from("item_location")
      .select("item_id, storage_location_l3_id")
      .eq("czy_glowna", true)
      .in("item_id", itemIds);

  if (primaryLocationError) {
    return { kind: "error" };
  }

  const primaryPositionByItemId = new Map(
    (primaryLocationData ?? []).map((location) => [
      location.item_id,
      location.storage_location_l3_id,
    ]),
  );
  const positionIds = Array.from(primaryPositionByItemId.values());
  const { data: positionData, error: positionError } = positionIds.length
    ? await supabase
        .from("storage_location_l3")
        .select("id, nazwa, storage_location_l2_id")
        .in("id", positionIds)
    : { data: [], error: null };

  if (positionError) {
    return { kind: "error" };
  }

  const positionsById = new Map((positionData ?? []).map((position) => [
    position.id,
    position,
  ]));
  const storageIds = Array.from(
    new Set((positionData ?? []).map((position) => position.storage_location_l2_id)),
  );
  const { data: storageData, error: storageError } = storageIds.length
    ? await supabase
        .from("storage_location_l2")
        .select("id, nazwa, room_id")
        .in("id", storageIds)
    : { data: [], error: null };

  if (storageError) {
    return { kind: "error" };
  }

  const storageById = new Map((storageData ?? []).map((storage) => [
    storage.id,
    storage,
  ]));
  const roomIds = Array.from(
    new Set((storageData ?? []).map((storage) => storage.room_id)),
  );
  const { data: roomData, error: roomError } = roomIds.length
    ? await supabase
        .from("room")
        .select("id, nazwa")
        .eq("household_id", householdId)
        .in("id", roomIds)
    : { data: [], error: null };

  if (roomError) {
    return { kind: "error" };
  }

  const roomsById = new Map((roomData ?? []).map((room) => [room.id, room]));

  return {
    kind: "success",
    query,
    results: items.map((item) => {
      const position = positionsById.get(primaryPositionByItemId.get(item.id) ?? "");
      const storage = position
        ? storageById.get(position.storage_location_l2_id)
        : null;
      const room = storage ? roomsById.get(storage.room_id) : null;

      return {
        id: item.id,
        location: buildItemSearchLocationPath({
          positionName: position?.nazwa,
          roomName: room?.nazwa,
          storageName: storage?.nazwa,
        }),
        name: item.nazwa,
      };
    }),
  };
}
