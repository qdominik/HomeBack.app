import type { EntityIconKey } from "../icons/entity-icon-definitions";
import { resolveItemIconKey } from "../icons/item-icon-resolution";

export const RECENT_DASHBOARD_ITEMS_LIMIT = 5;

export type DashboardWidgetState<T> =
  | { kind: "error" }
  | { data: T; kind: "success" };

export type RecentDashboardItem = {
  iconKey: EntityIconKey;
  id: string;
  location: string | null;
  name: string;
  photoPath: string | null;
  previewUrl: string | null;
};

export type DashboardCategoryCount = {
  count: number;
  iconKey: EntityIconKey;
  id: string;
  name: string;
};

export type DashboardRoomShortcut = {
  iconKey: string | null;
  id: string;
  itemCount: number;
  name: string;
  order: number;
};

export type DashboardWidgetData = {
  categories: DashboardWidgetState<DashboardCategoryCount[]>;
  recentItems: DashboardWidgetState<RecentDashboardItem[]>;
  rooms: DashboardWidgetState<DashboardRoomShortcut[]>;
  unlocatedItemCount: DashboardWidgetState<number>;
};

export type DashboardItemSource = {
  category_id: string;
  created_at: string;
  household_id: string;
  id: string;
  miniatura_url: string | null;
  nazwa: string;
  status: string;
  updated_at: string;
};

export type DashboardCategorySource = {
  household_id: string | null;
  id: string;
  ikona: string | null;
  key: string | null;
  nazwa: string;
};

export type DashboardRoomSource = {
  household_id: string;
  id: string;
  ikona: string | null;
  kolejność: number;
  nazwa: string;
};

export type DashboardStorageSource = {
  id: string;
  nazwa: string;
  room_id: string;
};

export type DashboardPositionSource = {
  id: string;
  nazwa: string;
  storage_location_l2_id: string;
};

export type DashboardLocationSource = {
  czy_glowna: boolean;
  id: string;
  item_id: string;
  room_id: string | null;
  storage_location_l2_id: string | null;
  storage_location_l3_id: string | null;
};

type DashboardWidgetSources = {
  categories: DashboardCategorySource[];
  householdId: string;
  items: DashboardItemSource[];
  locations: DashboardLocationSource[];
  positions: DashboardPositionSource[];
  rooms: DashboardRoomSource[];
  storageLocations: DashboardStorageSource[];
};

type ResolvedLocation = {
  path: string;
  roomId: string;
};

function resolveLocation(
  location: DashboardLocationSource,
  roomsById: ReadonlyMap<string, DashboardRoomSource>,
  storageById: ReadonlyMap<string, DashboardStorageSource>,
  positionsById: ReadonlyMap<string, DashboardPositionSource>,
): ResolvedLocation | null {
  const position = location.storage_location_l3_id
    ? positionsById.get(location.storage_location_l3_id)
    : null;
  const storageId =
    position?.storage_location_l2_id ?? location.storage_location_l2_id;
  const storage = storageId ? storageById.get(storageId) : null;
  const roomId = storage?.room_id ?? location.room_id;
  const room = roomId ? roomsById.get(roomId) : null;

  if (!room) {
    return null;
  }

  return {
    path: [room.nazwa, storage?.nazwa, position?.nazwa]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(" / "),
    roomId: room.id,
  };
}

function newestFirst(left: DashboardItemSource, right: DashboardItemSource) {
  return (
    right.updated_at.localeCompare(left.updated_at) ||
    right.created_at.localeCompare(left.created_at) ||
    left.id.localeCompare(right.id)
  );
}

