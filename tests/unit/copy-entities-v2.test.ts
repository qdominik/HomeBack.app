import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canCopyEntity,
  defaultCopyName,
  mapCopyRpcError,
  parseCopyFurnitureInput,
  parseCopyItemInput,
  parseCopyRoomInput,
  parseCopyStorageInput,
  resolveCopyDialogOutcome,
} from "../../src/lib/copy-entities/copy-contract";
import {
  getInitialItemLocationSelection,
  getPositionOptionsForStorage,
  getStorageOptionsForRoom,
  selectItemLocationRoom,
  selectItemLocationStorage,
  type ItemLocationSelectorOptions,
} from "../../src/lib/items/item-options";

const roomId = "10000000-0000-4000-8000-000000000001";
const furnitureId = "10000000-0000-4000-8000-000000000002";
const storageId = "10000000-0000-4000-8000-000000000003";
const itemId = "10000000-0000-4000-8000-000000000004";

const locationOptions: ItemLocationSelectorOptions = {
  rooms: [
    { id: roomId, label: "Kitchen" },
    {
      id: "10000000-0000-4000-8000-000000000005",
      label: "Garage",
    },
  ],
  storageLocations: [
    { id: furnitureId, label: "Cabinet", roomId },
    {
      id: "10000000-0000-4000-8000-000000000006",
      label: "Shelf",
      roomId: "10000000-0000-4000-8000-000000000005",
    },
  ],
  positions: [
    {
      id: storageId,
      locationCode: "KUC-SZF-POZ1",
      positionName: "Drawer 1",
      roomId,
      roomName: "Kitchen",
      storageId: furnitureId,
      storageName: "Cabinet",
    },
  ],
};

function source(path: string) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

function exportedAction(sourceText: string, name: string) {
  const start = sourceText.indexOf(`export async function ${name}`);
  const next = sourceText.indexOf("\nexport async function ", start + 1);

  assert.notEqual(start, -1, `${name} exists`);
  return sourceText.slice(start, next === -1 ? sourceText.length : next);
}

test("copy names use the approved suffix and preserve trimmed source names", () => {
  assert.equal(defaultCopyName("Kitchen"), "Kitchen \u2014 kopia");
  assert.equal(defaultCopyName("  Kitchen  "), "Kitchen \u2014 kopia");
});

test("copy role policy permits only approved roles", () => {
  for (const kind of ["room", "furniture", "storage"] as const) {
    assert.equal(canCopyEntity(kind, "admin"), true);
    assert.equal(canCopyEntity(kind, "domownik"), false);
    assert.equal(canCopyEntity(kind, "dziecko"), false);
  }

  assert.equal(canCopyEntity("item", "admin"), true);
  assert.equal(canCopyEntity("item", "domownik"), true);
  assert.equal(canCopyEntity("item", "dziecko"), false);
  assert.equal(canCopyEntity("item", null), false);
});

test("copy action visibility is wired to the approved UI roles", () => {
  const homePage = source("src/app/(app)/home/page.tsx");
  const itemsPage = source("src/app/(app)/items/page.tsx");

  assert.match(homePage, /const isAdmin = profile\?\.rola === "admin" && profile\.status === "aktywny"/);
  assert.match(homePage, /<RoomCard[\s\S]*?isAdmin=\{isAdmin\}/);
  assert.match(itemsPage, /const canCopy = profile\?\.status === "aktywny" &&[\s\S]*?\(profile\.rola === "admin" \|\| profile\.rola === "domownik"\)/);
  assert.match(itemsPage, /<ItemCard[\s\S]*?canCopy=\{canCopy\}/);

  for (const kind of ["room", "furniture", "storage", "item"] as const) {
    assert.equal(canCopyEntity(kind, "dziecko"), false);
  }
});

test("copy payloads require UUIDs and omit household_id", () => {
  const room = parseCopyRoomInput({
    roomId,
    name: "Kitchen Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia",
    copyStructure: true,
    household_id: "untrusted",
  });
  const furniture = parseCopyFurnitureInput({
    furnitureId,
    targetRoomId: roomId,
    name: "Cabinet Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia",
    copyStorage: false,
  });
  const storage = parseCopyStorageInput({
    storageId,
    targetFurnitureId: furnitureId,
    name: "Drawer Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia",
  });

  assert.deepEqual(room, {
    ok: true,
    input: { roomId, name: "Kitchen Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia", copyStructure: true },
  });
  assert.deepEqual(furniture, {
    ok: true,
    input: {
      furnitureId,
      targetRoomId: roomId,
      name: "Cabinet Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia",
      copyStorage: false,
    },
  });
  assert.deepEqual(storage, {
    ok: true,
    input: { storageId, targetFurnitureId: furnitureId, name: "Drawer Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia" },
  });
  assert.deepEqual(
    parseCopyRoomInput({ roomId: "not-a-uuid", name: "Copy", copyStructure: true }),
    { ok: false },
  );
});

