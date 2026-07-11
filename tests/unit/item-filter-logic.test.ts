import assert from "node:assert/strict";
import test from "node:test";
import {
  hasItemFilters,
  parseItemSearchParams,
  searchPattern,
} from "../../src/lib/items/item-search-params";

const validUuid = "11111111-2222-3333-4444-555555555555";

test("item filters use safe defaults for empty and unknown parameters", () => {
  assert.deepEqual(parseItemSearchParams({}), {
    categoryId: null,
    categoryKey: null,
    positionId: null,
    query: "",
    roomId: null,
    sort: "recent",
    status: null,
    storageId: null,
  });

  assert.equal(parseItemSearchParams({ sort: "newest", status: "removed" }).sort, "recent");
  assert.equal(parseItemSearchParams({ sort: "newest", status: "removed" }).status, null);
});

test("item filters trim and cap a text query", () => {
  const filters = parseItemSearchParams({
    q: `  ${"a".repeat(120)}  `,
  });

  assert.equal(filters.query, "a".repeat(100));
  assert.equal(searchPattern("latarka_100%"), "%latarka100%");
});

test("item filters preserve valid UUIDs and reject malformed values", () => {
  const filters = parseItemSearchParams({
    category: validUuid.toUpperCase(),
    position: "not-a-uuid",
    room: validUuid,
    storage: "11111111-2222-3333-4444-55555555555z",
  });

  assert.equal(filters.categoryId, validUuid);
  assert.equal(filters.categoryKey, null);
  assert.equal(filters.roomId, validUuid);
  assert.equal(filters.positionId, null);
  assert.equal(filters.storageId, null);
});

test("item filters support a system category key and technical status value", () => {
  const filters = parseItemSearchParams({
    category: "tools",
    status: "w_domu",
  });

  assert.equal(filters.categoryId, null);
  assert.equal(filters.categoryKey, "tools");
  assert.equal(filters.status, "w domu");
});

test("item filters keep supported status and sort values", () => {
  const filters = parseItemSearchParams({
    sort: "location",
    status: "pożyczone",
  });

  assert.equal(filters.sort, "location");
  assert.equal(filters.status, "pożyczone");
  assert.equal(hasItemFilters(filters), true);
  assert.equal(hasItemFilters(parseItemSearchParams({ sort: "name" })), false);
});
