import assert from "node:assert/strict";
import test from "node:test";
import {
  buildItemLocationSelectorOptions,
  buildItemLocationAssignments,
  getInitialItemLocationSelection,
  getItemEditFormLocationProps,
  getItemLocationTarget,
  resolveItemLocation,
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

const roomSelection = { roomId: "room-salon", storageId: "", positionId: "" };
const furnitureSelection = { ...roomSelection, storageId: "storage-komoda" };
const storageSelection = { ...furnitureSelection, positionId: "position-szuflada-1" };
for (const [level, selection, names] of [
  ["L1", roomSelection, ["Salon", "", ""]],
  ["L2", furnitureSelection, ["Salon", "Komoda", ""]],
  ["L3", storageSelection, ["Salon", "Komoda", "Szuflada 1"]],
] as const) {
  test(`${level} persists only the deepest target and restores all selectors`, () => {
    const target = getItemLocationTarget(selection);
    assert.equal(Object.values(target).filter(Boolean).length, 1);
    const location = resolveItemLocation(options, target)!;
    assert.deepEqual([location.roomName, location.storageName, location.positionName], names);
    const props = getItemEditFormLocationProps(options, location);
    assert.deepEqual(getInitialItemLocationSelection(options, props.selectedPositionId, props.selectedStorageId, props.selectedRoomId), selection);
  });
}

test("L1 -> L2 -> L3 -> L1 -> empty replaces the target without retaining parents", () => {
  for (const selection of [roomSelection, furnitureSelection, storageSelection, roomSelection, selectItemLocationRoom("")]) {
    const target = getItemLocationTarget(selection);
    assert.equal(Object.values(target).filter(Boolean).length, selection.roomId ? 1 : 0);
    assert.equal(resolveItemLocation(options, target)?.roomId ?? "", selection.roomId);
  }
});

test("invalid, empty and foreign targets cannot produce a breadcrumb", () => {
  for (const target of [
    { room_id: "foreign", storage_location_l3_id: null },
    { storage_location_l2_id: "foreign", storage_location_l3_id: null },
    { storage_location_l3_id: "foreign" },
    { storage_location_l3_id: null },
    { room_id: "room-salon", storage_location_l3_id: "position-szuflada-1" },
  ]) assert.equal(resolveItemLocation(options, target), null);
});

test("mixed assignments prefer the primary, then deterministic valid additional targets", () => {
  const assignments = [
    { item_id: "item", czy_glowna: false, ...getItemLocationTarget(storageSelection) },
    { item_id: "item", czy_glowna: true, ...getItemLocationTarget(roomSelection) },
    { item_id: "item", czy_glowna: false, ...getItemLocationTarget(furnitureSelection) },
  ];
  for (const rows of [assignments, [...assignments].reverse()]) {
    assert.equal(buildItemLocationAssignments(options, rows).get("item")?.id, "room-salon");
    assert.equal(buildItemLocationAssignments(options, rows.filter((r) => !r.czy_glowna)).get("item")?.id, "position-szuflada-1");
  }
});


test("L2/L3 breadcrumbs follow reparented furniture instead of stored ancestors", () => {
  const movedOptions = buildItemLocationSelectorOptions({
    ...supabaseItemsLocationRows,
    storageLocations: supabaseItemsLocationRows.storageLocations.map((entry) =>
      entry.id === "storage-komoda" ? { ...entry, room_id: "room-bedroom" } : entry),
  });
  for (const selection of [furnitureSelection, storageSelection]) {
    const location = resolveItemLocation(movedOptions, getItemLocationTarget(selection));
    assert.equal(location?.roomName, "Sypialnia");
    assert.equal(location?.roomId, "room-bedroom");
  }
  assert.equal(resolveItemLocation(movedOptions, getItemLocationTarget(roomSelection))?.roomName, "Salon");
});
