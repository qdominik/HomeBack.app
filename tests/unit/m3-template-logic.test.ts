import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_TEMPLATE_OPTIONS } from "../../src/lib/categories/category-template-options";
import { dictionaries } from "../../src/lib/i18n";
import {
  CUSTOM_TEMPLATE_VALUE,
  ROOM_TEMPLATE_OPTIONS,
  STORAGE_LOCATION_TEMPLATE_OPTIONS,
} from "../../src/lib/home/home-template-options";
import { inferHomeKind } from "../../src/lib/home/infer-home-kind";
import { inferTemplateOption } from "../../src/lib/templates/infer-template-option";
import {
  normalizeTemplateValue,
  resolveTemplateOrCustomValue,
} from "../../src/lib/templates/normalize-template-value";
import {
  resolveEntityActionLabel,
  resolveEntityLabels,
} from "../../src/lib/i18n/entity-labels";

test("normalizeTemplateValue ignores case, Polish signs and repeated spaces", () => {
  assert.equal(
    normalizeTemplateValue("\u0141\u00f3\u017cko   rozk\u0142adane"),
    "lozko rozkladane",
  );
  assert.equal(normalizeTemplateValue("  SZAFKA   NARO\u017bNA "), "szafka narozna");
});

test("inferTemplateOption prefers the longest matching template", () => {
  assert.equal(
    inferTemplateOption(
      "Szafka narozna w kuchni",
      STORAGE_LOCATION_TEMPLATE_OPTIONS,
      CUSTOM_TEMPLATE_VALUE,
    ),
    "Szafka narożna",
  );
  assert.equal(
    inferTemplateOption(
      "Regal wiszacy nad biurkiem",
      STORAGE_LOCATION_TEMPLATE_OPTIONS,
      CUSTOM_TEMPLATE_VALUE,
    ),
    "Regał wiszący",
  );
});

test("home template inference covers M3 room and storage examples", () => {
  assert.equal(inferHomeKind("Salon na dole", "room"), "Salon");
  assert.equal(inferHomeKind("pokoj dziecka", "room"), "Pokój dziecka");
  assert.equal(inferHomeKind("pokoj goscinny", "room"), "Pokój gościnny");
  assert.equal(inferHomeKind("lazienka", "room"), "Łazienka");
  assert.equal(inferHomeKind("Pomieszczenie z rowerami", "room"), null);
  assert.equal(inferHomeKind("Szafka narożna w kuchni", "storage"), "Szafka narożna");
  assert.equal(inferHomeKind("lozko rozkladane", "storage"), "Łóżko rozkładane");
  assert.equal(inferHomeKind("Stary kuferek", "storage"), null);
});

test("M3 template option lists expose template choices and custom fallback", () => {
  assert.ok(ROOM_TEMPLATE_OPTIONS.includes("Pokój gościnny"));
  assert.ok(STORAGE_LOCATION_TEMPLATE_OPTIONS.includes("Szafka wisząca"));
  assert.ok(CATEGORY_TEMPLATE_OPTIONS.includes("Narzędzia"));
  assert.equal(ROOM_TEMPLATE_OPTIONS.at(-1), CUSTOM_TEMPLATE_VALUE);
  assert.equal(STORAGE_LOCATION_TEMPLATE_OPTIONS.at(-1), CUSTOM_TEMPLATE_VALUE);
  assert.equal(CATEGORY_TEMPLATE_OPTIONS.at(-1), CUSTOM_TEMPLATE_VALUE);
});

test("M3.1 preserves template and custom values submitted by the form", () => {
  assert.equal(
    resolveTemplateOrCustomValue("Salon", "", CUSTOM_TEMPLATE_VALUE),
    "Salon",
  );
  assert.equal(
    resolveTemplateOrCustomValue("Sypialnia", "", CUSTOM_TEMPLATE_VALUE),
    "Sypialnia",
  );
  assert.equal(
    resolveTemplateOrCustomValue("Balkon", "", CUSTOM_TEMPLATE_VALUE),
    "Balkon",
  );
  assert.equal(
    resolveTemplateOrCustomValue("Rega\u0142", "", CUSTOM_TEMPLATE_VALUE),
    "Rega\u0142",
  );
  assert.equal(
    resolveTemplateOrCustomValue(
      "Szafka naro\u017cna",
      "",
      CUSTOM_TEMPLATE_VALUE,
    ),
    "Szafka naro\u017cna",
  );
  assert.equal(
    resolveTemplateOrCustomValue("Inne", "  Rowerownia  ", CUSTOM_TEMPLATE_VALUE),
    "Rowerownia",
  );
  assert.equal(
    resolveTemplateOrCustomValue("Inne", "  Kuferek  ", CUSTOM_TEMPLATE_VALUE),
    "Kuferek",
  );
  assert.equal(
    resolveTemplateOrCustomValue("Inne", "", CUSTOM_TEMPLATE_VALUE),
    CUSTOM_TEMPLATE_VALUE,
  );
});

