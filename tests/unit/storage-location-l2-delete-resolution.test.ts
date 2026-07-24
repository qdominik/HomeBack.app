import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildStorageLocationL2DeleteTargetOptions,
  canSubmitStorageLocationL2Delete,
  mapStorageLocationL2DeleteResolutionError,
  mapStorageLocationL2DeleteResolutionRow,
  parseStorageLocationL2DeleteResolutionInput,
  storageLocationL2DeleteResolutionRpcName,
  storageLocationL2MoveSourceType,
  type StorageLocationL2DeleteResolutionInput,
  type StorageLocationL2DeleteResolutionRpcRow,
} from "../../src/lib/home/storage-location-l2-delete-resolution";

const sourceId = "11111111-1111-4111-8111-111111111111";
const targetId = "22222222-2222-4222-8222-222222222222";

function input(
  overrides: Partial<StorageLocationL2DeleteResolutionInput> = {},
): StorageLocationL2DeleteResolutionInput {
  return {
    storageLocationL2Id: sourceId,
    resolution: "move",
    targetPositionId: targetId,
    expectedStorageLocationL3Count: 2,
    expectedDistinctItemCount: 3,
    expectedLocationLinkCount: 4,
    ...overrides,
  };
}

function row(
  overrides: Partial<StorageLocationL2DeleteResolutionRpcRow> = {},
): StorageLocationL2DeleteResolutionRpcRow {
  return {
    status: "success",
    resolution: "move",
    deleted_storage_location_l2_id: sourceId,
    deleted_storage_location_l3_count: 2,
    affected_item_count: 3,
    active_item_count: 2,
    archived_item_count: 1,
    moved_item_count: 2,
    detached_link_count: 2,
    reused_target_link_count: 1,
    created_target_link_count: 1,
    removed_source_link_count: 2,
    ...overrides,
  };
}

test("M4D.6 accepts only the three closed resolutions", () => {
  for (const resolution of ["delete", "detach", "move"] as const) {
    const targetPositionId = resolution === "move" ? targetId : null;
    assert.equal(
      parseStorageLocationL2DeleteResolutionInput({
        ...input({ resolution, targetPositionId }),
      }).ok,
      true,
    );
  }

  assert.deepEqual(
    parseStorageLocationL2DeleteResolutionInput({
      ...input(),
      resolution: "archive",
    }),
    { ok: false, code: "invalid_delete_resolution" },
  );
});

test("M4D.6 validates source UUID and all expected counts", () => {
  assert.equal(
    parseStorageLocationL2DeleteResolutionInput({
      ...input(),
      storageLocationL2Id: "not-a-uuid",
    }).ok,
    false,
  );

  for (const field of [
    "expectedStorageLocationL3Count",
    "expectedDistinctItemCount",
    "expectedLocationLinkCount",
  ] as const) {
    assert.equal(
      parseStorageLocationL2DeleteResolutionInput({
        ...input(),
        [field]: -1,
      }).ok,
      false,
    );
  }
});

test("M4D.6 requires target only for move", () => {
  assert.equal(
    parseStorageLocationL2DeleteResolutionInput(
      input({ targetPositionId: null }),
    ).ok,
    false,
  );
  assert.equal(
    parseStorageLocationL2DeleteResolutionInput(
      input({ resolution: "delete", targetPositionId: targetId }),
    ).ok,
    false,
  );
  assert.equal(
    parseStorageLocationL2DeleteResolutionInput(
      input({ resolution: "detach", targetPositionId: targetId }),
    ).ok,
    false,
  );
});

test("M4D.6 maps a complete move contract", () => {
  const result = mapStorageLocationL2DeleteResolutionRow(input(), row());

  assert.equal(result.deletedStorageLocationL2Id, sourceId);
  assert.equal(result.deletedStorageLocationL3Count, 2);
  assert.equal(result.affectedItemCount, 3);
  assert.equal(result.movedItemCount, 2);
  assert.equal(result.detachedLinkCount, 2);
  assert.equal(result.reusedTargetLinkCount, 1);
  assert.equal(result.createdTargetLinkCount, 1);
  assert.equal(result.removedSourceLinkCount, 2);
});

test("M4D.6 validates delete and detach invariants", () => {
  assert.doesNotThrow(() =>
    mapStorageLocationL2DeleteResolutionRow(
      input({
        resolution: "delete",
        targetPositionId: null,
        expectedStorageLocationL3Count: 1,
        expectedDistinctItemCount: 0,
        expectedLocationLinkCount: 0,
      }),
      row({
        resolution: "delete",
        deleted_storage_location_l3_count: 1,
        affected_item_count: 0,
        active_item_count: 0,
        archived_item_count: 0,
        moved_item_count: 0,
        detached_link_count: 0,
        reused_target_link_count: 0,
        created_target_link_count: 0,
        removed_source_link_count: 0,
      }),
    ),
  );

  assert.doesNotThrow(() =>
    mapStorageLocationL2DeleteResolutionRow(
      input({
        resolution: "detach",
        targetPositionId: null,
      }),
      row({
        resolution: "detach",
        moved_item_count: 0,
        detached_link_count: 4,
        reused_target_link_count: 0,
        created_target_link_count: 0,
        removed_source_link_count: 0,
      }),
    ),
  );
});

