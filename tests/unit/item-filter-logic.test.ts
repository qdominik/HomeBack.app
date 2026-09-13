import assert from "node:assert/strict";
import test from "node:test";
import {
  applyItemFilters,
  hasItemFilters,
  parseItemSearchParams,
  parseItemFocusId,
  searchPattern,
} from "../../src/lib/items/item-search-params";
import {
  filterItemsForFocus,
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
    added: null,
    categoryId: null,
    categoryKey: null,
    dateFrom: null,
    dateTo: null,
    positionId: null,
    query: "",
    roomId: null,
    sort: "recent",
    status: "active",
    storageId: null,
  });

  assert.equal(parseItemSearchParams({ sort: "newest", status: "removed" }).sort, "recent");
  assert.equal(parseItemSearchParams({ sort: "newest", itemStatus: "removed" }).status, "active");
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

test("item focus accepts only a valid item UUID", () => {
  assert.equal(parseItemFocusId(validUuid), validUuid);
  assert.equal(parseItemFocusId([validUuid, "other"]), validUuid);
  assert.equal(parseItemFocusId("not-an-item-id"), null);
  assert.equal(parseItemFocusId(undefined), null);
});

test("item filters support category keys, archive scopes, and date ranges", () => {
  const filters = parseItemSearchParams({
    added: "custom",
    category: "tools",
    from: "2026-08-01",
    itemStatus: "all",
    to: "2026-08-31",
  });

  assert.equal(filters.categoryId, null);
  assert.equal(filters.categoryKey, "tools");
  assert.equal(filters.status, "all");
  assert.equal(filters.added, "custom");
  assert.equal(filters.dateFrom, "2026-08-01");
  assert.equal(filters.dateTo, "2026-08-31");
});

test("item filters keep supported archive and sort values", () => {
  const filters = parseItemSearchParams({
    itemStatus: "archived",
    sort: "location",
  });

  assert.equal(filters.sort, "location");
  assert.equal(filters.status, "archived");
  assert.equal(hasItemFilters(filters), true);
  assert.equal(hasItemFilters(parseItemSearchParams({ sort: "name" })), false);
});

const categoryA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const categoryB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const roomA = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const furnitureA = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const positionA = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const filterItems = [
  { id: "item-a", household_id: "home", nazwa: "Ładowarka USB", category_id: categoryA, status: "w domu" as const, created_at: "2026-09-13T08:00:00.000Z" },
  { id: "item-b", household_id: "home", nazwa: "Ładowarka zapasowa", category_id: categoryB, status: "archiwalne" as const, created_at: "2026-08-01T08:00:00.000Z" },
  { id: "item-c", household_id: "other", nazwa: "Ładowarka obca", category_id: categoryA, status: "w domu" as const, created_at: "2026-09-13T08:00:00.000Z" },
];
const location = {
  id: positionA,
  locationCode: "SAL-KOM-SZU1",
  positionName: "Szuflada",
  roomId: roomA,
  roomName: "Salon",
  storageId: furnitureA,
  storageName: "Komoda",
};

function apply(params: Record<string, string>) {
  return applyItemFilters({
    categoryKeyById: new Map([[categoryA, "electronics"], [categoryB, "other"]]),
    filters: parseItemSearchParams(params),
    householdId: "home",
    items: filterItems,
    locationsByItemId: new Map([["item-a", [location]]]),
    now: new Date("2026-09-13T12:00:00.000Z"),
  }).map((item) => item.id);
}

test("inventory text search reuses global Polish normalization and household scope", () => {
  assert.deepEqual(apply({ q: "ladowarka" }), ["item-a"]);
});

test("inventory combines name, category, Room, Furniture, and Storage space filters", () => {
  assert.deepEqual(apply({ q: "ładowarka", category: categoryA, room: roomA, storage: furnitureA, position: positionA }), ["item-a"]);
  assert.deepEqual(apply({ q: "ładowarka", category: categoryB, room: roomA }), []);
});

test("inventory archive and added-time filters compose with text search", () => {
  assert.deepEqual(apply({ q: "ładowarka", itemStatus: "all" }), ["item-a", "item-b"]);
  assert.deepEqual(apply({ q: "ładowarka", itemStatus: "archived" }), ["item-b"]);
  assert.deepEqual(apply({ q: "ładowarka", added: "today" }), ["item-a"]);
  assert.deepEqual(apply({ q: "ładowarka", added: "7d" }), ["item-a"]);
  assert.deepEqual(apply({ q: "ładowarka", added: "30d" }), ["item-a"]);
  assert.deepEqual(apply({ q: "ładowarka", itemStatus: "all", added: "3m" }), ["item-a", "item-b"]);
  assert.deepEqual(apply({ q: "ładowarka", itemStatus: "all", added: "custom", from: "2026-08-01", to: "2026-08-01" }), ["item-b"]);
});

test("inventory text search applies the global 40-result contract", () => {
  const items = Array.from({ length: 41 }, (_, index) => ({
    ...filterItems[0],
    id: `item-${String(index).padStart(2, "0")}`,
    nazwa: `Ładowarka ${String(index).padStart(2, "0")}`,
  }));
  const results = applyItemFilters({
    categoryKeyById: new Map([[categoryA, "electronics"]]),
    filters: parseItemSearchParams({ q: "ladowarka" }),
    householdId: "home",
    items,
    locationsByItemId: new Map(),
  });
  assert.equal(results.length, 40);
  assert.equal(results.at(-1)?.id, "item-39");
});