export function buildDashboardWidgetContent({
  categories,
  householdId,
  items,
  locations,
  positions,
  rooms,
  storageLocations,
}: DashboardWidgetSources) {
  const householdItems = items.filter(
    (item) =>
      item.household_id === householdId && item.status !== "archiwalne",
  );
  const householdItemIds = new Set(householdItems.map((item) => item.id));
  const visibleCategories = categories.filter(
    (category) =>
      category.household_id === null || category.household_id === householdId,
  );
  const categoriesById = new Map(
    visibleCategories.map((category) => [category.id, category]),
  );
  const householdRooms = rooms.filter(
    (room) => room.household_id === householdId,
  );
  const roomsById = new Map(householdRooms.map((room) => [room.id, room]));
  const householdStorage = storageLocations.filter((storage) =>
    roomsById.has(storage.room_id),
  );
  const storageById = new Map(
    householdStorage.map((storage) => [storage.id, storage]),
  );
  const householdPositions = positions.filter((position) =>
    storageById.has(position.storage_location_l2_id),
  );
  const positionsById = new Map(
    householdPositions.map((position) => [position.id, position]),
  );
  const householdLocations = locations.filter((location) =>
    householdItemIds.has(location.item_id),
  );
  const locatedItemIds = new Set(
    householdLocations.map((location) => location.item_id),
  );
  const resolvedLocations = householdLocations.flatMap((location) => {
    const resolved = resolveLocation(
      location,
      roomsById,
      storageById,
      positionsById,
    );

    return resolved ? [{ location, resolved }] : [];
  });
  const primaryLocationByItemId = new Map<string, ResolvedLocation>();

  for (const entry of [...resolvedLocations].sort(
    (left, right) =>
      Number(right.location.czy_glowna) - Number(left.location.czy_glowna) ||
      left.location.id.localeCompare(right.location.id),
  )) {
    if (!primaryLocationByItemId.has(entry.location.item_id)) {
      primaryLocationByItemId.set(entry.location.item_id, entry.resolved);
    }
  }

  const recentItems = [...householdItems]
    .sort(newestFirst)
    .slice(0, RECENT_DASHBOARD_ITEMS_LIMIT)
    .map((item): RecentDashboardItem => {
      const category = categoriesById.get(item.category_id);

      return {
        iconKey: resolveItemIconKey({
          categoryKey: category?.key,
          itemIconKey: category?.ikona,
        }),
        id: item.id,
        location: primaryLocationByItemId.get(item.id)?.path ?? null,
        name: item.nazwa,
        photoPath: item.miniatura_url,
        previewUrl: null,
      };
    });
  const categoryCounts = new Map<string, number>();

  for (const item of householdItems) {
    if (categoriesById.has(item.category_id)) {
      categoryCounts.set(
        item.category_id,
        (categoryCounts.get(item.category_id) ?? 0) + 1,
      );
    }
  }

  const categoryCountItems = visibleCategories
    .flatMap((category): DashboardCategoryCount[] => {
      const count = categoryCounts.get(category.id) ?? 0;

      return count
        ? [
            {
              count,
              iconKey: resolveItemIconKey({
                categoryKey: category.key,
                itemIconKey: category.ikona,
              }),
              id: category.id,
              name: category.nazwa,
            },
          ]
        : [];
    })
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name),
    );
  const itemIdsByRoom = new Map<string, Set<string>>();

  for (const { location, resolved } of resolvedLocations) {
    const itemIds = itemIdsByRoom.get(resolved.roomId) ?? new Set<string>();
    itemIds.add(location.item_id);
    itemIdsByRoom.set(resolved.roomId, itemIds);
  }

  const roomShortcuts = householdRooms
    .map(
      (room): DashboardRoomShortcut => ({
        iconKey: room.ikona,
        id: room.id,
        itemCount: itemIdsByRoom.get(room.id)?.size ?? 0,
        name: room.nazwa,
        order: room.kolejność,
      }),
    )
    .sort(
      (left, right) =>
        left.order - right.order || left.name.localeCompare(right.name),
    );

  return {
    categories: categoryCountItems,
    recentItems,
    rooms: roomShortcuts,
    unlocatedItemCount: householdItems.filter(
      (item) => !locatedItemIds.has(item.id),
    ).length,
  };
}

export function createDashboardWidgetErrorData(): DashboardWidgetData {
  return {
    categories: { kind: "error" },
    recentItems: { kind: "error" },
    rooms: { kind: "error" },
    unlocatedItemCount: { kind: "error" },
  };
}
