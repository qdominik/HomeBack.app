import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseItemType,
  resolveItemQuantity,
  showsItemQuantity,
} from "../../src/lib/items/item-form-values";
import {
  buildItemPhotoDraftPath,
  getItemPhotoDraftPrefix,
  ITEM_PHOTO_MAX_SIZE_BYTES,
  isItemPhotoDraftPathForHousehold,
  sanitizeItemPhotoFilename,
  validateItemPhotoFile,
} from "../../src/lib/items/item-photo-storage";

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

test("item photo validation accepts JPEG and WebP files", () => {
  const jpeg = new File(["jpeg"], "photo.png", { type: "image/jpeg" });
  const webp = new File(["webp"], "photo.txt", { type: "image/webp" });
  const jpegResult = validateItemPhotoFile(jpeg);
  const webpResult = validateItemPhotoFile(webp);

  assert.deepEqual(
    {
      ok: jpegResult.ok,
      mimeType: jpegResult.ok ? jpegResult.mimeType : null,
    },
    { ok: true, mimeType: "image/jpeg" },
  );
  assert.deepEqual(
    {
      ok: webpResult.ok,
      mimeType: webpResult.ok ? webpResult.mimeType : null,
    },
    { ok: true, mimeType: "image/webp" },
  );
});

test("item photo validation rejects unsupported MIME types and oversized files", () => {
  const png = new File(["png"], "photo.jpg", { type: "image/png" });
  const oversized = new File(
    [new Uint8Array(ITEM_PHOTO_MAX_SIZE_BYTES + 1)],
    "photo.webp",
    { type: "image/webp" },
  );

  assert.deepEqual(validateItemPhotoFile(png), {
    ok: false,
    code: "unsupported_file_type",
  });
  assert.deepEqual(validateItemPhotoFile(oversized), {
    ok: false,
    code: "file_too_large",
  });
});

test("item photo draft path sanitizes filename and includes household and draft ids", () => {
  const householdId = "25000000-0000-4000-8000-000000000001";
  const draftId = "35000000-0000-4000-8000-000000000001";
  const filename = "..\\Moje Zdjecie / Rzecz #1.webp";

  assert.equal(
    sanitizeItemPhotoFilename(filename),
    "moje-zdjecie-rzecz-1.webp",
  );
  assert.deepEqual(
    buildItemPhotoDraftPath({ draftId, filename, householdId }),
    {
      draftId,
      path: `households/${householdId}/item-photo-drafts/${draftId}/moje-zdjecie-rzecz-1.webp`,
    },
  );
});

test("item photo draft path guard accepts only active household draft paths", () => {
  const householdId = "25000000-0000-4000-8000-000000000001";
  const draftId = "35000000-0000-4000-8000-000000000001";
  const validPath = `households/${householdId}/item-photo-drafts/${draftId}/photo.webp`;

  assert.equal(
    getItemPhotoDraftPrefix(householdId),
    `households/${householdId}/item-photo-drafts/`,
  );
  assert.equal(isItemPhotoDraftPathForHousehold(validPath, householdId), true);
  assert.equal(
    isItemPhotoDraftPathForHousehold(
      validPath,
      "25000000-0000-4000-8000-000000000002",
    ),
    false,
  );
  assert.equal(
    isItemPhotoDraftPathForHousehold(
      `households/${householdId}/final/${draftId}/photo.webp`,
      householdId,
    ),
    false,
  );
});

test("item photo draft actions do not accept household id from the client", () => {
  const actions = readFileSync("src/app/(app)/items/actions.ts", "utf8");
  const uploadStart = actions.indexOf("export async function uploadItemPhotoDraft");
  const uploadEnd = actions.indexOf("export async function createItem", uploadStart);
  const uploadAction = actions.slice(uploadStart, uploadEnd);

  assert.notEqual(uploadStart, -1);
  assert.notEqual(uploadEnd, -1);
  assert.match(uploadAction, /getActiveAdminContext\(supabase\)/);
  assert.doesNotMatch(uploadAction, /formData\.get\(["']household_id["']\)/);
  assert.doesNotMatch(uploadAction, /getStringProperty\(.*["']household_id["']\)/);
  assert.match(uploadAction, /validateItemPhotoFile\(formData\.get\("photo"\)\)/);
});

test("item form supports photo draft preview without submitting persistent photo fields", () => {
  const form = readFileSync("src/components/items/item-form.tsx", "utf8");

  assert.match(form, /uploadItemPhotoDraft/);
  assert.match(form, /cleanupItemPhotoDraft/);
  assert.match(form, /type="file"/);
  assert.match(form, /accept="image\/jpeg,image\/webp"/);
  assert.match(form, /previewUrl/);
  assert.match(form, /storagePath/);
  assert.doesNotMatch(form, /name="miniatura_url"/);
  assert.doesNotMatch(form, /name="file"/);
  assert.doesNotMatch(form, /name="storagePath"/);
});

test("item create and update do not persist photo references in this stage", () => {
  const actions = readFileSync("src/app/(app)/items/actions.ts", "utf8");
  const createStart = actions.indexOf("export async function createItem");
  const updateStart = actions.indexOf("export async function updateItem");
  const archiveStart = actions.indexOf("export async function archiveItem");
  const createAction = actions.slice(createStart, updateStart);
  const updateAction = actions.slice(updateStart, archiveStart);

  assert.notEqual(createStart, -1);
  assert.notEqual(updateStart, -1);
  assert.notEqual(archiveStart, -1);
  assert.doesNotMatch(createAction, /miniatura_url|\.from\("file"\)/);
  assert.doesNotMatch(updateAction, /miniatura_url|\.from\("file"\)/);
});
