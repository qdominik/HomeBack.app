import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isItemPhotoUnknownName,
  isItemPhotoWeakSuggestion,
  shouldApplyItemPhotoSuggestionName,
} from "../../src/lib/items/item-photo-ai";
import {
  ITEM_PHOTO_MAX_SIZE_BYTES,
  validateItemPhotoFile,
} from "../../src/lib/items/item-photo-storage";

test("item photo client selection validates size and type before upload", () => {
  const smallJpeg = new File([new Uint8Array(100)], "photo.jpg", {
    type: "image/jpeg",
  });
  const smallWebp = new File([new Uint8Array(100)], "photo.webp", {
    type: "image/webp",
  });
  const oversized = new File(
    [new Uint8Array(ITEM_PHOTO_MAX_SIZE_BYTES + 1)],
    "photo.jpg",
    { type: "image/jpeg" },
  );
  const png = new File([new Uint8Array(100)], "photo.png", {
    type: "image/png",
  });

  assert.equal(validateItemPhotoFile(smallJpeg).ok, true);
  assert.equal(validateItemPhotoFile(smallWebp).ok, true);
  assert.deepEqual(validateItemPhotoFile(oversized), {
    ok: false,
    code: "file_too_large",
  });
  assert.deepEqual(validateItemPhotoFile(png), {
    ok: false,
    code: "unsupported_file_type",
  });
});

test("item photo suggestion name guard keeps an empty name fillable", () => {
  assert.equal(shouldApplyItemPhotoSuggestionName("", "Wiertarka"), true);
  assert.equal(shouldApplyItemPhotoSuggestionName("", null), false);
  assert.equal(shouldApplyItemPhotoSuggestionName("", "Nieznany przedmiot"), true);
});

test("item photo suggestion name guard never overwrites a typed name with an unknown placeholder", () => {
  assert.equal(
    shouldApplyItemPhotoSuggestionName("Moja wiertarka", "Nieznany przedmiot"),
    false,
  );
  assert.equal(
    shouldApplyItemPhotoSuggestionName("Wiertarka", "unknown item"),
    false,
  );
  assert.equal(
    shouldApplyItemPhotoSuggestionName("Wiertarka", "Wiertarka"),
    true,
  );
});

test("item photo weak suggestion detection covers no confidence and placeholders", () => {
  assert.equal(
    isItemPhotoWeakSuggestion({ nazwa: null, categoryConfidence: "none" }),
    true,
  );
  assert.equal(
    isItemPhotoWeakSuggestion({
      nazwa: "Nieznany przedmiot",
      categoryConfidence: "none",
    }),
    true,
  );
  assert.equal(
    isItemPhotoWeakSuggestion({ nazwa: "Wiertarka", categoryConfidence: "none" }),
    true,
  );
  assert.equal(
    isItemPhotoWeakSuggestion({
      nazwa: "Nieznany przedmiot",
      categoryConfidence: "high",
    }),
    true,
  );
  assert.equal(
    isItemPhotoWeakSuggestion({ nazwa: "Wiertarka", categoryConfidence: "high" }),
    false,
  );
  assert.equal(
    isItemPhotoWeakSuggestion({ nazwa: " ", categoryConfidence: "medium" }),
    true,
  );
});

test("item photo unknown name detection normalizes Polish diacritics", () => {
  assert.equal(isItemPhotoUnknownName("Nieznany przedmiot"), true);
  assert.equal(isItemPhotoUnknownName("  NIEZNANA  rzecz "), true);
  assert.equal(isItemPhotoUnknownName("Unknown Item"), true);
  assert.equal(isItemPhotoUnknownName("Wiertarka"), false);
});

test("item form validates the photo on the client before calling the server action", () => {
  const form = readFileSync("src/components/items/item-form.tsx", "utf8");
  const uploadStart = form.indexOf("function uploadSelectedPhoto");
  const analysisStart = form.indexOf("function applyPhotoSuggestions");
  const uploadSelectedPhoto = form.slice(uploadStart, analysisStart);

  assert.notEqual(uploadStart, -1);
  assert.notEqual(analysisStart, -1);
  assert.match(uploadSelectedPhoto, /validateItemPhotoFile\(selectedFile\)/);
  assert.match(uploadSelectedPhoto, /photoErrorMessages\[selection\.code\]/);
  assert.match(uploadSelectedPhoto, /try \{/);
  assert.match(
    uploadSelectedPhoto,
    /result = await uploadItemPhotoDraft\(formData\)/,
  );
  assert.match(uploadSelectedPhoto, /errors\.uploadFailed/);
});

test("item form does not overwrite a typed name with a weak AI suggestion", () => {
  const form = readFileSync("src/components/items/item-form.tsx", "utf8");

  assert.match(
    form,
    /shouldApplyItemPhotoSuggestionName\(itemName, suggestionName\)/,
  );
  assert.match(form, /isItemPhotoWeakSuggestion\(suggestion\)/);
  assert.match(form, /noConfidentMatch/);
});

test("server actions body size limit accepts the 2 MB photo ceiling", () => {
  const nextConfig = readFileSync("next.config.ts", "utf8");

  assert.match(nextConfig, /experimental\s*:/);
  assert.match(nextConfig, /serverActions\s*:/);
  assert.match(nextConfig, /bodySizeLimit\s*:/);
  assert.match(nextConfig, /3mb/);
});
