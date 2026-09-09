import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";
import { GLOBAL_SEARCH_FILTERS, globalSearchRank, parseGlobalSearchFilter, searchGlobalSources, type SearchSources } from "../../src/lib/global-search/search";
import { loadSearchSources, readSearchPages } from "../../src/lib/global-search/load-sources";

const sources: SearchSources = {
  rooms: [{ id: "r", household_id: "home", nazwa: "Garaż" }, { id: "other-r", household_id: "other", nazwa: "Garaż" }],
  furniture: [{ id: "f", room_id: "r", nazwa: "Garaż — komoda" }, { id: "other-f", room_id: "other-r", nazwa: "Garaż — komoda" }],
  storage: [{ id: "s", storage_location_l2_id: "f", nazwa: "Garaż — półka 2" }, { id: "other-s", storage_location_l2_id: "other-f", nazwa: "Garaż — półka 2" }],
  items: [
    { id: "i", household_id: "home", nazwa: "Ładowarka garaż", status: "w domu" },
    { id: "other-i", household_id: "other", nazwa: "Ładowarka garaż", status: "w domu" },
    { id: "archive", household_id: "home", nazwa: "Ładowarka garaż", status: "archiwalne" },
  ],
  locations: [{ item_id: "i", storage_location_l3_id: "s", czy_glowna: true }],
};

test("all searches the four entity names, ranks exact before prefix before substring and excludes other households", () => {
  const results = searchGlobalSources(sources, "home", "garaż");
  assert.deepEqual(results.map((r) => r.type), ["room", "furniture", "storage", "item"]);
  assert.equal(results.some((r) => r.id.startsWith("other") || r.id === "archive"), false);
});

for (const filter of GLOBAL_SEARCH_FILTERS.slice(1)) {
  test(`filter ${filter} returns only its own type`, () => {
    const results = searchGlobalSources(sources, "home", "garaz", filter);
    assert.equal(results.length, 1);
    assert.equal(results[0].type, filter);
  });
}

test("uses shared Polish normalization and preserves user-entered names", () => {
  const [item] = searchGlobalSources(sources, "home", "  LADOWARKA  ");
  assert.equal(item.name, "Ładowarka garaż");
  assert.equal(item.type, "item");
  assert.equal(globalSearchRank("Ładowarka", "ladowarka"), 3);
  assert.equal(globalSearchRank("Ładowarka", "ŁADOWARKA"), 0);
  assert.equal(globalSearchRank("Ładowarka USB", "ładowarka"), 1);
  assert.equal(globalSearchRank("Moja ładowarka", "ładowarka"), 2);
});

test("empty, punctuation-only, missing and unknown queries never match everything", () => {
  for (const query of ["", " \n ", "%_", "---", "not here"]) assert.deepEqual(searchGlobalSources(sources, "home", query), []);
  assert.deepEqual(searchGlobalSources(sources, "", "garaż"), []);
  for (const value of [undefined, null, "bad", {}, ["item"]]) assert.equal(parseGlobalSearchFilter(value), "all");
});

test("breadcrumbs and hrefs identify each target on existing pages", () => {
  const byType = new Map(searchGlobalSources(sources, "home", "garaż").map((r) => [r.type, r]));
  assert.equal(byType.get("item")?.href, "/items#item-i");
  assert.equal(byType.get("room")?.href, "/home#room-r");
  assert.equal(byType.get("furniture")?.href, "/home#furniture-f");
  assert.equal(byType.get("storage")?.href, "/home#storage-s");
  assert.deepEqual(byType.get("room")?.breadcrumb, ["Garaż"]);
  assert.deepEqual(byType.get("furniture")?.breadcrumb, ["Garaż", "Garaż — komoda"]);
  const path = ["Garaż", "Garaż — komoda", "Garaż — półka 2"];
  assert.deepEqual(byType.get("storage")?.breadcrumb, path);
  assert.deepEqual(byType.get("item")?.breadcrumb, path);
});

test("missing or cross-household location references cannot leak breadcrumb names", () => {
  for (const locations of [[], [{ item_id: "i", storage_location_l3_id: "other-s", czy_glowna: true }]]) {
    assert.deepEqual(searchGlobalSources({ ...sources, locations }, "home", "ładowarka")[0].breadcrumb, []);
  }
});

test("equal ranks sort by type then Polish alphabetical name with deterministic id tie-break", () => {
  const sameNames: SearchSources = {
    ...sources,
    items: ["z", "a", "b"].map((id) => ({ id, household_id: "home", nazwa: id === "z" ? "Garaż Z" : "Garaż A", status: "w domu" })),
  };
  assert.deepEqual(searchGlobalSources(sameNames, "home", "garaż").map((r) => r.id), ["r", "a", "b", "z", "f", "s"]);
});

test("pagination reads past 1000 rows and fails closed on any source error", async () => {
  const rows = Array.from({ length: 1201 }, (_, id) => ({ id }));
  const ranges: number[][] = [];
  const result = await readSearchPages(async (from, to) => { ranges.push([from, to]); return { data: rows.slice(from, to + 1), error: null }; });
  assert.equal(result.length, 1201);
  assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]]);
  await assert.rejects(readSearchPages(async () => ({ data: null, error: "denied" })), /unavailable/);
});

