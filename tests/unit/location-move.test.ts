import assert from "node:assert/strict";
import test from "node:test";

import {
  locationMoveRpcName,
  mapLocationMoveError,
  mapLocationMoveRow,
  parseLocationMoveInput,
  type LocationMoveInput,
  type LocationMoveRpcRow,
} from "../../src/lib/home/location-move";

const sourceId = "AA000000-0000-0000-0000-000000000001";
const targetPositionId = "BB000000-0000-0000-0000-000000000001";

const input: LocationMoveInput = {
  sourceType: "room",
  sourceId: sourceId.toLowerCase(),
  targetPositionId: targetPositionId.toLowerCase(),
};

const successRow: LocationMoveRpcRow = {
  status: "success",
  moved_item_count: "3",
  active_item_count: 2,
  archived_item_count: "1",
  reused_target_link_count: 1,
  created_target_link_count: "2",
  removed_source_link_count: 3,
};

test("move input accepts three closed source types and normalizes both UUIDs", () => {
  for (const sourceType of ["room", "storage", "position"] as const) {
    assert.deepEqual(
      parseLocationMoveInput({ sourceType, sourceId, targetPositionId }),
      {
        ok: true,
        input: {
          sourceType,
          sourceId: sourceId.toLowerCase(),
          targetPositionId: targetPositionId.toLowerCase(),
        },
      },
    );
  }
});

test("move input rejects an unknown type and either malformed UUID", () => {
  assert.deepEqual(
    parseLocationMoveInput({
      sourceType: "table-name",
      sourceId,
      targetPositionId,
    }),
    { ok: false, code: "invalid_location_move" },
  );
  assert.deepEqual(
    parseLocationMoveInput({
      sourceType: "room",
      sourceId: "not-a-uuid",
      targetPositionId,
    }),
    { ok: false, code: "invalid_location_move" },
  );
  assert.deepEqual(
    parseLocationMoveInput({
      sourceType: "room",
      sourceId,
      targetPositionId: "not-a-uuid",
    }),
    { ok: false, code: "invalid_location_move" },
  );
});

test("move uses one constant RPC name", () => {
  assert.equal(locationMoveRpcName, "move_primary_items_from_location");
});

test("move result maps active, archived, reused, created, and removed counts", () => {
  assert.deepEqual(mapLocationMoveRow(input, successRow), {
    ...input,
    status: "success",
    movedItemCount: 3,
    activeItemCount: 2,
    archivedItemCount: 1,
    reusedTargetLinkCount: 1,
    createdTargetLinkCount: 2,
    removedSourceLinkCount: 3,
  });
});

test("idempotent empty move maps to a successful zero result", () => {
  assert.deepEqual(
    mapLocationMoveRow(input, {
      status: "success",
      moved_item_count: 0,
      active_item_count: 0,
      archived_item_count: 0,
      reused_target_link_count: 0,
      created_target_link_count: 0,
      removed_source_link_count: 0,
    }),
    {
      ...input,
      status: "success",
      movedItemCount: 0,
      activeItemCount: 0,
      archivedItemCount: 0,
      reusedTargetLinkCount: 0,
      createdTargetLinkCount: 0,
      removedSourceLinkCount: 0,
    },
  );
});

test("move mapper rejects invalid status, counts, and invariants", () => {
  assert.throws(
    () => mapLocationMoveRow(input, { ...successRow, status: "partial" }),
    /Invalid location move status/,
  );
  assert.throws(
    () =>
      mapLocationMoveRow(input, {
        ...successRow,
        moved_item_count: -1,
      }),
    /Invalid location move count/,
  );
  assert.throws(
    () =>
      mapLocationMoveRow(input, {
        ...successRow,
        active_item_count: 1,
      }),
    /Invalid location move invariant/,
  );
  assert.throws(
    () =>
      mapLocationMoveRow(input, {
        ...successRow,
        reused_target_link_count: 0,
      }),
    /Invalid location move invariant/,
  );
  assert.throws(
    () =>
      mapLocationMoveRow(input, {
        ...successRow,
        removed_source_link_count: 2,
      }),
    /Invalid location move invariant/,
  );
});

test("known move errors map to a closed safe contract", () => {
  const cases = [
    ["AUTH_REQUIRED", "auth_required"],
    ["ACTIVE_PROFILE_REQUIRED", "active_profile_required"],
    ["ADMIN_REQUIRED", "admin_required"],
    ["INVALID_SOURCE_TYPE", "invalid_source_type"],
    ["SOURCE_NOT_AVAILABLE", "source_not_available"],
    ["TARGET_NOT_AVAILABLE", "target_not_available"],
    ["TARGET_INSIDE_SOURCE", "target_inside_source"],
    ["MOVE_FAILED", "move_failed"],
  ] as const;

  for (const [message, code] of cases) {
    assert.deepEqual(mapLocationMoveError({ message }), {
      ok: false,
      code,
    });
  }
});

test("unexpected move errors do not expose database details", () => {
  assert.deepEqual(
    mapLocationMoveError({
      message: "duplicate key violates internal_index_name",
    }),
    { ok: false, code: "move_unavailable" },
  );
});