test("M4N.1 resolves default Polish structure labels", () => {
  assert.deepEqual(resolveEntityLabels("pl"), {
    room: { singular: "Pomieszczenie", plural: "Pomieszczenia" },
    storage: { singular: "Mebel", plural: "Meble" },
    position: { singular: "Schowek", plural: "Schowki" },
  });
  assert.equal(
    resolveEntityActionLabel("pl", "add", "storage"),
    "Dodaj mebel",
  );
  assert.equal(resolveEntityActionLabel("pl", "edit", "storage"), "Edytuj mebel");
  assert.equal(resolveEntityActionLabel("pl", "delete", "position"), "Usuń schowek");
});

test("M4N.1 resolves default English structure labels", () => {
  assert.deepEqual(resolveEntityLabels("en"), {
    room: { singular: "Room", plural: "Rooms" },
    storage: { singular: "Furniture item", plural: "Furniture" },
    position: { singular: "Storage space", plural: "Storage spaces" },
  });
  assert.equal(
    resolveEntityActionLabel("en", "create", "storage"),
    "Create furniture item",
  );
  assert.equal(resolveEntityActionLabel("en", "edit", "storage"), "Edit furniture item");
  assert.equal(resolveEntityActionLabel("en", "delete", "position"), "Delete storage space");
});

test("M3.2A applies a partial storage override only to storage", () => {
  const labels = resolveEntityLabels("pl", {
    storage: { singular: "Lokalizacja" },
  });

  assert.equal(labels.storage.singular, "Lokalizacja");
  assert.equal(labels.storage.plural, "Meble");
  assert.equal(labels.room.singular, "Pomieszczenie");
  assert.equal(labels.position.singular, "Schowek");
});

test("M4N.1 falls back when an entity label override is missing or empty", () => {
  const labels = resolveEntityLabels("pl", {
    storage: { singular: "", plural: "" },
  });

  assert.deepEqual(labels.storage, {
    singular: "Mebel",
    plural: "Meble",
  });
});

test("M4N.1 preserves a supplied label without translating other entities", () => {
  const userProvidedLabel = "Prywatny schowek";
  const labels = resolveEntityLabels("pl", {
    storage: { singular: userProvidedLabel },
  });

  assert.equal(labels.storage.singular, userProvidedLabel);
  assert.equal(labels.room.plural, "Pomieszczenia");
  assert.equal(labels.position.plural, "Schowki");
});

test("M4 small stage exposes Shelf once and preserves Other as the final storage template", () => {
  const shelf = "P\u00f3\u0142ka";
  const shelfIndex = STORAGE_LOCATION_TEMPLATE_OPTIONS.indexOf(shelf);
  const shelfUnitIndex = STORAGE_LOCATION_TEMPLATE_OPTIONS.indexOf("Rega\u0142 wisz\u0105cy");

  assert.equal(
    STORAGE_LOCATION_TEMPLATE_OPTIONS.filter((option) => option === shelf).length,
    1,
  );
  assert.ok(shelfIndex > shelfUnitIndex);
  assert.equal(STORAGE_LOCATION_TEMPLATE_OPTIONS.at(-1), CUSTOM_TEMPLATE_VALUE);
});
test("M4N.1 keeps technical entity keys while exposing approved selector and delete-dialog labels", () => {
  const technicalKeys = ["room", "storage", "position"] as const;
  assert.deepEqual(technicalKeys, ["room", "storage", "position"]);

  assert.equal(dictionaries.pl.modules.items.selectStorage, "Wybierz Mebel");
  assert.equal(dictionaries.pl.modules.items.selectPosition, "Wybierz Schowek");
  assert.equal(dictionaries.pl.modules.home.structureFallback, "Dom");
  assert.equal(dictionaries.pl.modules.home.household, "Gospodarstwo");
  assert.equal(
    dictionaries.pl.modules.home.positionDelete.noTarget,
    "Nie ma innego Schowka, do którego można przenieść Rzeczy. Najpierw dodaj Schowek w innym Meblu.",
  );

  assert.equal(dictionaries.en.modules.items.selectStorage, "Select furniture");
  assert.equal(dictionaries.en.modules.items.selectPosition, "Select storage space");
  assert.equal(dictionaries.en.modules.home.structureFallback, "Home");
  assert.equal(dictionaries.en.modules.home.household, "Household");
  assert.equal(
    dictionaries.en.modules.home.positionDelete.noTarget,
    "There is no other Storage space to move Items to. Add a Storage space in another Furniture item first.",
  );
});