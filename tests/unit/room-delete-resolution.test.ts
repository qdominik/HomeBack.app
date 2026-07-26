import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildRoomDeleteTargetOptions,
  canSubmitRoomDelete,
  mapRoomDeleteResolutionError,
  mapRoomDeleteResolutionRow,
  parseRoomDeleteResolutionInput,
  roomDeleteResolutionRpcName,
  roomMoveSourceType,
  type RoomDeleteResolutionInput,
  type RoomDeleteResolutionRpcRow,
} from "../../src/lib/home/room-delete-resolution";

const sourceId = "11111111-1111-4111-8111-111111111111";
const targetId = "22222222-2222-4222-8222-222222222222";

function input(
  overrides: Partial<RoomDeleteResolutionInput> = {},
): RoomDeleteResolutionInput {
  return {
    roomId: sourceId,
    resolution: "move",
    targetPositionId: targetId,
    expectedStorageLocationL2Count: 2,
    expectedStorageLocationL3Count: 3,
    expectedDistinctItemCount: 4,
    expectedLocationLinkCount: 5,
    ...overrides,
  };
}

function row(
  overrides: Partial<RoomDeleteResolutionRpcRow> = {},
): RoomDeleteResolutionRpcRow {
  return {
    status: "success",
    resolution: "move",
    deleted_room_id: sourceId,
    deleted_storage_location_l2_count: 2,
    deleted_storage_location_l3_count: 3,
    affected_item_count: 4,
    active_item_count: 3,
    archived_item_count: 1,
    moved_item_count: 3,
    detached_link_count: 2,
    reused_target_link_count: 1,
    created_target_link_count: 2,
    removed_source_link_count: 3,
    ...overrides,
  };
}

test("M4D.7 accepts only delete, detach and move", () => {
  for (const resolution of ["delete", "detach", "move"] as const) {
    const targetPositionId = resolution === "move" ? targetId : null;
    assert.equal(
      parseRoomDeleteResolutionInput({
        ...input({ resolution, targetPositionId }),
      }).ok,
      true,
    );
  }

  assert.deepEqual(
    parseRoomDeleteResolutionInput({ ...input(), resolution: "archive" }),
    { ok: false, code: "invalid_delete_resolution" },
  );
});

test("M4D.7 validates UUIDs, targets and every snapshot count", () => {
  assert.equal(
    parseRoomDeleteResolutionInput({ ...input(), roomId: "not-a-uuid" }).ok,
    false,
  );
  assert.equal(
    parseRoomDeleteResolutionInput({
      ...input({ resolution: "move" }),
      targetPositionId: null,
    }).ok,
    false,
  );
  assert.equal(
    parseRoomDeleteResolutionInput({
      ...input({ resolution: "detach", targetPositionId: null }),
      targetPositionId: targetId,
    }).ok,
    false,
  );

  for (const key of [
    "expectedStorageLocationL2Count",
    "expectedStorageLocationL3Count",
    "expectedDistinctItemCount",
    "expectedLocationLinkCount",
  ] as const) {
    assert.equal(
      parseRoomDeleteResolutionInput({ ...input(), [key]: -1 }).ok,
      false,
    );
    assert.equal(
      parseRoomDeleteResolutionInput({ ...input(), [key]: 1.5 }).ok,
      false,
    );
  }
});

test("M4D.7 normalizes UUIDs without accepting client household data", () => {
  const result = parseRoomDeleteResolutionInput({
    ...input(),
    roomId: sourceId.toUpperCase(),
    targetPositionId: targetId.toUpperCase(),
    householdId: "33333333-3333-4333-8333-333333333333",
  });

  assert.deepEqual(result, { ok: true, input: input() });
  assert.equal(
    result.ok && "householdId" in result.input,
    false,
  );
});

test("M4D.7 maps a valid move result and numeric bigint strings", () => {
  assert.deepEqual(
    mapRoomDeleteResolutionRow(
      input(),
      row({
        deleted_storage_location_l2_count: "2",
        deleted_storage_location_l3_count: "3",
        affected_item_count: "4",
        active_item_count: "3",
        archived_item_count: "1",
        moved_item_count: "3",
        detached_link_count: "2",
        reused_target_link_count: "1",
        created_target_link_count: "2",
        removed_source_link_count: "3",
      }),
    ),
    {
      ...input(),
      status: "success",
      deletedRoomId: sourceId,
      deletedStorageLocationL2Count: 2,
      deletedStorageLocationL3Count: 3,
      affectedItemCount: 4,
      activeItemCount: 3,
      archivedItemCount: 1,
      movedItemCount: 3,
      detachedLinkCount: 2,
      reusedTargetLinkCount: 1,
      createdTargetLinkCount: 2,
      removedSourceLinkCount: 3,
    },
  );
});

