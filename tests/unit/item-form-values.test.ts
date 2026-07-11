import assert from "node:assert/strict";
import test from "node:test";
import {
  parseItemType,
  resolveItemQuantity,
  showsItemQuantity,
} from "../../src/lib/items/item-form-values";

test("item type parser accepts only the approved enum values", () => {
  assert.equal(parseItemType("unikalny"), "unikalny");
  assert.equal(parseItemType("zapas"), "zapas");
  assert.equal(parseItemType("zestaw"), "zestaw");
  assert.equal(parseItemType("other"), null);
  assert.equal(parseItemType(""), null);
});

test("a single item always stores quantity one", () => {
  assert.equal(resolveItemQuantity("unikalny", ""), 1);
  assert.equal(resolveItemQuantity("unikalny", "12"), 1);
  assert.equal(showsItemQuantity("unikalny"), false);
});

test("stock and set use a positive integer quantity with one as the default", () => {
  assert.equal(resolveItemQuantity("zapas", ""), 1);
  assert.equal(resolveItemQuantity("zapas", "4"), 4);
  assert.equal(resolveItemQuantity("zestaw", "12"), 12);
  assert.equal(showsItemQuantity("zapas"), true);
  assert.equal(showsItemQuantity("zestaw"), true);
});

test("stock and set reject non-integer and non-positive quantities", () => {
  assert.equal(resolveItemQuantity("zapas", "0"), null);
  assert.equal(resolveItemQuantity("zapas", "-1"), null);
  assert.equal(resolveItemQuantity("zestaw", "1.5"), null);
  assert.equal(resolveItemQuantity("zestaw", "abc"), null);
});
