import assert from "node:assert/strict";
import test from "node:test";
import {
  parseItemType,
  resolveItemQuantity,
  showsItemQuantity,
} from "../../src/lib/items/item-form-values";
import {
  buildItemPhotoDraftPath,
  ITEM_PHOTO_MAX_SIZE_BYTES,
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
