import assert from "node:assert/strict";
import test from "node:test";
import { buildItemLocationSelectorOptions } from "../../src/lib/items/item-options";

const options = buildItemLocationSelectorOptions({
  rooms: [
    { id: "room-a", nazwa: "Pomieszczenie A" },
    { id: "room-b", nazwa: "Pomieszczenie B" },
    { id: "room-c", nazwa: "Pomieszczenie C" },
  ],
  storageLocations: [
    { id: "storage-a", room_id: "room-a", nazwa: "Schowek A" },
    { id: "storage-b", room_id: "room-b", nazwa: "Schowek B" },
  ],
  positions: [
    {
      id: "position-a",
      storage_location_l2_id: "storage-a",
      nazwa: "Pozycja A",
      kod_lokalizacji: "A-1",
    },
  ],
});

test("location selector keeps rooms without storage locations or L3 positions", () => {
  assert.deepEqual(options.rooms, [
    { id: "room-a", label: "Pomieszczenie A" },
    { id: "room-b", label: "Pomieszczenie B" },
    { id: "room-c", label: "Pomieszczenie C" },
  ]);
});

test("location selector narrows storage and positions through their parent ids", () => {
  assert.deepEqual(
    options.storageLocations.filter((storage) => storage.roomId === "room-a"),
    [{ id: "storage-a", roomId: "room-a", label: "Schowek A" }],
  );
  assert.deepEqual(
    options.storageLocations.filter((storage) => storage.roomId === "room-b"),
    [{ id: "storage-b", roomId: "room-b", label: "Schowek B" }],
  );
  assert.deepEqual(
    options.storageLocations.filter((storage) => storage.roomId === "room-c"),
    [],
  );
  assert.deepEqual(
    options.positions.filter((position) => position.storageId === "storage-a"),
    [
      {
        id: "position-a",
        locationCode: "A-1",
        positionName: "Pozycja A",
        roomId: "room-a",
        roomName: "Pomieszczenie A",
        storageId: "storage-a",
        storageName: "Schowek A",
      },
    ],
  );
  assert.deepEqual(
    options.positions.filter((position) => position.storageId === "storage-b"),
    [],
  );
});
