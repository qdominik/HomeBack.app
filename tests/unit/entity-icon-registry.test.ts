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
import {
  localizePhosphorIconSearchEntries,
  normalizeIconSearchText,
  paginatePhosphorIcons,
  searchPhosphorIcons,
  tokenizePhosphorIconName,
} from "../../src/lib/icons/phosphor-icon-catalog";
import { plIconSearchLocale } from "../../src/lib/icons/search-locales/pl";
import { enIconSearchLocale } from "../../src/lib/icons/search-locales/en";
import { loadIconSearchLocale } from "../../src/lib/icons/search-locales";

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
  const localizedEntries = localizePhosphorIconSearchEntries(PHOSPHOR_ICON_MANIFEST, plIconSearchLocale);
  assert.equal(searchPhosphorIcons(localizedEntries, " airplane ")[0]?.name, "AirplaneIcon");
  assert.equal(searchPhosphorIcons(localizedEntries, "AIRPLANEICON")[0]?.name, "AirplaneIcon");
  assert.equal(searchPhosphorIcons(localizedEntries, "zzzz-not-an-icon").length, 0);
  assert.equal(paginatePhosphorIcons(localizedEntries, 1).entries.length, 48);
  assert.equal(paginatePhosphorIcons(localizedEntries, 32).currentPage, 32);
});

test("Phosphor search uses Polish token aliases and icon-specific exceptions", () => {
  const localizedEntries = localizePhosphorIconSearchEntries(PHOSPHOR_ICON_MANIFEST, plIconSearchLocale);
  const namesFor = (query: string) => searchPhosphorIcons(localizedEntries, query).map((entry) => entry.name);

  assert.ok(namesFor("samolot").includes("AirplaneIcon"));
  assert.ok(namesFor("krzesło").includes("ChairIcon"));
  assert.ok(namesFor("archiwum").includes("FileArchiveIcon"));
  assert.ok(namesFor("segregator").includes("FileArchiveIcon"));
  assert.ok(namesFor("łóżko").includes("BedIcon"));
  assert.ok(namesFor("samochód").includes("CarIcon"));
  assert.ok(namesFor("auto").includes("CarIcon"));
  assert.ok(namesFor("kosz").includes("TrashIcon"));
  assert.ok(namesFor("dokument").includes("FileIcon"));
  assert.ok(namesFor("kuchnia").includes("CookingPotIcon"));
  assert.ok(namesFor("łazienka").includes("BathtubIcon"));
});

test("Phosphor search normalization removes Polish diacritics and tokenizes canonical names", () => {
  assert.equal(normalizeIconSearchText("  ŁÓŻKO  "), "lozko");
  assert.deepEqual(tokenizePhosphorIconName("AirplaneInFlightIcon"), ["airplane", "in", "flight"]);
});

const plCatalog = localizePhosphorIconSearchEntries(PHOSPHOR_ICON_MANIFEST, plIconSearchLocale);
for (const [query, iconName] of [
  ["samolot", "AirplaneIcon"], ["krzesło", "ChairIcon"], ["krzeslo", "ChairIcon"],
  ["fotel", "ArmchairIcon"], ["archiwum", "FileArchiveIcon"], ["segregator", "FileArchiveIcon"],
  ["archiwum dokumentów", "FileArchiveIcon"], ["samochód", "CarIcon"], ["samochod", "CarIcon"],
  ["auto", "CarIcon"], ["łóżko", "BedIcon"], ["lozko", "BedIcon"], ["dokument", "FileIcon"],
  ["kuchnia", "CookingPotIcon"], ["łazienka", "BathtubIcon"], ["apteczka", "FirstAidKitIcon"],
  ["pralka", "WashingMachineIcon"], ["AirplaneIcon", "AirplaneIcon"], ["airplane", "AirplaneIcon"],
] as const) {
  test(`Polish icon search: ${query} finds ${iconName}`, () => {
    assert.ok(searchPhosphorIcons(plCatalog, query).some((entry) => entry.name === iconName));
  });
}

test("English locale finds canonical AirplaneIcon", () => {
  const catalog = localizePhosphorIconSearchEntries(PHOSPHOR_ICON_MANIFEST, enIconSearchLocale);
  assert.ok(searchPhosphorIcons(catalog, "airplane").some((entry) => entry.name === "AirplaneIcon"));
});

test("unknown locale falls back to English without throwing", async () => {
  const locale = await loadIconSearchLocale("xx");
  assert.equal(locale.locale, "en");
});

test("AND search narrows FileArchiveIcon and rejects a missing term", () => {
  const file = searchPhosphorIcons(plCatalog, "plik").map((entry) => entry.name);
  const archive = searchPhosphorIcons(plCatalog, "archiwum").map((entry) => entry.name);
  const both = searchPhosphorIcons(plCatalog, "plik   archiwum").map((entry) => entry.name);
  assert.ok(both.includes("FileArchiveIcon"));
  assert.ok(both.every((name) => file.includes(name)));
  assert.ok(both.every((name) => archive.includes(name)));
  assert.equal(searchPhosphorIcons(plCatalog, "plik nieistniejace").length, 0);
});

test("normalization covers Polish diacritics and whitespace", () => {
  for (const [source, expected] of [["krzesło", "krzeslo"], ["łóżko", "lozko"], ["samochód", "samochod"], ["półka", "polka"], ["narzędzie", "narzedzie"], ["  ŁÓŻKO   ", "lozko"]] as const) assert.equal(normalizeIconSearchText(source), expected);
});

test("localized dictionary integrity covers themes, real tokens and aliases", () => {
  const names = new Set<string>(PHOSPHOR_ICON_MANIFEST.map((entry) => entry.name));
  const manifestTokens = new Set(PHOSPHOR_ICON_MANIFEST.flatMap((entry) => tokenizePhosphorIconName(entry.name)));
  assert.equal(plIconSearchLocale.themes?.length, 21);
  const tokenEntries = Object.entries(plIconSearchLocale.tokenAliases);
  assert.ok(tokenEntries.length >= 84);
  for (const theme of plIconSearchLocale.themes ?? []) assert.ok(Object.keys(theme.tokens).length >= 4, theme.id);
  for (const [token, aliases] of tokenEntries) { assert.ok(manifestTokens.has(token), token); assert.ok(aliases.length > 0, token); assert.equal(new Set(aliases.map(normalizeIconSearchText)).size, aliases.length, token); }
  const terms = new Set(tokenEntries.flatMap(([, aliases]) => aliases.map(normalizeIconSearchText)));
  assert.ok(terms.size >= 140, `terms=${terms.size}`);
  for (const [iconName, aliases] of Object.entries(plIconSearchLocale.iconAliases)) { assert.ok(names.has(iconName), iconName); assert.ok(aliases.length > 0, iconName); assert.equal(new Set(aliases.map(normalizeIconSearchText)).size, aliases.length, iconName); }
  assert.equal(enIconSearchLocale.locale, "en");
  assert.equal(plIconSearchLocale.locale, "pl");
});

test("empty query preserves all canonical names and canonical icon values", () => {
  const results = searchPhosphorIcons(plCatalog, "");
  assert.equal(results.length, 1512);
  assert.deepEqual(results.map((entry) => entry.name), PHOSPHOR_ICON_MANIFEST.map((entry) => entry.name));
  assert.equal(searchPhosphorIcons(plCatalog, "samolot")[0]?.name.endsWith("Icon"), true);
  assert.equal(searchPhosphorIcons(plCatalog, "qwerty-nie-ma").length, 0);
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