test("M4D.7 rejects malformed RPC rows and counter invariants", () => {
  for (const invalidRow of [
    row({ status: "failed" }),
    row({ resolution: "detach" }),
    row({ deleted_room_id: targetId }),
    row({ deleted_storage_location_l2_count: 1 }),
    row({ deleted_storage_location_l3_count: 2 }),
    row({ affected_item_count: 5 }),
    row({ moved_item_count: 4 }),
    row({ created_target_link_count: 1 }),
    row({ removed_source_link_count: 2 }),
    row({ detached_link_count: 1 }),
    row({ affected_item_count: "NaN" }),
  ]) {
    assert.throws(() => mapRoomDeleteResolutionRow(input(), invalidRow));
  }
});

test("M4D.7 enforces delete and detach result invariants", () => {
  const deleteInput = input({
    resolution: "delete",
    targetPositionId: null,
    expectedDistinctItemCount: 0,
    expectedLocationLinkCount: 0,
  });
  const deleteRow = row({
    resolution: "delete",
    affected_item_count: 0,
    active_item_count: 0,
    archived_item_count: 0,
    moved_item_count: 0,
    detached_link_count: 0,
    reused_target_link_count: 0,
    created_target_link_count: 0,
    removed_source_link_count: 0,
  });

  assert.equal(
    mapRoomDeleteResolutionRow(deleteInput, deleteRow).resolution,
    "delete",
  );
  assert.throws(() =>
    mapRoomDeleteResolutionRow(
      deleteInput,
      { ...deleteRow, affected_item_count: 1, active_item_count: 1 },
    ),
  );

  const detachInput = input({
    resolution: "detach",
    targetPositionId: null,
  });
  const detachRow = row({
    resolution: "detach",
    moved_item_count: 0,
    detached_link_count: 5,
    reused_target_link_count: 0,
    created_target_link_count: 0,
    removed_source_link_count: 0,
  });

  assert.equal(
    mapRoomDeleteResolutionRow(detachInput, detachRow).resolution,
    "detach",
  );
  assert.throws(() =>
    mapRoomDeleteResolutionRow(
      detachInput,
      { ...detachRow, detached_link_count: 4 },
    ),
  );
});

test("M4D.7 maps database errors to a closed public contract", () => {
  const mappings = {
    AUTH_REQUIRED: "auth_required",
    ACTIVE_PROFILE_REQUIRED: "active_profile_required",
    ADMIN_REQUIRED: "admin_required",
    INVALID_RESOLUTION: "invalid_delete_resolution",
    INVALID_EXPECTED_COUNTS: "invalid_delete_resolution",
    LOCATION_NOT_AVAILABLE: "location_not_available",
    TARGET_REQUIRED: "target_required",
    TARGET_NOT_ALLOWED: "target_not_allowed",
    TARGET_NOT_AVAILABLE: "target_not_available",
    TARGET_IN_SOURCE_SUBTREE: "target_in_source_subtree",
    DEPENDENCIES_CHANGED: "dependencies_changed",
    DELETE_FAILED: "delete_failed",
  } as const;

  for (const [databaseCode, code] of Object.entries(mappings)) {
    assert.deepEqual(
      mapRoomDeleteResolutionError({ message: `error: ${databaseCode}` }),
      { ok: false, code },
    );
  }

  assert.deepEqual(mapRoomDeleteResolutionError({ message: "internal" }), {
    ok: false,
    code: "delete_unavailable",
  });
});

test("M4D.7 target options exclude the source Room and sort paths", () => {
  assert.deepEqual(
    buildRoomDeleteTargetOptions(
      [
        { id: "room-a", nazwa: "Źródło" },
        { id: "room-b", nazwa: "Salon" },
        { id: "room-c", nazwa: "Biuro" },
      ],
      [
        { id: "storage-a", nazwa: "Komoda", room_id: "room-a" },
        { id: "storage-b", nazwa: "Szafa", room_id: "room-b" },
        { id: "storage-c", nazwa: "Regał", room_id: "room-c" },
      ],
      [
        {
          id: "position-a",
          nazwa: "Szuflada",
          storage_location_l2_id: "storage-a",
        },
        {
          id: "position-b",
          nazwa: "Półka",
          storage_location_l2_id: "storage-b",
        },
        {
          id: "position-c",
          nazwa: "Organizer",
          storage_location_l2_id: "storage-c",
        },
        {
          id: "dangling",
          nazwa: "Brak rodzica",
          storage_location_l2_id: "missing",
        },
      ],
      "room-a",
    ),
    [
      { id: "position-c", label: "Biuro -> Regał -> Organizer" },
      { id: "position-b", label: "Salon -> Szafa -> Półka" },
    ],
  );
});

