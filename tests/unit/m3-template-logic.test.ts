import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_TEMPLATE_OPTIONS } from "../../src/lib/categories/category-template-options";
import {
  CUSTOM_TEMPLATE_VALUE,
  FURNITURE_CUSTOM_TEMPLATE_VALUES,
  FURNITURE_TEMPLATE_OPTIONS_EN,
  FURNITURE_TEMPLATE_OPTIONS_PL,
  ROOM_TEMPLATE_OPTIONS,
  STORAGE_LOCATION_TEMPLATE_OPTIONS,
  STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES,
  STORAGE_SPACE_TEMPLATE_OPTIONS_EN,
  STORAGE_SPACE_TEMPLATE_OPTIONS_PL,
} from "../../src/lib/home/home-template-options";
import { inferHomeKind } from "../../src/lib/home/infer-home-kind";
import { generateLocationCode } from "../../src/lib/home/location-code";
import { dictionaries } from "../../src/lib/i18n";
import {
  resolveEntityActionLabel,
  resolveEntityLabels,
} from "../../src/lib/i18n/entity-labels";
import { inferTemplateOption } from "../../src/lib/templates/infer-template-option";
import {
  findTemplateOption,
  normalizeTemplateValue,
  resolveTemplateOrCustomValue,
  shouldApplyInferredTemplate,
} from "../../src/lib/templates/normalize-template-value";

function includesOption(options: readonly string[], value: string) {
  return options.includes(value);
}

function normalizedOptions(options: readonly string[]) {
  return options.map(normalizeTemplateValue);
}

test("normalizeTemplateValue ignores case, Polish signs and repeated spaces", () => {
  assert.equal(
    normalizeTemplateValue("\u0141\u00f3\u017cko   rozk\u0142adane"),
    "lozko rozkladane",
  );
  assert.equal(
    normalizeTemplateValue("  SZAFKA   NARO\u017bNA "),
    "szafka narozna",
  );
});

test("inferTemplateOption prefers the longest matching template", () => {
  assert.equal(
    inferTemplateOption(
      "Szafka nocna obok \u0142\u00f3\u017cka",
      FURNITURE_TEMPLATE_OPTIONS_PL,
      FURNITURE_CUSTOM_TEMPLATE_VALUES.pl,
    ),
    "Szafka nocna",
  );
  assert.equal(
    inferTemplateOption(
      "P\u00f3\u0142ka wisz\u0105ca nad biurkiem",
      FURNITURE_TEMPLATE_OPTIONS_PL,
      FURNITURE_CUSTOM_TEMPLATE_VALUES.pl,
    ),
    "P\u00f3\u0142ka wisz\u0105ca",
  );
});

test("home template inference keeps room behavior and covers furniture examples", () => {
  assert.equal(inferHomeKind("Salon na dole", "room"), "Salon");
  assert.equal(inferHomeKind("pokoj dziecka", "room"), "Pok\u00f3j dziecka");
  assert.equal(inferHomeKind("pokoj goscinny", "room"), "Pok\u00f3j go\u015bcinny");
  assert.equal(inferHomeKind("Pomieszczenie z rowerami", "room"), null);
  assert.equal(inferHomeKind("Komoda w salonie", "storage"), "Komoda");
  assert.equal(inferHomeKind("Szafa naro\u017cna", "storage"), "Szafa");
  assert.equal(inferHomeKind("Szafka pod telewizorem", "storage"), "Szafka");
  assert.equal(inferHomeKind("Stary kuferek", "storage"), null);
});

test("M3 template exports remain compatible with categories and rooms", () => {
  assert.ok(ROOM_TEMPLATE_OPTIONS.includes("Pok\u00f3j go\u015bcinny"));
  assert.equal(STORAGE_LOCATION_TEMPLATE_OPTIONS, FURNITURE_TEMPLATE_OPTIONS_PL);
  assert.ok(CATEGORY_TEMPLATE_OPTIONS.includes("Narz\u0119dzia"));
  assert.equal(ROOM_TEMPLATE_OPTIONS.at(-1), CUSTOM_TEMPLATE_VALUE);
  assert.equal(CATEGORY_TEMPLATE_OPTIONS.at(-1), CUSTOM_TEMPLATE_VALUE);
});

