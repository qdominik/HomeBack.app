import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocationDetachRpcName,
  mapLocationDetachError,
  mapLocationDetachRow,
  parseLocationDetachInput,
  type LocationDetachRpcRow,
} from "../../src/lib/home/location-detach";

const entityId = "11111111-2222-3333-4444-555555555555";

function rpcRow(
  overrides: Partial<LocationDetachRpcRow> = {},
): LocationDetachRpcRow {
  return {
    status: "success",
    detached_item_count: 3,
    detached_link_count: 4,
    active_item_count: 2,
    archived_item_count: 1,
    ...overrides,
  };
}

test("detach input accepts only three closed location types and UUID", () => {
  for (const entityType of ["room", "storage", "position"] as const) {
    assert.deepEqual(
      parseLocationDetachInput({
        entityType,
        entityId: entityId.toUpperCase(),
      }),
      { ok: true, input: { entityType, entityId } },
    );
  }

  assert.deepEqual(
    parseLocationDetachInput({ entityType: "household", entityId }),
    { ok: false, code: "invalid_location_id" },
  );
  assert.deepEqual(
    parseLocationDetachInput({ entityType: "room", entityId: "not-a-uuid" }),
    { ok: false, code: "invalid_location_id" },
  );
});

test("detach dispatcher selects one explicit RPC per entity", () => {
  assert.equal(
    getLocationDetachRpcName("room"),
    "detach_items_from_room_location",
  );
  assert.equal(
    getLocationDetachRpcName("storage"),
    "detach_items_from_storage_location_l2",
  );
  assert.equal(
    getLocationDetachRpcName("position"),
    "detach_items_from_storage_location_l3",
  );
});

test("an arbitrary RPC name cannot be used as a location type", () => {
  assert.deepEqual(
    parseLocationDetachInput({
      entityType: "delete_item_permanently",
      entityId,
    }),
    { ok: false, code: "invalid_location_id" },
  );
});

test("detach result keeps distinct Item and deleted link counts separate", () => {
  assert.deepEqual(
    mapLocationDetachRow(
      { entityType: "room", entityId },
      rpcRow({
        detached_item_count: "3",
        detached_link_count: "4",
        active_item_count: "2",
        archived_item_count: "1",
      }),
    ),
    {
      entityType: "room",
      entityId,
      status: "success",
      detachedItemCount: 3,
      detachedLinkCount: 4,
      activeItemCount: 2,
      archivedItemCount: 1,
    },
  );
});

test("idempotent empty detach maps to a successful zero result", () => {
  assert.deepEqual(
    mapLocationDetachRow(
      { entityType: "position", entityId },
      rpcRow({
        detached_item_count: 0,
        detached_link_count: 0,
        active_item_count: 0,
        archived_item_count: 0,
      }),
    ),
    {
      entityType: "position",
      entityId,
      status: "success",
      detachedItemCount: 0,
      detachedLinkCount: 0,
      activeItemCount: 0,
      archivedItemCount: 0,
    },
  );
});

test("detach mapper rejects invalid status, counts, and invariants", () => {
  assert.throws(
    () =>
      mapLocationDetachRow(
        { entityType: "room", entityId },
        rpcRow({ status: "partial" }),
      ),
    /Invalid location detach status/,
  );
  assert.throws(
    () =>
      mapLocationDetachRow(
        { entityType: "room", entityId },
        rpcRow({ detached_link_count: -1 }),
      ),
    /Invalid location detach count/,
  );
  assert.throws(
    () =>
      mapLocationDetachRow(
        { entityType: "room", entityId },
        rpcRow({ active_item_count: 1 }),
      ),
    /Invalid location detach invariant/,
  );
  assert.throws(
    () =>
      mapLocationDetachRow(
        { entityType: "room", entityId },
        rpcRow({ detached_link_count: 2 }),
      ),
    /Invalid location detach invariant/,
  );
});

test("known detach errors map to a closed safe contract", () => {
  assert.deepEqual(mapLocationDetachError({ message: "AUTH_REQUIRED" }), {
    ok: false,
    code: "auth_required",
  });
  assert.deepEqual(
    mapLocationDetachError({ message: "ACTIVE_PROFILE_REQUIRED" }),
    { ok: false, code: "active_profile_required" },
  );
  assert.deepEqual(mapLocationDetachError({ message: "ADMIN_REQUIRED" }), {
    ok: false,
    code: "admin_required",
  });
  assert.deepEqual(
    mapLocationDetachError({ message: "LOCATION_NOT_AVAILABLE" }),
    { ok: false, code: "location_not_available" },
  );
  assert.deepEqual(mapLocationDetachError({ message: "DETACH_FAILED" }), {
    ok: false,
    code: "detach_failed",
  });
});

test("unexpected database errors do not expose internal details", () => {
  assert.deepEqual(
    mapLocationDetachError({ message: "relation internal failed" }),
    { ok: false, code: "detach_unavailable" },
  );
});