test("M4D.7 submit guard and identifiers remain closed", () => {
  assert.equal(canSubmitRoomDelete("delete", null), true);
  assert.equal(canSubmitRoomDelete("detach", null), true);
  assert.equal(canSubmitRoomDelete("move", null), false);
  assert.equal(canSubmitRoomDelete("move", targetId), true);
  assert.equal(canSubmitRoomDelete(null, null), false);
  assert.equal(roomDeleteResolutionRpcName, "delete_room_with_resolution");
  assert.equal(roomMoveSourceType, "room");
});

test("M4D.7 replaces only the Room delete path", () => {
  const roomCard = readFileSync("src/components/home/room-card.tsx", "utf8");
  const furnitureCard = readFileSync(
    "src/components/home/storage-location-l2-card.tsx",
    "utf8",
  );

  assert.match(roomCard, /RoomDeleteDialog/);
  assert.doesNotMatch(roomCard, /ConfirmDeleteButton|window\.confirm/);
  assert.match(furnitureCard, /StorageLocationL2DeleteDialog/);
});

test("M4D.7 wires an enabled button trigger to open and cancel the dialog", () => {
  const dialog = readFileSync(
    "src/components/home/room-delete-dialog.tsx",
    "utf8",
  ).replace(/\r\n/g, "\n");
  const triggerStart = dialog.indexOf(
    '<button\n        className={buttonClassName({ variant: "danger" })}',
  );
  const triggerEnd = dialog.indexOf("</button>", triggerStart) + 9;
  const trigger = dialog.slice(triggerStart, triggerEnd);
  const openStart = dialog.indexOf("  function openDialog()");
  const openEnd = dialog.indexOf(
    "\n  }\n\n  function closeDialog",
    openStart,
  ) + 4;
  const openDialog = dialog.slice(openStart, openEnd);
  const closeStart = dialog.indexOf("  function closeDialog()");
  const closeEnd = dialog.indexOf(
    "\n  }\n\n  function resetAfterClose",
    closeStart,
  ) + 4;
  const closeDialog = dialog.slice(closeStart, closeEnd);

  assert.notEqual(triggerStart, -1);
  assert.match(trigger, /onClick=\{openDialog\}/);
  assert.match(trigger, /type="button"/);
  assert.doesNotMatch(trigger, /disabled=/);
  assert.match(openDialog, /dialog\.showModal\(\)/);
  assert.match(openDialog, /void loadContext\(\)/);
  assert.doesNotMatch(openDialog, /deleteRoomWithResolution/);
  assert.match(closeDialog, /dialogRef\.current\?\.close\(\)/);
  assert.match(dialog, /onClick=\{closeDialog\}/);
  assert.match(dialog, /onClose=\{resetAfterClose\}/);
});

test("M4D.7 loads context lazily and final action performs one RPC", () => {
  const dialog = readFileSync(
    "src/components/home/room-delete-dialog.tsx",
    "utf8",
  );
  const actions = readFileSync("src/app/(app)/home/actions.ts", "utf8");
  const normalizedActions = actions.replace(/\r\n/g, "\n");
  const actionStart = normalizedActions.indexOf(
    "export async function deleteRoomWithResolution",
  );
  const actionEnd =
    normalizedActions.indexOf(
      "\n}\n\nexport async function createStorageLocationL2",
      actionStart,
    ) + 2;
  const finalAction = normalizedActions.slice(actionStart, actionEnd);

  assert.match(dialog, /getRoomDeletionContext/);
  assert.match(dialog, /deleteRoomWithResolution/);
  assert.match(dialog, /totalLocationLinksCount === 0/);
  assert.equal((finalAction.match(/supabase\.rpc\(/g) ?? []).length, 1);
  assert.match(finalAction, /revalidatePath\(routes\.home\)/);
  assert.match(finalAction, /revalidatePath\(routes\.items\)/);
  assert.doesNotMatch(finalAction, /\.from\("room"\)/);
});