test("M4D.6 rejects missing fields, negative results and broken invariants", () => {
  assert.throws(() =>
    mapStorageLocationL2DeleteResolutionRow(input(), {
      ...row(),
      status: "unknown",
    }),
  );
  assert.throws(() =>
    mapStorageLocationL2DeleteResolutionRow(input(), {
      ...row(),
      affected_item_count: -1,
    }),
  );
  assert.throws(() =>
    mapStorageLocationL2DeleteResolutionRow(input(), {
      ...row(),
      deleted_storage_location_l3_count: 1,
    }),
  );
  assert.throws(() =>
    mapStorageLocationL2DeleteResolutionRow(input(), {
      ...row(),
      created_target_link_count: 0,
    }),
  );
  assert.throws(() =>
    mapStorageLocationL2DeleteResolutionRow(input(), {
      ...row(),
      removed_source_link_count: 1,
    }),
  );
});

test("M4D.6 maps controlled errors without exposing database details", () => {
  assert.deepEqual(
    mapStorageLocationL2DeleteResolutionError({
      message: "DEPENDENCIES_CHANGED",
    }),
    { ok: false, code: "dependencies_changed" },
  );
  assert.deepEqual(
    mapStorageLocationL2DeleteResolutionError({
      message: "TARGET_IN_SOURCE_SUBTREE",
    }),
    { ok: false, code: "target_in_source_subtree" },
  );
  assert.deepEqual(
    mapStorageLocationL2DeleteResolutionError({
      message: "postgres internal detail",
    }),
    { ok: false, code: "delete_unavailable" },
  );
});

test("M4D.6 target options exclude the full source furniture subtree", () => {
  const options = buildStorageLocationL2DeleteTargetOptions(
    [
      { id: "room-a", nazwa: "Salon" },
      { id: "room-b", nazwa: "Sypialnia" },
    ],
    [
      { id: "storage-a", nazwa: "Komoda", room_id: "room-a" },
      { id: "storage-b", nazwa: "Szafa", room_id: "room-a" },
      { id: "storage-c", nazwa: "Łóżko", room_id: "room-b" },
    ],
    [
      {
        id: "position-a",
        nazwa: "Szuflada 1",
        storage_location_l2_id: "storage-a",
      },
      {
        id: "position-b",
        nazwa: "Górna półka",
        storage_location_l2_id: "storage-b",
      },
      {
        id: "position-c",
        nazwa: "Schowek pod łóżkiem",
        storage_location_l2_id: "storage-c",
      },
    ],
    "storage-a",
  );

  assert.deepEqual(options, [
    {
      id: "position-b",
      label: "Salon -> Szafa -> Górna półka",
    },
    {
      id: "position-c",
      label: "Sypialnia -> Łóżko -> Schowek pod łóżkiem",
    },
  ]);
});

test("M4D.6 submit guard requires a valid move target", () => {
  assert.equal(canSubmitStorageLocationL2Delete("delete", null), true);
  assert.equal(canSubmitStorageLocationL2Delete("detach", null), true);
  assert.equal(canSubmitStorageLocationL2Delete("move", null), false);
  assert.equal(canSubmitStorageLocationL2Delete("move", targetId), true);
  assert.equal(canSubmitStorageLocationL2Delete(null, null), false);
});

test("M4D.6 keeps constant RPC and storage source identifiers", () => {
  assert.equal(
    storageLocationL2DeleteResolutionRpcName,
    "delete_storage_location_l2_with_resolution",
  );
  assert.equal(storageLocationL2MoveSourceType, "storage");
});

test("M4D.6 replaces only the Furniture delete path and preserves M4D.5", () => {
  const furnitureCard = readFileSync(
    "src/components/home/storage-location-l2-card.tsx",
    "utf8",
  );
  const storageSpaceCard = readFileSync(
    "src/components/home/storage-location-l3-card.tsx",
    "utf8",
  );

  assert.match(furnitureCard, /StorageLocationL2DeleteDialog/);
  assert.doesNotMatch(furnitureCard, /ConfirmDeleteButton|window\.confirm/);
  assert.match(storageSpaceCard, /StorageLocationL3DeleteDialog/);
});

test("M4D.6 loads context lazily and uses one final server-side RPC", () => {
  const dialog = readFileSync(
    "src/components/home/storage-location-l2-delete-dialog.tsx",
    "utf8",
  );
  const actions = readFileSync("src/app/(app)/home/actions.ts", "utf8");
  const actionStart = actions.indexOf(
    "export async function deleteStorageLocationL2WithResolution",
  );
  const actionEnd =
    actions.indexOf("\n}\n\nasync function parentLocationContext", actionStart) + 2;
  const finalAction = actions.slice(actionStart, actionEnd);

  assert.match(dialog, /getStorageLocationL2DeletionContext/);
  assert.match(dialog, /deleteStorageLocationL2WithResolution/);
  assert.equal((finalAction.match(/supabase\.rpc\(/g) ?? []).length, 1);
  assert.match(finalAction, /revalidatePath\(routes\.home\)/);
  assert.match(finalAction, /revalidatePath\(routes\.items\)/);
  assert.doesNotMatch(finalAction, /\.from\("storage_location_l[23]"\)/);
});