test("template and custom submissions preserve the exact user value", () => {
  assert.equal(
    resolveTemplateOrCustomValue("Komoda", "", FURNITURE_CUSTOM_TEMPLATE_VALUES.pl),
    "Komoda",
  );
  assert.equal(
    resolveTemplateOrCustomValue(
      FURNITURE_CUSTOM_TEMPLATE_VALUES.pl,
      "  Sejf \u015bcienny  ",
      FURNITURE_CUSTOM_TEMPLATE_VALUES.pl,
    ),
    "Sejf \u015bcienny",
  );
  assert.equal(
    resolveTemplateOrCustomValue(
      STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES.pl,
      "  Lewa wn\u0119ka  ",
      STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES.pl,
    ),
    "Lewa wn\u0119ka",
  );
});

test("M4N.1 resolves default Polish structure labels", () => {
  assert.deepEqual(resolveEntityLabels("pl"), {
    room: { singular: "Pomieszczenie", plural: "Pomieszczenia" },
    storage: { singular: "Mebel", plural: "Meble" },
    position: { singular: "Schowek", plural: "Schowki" },
  });
  assert.equal(resolveEntityActionLabel("pl", "add", "storage"), "Dodaj mebel");
  assert.equal(resolveEntityActionLabel("pl", "edit", "storage"), "Edytuj mebel");
  assert.equal(resolveEntityActionLabel("pl", "delete", "position"), "Usu\u0144 schowek");
});

test("M4N.1 resolves default English structure labels", () => {
  assert.deepEqual(resolveEntityLabels("en"), {
    room: { singular: "Room", plural: "Rooms" },
    storage: { singular: "Furniture item", plural: "Furniture" },
    position: { singular: "Storage space", plural: "Storage spaces" },
  });
  assert.equal(resolveEntityActionLabel("en", "create", "storage"), "Create furniture item");
  assert.equal(resolveEntityActionLabel("en", "edit", "storage"), "Edit furniture item");
  assert.equal(resolveEntityActionLabel("en", "delete", "position"), "Delete storage space");
});

test("M4N.1 applies partial overrides and preserves supplied labels", () => {
  const labels = resolveEntityLabels("pl", {
    storage: { singular: "Lokalizacja", plural: "" },
  });

  assert.equal(labels.storage.singular, "Lokalizacja");
  assert.equal(labels.storage.plural, "Meble");
  assert.equal(labels.room.singular, "Pomieszczenie");
  assert.equal(labels.position.singular, "Schowek");
});

test("M4N.1 keeps technical entity keys and approved structure copy", () => {
  const technicalKeys = ["room", "storage", "position"] as const;
  assert.deepEqual(technicalKeys, ["room", "storage", "position"]);
  assert.equal(dictionaries.pl.modules.home.structureFallback, "Dom");
  assert.equal(dictionaries.pl.modules.home.household, "Gospodarstwo");
  assert.equal(dictionaries.en.modules.home.structureFallback, "Home");
  assert.equal(dictionaries.en.modules.home.household, "Household");
});

test("M4N.2 Polish furniture templates are complete, unique and do not promote plain Shelf", () => {
  for (const option of [
    "Komoda",
    "Szafa",
    "Rega\u0142",
    "P\u00f3\u0142ka wisz\u0105ca",
    "Modu\u0142 p\u00f3\u0142kowy",
    FURNITURE_CUSTOM_TEMPLATE_VALUES.pl,
  ]) {
    assert.ok(includesOption(FURNITURE_TEMPLATE_OPTIONS_PL, option));
  }
  assert.equal(includesOption(FURNITURE_TEMPLATE_OPTIONS_PL, "P\u00f3\u0142ka"), false);
  assert.equal(
    new Set(normalizedOptions(FURNITURE_TEMPLATE_OPTIONS_PL)).size,
    FURNITURE_TEMPLATE_OPTIONS_PL.length,
  );
});