test("Item payload supports an explicit no-location target only", () => {
  assert.deepEqual(
    parseCopyItemInput({ itemId, name: "Drill Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia", targetStorageId: null }),
    {
      ok: true,
      input: { itemId, name: "Drill Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia", targetStorageId: null },
    },
  );
  assert.deepEqual(
    parseCopyItemInput({ itemId, name: "Drill Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia", targetStorageId: storageId }),
    {
      ok: true,
      input: { itemId, name: "Drill Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia", targetStorageId: storageId },
    },
  );
  assert.deepEqual(
    parseCopyItemInput({ itemId, name: "Drill Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬Ä…Ä‚â€šĂ‚ÂÄ‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă‹â€ˇĂ„â€šĂ˘â‚¬ĹˇÄ‚â€šĂ‚Â¬Ä‚â€žĂ˘â‚¬ĹˇÄ‚â€ąĂ‚ÂĂ„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€šĂ‚Â¬Ä‚â€žĂ„â€¦Ä‚â€žĂ˘â‚¬Ĺľ kopia" }),
    { ok: false },
  );
});

test("dependent Room, Furniture and Storage selectors reset downstream choices", () => {
  const initial = getInitialItemLocationSelection(locationOptions, storageId);
  assert.deepEqual(initial, {
    roomId,
    storageId: furnitureId,
    positionId: storageId,
  });
  assert.deepEqual(getStorageOptionsForRoom(locationOptions, roomId), [
    { id: furnitureId, label: "Cabinet", roomId },
  ]);
  assert.equal(getPositionOptionsForStorage(locationOptions, furnitureId)[0]?.id, storageId);
  assert.deepEqual(selectItemLocationRoom(roomId), {
    roomId,
    storageId: "",
    positionId: "",
  });
  assert.deepEqual(
    selectItemLocationStorage(initial, furnitureId),
    { roomId, storageId: furnitureId, positionId: "" },
  );
});

test("copy item location change handlers capture event values before state callbacks", () => {
  const dialog = source("src/components/items/copy-item-dialog.tsx");
  const selectionCallbacks =
    dialog.match(/setSelection\(\(currentSelection\) =>[\s\S]*?\n\s*\);/g) ?? [];

  assert.ok(selectionCallbacks.length >= 2);
  for (const callback of selectionCallbacks) {
    assert.doesNotMatch(callback, /event\.(currentTarget|target)\.(value|checked)/);
  }

  assert.match(dialog, /const roomId = event\.currentTarget\.value;/);
  assert.match(dialog, /setSelection\(selectItemLocationRoom\(roomId\)\)/);
  assert.match(dialog, /const storageId = event\.currentTarget\.value;/);
  assert.match(
    dialog,
    /selectItemLocationStorage\(currentSelection, storageId\)/,
  );
  assert.match(dialog, /const positionId = event\.currentTarget\.value;/);
  assert.match(dialog, /positionId,/);
});

test("RPC error mapping never reports a false success", () => {
  assert.equal(mapCopyRpcError("AUTH_REQUIRED"), "auth_required");
  assert.equal(mapCopyRpcError("ADMIN_REQUIRED"), "admin_required");
  assert.equal(mapCopyRpcError("TARGET_NOT_AVAILABLE"), "target_not_available");
  assert.equal(mapCopyRpcError("unexpected database message"), "copy_unavailable");
});

test("copy dialog outcome closes and refreshes only after an explicit action success", () => {
  assert.deepEqual(
    resolveCopyDialogOutcome({ ok: true, id: roomId }, "Copy failed"),
    {
      closeDialog: true,
      clearError: true,
      errorMessage: null,
      refresh: true,
      resetForm: true,
    },
  );

  assert.deepEqual(
    resolveCopyDialogOutcome({ ok: false, code: "copy_unavailable" }, "Copy failed"),
    {
      closeDialog: false,
      clearError: false,
      errorMessage: "Copy failed",
      refresh: false,
      resetForm: false,
    },
  );
});

