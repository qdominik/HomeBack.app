import assert from "node:assert/strict";
import test from "node:test";
import { settleItemFormAction } from "../../src/lib/items/item-form-action";
import { cleanupOwnedItemPhotoDraft, replaceItemPhotoDraft } from "../../src/lib/items/item-photo/draft-flow";
import { uploadItemPhotoWithPreview } from "../../src/lib/items/item-photo/upload-with-preview";
import { isItemPhotoWeakSuggestion, resolveItemPhotoSuggestionName } from "../../src/lib/items/item-photo-ai/apply-suggestion";

const file = new File(["photo"], "photo.webp", { type: "image/webp" });
const oldDraft = "households/25000000-0000-4000-8000-000000000001/item-photo-drafts/35000000-0000-4000-8000-000000000001/photo.webp";
const newDraft = oldDraft.replace("35000000", "45000000");
const secretError = new Error("private-token signed-url private-provider-body");

function flow(overrides: Partial<Parameters<typeof replaceItemPhotoDraft>[0]> = {}) {
  const removed: string[] = [];
  const events: string[] = [];
  return {
    removed, events,
    input: {
      file,
      previousStoragePath: oldDraft,
      isCurrent: () => true,
      onUploading: () => events.push("uploading"),
      upload: async () => { events.push("upload"); return { ok: true as const, storagePath: newDraft }; },
      cleanup: async (path: string) => { events.push("cleanup"); removed.push(path); return { ok: true }; },
      ...overrides,
    },
  };
}

test("preparation failure preserves old draft and does not attempt upload or cleanup", async () => {
  for (const prepare of [
    async () => ({ ok: false as const, code: "unsupported_file_type" as const }),
    async () => { throw secretError; },
  ]) {
    const f = flow({ prepare });
    const result = await replaceItemPhotoDraft(f.input);
    assert.equal(result.status, "failed");
    assert.deepEqual(f.removed, []);
    assert.deepEqual(f.events, []);
    assert.doesNotMatch(JSON.stringify(result), /private-token|signed-url|private-provider-body/);
  }
});

test("returned and thrown upload failures retain old selection without cleanup", async () => {
  for (const upload of [
    async () => ({ ok: false as const, code: "upload_failed" }),
    async () => { throw secretError; },
  ]) {
    const f = flow({ upload });
    assert.deepEqual(await replaceItemPhotoDraft(f.input), { status: "failed", code: "upload_failed" });
    assert.deepEqual(f.removed, []);
  }
});

test("replacement uploads prepared file before cleaning only previous draft", async () => {
  const compressed = new File(["compressed"], "compressed.webp", { type: "image/webp" });
  const f = flow({
    prepare: async () => ({ ok: true, file: compressed, wasCompressed: true }),
    upload: async (uploadedFile) => {
      assert.equal(uploadedFile, compressed);
      assert.deepEqual(f.removed, []);
      f.events.push("upload");
      return { ok: true, storagePath: newDraft };
    },
  });
  const result = await replaceItemPhotoDraft(f.input);
  assert.equal(result.status, "uploaded");
  if (result.status !== "uploaded") return;
  assert.equal(result.file, compressed);
  assert.equal(result.cleanupFailed, false);
  assert.deepEqual(f.removed, [oldDraft]);
  assert.deepEqual(f.events, ["uploading", "upload", "cleanup"]);
});

test("old draft cleanup errors do not discard successful replacement and report failure", async () => {
  for (const cleanup of [async () => ({ ok: false }), async () => { throw secretError; }]) {
    const f = flow({ cleanup });
    const result = await replaceItemPhotoDraft(f.input);
    assert.equal(result.status, "uploaded");
    if (result.status !== "uploaded") return;
    assert.equal(result.cleanupFailed, true);
    assert.equal(result.upload.storagePath, newDraft);
  }
});

test("persisted photo is never supplied to cleanup when no previous draft exists", async () => {
  const f = flow({ previousStoragePath: undefined });
  assert.equal((await replaceItemPhotoDraft(f.input)).status, "uploaded");
  assert.deepEqual(f.removed, []);
});

test("stale preparation does not upload or delete the previous draft", async () => {
  const f = flow({ isCurrent: () => false });
  assert.deepEqual(await replaceItemPhotoDraft(f.input), { status: "stale" });
  assert.deepEqual(f.events, []);
});

test("late upload cleans its own successful draft and leaves old selection alone", async () => {
  let current = true;
  const f = flow({
    isCurrent: () => current,
    upload: async () => { current = false; return { ok: true, storagePath: newDraft }; },
  });
  assert.deepEqual(await replaceItemPhotoDraft(f.input), { status: "stale" });
  assert.deepEqual(f.removed, [newDraft]);
});

test("late failed upload never requests cleanup", async () => {
  let current = true;
  const f = flow({
    isCurrent: () => current,
    upload: async () => { current = false; throw secretError; },
  });
  assert.deepEqual(await replaceItemPhotoDraft(f.input), { status: "stale" });
  assert.deepEqual(f.removed, []);
});

