export type ItemCategoryOption = {
  id: string;
  isSystem: boolean;
  label: string;
};

export type ItemRoomOption = {
  id: string;
  label: string;
};

export type ItemStorageOption = {
  id: string;
  label: string;
  roomId: string;
};

export type ItemLocationOption = {
  id: string;
  locationCode: string;
  positionName: string;
  roomId: string;
  roomName: string;
  storageId: string;
  storageName: string;
};

export type ItemLocationSelectorOptions = {
  positions: ItemLocationOption[];
  rooms: ItemRoomOption[];
  storageLocations: ItemStorageOption[];
};

export type ItemLocationSelection = {
  positionId: string;
  roomId: string;
  storageId: string;
};

type RoomSource = {
  id: string;
  nazwa: string;
};

type StorageSource = {
  id: string;
  nazwa: string;
  room_id: string;
};

type PositionSource = {
  id: string;
  kod_lokalizacji: string;
  nazwa: string;
  storage_location_l2_id: string;
};

export function buildItemLocationSelectorOptions({
  positions,
  rooms,
  storageLocations,
}: {
  positions: PositionSource[];
  rooms: RoomSource[];
  storageLocations: StorageSource[];
}): ItemLocationSelectorOptions {
  const roomOptions = rooms.map((room) => ({
    id: room.id,
    label: room.nazwa,
  }));
  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const storageOptions = storageLocations.flatMap((storage) =>
    roomsById.has(storage.room_id)
      ? [
          {
            id: storage.id,
            label: storage.nazwa,
            roomId: storage.room_id,
          },
        ]
      : [],
  );
  const storageById = new Map(
    storageLocations.map((storage) => [storage.id, storage]),
  );
  const positionOptions = positions.flatMap((position) => {
    const storage = storageById.get(position.storage_location_l2_id);
    const room = storage ? roomsById.get(storage.room_id) : null;

    return storage && room
      ? [
          {
            id: position.id,
            locationCode: position.kod_lokalizacji,
            positionName: position.nazwa,
            roomId: room.id,
            roomName: room.nazwa,
            storageId: storage.id,
            storageName: storage.nazwa,
          },
        ]
      : [];
  });

  return {
    positions: positionOptions,
    rooms: roomOptions,
    storageLocations: storageOptions,
  };
}

export function getStorageOptionsForRoom(
  options: ItemLocationSelectorOptions,
  roomId: string,
) {
  return options.storageLocations.filter((option) => option.roomId === roomId);
}

export function getPositionOptionsForStorage(
  options: ItemLocationSelectorOptions,
  storageId: string,
) {
  return options.positions.filter((option) => option.storageId === storageId);
}

export function getInitialItemLocationSelection(
  options: ItemLocationSelectorOptions,
  selectedPositionId?: string | null,
  selectedStorageId?: string | null,
  selectedRoomId?: string | null,
): ItemLocationSelection {
  const initialOption =
    options.positions.find((option) => option.id === selectedPositionId) ?? null;

  const storage = options.storageLocations.find((entry) => entry.id === selectedStorageId);
  const roomId = initialOption?.roomId ?? storage?.roomId ?? selectedRoomId;
  const room = options.rooms.find((entry) => entry.id === roomId);
  return {
    positionId: initialOption?.id ?? "",
    roomId: room?.id ?? "",
    storageId: initialOption?.storageId ?? (room ? storage?.id : null) ?? "",
  };
}

export function getItemEditFormLocationProps(
  locationOptions: ItemLocationSelectorOptions,
  location: ItemLocationOption | null,
) {
  return {
    locationOptions,
    selectedPositionId: location?.positionName ? location.id : null,
    selectedStorageId: location?.storageId || null,
    selectedRoomId: location?.roomId || null,
  };
}

export function getItemLocationFieldKey(
  itemId?: string | null,
  selectedPositionId?: string | null,
  selectedStorageId?: string | null,
  selectedRoomId?: string | null,
) {
  return `${itemId ?? "new"}:${selectedPositionId ?? selectedStorageId ?? selectedRoomId ?? "none"}`;
}

export function getItemLocationFieldProps(
  options: ItemLocationSelectorOptions,
  selectedPositionId?: string | null,
  selectedStorageId?: string | null,
  selectedRoomId?: string | null,
) {
  return {
    options,
    selectedStorageId: selectedStorageId ?? null,
    selectedRoomId: selectedRoomId ?? null,
    selectedPositionId: selectedPositionId ?? null,
  };
}

export function selectItemLocationRoom(roomId: string): ItemLocationSelection {
  return { roomId, storageId: "", positionId: "" };
}

export function selectItemLocationStorage(
  selection: ItemLocationSelection,
  storageId: string,
): ItemLocationSelection {
  return { ...selection, storageId, positionId: "" };
}

export type ItemLocationTarget = {
  room_id?: string | null;
  storage_location_l2_id?: string | null;
  storage_location_l3_id: string | null;
};

// Selectors carry parents; a persisted assignment carries only its deepest target.
export function getItemLocationTarget(selection: ItemLocationSelection): ItemLocationTarget {
  return {
    room_id: !selection.positionId && !selection.storageId ? selection.roomId || null : null,
    storage_location_l2_id: !selection.positionId ? selection.storageId || null : null,
    storage_location_l3_id: selection.positionId || null,
  };
}

export function resolveItemLocation(options: ItemLocationSelectorOptions, target: ItemLocationTarget): ItemLocationOption | null {
  if ([target.room_id, target.storage_location_l2_id, target.storage_location_l3_id].filter(Boolean).length !== 1) return null;
  if (target.storage_location_l3_id) return options.positions.find((p) => p.id === target.storage_location_l3_id) ?? null;
  const furniture = target.storage_location_l2_id
    ? options.storageLocations.find((f) => f.id === target.storage_location_l2_id) : null;
  if (target.storage_location_l2_id && !furniture) return null;
  const room = options.rooms.find((r) => r.id === (furniture?.roomId ?? target.room_id));
  if (!room) return null;
  return { id: furniture?.id ?? room.id, roomId: room.id, roomName: room.label,
    storageId: furniture?.id ?? "", storageName: furniture?.label ?? "",
    positionName: "", locationCode: "" };
}

export function buildItemLocationAssignments(
  options: ItemLocationSelectorOptions,
  assignments: (ItemLocationTarget & { id?: string; item_id: string; czy_glowna: boolean })[],
) {
  const result = new Map<string, ItemLocationOption>();
  const key = (a: ItemLocationTarget) => a.storage_location_l3_id ?? a.storage_location_l2_id ?? a.room_id ?? "";
  const level = (a: ItemLocationTarget) => a.storage_location_l3_id ? 3 : a.storage_location_l2_id ? 2 : 1;
  for (const assignment of [...assignments].sort((a, b) => Number(b.czy_glowna) - Number(a.czy_glowna)
    || key(a).localeCompare(key(b)) || level(a) - level(b) || (a.id ?? "").localeCompare(b.id ?? ""))) {
    const location = resolveItemLocation(options, assignment);
    if (location && !result.has(assignment.item_id)) result.set(assignment.item_id, location);
  }
  return result;
}