// Executable query double: intentionally exposes both households unless the loader scopes reads.
function queryClient(failTable?: string, locations = sources.locations) {
  const records: Record<string, object[]> = {
    item: sources.items,
    room: sources.rooms,
    storage_location_l2: sources.furniture,
    storage_location_l3: sources.storage,
    item_location: [...locations, { item_id: "other-i", storage_location_l3_id: "other-s", czy_glowna: true }],
  };
  const observed: Record<string, object[]> = {};
  const client = { from(table: string) {
    let rows = records[table] as Record<string, unknown>[];
    const builder = {
      select() { return builder; }, order() { return builder; },
      eq(key: string, value: unknown) { rows = rows.filter((r) => r[key] === value); return builder; },
      neq(key: string, value: unknown) { rows = rows.filter((r) => r[key] !== value); return builder; },
      in(key: string, ids: unknown[]) { rows = rows.filter((r) => ids.includes(r[key])); return builder; },
      range(from: number, to: number) { observed[table] = rows; return Promise.resolve({ data: rows.slice(from, to + 1), error: table === failTable ? "denied" : null }); },
    };
    return builder;
  } } as unknown as SupabaseClient<Database>;
  return { client, observed };
}

test("data adapter scopes items, rooms and every descendant before reading", async () => {
  const { client, observed } = queryClient();
  const loaded = await loadSearchSources(client, "home", "garaz", "all");
  assert.equal(loaded.items.length, 1);
  assert.equal(loaded.rooms.length, 1);
  assert.equal(loaded.furniture.length, 1);
  assert.equal(loaded.storage.length, 1);
  assert.equal(loaded.locations.length, 1);
  assert.deepEqual(Object.values(observed).map((rows) => rows.length), [1, 1, 1, 1, 1]);
  assert.deepEqual(loaded.locations, sources.locations);
});

test("data adapter rejects missing household and any failed descendant read", async () => {
  const { client } = queryClient("storage_location_l3");
  await assert.rejects(loadSearchSources(client, "", "garaz", "all"), /Household required/);
  await assert.rejects(loadSearchSources(client, "home", "garaz", "all"), /unavailable/);
});


test("additional persisted location is loaded and supplies a full breadcrumb without a primary", async () => {
  const locations = [{ item_id: "i", storage_location_l3_id: "s", czy_glowna: false }];
  const { client } = queryClient(undefined, locations);
  const loaded = await loadSearchSources(client, "home", "garaz", "all");
  assert.deepEqual(loaded.locations, locations);
  assert.deepEqual(searchGlobalSources(loaded, "home", "ładowarka")[0].breadcrumb,
    ["Garaż", "Garaż — komoda", "Garaż — półka 2"]);
});

test("valid primary takes precedence over additional locations regardless of input order", () => {
  const data: SearchSources = { ...sources,
    storage: [...sources.storage, { id: "a", storage_location_l2_id: "f", nazwa: "Dodatkowy schowek" }],
    locations: [...sources.locations, { item_id: "i", storage_location_l3_id: "a", czy_glowna: false }],
  };
  for (const locations of [data.locations, [...data.locations].reverse()]) {
    assert.equal(searchGlobalSources({ ...data, locations }, "home", "ładowarka")[0].breadcrumb.at(-1), "Garaż — półka 2");
  }
});

test("additional locations use the lowest storage id and never accept another household's primary", () => {
  const data: SearchSources = { ...sources,
    storage: [...sources.storage, { id: "a", storage_location_l2_id: "f", nazwa: "Pierwszy schowek" }],
    locations: [
      { item_id: "i", storage_location_l3_id: "other-s", czy_glowna: true },
      { item_id: "i", storage_location_l3_id: "s", czy_glowna: false },
      { item_id: "i", storage_location_l3_id: "a", czy_glowna: false },
    ],
  };
  for (const locations of [data.locations, [...data.locations].reverse()]) {
    assert.deepEqual(searchGlobalSources({ ...data, locations }, "home", "ładowarka")[0].breadcrumb,
      ["Garaż", "Garaż — komoda", "Pierwszy schowek"]);
  }
});

test("preserves Kitchen fridge upper shelf path and distinguishes genuinely unlocated items", () => {
  const data: SearchSources = { ...sources,
    rooms: [{ id: "r", household_id: "home", nazwa: "Kuchnia" }],
    furniture: [{ id: "f", room_id: "r", nazwa: "Lodówka" }],
    storage: [{ id: "s", storage_location_l2_id: "f", nazwa: "Górna półka" }],
  };
  assert.deepEqual(searchGlobalSources(data, "home", "ładowarka")[0].breadcrumb,
    ["Kuchnia", "Lodówka", "Górna półka"]);
  assert.deepEqual(searchGlobalSources({ ...data, locations: [] }, "home", "ładowarka")[0].breadcrumb, []);
});


test("L1/L2/L3 and no assignment preserve global search breadcrumb and href", () => {
  const cases: [SearchSources["locations"], string[]][] = [
    [[{ item_id: "i", room_id: "r", storage_location_l3_id: null, czy_glowna: true }], ["Garaż"]],
    [[{ item_id: "i", storage_location_l2_id: "f", storage_location_l3_id: null, czy_glowna: true }], ["Garaż", "Garaż — komoda"]],
    [sources.locations, ["Garaż", "Garaż — komoda", "Garaż — półka 2"]],
    [[], []],
  ];
  for (const [locations, breadcrumb] of cases) {
    const result = searchGlobalSources({ ...sources, locations }, "home", "ładowarka")[0];
    assert.deepEqual(result.breadcrumb, breadcrumb);
    assert.equal(result.href, "/items#item-i");
  }
});

test("foreign L1 and L2 references are excluded even when primary", () => {
  for (const target of [{ room_id: "other-r" }, { storage_location_l2_id: "other-f" }]) {
    const locations = [{ item_id: "i", storage_location_l3_id: null, czy_glowna: true, ...target }];
    assert.deepEqual(searchGlobalSources({ ...sources, locations }, "home", "ładowarka")[0].breadcrumb, []);
  }
});