test("inventory filter UI keeps required order, responsive row, removable filters, and separate icon search", () => {
  const filtersSource = readFileSync("src/components/items/item-filters.tsx", "utf8");
  const formSource = readFileSync("src/components/items/item-form.tsx", "utf8");
  const locationSource = readFileSync("src/components/items/item-location-field.tsx", "utf8");
  const dialogSource = readFileSync("src/components/items/item-create-dialog.tsx", "utf8");
  const homeSource = readFileSync("src/app/(app)/home/page.tsx", "utf8");
  const iconSource = readFileSync("src/components/icons/entity-icon-picker.tsx", "utf8");
  const searchIndex = filtersSource.indexOf("placeholder={t.modules.items.searchPlaceholder}");
  const submitIndex = filtersSource.indexOf('type="submit"', searchIndex);
  const categoryIndex = filtersSource.indexOf("label={t.modules.items.category}", submitIndex);
  const roomIndex = filtersSource.indexOf("label={t.modules.items.room}", categoryIndex);
  const storageIndex = filtersSource.indexOf("label={t.modules.items.storage}", roomIndex);
  const moreIndex = filtersSource.indexOf("t.modules.items.moreFilters", storageIndex);
  assert.ok(searchIndex < submitIndex && submitIndex < categoryIndex && categoryIndex < roomIndex && roomIndex < storageIndex && storageIndex < moreIndex);
  assert.match(filtersSource.slice(searchIndex, categoryIndex), /MagnifyingGlassIcon[\s\S]*t\.modules\.items\.search/);
  assert.match(filtersSource, /xl:flex-row/);
  assert.match(filtersSource, /xl:absolute/);
  assert.match(filtersSource, /clearFilters/);
  assert.match(formSource, /name="typ"[\s\S]*?min-w-0 max-w-full|className="[^"]*min-w-0 max-w-full[^"]*"[\s\S]*?name="typ"/);
  assert.match(formSource, /name="category_id"[\s\S]*?min-w-0 max-w-full|className="[^"]*min-w-0 max-w-full[^"]*"[\s\S]*?name="category_id"/);
  assert.match(locationSource, /fieldset className="min-w-0 max-w-full/);
  assert.equal((locationSource.match(/w-full min-w-0 max-w-full/g) ?? []).length, 3);
  assert.match(dialogSource, /overflow-x-hidden/);
  assert.doesNotMatch(homeSource, /HomeSearch|modules\.home\.search/);
  assert.match(iconSource, /type="search"/);
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

test("item focus keeps the full list without a focus id and isolates one household item", () => {
  const items = [
    { id: "item-a", household_id: "household-a", status: "w domu" as const },
    { id: "item-b", household_id: "household-a", status: "w domu" as const },
    { id: "item-a", household_id: "household-b", status: "w domu" as const },
  ];

  assert.deepEqual(
    filterItemsForFocus(items, null, "household-a").map((item) => item.id),
    ["item-a", "item-b", "item-a"],
  );
  assert.deepEqual(
    filterItemsForFocus(items, "item-a", "household-a"),
    [items[0]],
  );
  assert.deepEqual(
    filterItemsForFocus(items, "item-a", "household-c"),
    [],
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
            iconKey: "other",
            name: "Baterie AA",
            location: { kind: "missing", path: null },
            previewUrl: null,
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

test("dashboard item search results reuse the item thumbnail fallback chain", () => {
  const searchComponent = readFileSync(
    "src/components/dashboard/item-search.tsx",
    "utf8",
  );
  const searchAction = readFileSync(
    "src/app/(app)/dashboard/actions.ts",
    "utf8",
  );
  const thumbnail = readFileSync(
    "src/components/items/item-photo-thumbnail.tsx",
    "utf8",
  );

  assert.match(searchComponent, /<ItemPhotoThumbnail/);
  assert.match(searchComponent, /alt=\{result\.name\}/);
  assert.match(searchComponent, /iconKey=\{result\.icon \?\? null\}/);
  assert.match(searchComponent, /previewUrl=\{result\.previewUrl \?\? null\}/);
  assert.match(searchComponent, /href=\{result\.href\}/);
  assert.match(searchAction, /isItemPhotoFinalPathForHousehold/);
  assert.match(searchAction, /createSignedUrl\(item\.miniatura_url/);
  assert.match(searchAction, /resolveItemIconKey/);
  assert.match(thumbnail, /alt=\{alt\}/);
  assert.match(thumbnail, /onError=\{\(\) => setPreviewFailed\(true\)\}/);
  assert.match(thumbnail, /<EntityIcon[\s\S]*iconKey=\{iconKey\}/);
});

test("dashboard item search action keeps the item and room reads scoped to household_id", () => {
  const source = readFileSync("src/lib/global-search/load-sources.ts", "utf8");

  assert.match(source, /\.eq\("household_id", householdId\)/);
  assert.match(source, /\.from\("item"\)/);
  assert.match(source, /\.from\("room"\)/);
});