test("M4N.2 English furniture templates mirror semantics without invalid plurals", () => {
  assert.ok(includesOption(FURNITURE_TEMPLATE_OPTIONS_EN, "Chest of drawers"));
  assert.ok(includesOption(FURNITURE_TEMPLATE_OPTIONS_EN, "Wall shelf"));
  assert.ok(includesOption(FURNITURE_TEMPLATE_OPTIONS_EN, "Shelving module"));
  assert.ok(includesOption(FURNITURE_TEMPLATE_OPTIONS_EN, "Other furniture or equipment"));
  assert.equal(includesOption(FURNITURE_TEMPLATE_OPTIONS_EN, "Shelf"), false);
  assert.equal(FURNITURE_TEMPLATE_OPTIONS_EN.join(" ").toLowerCase().includes("furnitures"), false);
});

test("M4N.2 Polish storage-space templates are complete and normalized-unique", () => {
  for (const option of [
    "Szuflada",
    "G\u00f3rna p\u00f3\u0142ka",
    "Dolna p\u00f3\u0142ka",
    "Schowek pod \u0142\u00f3\u017ckiem",
    "Pojemnik",
    STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES.pl,
  ]) {
    assert.ok(includesOption(STORAGE_SPACE_TEMPLATE_OPTIONS_PL, option));
  }
  assert.equal(
    new Set(normalizedOptions(STORAGE_SPACE_TEMPLATE_OPTIONS_PL)).size,
    STORAGE_SPACE_TEMPLATE_OPTIONS_PL.length,
  );
});

test("M4N.2 English storage-space templates keep qualified shelf names", () => {
  assert.ok(includesOption(STORAGE_SPACE_TEMPLATE_OPTIONS_EN, "Drawer"));
  assert.ok(includesOption(STORAGE_SPACE_TEMPLATE_OPTIONS_EN, "Top shelf"));
  assert.ok(includesOption(STORAGE_SPACE_TEMPLATE_OPTIONS_EN, "Bottom shelf"));
  assert.ok(includesOption(STORAGE_SPACE_TEMPLATE_OPTIONS_EN, "Under-bed storage"));
  assert.ok(includesOption(STORAGE_SPACE_TEMPLATE_OPTIONS_EN, "Other storage space"));
  assert.equal(includesOption(STORAGE_SPACE_TEMPLATE_OPTIONS_EN, "Shelf"), false);
});

test("M4N.2 furniture inference handles Polish names and longest matches", () => {
  const cases = [
    ["Komoda w salonie", "Komoda"],
    ["DU\u017bA SZAFA", "Szafa"],
    ["Szafka nocna", "Szafka nocna"],
    ["Rega\u0142 na ksi\u0105\u017cki", "Rega\u0142"],
    ["P\u00f3\u0142ka wisz\u0105ca", "P\u00f3\u0142ka wisz\u0105ca"],
    ["Modu\u0142 p\u00f3\u0142kowy", "Modu\u0142 p\u00f3\u0142kowy"],
    ["\u0141\u00f3\u017cko rozk\u0142adane", "\u0141\u00f3\u017cko"],
    ["Biurko dziecka", "Biurko"],
    ["St\u00f3\u0142 kuchenny", "St\u00f3\u0142"],
    ["Lodowka", "Lod\u00f3wka"],
    ["Sejf", "Sejf"],
    ["Walizka du\u017ca", "Walizka"],
  ] as const;

  for (const [name, expected] of cases) {
    assert.equal(inferHomeKind(name, "storage"), expected);
  }
});

