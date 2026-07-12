import assert from "node:assert/strict";
import test from "node:test";
import {
  findMatchingCategory,
  getItemCategoryOptions,
} from "../../src/lib/categories/category-selection";

const categories = [
  {
    id: "system-tools",
    household_id: null,
    nazwa: "Narzędzia",
    czy_systemowa: true,
  },
  {
    id: "custom-sport",
    household_id: "household-a",
    nazwa: "Sport",
    czy_systemowa: false,
  },
  {
    id: "foreign-garden",
    household_id: "household-b",
    nazwa: "Ogród",
    czy_systemowa: false,
  },
];

test("item category options include system and own custom categories only", () => {
  assert.deepEqual(getItemCategoryOptions(categories, "household-a"), [
    { id: "system-tools", isSystem: true, label: "Narzędzia" },
    { id: "custom-sport", isSystem: false, label: "Sport" },
  ]);
});

test("category matching rejects empty names and finds normalized duplicates", () => {
  assert.equal(findMatchingCategory(categories, "   "), null);
  assert.equal(
    findMatchingCategory(categories, " narzedzia ")?.id,
    "system-tools",
  );
  assert.equal(findMatchingCategory(categories, " SPORT ")?.id, "custom-sport");
});
