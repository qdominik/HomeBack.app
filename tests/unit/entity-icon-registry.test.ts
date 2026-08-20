import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import {
  ENTITY_ICON_DEFINITIONS,
  ENTITY_ICON_FALLBACKS,
} from "../../src/lib/icons/entity-icon-definitions";
import { getCategoryIconKey } from "../../src/lib/icons/category-icon-map";
import { normalizeCustomCategoryIconKey } from "../../src/lib/categories/custom-category-icon";
import { resolveItemIconKey } from "../../src/lib/icons/item-icon-resolution";
import {
  resolvePositionIconKey,
  resolveStorageLocationIconKey,
} from "../../src/lib/icons/home-structure-icons";
import {
  getRoomIconKeyForKind,
  inferRoomIconKey,
  resolveRoomIconKey,
} from "../../src/lib/icons/room-icon-suggestion";
import {
  getDefaultRoomIconKey,
  getEntityIconDefinition,
  getEntityIconFallback,
  isEntityIconKey,
  normalizeEntityIconKey,
  searchEntityIconOptions,
} from "../../src/lib/icons/entity-icon-validation";
import { PHOSPHOR_ICON_MANIFEST } from "../../src/lib/icons/phosphor-icon-registry";
import { isAllowedStoredEntityIcon, normalizeStoredEntityIcon } from "../../src/lib/icons/phosphor-icon-server-validation";
import { paginatePhosphorIcons, searchPhosphorIcons } from "../../src/lib/icons/phosphor-icon-catalog";

test("entity icon keys are recognized and unknown values are rejected", () => {
  assert.equal(isEntityIconKey("living-room"), true);
  assert.equal(isEntityIconKey("ArmchairIcon"), false);
  assert.equal(isEntityIconKey(""), false);
});

test("generated Phosphor registry has 1512 canonical names in groups of at most 96", () => {
  assert.equal(PHOSPHOR_ICON_MANIFEST.length, 1512);
  assert.equal(new Set(PHOSPHOR_ICON_MANIFEST.map((entry) => entry.name)).size, 1512);
  assert.equal(PHOSPHOR_ICON_MANIFEST.every((entry) => entry.name.endsWith("Icon")), true);
  assert.equal(Math.max(...PHOSPHOR_ICON_MANIFEST.map((entry) => entry.group)), 15);
  for (const group of new Set(PHOSPHOR_ICON_MANIFEST.map((entry) => entry.group))) {
    assert.ok(PHOSPHOR_ICON_MANIFEST.filter((entry) => entry.group === group).length <= 96);
  }
});

test("Phosphor search trims, ignores case, matches partial names, and paginates by 48", () => {
  assert.equal(searchPhosphorIcons(PHOSPHOR_ICON_MANIFEST, " airplane ")[0]?.name, "AirplaneIcon");
  assert.equal(searchPhosphorIcons(PHOSPHOR_ICON_MANIFEST, "AIRPLANEICON")[0]?.name, "AirplaneIcon");
  assert.equal(searchPhosphorIcons(PHOSPHOR_ICON_MANIFEST, "zzzz-not-an-icon").length, 0);
  assert.equal(paginatePhosphorIcons(PHOSPHOR_ICON_MANIFEST, 1).entries.length, 48);
  assert.equal(paginatePhosphorIcons(PHOSPHOR_ICON_MANIFEST, 32).currentPage, 32);
});

test("generated content comparison ignores only line-ending representation", async () => {
  const moduleURL = pathToFileURL("scripts/icon-registry-content.mjs").href;
  const { hasSameGeneratedContent } = await Function("url", "return import(url)")(moduleURL);
  assert.equal(hasSameGeneratedContent("a\nb\n", "a\nb\n"), true);
  assert.equal(hasSameGeneratedContent("a\nb\n", "a\r\nb\r\n"), true);
  assert.equal(hasSameGeneratedContent("a\r\nb\r\n", "a\nb\n"), true);
  assert.equal(hasSameGeneratedContent("a\rb\r", "a\nb\n"), true);
  assert.equal(hasSameGeneratedContent("a\nb\n", "a\nc\n"), false);
  assert.equal(hasSameGeneratedContent("a\nb", "a\nb\n"), false);
  assert.equal(hasSameGeneratedContent("a\n b\n", "a\nb\n"), false);
});

