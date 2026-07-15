import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocationDependencySummaryRpcName,
  mapLocationDependencySummaryError,
  mapLocationDependencySummaryRow,
  parseLocationDependencySummaryInput,
  type LocationDependencySummaryRpcRow,
} from "../../src/lib/home/location-dependency-summary";

const entityId = "11111111-2222-3333-4444-555555555555";

function rpcRow(
  overrides: Partial<LocationDependencySummaryRpcRow> = {},
): LocationDependencySummaryRpcRow {
  return {
    entity_id: entityId,
    storage_count: 2,
    position_count: 3,
    active_direct_items_count: 0,
    active_nested_items_count: 2,
    active_items_count: 2,
    archived_direct_items_count: 0,
    archived_nested_items_count: 1,
    archived_items_count: 1,
    total_distinct_items_count: 3,
    primary_location_links_count: 2,
    non_primary_location_links_count: 2,
    total_location_links_count: 4,
    requires_item_resolution: true,
    requires_subtree_deletion: true,
    can_delete_immediately: false,
    ...overrides,
  };
}

test("dependency summary input accepts only a closed entity type and UUID", () => {
  assert.deepEqual(
    parseLocationDependencySummaryInput({
      entityType: "room",
      entityId: entityId.toUpperCase(),
    }),
    {
      ok: true,
      input: { entityType: "room", entityId },
    },
  );
  assert.deepEqual(
    parseLocationDependencySummaryInput({
      entityType: "household",
      entityId,
    }),
    { ok: false, code: "invalid_location_id" },
  );
  assert.deepEqual(
    parseLocationDependencySummaryInput({
      entityType: "position",
      entityId: "not-a-uuid",
    }),
    { ok: false, code: "invalid_location_id" },
  );
});

test("dependency summary dispatcher selects one explicit RPC per entity", () => {
  assert.equal(
    getLocationDependencySummaryRpcName("room"),
    "get_room_location_dependency_summary",
  );
  assert.equal(
    getLocationDependencySummaryRpcName("storage"),
    "get_storage_location_l2_dependency_summary",
  );
  assert.equal(
    getLocationDependencySummaryRpcName("position"),
    "get_storage_location_l3_dependency_summary",
  );
});

test("room summary maps structural, active, archived, and link counts", () => {
  const summary = mapLocationDependencySummaryRow(
    "room",
    rpcRow({
      storage_count: "2",
      active_nested_items_count: "2",
      total_location_links_count: "4",
    }),
  );

  assert.deepEqual(summary, {
    entityType: "room",
    entityId,
    storageCount: 2,
    positionCount: 3,
    activeDirectItemsCount: 0,
    activeNestedItemsCount: 2,
    activeItemsCount: 2,
    archivedDirectItemsCount: 0,
    archivedNestedItemsCount: 1,
    archivedItemsCount: 1,
    totalDistinctItemsCount: 3,
    primaryLocationLinksCount: 2,
    nonPrimaryLocationLinksCount: 2,
    totalLocationLinksCount: 4,
    requiresItemResolution: true,
    requiresSubtreeDeletion: true,
    canDeleteImmediately: false,
  });
});

test("storage summary keeps direct item counts at zero", () => {
  const summary = mapLocationDependencySummaryRow(
    "storage",
    rpcRow({ storage_count: 0 }),
  );

  assert.equal(summary.activeDirectItemsCount, 0);
  assert.equal(summary.archivedDirectItemsCount, 0);
  assert.equal(summary.activeNestedItemsCount, 2);
  assert.equal(summary.archivedNestedItemsCount, 1);
});

test("position summary maps linked items as direct dependencies", () => {
  const summary = mapLocationDependencySummaryRow(
    "position",
    rpcRow({
      storage_count: 0,
      position_count: 0,
      active_direct_items_count: 1,
      active_nested_items_count: 0,
      active_items_count: 1,
      archived_direct_items_count: 1,
      archived_nested_items_count: 0,
      total_distinct_items_count: 2,
      primary_location_links_count: 1,
      non_primary_location_links_count: 1,
      total_location_links_count: 2,
      requires_subtree_deletion: false,
    }),
  );

  assert.equal(summary.activeDirectItemsCount, 1);
  assert.equal(summary.archivedDirectItemsCount, 1);
  assert.equal(summary.activeNestedItemsCount, 0);
  assert.equal(summary.archivedNestedItemsCount, 0);
  assert.equal(summary.totalDistinctItemsCount, 2);
  assert.equal(summary.totalLocationLinksCount, 2);
});

