import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLocationDeleteTargetOptions,
  canSubmitLocationDelete,
  locationDeleteResolutionRpcName,
  mapLocationDeleteResolutionError,
  mapLocationDeleteResolutionRow,
  parseLocationDeleteResolutionInput,
  type LocationDeleteResolutionInput,
  type LocationDeleteResolutionRpcRow,
} from "../../src/lib/home/location-delete-resolution";

const sourceId = "AA000000-0000-0000-0000-000000000001";
const targetId = "BB000000-0000-0000-0000-000000000001";

function input(
  resolution: LocationDeleteResolutionInput["resolution"],
): LocationDeleteResolutionInput {
  return {
    positionId: sourceId.toLowerCase(),
    resolution,
    targetPositionId: resolution === "move" ? targetId.toLowerCase() : null,
    expectedDistinctItemCount: resolution === "delete" ? 0 : 3,
    expectedLocationLinkCount: resolution === "delete" ? 0 : 5,
  };
}

function row(
  overrides: Partial<LocationDeleteResolutionRpcRow> = {},
): LocationDeleteResolutionRpcRow {
  return {
    status: "success",
    resolution: "move",
    deleted_storage_location_l3_id: sourceId.toLowerCase(),
    affected_item_count: 3,
    active_item_count: 2,
    archived_item_count: 1,
    moved_item_count: 2,
    detached_link_count: 3,
    reused_target_link_count: 1,
    created_target_link_count: 1,
    ...overrides,
  };
}

test("delete resolution parser accepts three closed modes", () => {
  for (const resolution of ["delete", "detach", "move"] as const) {
    const candidate = input(resolution);
    assert.deepEqual(parseLocationDeleteResolutionInput(candidate), {
      ok: true,
      input: candidate,
    });
  }
});

test("delete resolution parser rejects unknown modes and malformed UUIDs", () => {
  assert.deepEqual(
    parseLocationDeleteResolutionInput({ ...input("delete"), resolution: "cancel" }),
    { ok: false, code: "invalid_delete_resolution" },
  );
  assert.deepEqual(
    parseLocationDeleteResolutionInput({ ...input("delete"), positionId: "bad" }),
    { ok: false, code: "invalid_delete_resolution" },
  );
});

test("move requires a distinct UUID target", () => {
  assert.deepEqual(
    parseLocationDeleteResolutionInput({ ...input("move"), targetPositionId: null }),
    { ok: false, code: "invalid_delete_resolution" },
  );
  assert.deepEqual(
    parseLocationDeleteResolutionInput({
      ...input("move"),
      targetPositionId: sourceId,
    }),
    { ok: false, code: "invalid_delete_resolution" },
  );
});

test("delete and detach reject a target", () => {
  for (const resolution of ["delete", "detach"] as const) {
    assert.deepEqual(
      parseLocationDeleteResolutionInput({
        ...input(resolution),
        targetPositionId: targetId,
      }),
      { ok: false, code: "invalid_delete_resolution" },
    );
  }
});

test("expected dependency counts must be non-negative safe integers", () => {
  for (const invalidCount of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.deepEqual(
      parseLocationDeleteResolutionInput({
        ...input("detach"),
        expectedDistinctItemCount: invalidCount,
      }),
      { ok: false, code: "invalid_delete_resolution" },
    );
  }
});

test("M4D.5 uses one constant final RPC name", () => {
  assert.equal(
    locationDeleteResolutionRpcName,
    "delete_storage_location_l3_with_resolution",
  );
});

test("delete result accepts only an empty dependency result", () => {
  assert.equal(
    mapLocationDeleteResolutionRow(
      input("delete"),
      row({
        resolution: "delete",
        affected_item_count: 0,
        active_item_count: 0,
        archived_item_count: 0,
        moved_item_count: 0,
        detached_link_count: 0,
        reused_target_link_count: 0,
        created_target_link_count: 0,
      }),
    ).deletedPositionId,
    sourceId.toLowerCase(),
  );
});

test("detach result requires every expected source link to be detached", () => {
  const summary = mapLocationDeleteResolutionRow(
    input("detach"),
    row({
      resolution: "detach",
      moved_item_count: 0,
      detached_link_count: 5,
      reused_target_link_count: 0,
      created_target_link_count: 0,
    }),
  );
  assert.equal(summary.detachedLinkCount, 5);
});

test("move result separates moved primary and detached remaining links", () => {
  const summary = mapLocationDeleteResolutionRow(input("move"), row());
  assert.equal(summary.movedItemCount, 2);
  assert.equal(summary.detachedLinkCount, 3);
  assert.equal(summary.reusedTargetLinkCount + summary.createdTargetLinkCount, 2);
});

test("result mapper rejects invalid counts and invariants", () => {
  assert.throws(
    () => mapLocationDeleteResolutionRow(input("move"), row({ active_item_count: -1 })),
    /Invalid location delete count/,
  );
  assert.throws(
    () => mapLocationDeleteResolutionRow(input("move"), row({ moved_item_count: 1 })),
    /Invalid location delete invariant/,
  );
  assert.throws(
    () => mapLocationDeleteResolutionRow(input("move"), row({ resolution: "detach" })),
    /Invalid location delete result/,
  );
});

test("known database errors map to a closed safe contract", () => {
  const cases = [
    ["AUTH_REQUIRED", "auth_required"],
    ["ACTIVE_PROFILE_REQUIRED", "active_profile_required"],
    ["ADMIN_REQUIRED", "admin_required"],
    ["INVALID_RESOLUTION", "invalid_delete_resolution"],
    ["LOCATION_NOT_AVAILABLE", "location_not_available"],
    ["TARGET_REQUIRED", "target_required"],
    ["TARGET_NOT_AVAILABLE", "target_not_available"],
    ["TARGET_INSIDE_SOURCE", "target_inside_source"],
    ["DEPENDENCIES_CHANGED", "dependencies_changed"],
    ["DELETE_FAILED", "delete_failed"],
  ] as const;

  for (const [message, code] of cases) {
    assert.deepEqual(mapLocationDeleteResolutionError({ message }), {
      ok: false,
      code,
    });
  }

  assert.deepEqual(
    mapLocationDeleteResolutionError({ message: "internal table detail" }),
    { ok: false, code: "delete_unavailable" },
  );
});

test("target options exclude the source and build readable hierarchy paths", () => {
  assert.deepEqual(
    buildLocationDeleteTargetOptions(
      [{ id: "room-a", nazwa: "Salon" }],
      [{ id: "storage-a", room_id: "room-a", nazwa: "Komoda" }],
      [
        { id: "source", storage_location_l2_id: "storage-a", nazwa: "Szuflada 1" },
        { id: "target", storage_location_l2_id: "storage-a", nazwa: "Szuflada 2" },
        { id: "orphan", storage_location_l2_id: "missing", nazwa: "Ukryta" },
      ],
      "source",
    ),
    [{ id: "target", label: "Salon -> Komoda -> Szuflada 2" }],
  );
});

test("final action is disabled until a valid resolution and move target exist", () => {
  assert.equal(canSubmitLocationDelete(null, null), false);
  assert.equal(canSubmitLocationDelete("detach", null), true);
  assert.equal(canSubmitLocationDelete("delete", null), true);
  assert.equal(canSubmitLocationDelete("move", null), false);
  assert.equal(canSubmitLocationDelete("move", "not-a-uuid"), false);
  assert.equal(canSubmitLocationDelete("move", targetId), true);
});
