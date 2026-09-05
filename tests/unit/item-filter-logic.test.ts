import assert from "node:assert/strict";
import test from "node:test";
import {
  hasItemFilters,
  parseItemSearchParams,
  searchPattern,
} from "../../src/lib/items/item-search-params";
import {
  filterItemsForView,
  parseItemView,
} from "../../src/lib/items/item-view-filter";
import {
  buildItemSearchLocationPath,
  filterItemSearchCandidates,
  normalizeItemSearchQuery,
  normalizeItemSearchText,
  resolveDashboardItemSearchView,
} from "../../src/lib/items/item-search";
import { readFileSync } from "node:fs";

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

test("item view parser defaults to all and accepts supported views", () => {
  assert.equal(parseItemView({}), "all");
  assert.equal(parseItemView({ view: "unknown" }), "all");
  assert.equal(parseItemView({ view: ["unlocated", "archived"] }), "unlocated");
  assert.equal(parseItemView({ view: " archived " }), "archived");
});

test("item views separate active, unlocated, and archived items", () => {
  const items = [
    { id: "active-with-location", status: "w domu" as const },
    { id: "active-without-location", status: "w domu" as const },
    { id: "borrowed-without-location", status: "pożyczone" as const },
    { id: "archived-with-location", status: "archiwalne" as const },
    { id: "archived-without-location", status: "archiwalne" as const },
  ];
  const primaryLocations = new Map([
    ["active-with-location", "position-a"],
    ["archived-with-location", "position-b"],
  ]);

  assert.deepEqual(
    filterItemsForView(items, primaryLocations, "all").map((item) => item.id),
    [
      "active-with-location",
      "active-without-location",
      "borrowed-without-location",
    ],
  );
  assert.deepEqual(
    filterItemsForView(items, primaryLocations, "unlocated").map(
      (item) => item.id,
    ),
    ["active-without-location", "borrowed-without-location"],
  );
  assert.deepEqual(
    filterItemsForView(items, primaryLocations, "archived").map(
      (item) => item.id,
    ),
    ["archived-with-location", "archived-without-location"],
  );
});

test("dashboard item search normalizes a submitted name without fuzzy matching", () => {
  const query = normalizeItemSearchQuery(
    `  ${"baterie   kuchenne ".repeat(20)} `,
  );

  assert.equal(query.length, 100);
  assert.equal(query.includes("  "), false);
  assert.equal(query.startsWith("baterie kuchenne"), true);
});

test("dashboard item search filters names within the current household only", () => {
  const results = filterItemSearchCandidates(
    [
      { id: "item-a", household_id: "household-a", nazwa: "Baterie AA" },
      { id: "item-b", household_id: "household-b", nazwa: "Baterie AAA" },
      { id: "item-c", household_id: "household-a", nazwa: "Latarka" },
    ],
    "household-a",
    " baterie ",
  );

  assert.deepEqual(results.map((item) => item.id), ["item-a"]);
});

test("dashboard item search treats Polish diacritics as optional", () => {
  assert.equal(normalizeItemSearchText("Ładowarka"), "ladowarka");

  assert.deepEqual(
    filterItemSearchCandidates(
      [
        { id: "item-a", household_id: "household-a", nazwa: "Ładowarka" },
        { id: "item-b", household_id: "household-a", nazwa: "Latarka" },
      ],
      "household-a",
      "ladowarka",
    ).map((item) => item.id),
    ["item-a"],
  );
  assert.deepEqual(
    filterItemSearchCandidates(
      [
        { id: "item-a", household_id: "household-a", nazwa: "Ladowarka" },
        { id: "item-b", household_id: "household-a", nazwa: "Baterie" },
      ],
      "household-a",
      "ładowarka",
    ).map((item) => item.id),
    ["item-a"],
  );
});

test("dashboard item search remains case-insensitive after diacritic normalization", () => {
  const results = filterItemSearchCandidates(
    [
      { id: "item-a", household_id: "household-a", nazwa: "ŁADOWARKA USB-C" },
      { id: "item-b", household_id: "household-a", nazwa: "Kabel USB-C" },
    ],
    "household-a",
    "łAdOwArKa",
  );

  assert.deepEqual(results.map((item) => item.id), ["item-a"]);
});

test("dashboard item search exposes initial, loading, error, no-result, and result states", () => {
  assert.equal(
    resolveDashboardItemSearchView({ isLoading: false, response: null }),
    "initial",
  );
  assert.equal(
    resolveDashboardItemSearchView({ isLoading: true, response: null }),
    "loading",
  );
  assert.equal(
    resolveDashboardItemSearchView({ isLoading: false, response: { kind: "error" } }),
    "error",
  );
  assert.equal(
    resolveDashboardItemSearchView({
      isLoading: false,
      response: { kind: "success", query: "baterie", results: [] },
    }),
    "no-results",
  );
  assert.equal(
    resolveDashboardItemSearchView({
      isLoading: false,
      response: {
        kind: "success",
        query: "baterie",
        results: [
          {
            id: "item-a",
            name: "Baterie AA",
            location: { kind: "missing", path: null },
          },
        ],
      },
    }),
    "results",
  );
});

test("dashboard item search presents complete, partial, and missing location paths", () => {
  assert.deepEqual(
    buildItemSearchLocationPath({
      roomName: "Salon",
      storageName: "Komoda",
      positionName: "Górna szuflada",
    }),
    { kind: "complete", path: "Salon / Komoda / Górna szuflada" },
  );
  assert.deepEqual(
    buildItemSearchLocationPath({ roomName: "Salon", storageName: "Komoda" }),
    { kind: "partial", path: "Salon / Komoda" },
  );
  assert.deepEqual(buildItemSearchLocationPath({}), {
    kind: "missing",
    path: null,
  });
});

test("dashboard item search action keeps the item and room reads scoped to household_id", () => {
  const source = readFileSync("src/app/(app)/dashboard/actions.ts", "utf8");

  assert.match(source, /\.eq\("household_id", householdId\)/);
  assert.match(source, /\.from\("item"\)/);
  assert.match(source, /\.from\("room"\)/);
});