test("stale replacement after old cleanup cleans only this flow's drafts", async () => {
  let current = true;
  const removed: string[] = [];
  const f = flow({
    isCurrent: () => current,
    cleanup: async (path) => { removed.push(path); current = false; return { ok: true }; },
  });
  assert.deepEqual(await replaceItemPhotoDraft(f.input), { status: "stale" });
  assert.deepEqual(removed, [oldDraft, newDraft]);
});

test("draft removal failure is controlled and a later retry can succeed", async () => {
  let attempts = 0;
  const cleanup = async (path: string) => {
    assert.equal(path, oldDraft);
    if (++attempts === 1) throw secretError;
    return { ok: true };
  };
  assert.equal(await cleanupOwnedItemPhotoDraft(oldDraft, cleanup), false);
  assert.equal(await cleanupOwnedItemPhotoDraft(oldDraft, cleanup), true);
});

test("AI transport error yields no suggestions; next attempt may succeed", async () => {
  const fallback = { ok: false as const, code: "provider_request_failed" };
  const result = await settleItemFormAction(async () => { throw secretError; }, fallback);
  assert.deepEqual(result, fallback);
  assert.doesNotMatch(JSON.stringify(result), /private-token|signed-url|private-provider-body/);
  const success = { ok: true, suggestion: { nazwa: "Wiertarka" } };
  assert.equal(await settleItemFormAction(async () => success, success), success);
});

test("quick category transport failure is safe and preserves successful existing-category result on retry", async () => {
  const fallback = { status: "action_failed" };
  assert.deepEqual(await settleItemFormAction(async () => { throw secretError; }, fallback), fallback);
  const existing = { status: "existing", category: { id: "category-1", label: "Moja kategoria" } };
  assert.equal(await settleItemFormAction(async () => existing, existing), existing);
});

test("failed/uncertain uploads never roll back an existing Storage file", async () => {
  for (const upload of [async () => ({ error: secretError }), async () => { throw secretError; }]) {
    let removals = 0;
    const result = await uploadItemPhotoWithPreview({
      upload,
      preview: async () => { assert.fail("preview must not be called"); },
      removeUploaded: async () => { removals++; },
    });
    assert.deepEqual(result, { ok: false, code: "upload_failed" });
    assert.equal(removals, 0);
  }
});

test("preview failure rolls back confirmed upload once even if cleanup throws", async () => {
  for (const preview of [
    async () => ({ data: null, error: secretError }),
    async () => ({ data: null, error: null }),
    async () => { throw secretError; },
  ]) {
    let removals = 0;
    const result = await uploadItemPhotoWithPreview({
      upload: async () => ({ error: null }), preview,
      removeUploaded: async () => { removals++; throw secretError; },
    });
    assert.deepEqual(result, { ok: false, code: "preview_url_failed" });
    assert.equal(removals, 1);
    assert.doesNotMatch(JSON.stringify(result), /private-token|signed-url|private-provider-body/);
  }
});

test("successful preview returns URL without deleting the newly selected photo", async () => {
  assert.deepEqual(await uploadItemPhotoWithPreview({
    upload: async () => ({ error: null }),
    preview: async () => ({ data: { signedUrl: "preview" }, error: null }),
    removeUploaded: async () => assert.fail("successful upload must remain"),
  }), { ok: true, previewUrl: "preview" });
});

test("manual name survives blank, unknown, low and none-confidence suggestions", () => {
  for (const nazwa of [null, "", "  ", "Nieznany przedmiot!", "UNKNOWN OBJECT", "Nierozpoznana rzecz"]) {
    const suggestion = { nazwa, categoryConfidence: "high" as const };
    assert.equal(resolveItemPhotoSuggestionName("Moja wiertarka", suggestion, false), "Moja wiertarka");
    assert.equal(isItemPhotoWeakSuggestion(suggestion), true);
  }
  for (const categoryConfidence of ["low", "none"] as const) {
    assert.equal(resolveItemPhotoSuggestionName("Moja wiertarka", { nazwa: "Narzędzie", categoryConfidence }, false), "Moja wiertarka");
  }
});

test("manual edit during analysis survives even a strong suggestion or intentionally cleared name", () => {
  const suggestion = { nazwa: "Wiertarka", categoryConfidence: "high" as const };
  assert.equal(resolveItemPhotoSuggestionName("Moja nazwa wpisana później", suggestion, true), "Moja nazwa wpisana później");
  assert.equal(resolveItemPhotoSuggestionName("", suggestion, true), "");
});

test("strong suggestions still fill names when there was no intervening manual edit", () => {
  for (const categoryConfidence of ["high", "medium"] as const) {
    assert.equal(resolveItemPhotoSuggestionName("Stara nazwa", { nazwa: "Wiertarka", categoryConfidence }, false), "Wiertarka");
  }
  assert.equal(resolveItemPhotoSuggestionName("", { nazwa: "Narzędzie", categoryConfidence: "low" }, false), "Narzędzie");
});
