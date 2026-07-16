import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  formatDeleteConfirmation,
  shouldSubmitDelete,
} from "../../src/lib/confirm-delete";import {
  isValidItemId,
  normalizePermanentItemDeletionResult,
  resolvePermanentItemDeletionResult,
} from "../../src/lib/items/permanent-item-deletion";

const templates = {
  category: "Delete category \"{name}\"?",
  item: "Permanently delete item \"{name}\"? This cannot be undone.",
  position: "Delete position \"{name}\"?",
  room: "Delete room \"{name}\"?",
  storage: "Delete storage location \"{name}\"?",
};

test("delete confirmation includes the entity name", () => {
  assert.equal(
    formatDeleteConfirmation(templates.room, "Salon"),
    'Delete room "Salon"?',
  );
});

test("each permanent entity type receives its own confirmation template", () => {
  assert.equal(formatDeleteConfirmation(templates.room, "Salon"), 'Delete room "Salon"?');
  assert.equal(
    formatDeleteConfirmation(templates.storage, "Komoda"),
    'Delete storage location "Komoda"?',
  );
  assert.equal(
    formatDeleteConfirmation(templates.position, "Szuflada 1"),
    'Delete position "Szuflada 1"?',
  );
  assert.equal(
    formatDeleteConfirmation(templates.category, "Sport"),
    'Delete category "Sport"?',
  );
});

test("cancelling the confirmation blocks the form submit", () => {
  assert.equal(
    shouldSubmitDelete({ confirm: () => false, message: "Delete?" }),
    false,
  );
});

test("accepting the confirmation permits the form submit", () => {
  assert.equal(
    shouldSubmitDelete({ confirm: () => true, message: "Delete?" }),
    true,
  );
});

test("a disabled button does not open a confirmation", () => {
  let confirmCalls = 0;

  assert.equal(
    shouldSubmitDelete({
      confirm: () => {
        confirmCalls += 1;
        return true;
      },
      disabled: true,
      message: "Delete?",
    }),
    false,
  );
  assert.equal(confirmCalls, 0);
});

test("the shared client button remains a submit control", () => {
  const source = readFileSync(
    "src/components/ui/confirm-delete-button.tsx",
    "utf8",
  );

  assert.equal(source.includes('type = "submit"'), true);
});
test("permanent item confirmation includes the item name and irreversible warning", () => {
  assert.equal(
    formatDeleteConfirmation(templates.item, "Laptop"),
    'Permanently delete item "Laptop"? This cannot be undone.',
  );
});

test("permanent item deletion accepts only textual UUID values", () => {
  assert.equal(
    isValidItemId("78000000-0000-0000-0000-000000000001"),
    true,
  );
  assert.equal(isValidItemId("not-an-item-id"), false);
  assert.equal(isValidItemId("78000000-0000-0000-0000"), false);
});

test("permanent deletion result mapping exposes only the closed contract", () => {
  assert.equal(normalizePermanentItemDeletionResult("success"), "success");
  assert.equal(
    normalizePermanentItemDeletionResult("item_has_files"),
    "item_has_files",
  );
  assert.equal(
    normalizePermanentItemDeletionResult("postgres_internal_error"),
    "deletion_failed",
  );
  assert.equal(
    resolvePermanentItemDeletionResult("success", { message: "raw error" }),
    "deletion_failed",
  );
});

test("item cards use the shared confirmation and keep archive separate", () => {
  const source = readFileSync("src/components/items/item-card.tsx", "utf8");

  assert.equal(source.includes("<ConfirmDeleteButton"), true);
  assert.equal(source.includes("action={deleteItemPermanently}"), true);
  assert.equal(source.includes("action={archiveItem}"), true);
  assert.equal(source.includes("isAdmin && !isArchived"), true);
  assert.equal(source.includes("restoreItem"), false);
});

test("permanent deletion action sends only a validated item id to the RPC", () => {
  const source = readFileSync("src/app/(app)/items/actions.ts", "utf8");
  const actionStart = source.indexOf(
    "export async function deleteItemPermanently",
  );
  const actionEnd = source.indexOf(
    "export async function createQuickCustomCategory",
    actionStart,
  );
  const actionSource = source.slice(actionStart, actionEnd);

  assert.equal(actionSource.includes("isValidItemId(itemId)"), true);
  assert.equal(
    actionSource.includes('supabase.rpc("delete_item_permanently"'),
    true,
  );
  assert.equal(actionSource.includes("household_id"), false);
  assert.equal(actionSource.includes("status"), false);
});
