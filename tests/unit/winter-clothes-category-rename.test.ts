import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

test("0018 migration renames only the winter_clothes label for existing databases", () => {
  const migration = source(
    "supabase/migrations/0018_rename_winter_clothes_category.sql",
  );

  assert.match(migration, /update public\.category/);
  assert.match(migration, /nazwa = 'Ubrania'/);
  assert.match(migration, /key = 'winter_clothes'/);
  assert.match(migration, /household_id is null/);
  assert.match(migration, /nazwa = 'Ubrania zimowe'/);

  assert.doesNotMatch(migration, /\bkey\s*=\s*['"]?winter_clothes.*,\s*key/);
  assert.doesNotMatch(migration, /set\s+key\s*=/);
  assert.doesNotMatch(migration, /set\s+ikona\s*=/);
  assert.doesNotMatch(migration, /set\s+czy_systemowa\s*=/);
  assert.doesNotMatch(migration, /set\s+widoczna_dla_dzieci\s*=/);
  assert.doesNotMatch(migration, /\binsert\s+into\b/i);
  assert.doesNotMatch(migration, /\bdelete\s+from\b/i);
});

test("the 0001 seed and the 0018 migration agree on the final label", () => {
  const seed = source("supabase/migrations/0001_initial_schema.sql");

  assert.match(seed, /\('winter_clothes', 'Ubrania', true, true\)/);
  assert.doesNotMatch(seed, /Ubrania zimowe/);
});

test("the winter_clothes icon mapping and template label stay unchanged", () => {
  const iconMap = source("src/lib/icons/category-icon-map.ts");
  const iconDefinitions = source("src/lib/icons/entity-icon-definitions.ts");
  const templateOptions = source(
    "src/lib/categories/category-template-options.ts",
  );

  assert.match(iconMap, /winter_clothes: "clothing"/);
  assert.match(iconDefinitions, /label: \{ en: "Clothing", pl: "Ubrania" \}/);
  assert.match(templateOptions, /"Ubrania"/);
  assert.doesNotMatch(templateOptions, /Ubrania zimowe/);
});