test("M4N.2 storage-space inference provides controlled suggestions", () => {
  const cases = [
    ["Szuflada na dokumenty", "Szuflada"],
    ["G\u00f3rna szuflada", "G\u00f3rna szuflada"],
    ["Dolna szuflada", "Dolna szuflada"],
    ["G\u00f3rna p\u00f3\u0142ka", "G\u00f3rna p\u00f3\u0142ka"],
    ["Dolna p\u00f3\u0142ka", "Dolna p\u00f3\u0142ka"],
    ["P\u00f3\u0142ka 1", "P\u00f3\u0142ka 1"],
    ["Lewa p\u00f3\u0142ka", "Lewa p\u00f3\u0142ka"],
    ["Schowek pod \u0142\u00f3\u017ckiem", "Schowek pod \u0142\u00f3\u017ckiem"],
    ["Pojemnik na kable", "Pojemnik"],
    ["Pude\u0142ko z dokumentami", "Pude\u0142ko"],
    ["Kosz na pranie", "Kosz"],
    ["Organizer na \u015bruby", "Organizer"],
  ] as const;

  for (const [name, expected] of cases) {
    assert.equal(inferHomeKind(name, "position"), expected);
  }
});

test("M4N.2 inference never overwrites an initial or manually touched value", () => {
  assert.equal(shouldApplyInferredTemplate(false, false), true);
  assert.equal(shouldApplyInferredTemplate(true, false), false);
  assert.equal(shouldApplyInferredTemplate(false, true), false);
});

test("M4N.2 legacy L2 values remain exact custom values", () => {
  for (const legacyValue of ["P\u00f3\u0142ka", "Szuflada", "Pojemnik"]) {
    assert.equal(findTemplateOption(legacyValue, FURNITURE_TEMPLATE_OPTIONS_PL), null);
    assert.equal(
      resolveTemplateOrCustomValue(
        FURNITURE_CUSTOM_TEMPLATE_VALUES.pl,
        legacyValue,
        FURNITURE_CUSTOM_TEMPLATE_VALUES.pl,
      ),
      legacyValue,
    );
  }
});

test("M4N.2 dictionaries expose equivalent PL and EN option sets", () => {
  assert.deepEqual(
    dictionaries.pl.modules.home.storageTypeSuggestions,
    [...FURNITURE_TEMPLATE_OPTIONS_PL],
  );
  assert.deepEqual(
    dictionaries.en.modules.home.storageTypeSuggestions,
    [...FURNITURE_TEMPLATE_OPTIONS_EN],
  );
  assert.deepEqual(
    dictionaries.pl.modules.home.positionNameSuggestions,
    [...STORAGE_SPACE_TEMPLATE_OPTIONS_PL],
  );
  assert.deepEqual(
    dictionaries.en.modules.home.positionNameSuggestions,
    [...STORAGE_SPACE_TEMPLATE_OPTIONS_EN],
  );
});

test("M4N.2 location codes preserve old aliases and add deterministic furniture aliases", () => {
  const base = {
    locationName: "G\u00f3rna p\u00f3\u0142ka",
    locationOrder: 2,
    roomName: "Salon",
    roomType: "Salon",
    storageLocationName: "Mebel",
  };

  assert.equal(
    generateLocationCode({ ...base, storageLocationType: "Szafka" }),
    "SAL-SZF-GOR2",
  );
  assert.equal(
    generateLocationCode({ ...base, storageLocationType: "P\u00f3\u0142ka" }),
    "SAL-POL-GOR2",
  );
  assert.equal(
    generateLocationCode({ ...base, storageLocationType: "P\u00f3\u0142ka wisz\u0105ca" }),
    "SAL-PWI-GOR2",
  );
  assert.equal(
    generateLocationCode({ ...base, storageLocationType: "Modu\u0142 p\u00f3\u0142kowy" }),
    "SAL-MPO-GOR2",
  );
  assert.equal(
    generateLocationCode({ ...base, storageLocationType: "Wall shelf" }),
    "SAL-PWI-GOR2",
  );
});
