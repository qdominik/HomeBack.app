import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  buildDashboardWidgetContent,
  createDashboardWidgetErrorData,
} from "../../src/lib/dashboard/dashboard-widgets";

const householdA = "11111111-1111-4111-8111-111111111111";
const householdB = "22222222-2222-4222-8222-222222222222";

function buildSources() {
  return {
    householdId: householdA,
    categories: [
      { id: "category-tools", household_id: null, key: "tools", nazwa: "Narzędzia", ikona: null },
      { id: "category-custom-a", household_id: householdA, key: null, nazwa: "Sport", ikona: "bicycle" },
      { id: "category-custom-b", household_id: householdB, key: null, nazwa: "Sekret", ikona: null },
    ],
    items: [
      { id: "item-new", household_id: householdA, category_id: "category-tools", nazwa: "Wiertarka", status: "w domu", miniatura_url: "households/a/photo.jpg", created_at: "2026-09-01", updated_at: "2026-09-10" },
      { id: "item-sport", household_id: householdA, category_id: "category-custom-a", nazwa: "Piłka", status: "pożyczone", miniatura_url: null, created_at: "2026-09-02", updated_at: "2026-09-09" },
      { id: "item-archived", household_id: householdA, category_id: "category-tools", nazwa: "Stare", status: "archiwalne", miniatura_url: null, created_at: "2026-09-03", updated_at: "2026-09-11" },
      { id: "item-foreign", household_id: householdB, category_id: "category-custom-b", nazwa: "Obce", status: "w domu", miniatura_url: null, created_at: "2026-09-04", updated_at: "2026-09-12" },
    ],
    rooms: [
      { id: "room-kitchen", household_id: householdA, nazwa: "Kuchnia", ikona: "kitchen", kolejność: 2 },
      { id: "room-garage", household_id: householdA, nazwa: "Garaż", ikona: "garage", kolejność: 1 },
      { id: "room-foreign", household_id: householdB, nazwa: "Obcy pokój", ikona: null, kolejność: 1 },
    ],
    storageLocations: [
      { id: "storage-cabinet", nazwa: "Szafka", room_id: "room-kitchen" },
      { id: "storage-foreign", nazwa: "Obca szafa", room_id: "room-foreign" },
    ],
    positions: [
      { id: "position-drawer", nazwa: "Szuflada", storage_location_l2_id: "storage-cabinet" },
      { id: "position-foreign", nazwa: "Obcy schowek", storage_location_l2_id: "storage-foreign" },
    ],
    locations: [
      { id: "location-new-primary", item_id: "item-new", czy_glowna: true, room_id: null, storage_location_l2_id: null, storage_location_l3_id: "position-drawer" },
      { id: "location-new-secondary", item_id: "item-new", czy_glowna: false, room_id: "room-garage", storage_location_l2_id: null, storage_location_l3_id: null },
      { id: "location-sport", item_id: "item-sport", czy_glowna: true, room_id: "room-garage", storage_location_l2_id: null, storage_location_l3_id: null },
      { id: "location-foreign", item_id: "item-foreign", czy_glowna: true, room_id: "room-foreign", storage_location_l2_id: null, storage_location_l3_id: null },
    ],
  };
}

test("dashboard widgets return recent active household items with their primary location", () => {
  const result = buildDashboardWidgetContent(buildSources());

  assert.deepEqual(result.recentItems.map((item) => item.id), ["item-new", "item-sport"]);
  assert.equal(result.recentItems[0].location, "Kuchnia / Szafka / Szuflada");
  assert.equal(result.recentItems[0].iconKey, "tools");
  assert.equal(result.recentItems.some((item) => item.name === "Obce"), false);
  assert.equal(result.recentItems.some((item) => item.name === "Stare"), false);
});

test("dashboard widgets count categories and rooms without leaking another household", () => {
  const result = buildDashboardWidgetContent(buildSources());

  assert.deepEqual(result.categories.map(({ count, name }) => ({ count, name })), [
    { count: 1, name: "Narzędzia" },
    { count: 1, name: "Sport" },
  ]);
  assert.deepEqual(result.rooms.map(({ itemCount, name }) => ({ itemCount, name })), [
    { itemCount: 2, name: "Garaż" },
    { itemCount: 1, name: "Kuchnia" },
  ]);
});

