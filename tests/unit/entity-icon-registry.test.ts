import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ENTITY_ICON_DEFINITIONS,
  ENTITY_ICON_FALLBACKS,
} from "../../src/lib/icons/entity-icon-definitions";
import { getCategoryIconKey } from "../../src/lib/icons/category-icon-map";
import { resolveItemIconKey } from "../../src/lib/icons/item-icon-resolution";
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

test("entity icon keys are recognized and unknown values are rejected", () => {
  assert.equal(isEntityIconKey("living-room"), true);
  assert.equal(isEntityIconKey("ArmchairIcon"), false);
  assert.equal(isEntityIconKey(""), false);
});

test("empty and unknown icon keys normalize to the requested group fallback", () => {
  assert.equal(normalizeEntityIconKey("", "room"), ENTITY_ICON_FALLBACKS.room);
  assert.equal(normalizeEntityIconKey("legacy-emoji", "storage"), "storage");
  assert.equal(getEntityIconFallback("item"), "package");
});

test("entity icon definitions have unique keys and group labels", () => {
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
