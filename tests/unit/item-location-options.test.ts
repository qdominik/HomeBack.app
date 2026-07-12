import assert from "node:assert/strict";
import test from "node:test";
import {
  buildItemLocationSelectorOptions,
  getPositionOptionsForStorage,
  getStorageOptionsForRoom,
  selectItemLocationRoom,
  selectItemLocationStorage,
} from "../../src/lib/items/item-options";

const supabaseItemsLocationRows = {
  rooms: [
    { id: "room-salon", nazwa: "Salon" },
    { id: "room-bedroom", nazwa: "Sypialnia" },
    { id: "room-balcony", nazwa: "Balkon" },
  ],
  storageLocations: [
    { id: "storage-komoda", room_id: "room-salon", nazwa: "Komoda" },
    { id: "storage-szafa", room_id: "room-bedroom", nazwa: "Szafa" },
  ],
  positions: [
    {
      id: "position-szuflada-1",
      storage_location_l2_id: "storage-komoda",
      nazwa: "Szuflada 1",
      kod_lokalizacji: "SAL-KOM-SZU1",
    },
    {
      id: "position-szuflada-2",
      storage_location_l2_id: "storage-komoda",
      nazwa: "Szuflada 2",
      kod_lokalizacji: "SAL-KOM-SZU2",
    },
  ],
};

const options = buildItemLocationSelectorOptions(supabaseItemsLocationRows);

test("location selector keeps rooms without storage locations or L3 positions", () => {
  assert.deepEqual(options.rooms, [
    { id: "room-salon", label: "Salon" },
    { id: "room-bedroom", label: "Sypialnia" },
    { id: "room-balcony", label: "Balkon" },
  ]);
  assert.deepEqual(getStorageOptionsForRoom(options, "room-balcony"), []);
  assert.deepEqual(getPositionOptionsForStorage(options, "storage-szafa"), []);
});

test("Supabase rows map to the complete Salon -> Komoda -> Szuflada structure", () => {
  assert.deepEqual(getStorageOptionsForRoom(options, "room-salon"), [
    { id: "storage-komoda", roomId: "room-salon", label: "Komoda" },
  ]);
  assert.deepEqual(getPositionOptionsForStorage(options, "storage-komoda"), [
    {
      id: "position-szuflada-1",
      locationCode: "SAL-KOM-SZU1",
      positionName: "Szuflada 1",
      roomId: "room-salon",
      roomName: "Salon",
      storageId: "storage-komoda",
      storageName: "Komoda",
    },
    {
      id: "position-szuflada-2",
      locationCode: "SAL-KOM-SZU2",
      positionName: "Szuflada 2",
      roomId: "room-salon",
      roomName: "Salon",
      storageId: "storage-komoda",
      storageName: "Komoda",
    },
  ]);
});

test("location selector clears child choices when a parent selection changes", () => {
  const selectedRoom = selectItemLocationRoom("room-salon");
  const selectedStorage = selectItemLocationStorage(
    selectedRoom,
    "storage-komoda",
  );
  const selectedPosition = {
    ...selectedStorage,
    positionId: "position-szuflada-1",
  };

  assert.deepEqual(selectItemLocationRoom("room-bedroom"), {
    roomId: "room-bedroom",
    storageId: "",
    positionId: "",
  });
  assert.deepEqual(
    selectItemLocationStorage(selectedPosition, "storage-szafa"),
    {
      roomId: "room-salon",
      storageId: "storage-szafa",
      positionId: "",
    },
  );
});