test("server icon validation accepts only semantic keys or generated Phosphor names", () => {
  assert.equal(isAllowedStoredEntityIcon("AirplaneIcon"), true);
  assert.equal(isAllowedStoredEntityIcon("UnknownIcon"), false);
  assert.equal(isAllowedStoredEntityIcon("living-room"), true);
});

test("all four server-action icon mappings reject malformed catalog values and preserve empty fallbacks", () => {
  const homeActions = readFileSync("src/app/(app)/home/actions.ts", "utf8");
  const categoryActions = readFileSync("src/app/(app)/categories/actions.ts", "utf8");
  for (const group of ["room", "category", "storage", "position"] as const) {
    assert.equal(isAllowedStoredEntityIcon("AirplaneIcon"), true, group);
    assert.equal(isAllowedStoredEntityIcon(group === "room" ? "room" : group === "category" ? "other" : group === "storage" ? "storage" : "position"), true, group);
    assert.equal(isAllowedStoredEntityIcon("Airplane"), false, group);
    assert.equal(isAllowedStoredEntityIcon("FakeIcon"), false, group);
    assert.equal(isAllowedStoredEntityIcon("@phosphor-icons/react/dist/csr/Airplane"), false, group);
    assert.equal(isAllowedStoredEntityIcon("<script>alert(1)</script>"), false, group);
    assert.equal(normalizeStoredEntityIcon("", group), group === "room" ? "room" : group === "category" ? "other" : group === "storage" ? "storage" : "position");
  }
  assert.match(homeActions, /normalizeStoredEntityIcon/);
  assert.match(homeActions, /roomIconField/);
  assert.match(homeActions, /storageLocationL2IconField/);
  assert.match(homeActions, /storageLocationL3IconField/);
  assert.match(categoryActions, /isAllowedStoredEntityIcon/);
});

test("empty and unknown icon keys normalize to the requested group fallback", () => {
  assert.equal(normalizeEntityIconKey("", "room"), ENTITY_ICON_FALLBACKS.room);
  assert.equal(normalizeEntityIconKey("legacy-emoji", "storage"), "storage");
  assert.equal(getEntityIconFallback("item"), "package");
});

test("entity icon definitions have unique keys and group labels", () => {
  assert.equal(ENTITY_ICON_DEFINITIONS.length, 45);
  const keys = new Set<string>();
  const labelsByGroup = new Set<string>();

  for (const definition of ENTITY_ICON_DEFINITIONS) {
    assert.equal(keys.has(definition.key), false, definition.key);
    keys.add(definition.key);

    const labelKey = `${definition.group}:${definition.label.pl}`;
    assert.equal(labelsByGroup.has(labelKey), false, labelKey);
    labelsByGroup.add(labelKey);
  }
});

test("entity icon search supports Polish names and aliases without mutating the registry", () => {
  const before = ENTITY_ICON_DEFINITIONS.map((definition) => definition.key);

  assert.equal(searchEntityIconOptions("salon", "room")[0]?.key, "living-room");
  assert.equal(searchEntityIconOptions("kanapa", "room")[0]?.key, "living-room");
  assert.equal(searchEntityIconOptions("polka", "storage")[0]?.key, "shelf");

  assert.deepEqual(
    ENTITY_ICON_DEFINITIONS.map((definition) => definition.key),
    before,
  );
});

test("default room icon and edit value normalization use stable semantic keys", () => {
  assert.equal(getDefaultRoomIconKey(), "room");
  assert.equal(normalizeEntityIconKey("bedroom", "room"), "bedroom");
  assert.equal(normalizeEntityIconKey("BedIcon", "room"), "room");
  assert.equal(getEntityIconDefinition("bedroom")?.label.pl, "Sypialnia");
});