test("copy actions pass no household_id and return an explicit success result after a successful RPC row", () => {
  const homeActions = source("src/app/(app)/home/actions.ts");
  const itemActions = source("src/app/(app)/items/actions.ts");
  const contracts = [
    [homeActions, "copyRoom", "copy_room_with_structure", "new_room_id"],
    [homeActions, "copyFurniture", "copy_furniture_with_storage", "new_furniture_id"],
    [homeActions, "copyStorageSpace", "copy_storage_space", "new_storage_id"],
    [itemActions, "copyItem", "copy_item", "new_item_id"],
  ] as const;

  for (const [actions, actionName, rpcName, idField] of contracts) {
    const action = exportedAction(actions, actionName);

    assert.match(action, new RegExp(`supabase\\.rpc\\("${rpcName}"`));
    assert.doesNotMatch(action, /household_id/);
    assert.match(action, /if \(error \|\| !row\?\.new_/);
    assert.match(action, new RegExp(`return \\{ ok: true, id: row\\.${idField} \\}`));
    assert.doesNotMatch(action, /redirectWithStatus\\(".*_copied"\\)/);
    assert.match(action, /revalidatePath/);
  }
});

test("all entity dialogs use the explicit success contract and controlled lifecycle", () => {
  const dialogs = [
    ["src/components/home/copy-room-dialog.tsx", "copyRoom"],
    ["src/components/home/copy-furniture-dialog.tsx", "copyFurniture"],
    ["src/components/home/copy-storage-dialog.tsx", "copyStorageSpace"],
    ["src/components/items/copy-item-dialog.tsx", "copyItem"],
  ] as const;

  for (const [path, mutation] of dialogs) {
    const dialog = source(path);

    assert.match(dialog, /^"use client";/);
    assert.match(dialog, new RegExp(`await ${mutation}\\(`));
    assert.match(dialog, /const \[open, setOpen\] = useState\(false\)/);
    assert.match(dialog, /useEffect\(\(\) => \{/);
    assert.match(dialog, /dialog\.showModal\(\)/);
    assert.match(dialog, /dialog\.close\(\)/);
    assert.match(dialog, /setIsSubmitting\(true\)/);
    assert.match(dialog, /finally \{/);
    assert.match(dialog, /setIsSubmitting\(false\)/);
    assert.match(dialog, /isSubmittingRef\.current = false/);
    assert.match(dialog, /resolveCopyDialogOutcome\(result, copy\.error\)/);
    assert.match(dialog, /if \(!result\.ok\) \{/);
    assert.match(dialog, /setMessage\(outcome\.errorMessage\)/);
    assert.match(dialog, /if \(outcome\.resetForm\) resetForm\(\)/);
    assert.match(dialog, /if \(outcome\.clearError\) setMessage\(null\)/);
    assert.match(dialog, /if \(outcome\.closeDialog\) setOpen\(false\)/);
    assert.match(dialog, /if \(outcome\.refresh\) showSuccessStatus\(\)/);
    assert.match(dialog, /router\.refresh\(\)/);
    assert.match(dialog, /onCancel=\{\(event\) => \{/);
    assert.match(dialog, /event\.preventDefault\(\)/);
    assert.match(dialog, /onClose=\{resetAfterClose\}/);
    assert.match(dialog, /setMessage\(null\)/);
    assert.match(dialog, /resetForm\(\)/);
    assert.match(dialog, /triggerRef\.current\?\.focus\(\)/);
    assert.match(dialog, /type="submit"/);
    assert.match(dialog, /disabled=\{[\s\S]*?isSubmitting/);
    assert.match(dialog, /aria-busy=\{isSubmitting\}/);
  }
});

test("copy dialogs block double submit before a second action can start", () => {
  const dialogs = [
    ["src/components/home/copy-room-dialog.tsx", "copyRoom"],
    ["src/components/home/copy-furniture-dialog.tsx", "copyFurniture"],
    ["src/components/home/copy-storage-dialog.tsx", "copyStorageSpace"],
    ["src/components/items/copy-item-dialog.tsx", "copyItem"],
  ] as const;

  for (const [path, mutation] of dialogs) {
    const dialog = source(path);
    const submit = dialog.slice(
      dialog.indexOf("async function submitCopy()"),
      dialog.indexOf("return ("),
    );

    assert.match(submit, /if \(isSubmittingRef\.current/);
    assert.match(submit, /return;/);
    assert.match(submit, /isSubmittingRef\.current = true/);
    assert.equal((submit.match(new RegExp(`await ${mutation}\\(`, "g")) ?? []).length, 1);
  }
});

test("entity copy triggers use explicit labels and cannot submit edit forms", () => {
  const dialogs = [
    ["src/components/home/copy-room-dialog.tsx", "copy.room.action"],
    ["src/components/home/copy-furniture-dialog.tsx", "copy.furniture.action"],
    ["src/components/home/copy-storage-dialog.tsx", "copy.storage.action"],
    ["src/components/items/copy-item-dialog.tsx", "copy.item.action"],
  ] as const;

  for (const [path, label] of dialogs) {
    const dialog = source(path);

    assert.match(dialog, new RegExp(`\\{${label.replace(".", "\\.")}\\}`));
    assert.match(dialog, /type="button"/);
    assert.doesNotMatch(dialog, />\s*\{copy\.action\}\s*<\/button>/);
  }

  const pl = source("src/lib/i18n/locales/pl.ts");
  const en = source("src/lib/i18n/locales/en.ts");

  for (const label of [
    "Kopiuj pomieszczenie",
    "Kopiuj mebel",
    "Kopiuj schowek",
    "Kopiuj rzecz",
  ]) {
    assert.match(pl, new RegExp(label));
  }

  for (const label of [
    "Copy room",
    "Copy furniture",
    "Copy storage space",
    "Copy item",
  ]) {
    assert.match(en, new RegExp(label));
  }
});

test("copy actions pass entity data to dialogs from current cards", () => {
  const roomCard = source("src/components/home/room-card.tsx");
  const furnitureCard = source("src/components/home/storage-location-l2-card.tsx");
  const storageCard = source("src/components/home/storage-location-l3-card.tsx");
  const itemCard = source("src/components/items/item-card.tsx");

  assert.match(roomCard, /<CopyRoomDialog[\s\S]*?furnitureCount=\{room\.locations\.length\}[\s\S]*?roomId=\{room\.id\}[\s\S]*?roomName=\{room\.nazwa\}[\s\S]*?storageCount=\{positionCount\}/);
  assert.match(furnitureCard, /<CopyFurnitureDialog[\s\S]*?furnitureId=\{location\.id\}[\s\S]*?furnitureName=\{location\.nazwa\}[\s\S]*?rooms=\{roomOptions\}[\s\S]*?storageCount=\{location\.positions\.length\}/);
  assert.match(storageCard, /<CopyStorageDialog[\s\S]*?furniture=\{furnitureOptions\}[\s\S]*?storageId=\{position\.id\}[\s\S]*?storageName=\{position\.nazwa\}/);
  assert.match(itemCard, /<CopyItemDialog[\s\S]*?itemId=\{item\.id\}[\s\S]*?itemName=\{item\.nazwa\}[\s\S]*?location=\{location\}[\s\S]*?locationOptions=\{locationOptions\}/);
});

test("Room edit form layout does not stretch the delete action", () => {
  const roomCard = source("src/components/home/room-card.tsx");

  assert.match(roomCard, /grid items-start gap-3 border-t border-line pt-5 lg:grid-cols-\[1fr_auto\]/);
  assert.match(roomCard, /<div className="self-start">\s*<RoomDeleteDialog/);
});

test("copy success feedback is provided through the client URL status and refresh pattern", () => {
  const homePage = source("src/app/(app)/home/page.tsx");
  const itemPage = source("src/app/(app)/items/page.tsx");

  assert.match(homePage, /room_copied: t\.modules\.home\.statuses\.roomCopied/);
  assert.match(homePage, /furniture_copied: t\.modules\.home\.statuses\.locationCopied/);
  assert.match(homePage, /storage_copied: t\.modules\.home\.statuses\.positionCopied/);
  assert.match(itemPage, /item_copied: t\.modules\.items\.feedback\.itemCopied/);
});

test("copy UI is fully sourced from the local PL and EN dictionaries", () => {
  const types = source("src/lib/i18n/types.ts");
  const pl = source("src/lib/i18n/locales/pl.ts");
  const en = source("src/lib/i18n/locales/en.ts");

  assert.match(types, /copy: \{/);
  for (const dictionary of [pl, en]) {
    assert.match(dictionary, /copy: \{/);
    assert.match(dictionary, /itemCopied:/);
    assert.match(dictionary, /roomCopied:/);
  }
});

test("the SQL copy contract serializes names and documents the one member-safe definer exception", () => {
  const migration = source("supabase/migrations/0016_m4c1_copy_entities_v2.sql");
  const decision = source("docs/decisions/m4c-1-copy-entities-v2.md");

  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /lower\(btrim\(nazwa\)\)/);
  assert.match(migration, /create function public\.copy_item[\s\S]*?security definer/);
  assert.match(migration, /create function public\.copy_room_with_structure[\s\S]*?security invoker/);
  assert.match(decision, /SECURITY DEFINER/);
  assert.match(decision, /Domownik/);
});

test("copy dialogs render through the shared modal portal", () => {
  const dialogs = [
    "src/components/home/copy-room-dialog.tsx",
    "src/components/home/copy-furniture-dialog.tsx",
    "src/components/home/copy-storage-dialog.tsx",
    "src/components/items/copy-item-dialog.tsx",
  ];
  const modalPortal = source("src/components/ui/modal-portal.tsx");

  assert.match(modalPortal, /createPortal\(children, document\.body\)/);
  for (const path of dialogs) {
    const dialog = source(path);
    assert.match(dialog, /ModalPortal/);
    assert.match(dialog, /<ModalPortal>[\s\S]*<dialog/);
  }
});
