import assert from "node:assert/strict";
import test from "node:test";
import {
  findMatchingCategory,
  getDefaultItemCategoryId,
  getItemCategoryOptions,
  resolveInitialItemCategoryId,
} from "../../src/lib/categories/category-selection";

const categories = [
  {
    id: "system-tools",
    household_id: null,
    key: "tools",
    nazwa: "Narz\u0119dzia",
    czy_systemowa: true,
  },
  {
    id: "system-other",
    household_id: null,
    key: "other",
    nazwa: "Inne",
    czy_systemowa: true,
  },
  {
    id: "custom-sport",
    household_id: "household-a",
    key: null,
    nazwa: "Sport",
    czy_systemowa: false,
  },
  {
    id: "foreign-garden",
    household_id: "household-b",
    key: null,
    nazwa: "Ogr\u00f3d",
    czy_systemowa: false,
  },
];

test("item category options include system and own custom categories only", () => {
  assert.deepEqual(getItemCategoryOptions(categories, "household-a"), [
    { id: "system-tools", isSystem: true, label: "Narz\u0119dzia" },
    { id: "system-other", isSystem: true, label: "Inne" },
    { id: "custom-sport", isSystem: false, label: "Sport" },
  ]);
});

test("system Other is the default only for a new item form", () => {
  const defaultCategoryId = getDefaultItemCategoryId(categories);

  assert.equal(defaultCategoryId, "system-other");
  assert.equal(resolveInitialItemCategoryId(null, defaultCategoryId), "system-other");
  assert.equal(
    resolveInitialItemCategoryId("system-tools", defaultCategoryId),
    "system-tools",
  );
});

test("category matching rejects empty names and finds normalized duplicates", () => {
  assert.equal(findMatchingCategory(categories, "   "), null);
  assert.equal(
    findMatchingCategory(categories, " narzedzia ")?.id,
    "system-tools",
  );
  assert.equal(findMatchingCategory(categories, " SPORT ")?.id, "custom-sport");
  assert.equal(findMatchingCategory(categories, " INNE ")?.id, "system-other");
});