test("system category keys resolve to category icon keys", () => {
  assert.equal(getCategoryIconKey("medicines"), "medicine");
  assert.equal(getCategoryIconKey("food"), "food");
  assert.equal(getCategoryIconKey("documents"), "documents");
  assert.equal(getCategoryIconKey("winter_clothes"), "clothing");
  assert.equal(getCategoryIconKey("electronics"), "electronics");
  assert.equal(getCategoryIconKey("tools"), "tools");
  assert.equal(getCategoryIconKey("books"), "books");
  assert.equal(getCategoryIconKey("spare_parts"), "spare-parts");
  assert.equal(getCategoryIconKey("other"), "other");
  assert.equal(getCategoryIconKey(null), "other");
});

test("item icon resolution prefers a future valid item override then category fallback", () => {
  assert.equal(
    resolveItemIconKey({ categoryKey: "food", itemIconKey: "cube" }),
    "cube",
  );
  assert.equal(resolveItemIconKey({ categoryKey: "tools" }), "tools");
  assert.equal(
    resolveItemIconKey({ categoryKey: "food", itemIconKey: "UnknownIcon" }),
    "food",
  );
});

test("entity icon component uses explicit Phosphor imports instead of a namespace import", () => {
  const source = readFileSync(
    "src/components/icons/entity-icon.tsx",
    "utf8",
  );

  assert.equal(source.includes("import * as"), false);
  assert.equal(source.includes("@phosphor-icons/react/dist/ssr/House"), true);
  assert.equal(source.includes("@phosphor-icons/react/ssr\""), false);
});
test("room kind suggestions use stable semantic icon keys", () => {
  assert.equal(getRoomIconKeyForKind("Salon"), "living-room");
  assert.equal(getRoomIconKeyForKind("  POKÓJ DZIECKA "), "child-room");
  assert.equal(getRoomIconKeyForKind("Łazienka"), "bathroom");
  assert.equal(getRoomIconKeyForKind("Pokój gościnny"), "bedroom");
  assert.equal(getRoomIconKeyForKind("Nieznany rodzaj"), "room");
});

test("room icon suggestion reuses kind inference for normalized room names", () => {
  assert.equal(inferRoomIconKey("  SALON  "), "living-room");
  assert.equal(inferRoomIconKey("Pokój chłopaka"), "child-room");
  assert.equal(inferRoomIconKey("Kuchnia"), "kitchen");
  assert.equal(inferRoomIconKey("Pokój gościnny"), "bedroom");
  assert.equal(inferRoomIconKey("Pomieszczenie techniczne"), "room");
});

test("automatic room icon suggestions update until a manual choice is made", () => {
  assert.equal(
    resolveRoomIconKey({
      currentIconKey: "room",
      name: "Salon",
      selectionMode: "automatic",
    }),
    "living-room",
  );
  assert.equal(
    resolveRoomIconKey({
      currentIconKey: "kitchen",
      name: "Sypialnia",
      selectionMode: "manual",
    }),
    "kitchen",
  );
});

test("existing and legacy room icons are preserved safely during editing", () => {
  assert.equal(
    resolveRoomIconKey({
      currentIconKey: "garage",
      name: "Salon",
      selectionMode: "manual",
    }),
    "garage",
  );
  assert.equal(
    resolveRoomIconKey({
      currentIconKey: "legacy-room-icon",
      name: "Salon",
      selectionMode: "manual",
    }),
    "room",
  );
});

test("furniture and storage spaces preserve saved icons and safely fall back", () => {
  assert.equal(resolveStorageLocationIconKey("Szafa", "dresser"), "dresser");
  assert.equal(resolveStorageLocationIconKey("Szafa", null), "wardrobe");
  assert.equal(
    resolveStorageLocationIconKey("Komoda", "legacy-storage-icon"),
    "dresser",
  );
  assert.equal(resolvePositionIconKey("drawer"), "drawer");
  assert.equal(resolvePositionIconKey(null), "position");
  assert.equal(resolvePositionIconKey("legacy-position-icon"), "position");
});

