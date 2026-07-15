import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  formatDeleteConfirmation,
  shouldSubmitDelete,
} from "../../src/lib/confirm-delete";

const templates = {
  category: "Delete category \"{name}\"?",
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
