export type ItemCategoryOption = {
  id: string;
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