test("distinct item counts remain separate from blocking location rows", () => {
  const summary = mapLocationDependencySummaryRow("room", rpcRow());

  assert.equal(summary.totalDistinctItemsCount, 3);
  assert.equal(summary.totalLocationLinksCount, 4);
  assert.equal(
    summary.primaryLocationLinksCount + summary.nonPrimaryLocationLinksCount,
    summary.totalLocationLinksCount,
  );
});

test("known database errors map to safe application results", () => {
  assert.deepEqual(mapLocationDependencySummaryError({ message: "AUTH_REQUIRED" }), {
    ok: false,
    code: "auth_required",
  });
  assert.deepEqual(
    mapLocationDependencySummaryError({ message: "ACTIVE_PROFILE_REQUIRED" }),
    { ok: false, code: "active_profile_required" },
  );
  assert.deepEqual(
    mapLocationDependencySummaryError({ message: "ADMIN_REQUIRED" }),
    { ok: false, code: "admin_required" },
  );
  assert.deepEqual(
    mapLocationDependencySummaryError({ message: "LOCATION_NOT_AVAILABLE" }),
    { ok: false, code: "location_not_available" },
  );
});

test("unexpected database errors do not expose internal details", () => {
  assert.deepEqual(
    mapLocationDependencySummaryError({ message: "relation internal failed" }),
    { ok: false, code: "summary_unavailable" },
  );
});

test("invalid RPC data is rejected instead of silently changing counts", () => {
  assert.throws(
    () =>
      mapLocationDependencySummaryRow(
        "room",
        rpcRow({ total_distinct_items_count: -1 }),
      ),
    /Invalid location dependency count/,
  );
});


test("summary mapper rejects contradictory aggregate counts and entity invariants", () => {
  const expectInvalid = (
    entityType: "room" | "storage" | "position",
    overrides: Partial<LocationDependencySummaryRpcRow>,
  ) => {
    assert.throws(
      () => mapLocationDependencySummaryRow(entityType, rpcRow(overrides)),
      /Invalid location dependency summary invariant/,
    );
  };

  expectInvalid("room", { active_items_count: 1 });
  expectInvalid("room", { archived_items_count: 0 });
  expectInvalid("room", { total_distinct_items_count: 2 });
  expectInvalid("room", { total_location_links_count: 3 });
  expectInvalid("room", { requires_item_resolution: false });
  expectInvalid("room", { can_delete_immediately: true });
  expectInvalid("room", { active_direct_items_count: 1 });
  expectInvalid("room", { requires_subtree_deletion: false });

  expectInvalid("storage", {
    storage_count: 0,
    active_direct_items_count: 1,
    requires_subtree_deletion: true,
  });
  expectInvalid("storage", {
    storage_count: 0,
    requires_subtree_deletion: false,
  });

  expectInvalid("position", {
    storage_count: 0,
    position_count: 0,
    active_direct_items_count: 1,
    active_nested_items_count: 1,
    active_items_count: 2,
    archived_direct_items_count: 1,
    archived_nested_items_count: 0,
    archived_items_count: 1,
    total_distinct_items_count: 3,
    primary_location_links_count: 1,
    non_primary_location_links_count: 1,
    total_location_links_count: 2,
    requires_item_resolution: true,
    requires_subtree_deletion: false,
    can_delete_immediately: false,
  });
  expectInvalid("position", {
    storage_count: 0,
    position_count: 0,
    active_direct_items_count: 1,
    active_nested_items_count: 0,
    active_items_count: 1,
    archived_direct_items_count: 1,
    archived_nested_items_count: 0,
    archived_items_count: 1,
    total_distinct_items_count: 2,
    primary_location_links_count: 1,
    non_primary_location_links_count: 1,
    total_location_links_count: 2,
    requires_item_resolution: true,
    requires_subtree_deletion: true,
    can_delete_immediately: false,
  });
});
