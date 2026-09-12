import type { AppContext } from "@/lib/app-context";
import {
  buildDashboardWidgetContent,
  createDashboardWidgetErrorData,
  type DashboardWidgetData,
} from "@/lib/dashboard/dashboard-widgets";
import {
  isItemPhotoFinalPathForHousehold,
  ITEM_PHOTO_BUCKET,
  ITEM_PHOTO_SIGNED_URL_TTL_SECONDS,
} from "@/lib/items/item-photo-storage";

const orderColumn = "kolejno\u015b\u0107" as const;

export async function loadDashboardWidgets({
  profile,
  supabase,
}: Pick<AppContext, "profile" | "supabase">): Promise<DashboardWidgetData> {
  const householdId = profile?.household_id;

  if (!householdId) {
    return createDashboardWidgetErrorData();
  }

  const [itemsResponse, categoriesResponse, roomsResponse] = await Promise.all([
    supabase
      .from("item")
      .select(
        "id, household_id, category_id, nazwa, status, miniatura_url, created_at, updated_at",
      )
      .eq("household_id", householdId)
      .neq("status", "archiwalne")
      .order("updated_at", { ascending: false }),
    supabase
      .from("category")
      .select("id, household_id, key, nazwa, ikona")
      .or(`household_id.is.null,household_id.eq.${householdId}`)
      .order("created_at", { ascending: true }),
    supabase
      .from("room")
      .select("*")
      .eq("household_id", householdId)
      .order(orderColumn, { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (itemsResponse.error || categoriesResponse.error || roomsResponse.error) {
    return createDashboardWidgetErrorData();
  }

  const items = itemsResponse.data ?? [];
  const rooms = roomsResponse.data ?? [];
  const itemIds = items.map((item) => item.id);
  const roomIds = rooms.map((room) => room.id);
  const [storageResponse, locationsResponse] = await Promise.all([
    roomIds.length
      ? supabase
          .from("storage_location_l2")
          .select("id, nazwa, room_id")
          .in("room_id", roomIds)
          .order(orderColumn, { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    itemIds.length
      ? supabase
          .from("item_location")
          .select(
            "id, item_id, room_id, storage_location_l2_id, storage_location_l3_id, czy_glowna",
          )
          .in("item_id", itemIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (storageResponse.error || locationsResponse.error) {
    return createDashboardWidgetErrorData();
  }

  const storageLocations = storageResponse.data ?? [];
  const storageIds = storageLocations.map((storage) => storage.id);
  const positionsResponse = storageIds.length
    ? await supabase
        .from("storage_location_l3")
        .select("id, nazwa, storage_location_l2_id")
        .in("storage_location_l2_id", storageIds)
        .order(orderColumn, { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (positionsResponse.error) {
    return createDashboardWidgetErrorData();
  }

  const content = buildDashboardWidgetContent({
    categories: categoriesResponse.data ?? [],
    householdId,
    items,
    locations: locationsResponse.data ?? [],
    positions: positionsResponse.data ?? [],
    rooms,
    storageLocations,
  });
  const canReadPhotos =
    profile.status === "aktywny" &&
    (profile.rola === "admin" || profile.rola === "domownik");
  const recentItems = await Promise.all(
    content.recentItems.map(async (item) => {
      if (
        !canReadPhotos ||
        !item.photoPath ||
        !isItemPhotoFinalPathForHousehold(item.photoPath, householdId)
      ) {
        return item;
      }

      const { data, error } = await supabase.storage
        .from(ITEM_PHOTO_BUCKET)
        .createSignedUrl(item.photoPath, ITEM_PHOTO_SIGNED_URL_TTL_SECONDS);

      return {
        ...item,
        previewUrl: error || !data?.signedUrl ? null : data.signedUrl,
      };
    }),
  );

  return {
    categories: { data: content.categories, kind: "success" },
    recentItems: { data: recentItems, kind: "success" },
    rooms: { data: content.rooms, kind: "success" },
  };
}