test("dashboard widgets expose empty collections and an explicit read-error state", () => {
  const sources = buildSources();
  const result = buildDashboardWidgetContent({
    ...sources,
    items: [],
    locations: [],
    rooms: [],
    storageLocations: [],
    positions: [],
  });

  assert.deepEqual(result.recentItems, []);
  assert.deepEqual(result.categories, []);
  assert.deepEqual(result.rooms, []);
  assert.deepEqual(createDashboardWidgetErrorData(), {
    categories: { kind: "error" },
    recentItems: { kind: "error" },
    rooms: { kind: "error" },
    unlocatedItemCount: { kind: "error" },
  });
});

test("dashboard counts only active household items without any L1, L2, or L3 location", () => {
  const sources = buildSources();
  const result = buildDashboardWidgetContent({
    ...sources,
    items: [
      ...sources.items,
      { id: "item-unlocated", household_id: householdA, category_id: "category-tools", nazwa: "Bez miejsca", status: "w domu", miniatura_url: null, created_at: "2026-09-05", updated_at: "2026-09-08" },
      { id: "item-l2", household_id: householdA, category_id: "category-tools", nazwa: "W szafce", status: "w domu", miniatura_url: null, created_at: "2026-09-05", updated_at: "2026-09-07" },
      { id: "item-foreign-unlocated", household_id: householdB, category_id: "category-custom-b", nazwa: "Obce bez miejsca", status: "w domu", miniatura_url: null, created_at: "2026-09-05", updated_at: "2026-09-06" },
      { id: "item-archived-unlocated", household_id: householdA, category_id: "category-tools", nazwa: "Archiwalne bez miejsca", status: "archiwalne", miniatura_url: null, created_at: "2026-09-05", updated_at: "2026-09-05" },
    ],
    locations: [
      ...sources.locations,
      { id: "location-l2", item_id: "item-l2", czy_glowna: true, room_id: null, storage_location_l2_id: "storage-cabinet", storage_location_l3_id: null },
    ],
  });

  assert.equal(result.unlocatedItemCount, 1);
});

test("dashboard reads and links keep the household and existing route contracts", () => {
  const loader = readFileSync("src/app/(app)/dashboard/widgets.ts", "utf8");
  const runtime = readFileSync("src/components/dashboard/module-runtime.tsx", "utf8");

  assert.match(loader, /\.from\("item"\)[\s\S]*?\.eq\("household_id", householdId\)/);
  assert.match(loader, /\.from\("room"\)[\s\S]*?\.eq\("household_id", householdId\)/);
  assert.match(loader, /household_id\.is\.null,household_id\.eq\.\$\{householdId\}/);
  assert.match(runtime, /\?focus=\$\{item\.id\}/);
  assert.match(runtime, /#room-\$\{room\.id\}/);
  assert.match(runtime, /\?category=\$\{category\.id\}/);
  assert.match(runtime, /\?view=unlocated/);
});

test("implemented dashboard modules render widgets instead of the coming-soon placeholder", () => {
  const registry = readFileSync("src/lib/dashboard/module-registry.ts", "utf8");
  const runtime = readFileSync("src/components/dashboard/module-runtime.tsx", "utf8");
  const page = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8");

  for (const key of ["recent-items", "category-count", "rooms"]) {
    assert.match(
      registry,
      new RegExp(`key: "${key}"[\\s\\S]*?status: "available"`),
    );
  }

  assert.match(runtime, /"recent-items": RecentItemsDashboardModule/);
  assert.match(runtime, /"category-count": CategoryCountDashboardModule/);
  assert.match(runtime, /rooms: RoomsDashboardModule/);
  assert.match(
    runtime,
    /dashboardModuleDefinitions\.map\([\s\S]*?Render: renderers\[definition\.key\]/,
  );
  assert.match(page, /Render=\{registration\.Render\}/);

  assert.match(runtime, /data-widget-content="recent-items"/);
  assert.match(runtime, /data-widget-content="category-count"/);
  assert.match(runtime, /data-widget-content="rooms"/);
});
