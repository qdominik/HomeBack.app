import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  getArchivedItemRestoreMode,
  normalizeItemArchiveResult,
  normalizeItemRestoreResult,
  parseLegacyRestoreStatus,
  resolveItemArchiveResult,
  resolveItemRestoreResult,
  restorableItemStatuses,
} from "../../src/lib/items/item-archive-restore";

test("legacy restore accepts exactly the three approved target statuses", () => {
  assert.deepEqual(restorableItemStatuses, [
    "w domu",
    "pożyczone",
    "zużyte",
  ]);
  assert.equal(parseLegacyRestoreStatus("w domu"), "w domu");
  assert.equal(parseLegacyRestoreStatus("pożyczone"), "pożyczone");
  assert.equal(parseLegacyRestoreStatus("zużyte"), "zużyte");
});

test("legacy restore rejects archived and foreign values", () => {
  assert.equal(parseLegacyRestoreStatus("archiwalne"), null);
  assert.equal(parseLegacyRestoreStatus("deleted"), null);
  assert.equal(parseLegacyRestoreStatus(""), null);
});

test("archive result mapping exposes only the closed contract", () => {
  assert.equal(normalizeItemArchiveResult("success"), "success");
  assert.equal(
    normalizeItemArchiveResult("item_already_archived"),
    "item_already_archived",
  );
  assert.equal(normalizeItemArchiveResult("raw_postgres_error"), "action_failed");
  assert.equal(
    resolveItemArchiveResult("success", { message: "raw error" }),
    "action_failed",
  );
});

test("restore result mapping exposes legacy and state errors safely", () => {
  assert.equal(normalizeItemRestoreResult("success"), "success");
  assert.equal(
    normalizeItemRestoreResult("restore_status_required"),
    "restore_status_required",
  );
  assert.equal(
    normalizeItemRestoreResult("invalid_restore_status"),
    "invalid_restore_status",
  );
  assert.equal(normalizeItemRestoreResult("raw_postgres_error"), "action_failed");
  assert.equal(
    resolveItemRestoreResult("success", { message: "raw error" }),
    "action_failed",
  );
});

test("archived item restore mode distinguishes stored and legacy status", () => {
  assert.equal(getArchivedItemRestoreMode("w domu"), "stored");
  assert.equal(getArchivedItemRestoreMode("pożyczone"), "stored");
  assert.equal(getArchivedItemRestoreMode("zużyte"), "stored");
  assert.equal(getArchivedItemRestoreMode(null), "legacy");
  assert.equal(getArchivedItemRestoreMode("archiwalne"), "legacy");
});

test("archive and restore actions send only validated lifecycle inputs to RPC", () => {
  const source = readFileSync("src/app/(app)/items/actions.ts", "utf8");
  const archiveStart = source.indexOf("export async function archiveItem");
  const restoreStart = source.indexOf("export async function restoreItem");
  const deleteStart = source.indexOf(
    "export async function deleteItemPermanently",
  );
  const archiveSource = source.slice(archiveStart, restoreStart);
  const restoreSource = source.slice(restoreStart, deleteStart);

  assert.equal(archiveSource.includes("isValidItemId(itemId)"), true);
  assert.equal(archiveSource.includes('supabase.rpc("archive_item"'), true);
  assert.equal(archiveSource.includes("household_id"), false);
  assert.equal(archiveSource.includes("status_before_archive"), false);
  assert.equal(restoreSource.includes("parseLegacyRestoreStatus"), true);
  assert.equal(restoreSource.includes('supabase.rpc("restore_item"'), true);
  assert.equal(restoreSource.includes("p_legacy_target_status"), true);
  assert.equal(restoreSource.includes("household_id"), false);
  assert.equal(restoreSource.includes("status_before_archive"), false);
});

test("archived item UI keeps permanent deletion and separates legacy restore", () => {
  const cardSource = readFileSync("src/components/items/item-card.tsx", "utf8");
  const legacySource = readFileSync(
    "src/components/items/legacy-item-restore-form.tsx",
    "utf8",
  );

  assert.equal(cardSource.includes("<ItemPermanentDeleteDialog"), true);
  assert.equal(cardSource.includes("action={deleteItemPermanently}"), false);
  assert.equal(cardSource.includes("action={restoreItem}"), true);
  assert.equal(cardSource.includes("<LegacyItemRestoreForm"), true);
  assert.equal(legacySource.includes('value=""'), true);
  assert.equal(legacySource.includes("disabled={!targetStatus}"), true);
  assert.equal(legacySource.includes('value="archiwalne"'), false);
});

test("PL and EN dictionaries contain controlled restore messages", () => {
  const polish = readFileSync("src/lib/i18n/locales/pl.ts", "utf8");
  const english = readFileSync("src/lib/i18n/locales/en.ts", "utf8");

  assert.equal(polish.includes("itemRestored"), true);
  assert.equal(polish.includes("restoreStatusRequired"), true);
  assert.equal(english.includes('restoreItem: "Restore"'), true);
  assert.equal(english.includes('itemRestored: "Item restored."'), true);
});