test("storage forms and server actions submit validated icon keys", () => {
  const actionSource = readFileSync("src/app/(app)/home/actions.ts", "utf8");
  const furnitureFormSource = readFileSync(
    "src/components/home/storage-location-l2-form.tsx",
    "utf8",
  );
  const storageFormSource = readFileSync(
    "src/components/home/storage-location-l3-form.tsx",
    "utf8",
  );

  assert.equal(actionSource.includes("function storageLocationL2IconField"), true);
  assert.equal(actionSource.includes("function storageLocationL3IconField"), true);
  assert.equal(actionSource.includes("ikona: storageLocationL2IconField(formData)"), true);
  assert.equal(actionSource.includes("ikona: storageLocationL3IconField(formData)"), true);
  assert.equal(furnitureFormSource.includes('group="storage"'), true);
  assert.equal(storageFormSource.includes('group="position"'), true);
});
test("custom category icons use other as their default and invalid fallback", () => {
  assert.equal(normalizeCustomCategoryIconKey(undefined), "other");
  assert.equal(normalizeCustomCategoryIconKey(""), "other");
  assert.equal(normalizeCustomCategoryIconKey("legacy-category-icon"), "other");
  assert.equal(normalizeCustomCategoryIconKey("TagIcon"), "TagIcon");
});

test("custom category icons keep valid category keys and reject other groups", () => {
  assert.equal(normalizeCustomCategoryIconKey("tools"), "tools");
  assert.equal(normalizeCustomCategoryIconKey("documents"), "documents");
  assert.equal(normalizeCustomCategoryIconKey("living-room"), "other");
  assert.equal(normalizeCustomCategoryIconKey("generic"), "generic");
});

test("category icon form preserves a saved key and permits a replacement", () => {
  const source = readFileSync("src/components/categories/category-form.tsx", "utf8");

  assert.equal(
    source.includes('defaultValue={normalizeCustomCategoryIconKey(category?.ikona)}'),
    true,
  );
  assert.equal(source.includes('group="category"'), true);
  assert.equal(source.includes('name="ikona"'), true);
});

test("custom category icon selection does not alter system category mapping", () => {
  assert.equal(getCategoryIconKey("food"), "food");
  assert.equal(getCategoryIconKey("other"), "other");
});

test("extended custom category icons are searchable by labels and aliases", () => {
  assert.equal(normalizeCustomCategoryIconKey("heart"), "heart");
  assert.equal(normalizeCustomCategoryIconKey("game-controller"), "game-controller");
  assert.equal(searchEntityIconOptions("motoryzacja", "category")[0]?.key, "car");
  assert.equal(searchEntityIconOptions("ogrod", "category")[0]?.key, "leaf");
  assert.equal(searchEntityIconOptions("ulubione", "category")[0]?.key, "star");
});

test("custom category icon validation accepts only explicit registry keys", () => {
  assert.equal(normalizeCustomCategoryIconKey("HeartIcon"), "HeartIcon");
  assert.equal(normalizeCustomCategoryIconKey("UnknownPhosphorIcon"), "UnknownPhosphorIcon");
  assert.equal(normalizeCustomCategoryIconKey("living-room"), "other");
  assert.equal(normalizeCustomCategoryIconKey("other"), "other");
});

test("custom category create and update preserve validated icon keys", () => {
  const createSource = readFileSync(
    "src/lib/categories/create-custom-category.ts",
    "utf8",
  );
  const actionSource = readFileSync(
    "src/app/(app)/categories/actions.ts",
    "utf8",
  );

  assert.equal(
    createSource.includes("const ikona = isAllowedStoredEntityIcon(submittedIconKey)"),
    true,
  );
  assert.equal(createSource.includes("      ikona,"), true);
  assert.equal(
    actionSource.includes(
      'const ikona = isAllowedStoredEntityIcon(submittedIcon)',
    ),
    true,
  );
  assert.equal(actionSource.includes(".update({ ikona, nazwa })"), true);
});
