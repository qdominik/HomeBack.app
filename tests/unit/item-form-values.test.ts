import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseItemType,
  resolveItemQuantity,
  showsItemQuantity,
} from "../../src/lib/items/item-form-values";
import {
  buildItemPhotoFinalPath,
  buildItemPhotoDraftPath,
  getItemPhotoDraftPrefix,
  ITEM_PHOTO_MAX_SIZE_BYTES,
  isItemPhotoFinalPathForHousehold,
  isItemPhotoDraftPathForHousehold,
  sanitizeItemPhotoFilename,
  validateItemPhotoFile,
} from "../../src/lib/items/item-photo-storage";
import {
  analyzeItemPhoto,
  buildItemPhotoAnalysisPrompt,
  createGroqItemPhotoAiProvider,
  getItemPhotoAiProvider,
  parseItemPhotoAiConfig,
  validateItemPhotoAnalysisSuggestion,
  type AnalyzeItemPhotoInput,
  type ItemPhotoAnalysisSuggestion,
} from "../../src/lib/items/item-photo-ai";

const VALID_ANALYSIS_INPUT: AnalyzeItemPhotoInput = {
  imageUrl: "https://storage.example.test/signed-item-photo",
  storagePath:
    "households/25000000-0000-4000-8000-000000000001/item-photo-drafts/35000000-0000-4000-8000-000000000001/photo.webp",
  mimeType: "image/webp",
  sizeBytes: 1200,
  categories: [{ id: "cat-1", name: "Tools" }],
  locale: "pl",
};

const VALID_ANALYSIS_SUGGESTION: ItemPhotoAnalysisSuggestion = {
  nazwa: "Wiertarka",
  opis: "Akumulatorowa wiertarka w walizce.",
  categoryId: "cat-1",
  categoryConfidence: "high",
  categoryFallbackUsed: false,
  typ: "unikalny",
  ilosc: 1,
  jednostka: "szt.",
  userMessage: null,
};

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

test("item photo final path is household-scoped and uses a stable item path", () => {
  const householdId = "25000000-0000-4000-8000-000000000001";
  const itemId = "45000000-0000-4000-8000-000000000001";
  const path = buildItemPhotoFinalPath({
    householdId,
    itemId,
    mimeType: "image/jpeg",
  });

  assert.equal(
    path,
    `households/${householdId}/items/${itemId}/photo.jpg`,
  );
  assert.equal(isItemPhotoFinalPathForHousehold(path, householdId), true);
  assert.equal(
    isItemPhotoFinalPathForHousehold(
      path,
      "25000000-0000-4000-8000-000000000002",
    ),
    false,
  );
  assert.equal(
    isItemPhotoFinalPathForHousehold(
      `households/${householdId}/item-photo-drafts/${itemId}/photo.jpg`,
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

test("item form submits only draft metadata and does not expose persistent photo fields", () => {
  const form = readFileSync("src/components/items/item-form.tsx", "utf8");

  assert.match(form, /uploadItemPhotoDraft/);
  assert.match(form, /cleanupItemPhotoDraft/);
  assert.match(form, /type="file"/);
  assert.match(form, /accept="image\/jpeg,image\/webp"/);
  assert.match(form, /previewUrl/);
  assert.match(form, /storagePath/);
  assert.match(form, /name="item_photo_draft_path"/);
  assert.match(form, /name="item_photo_mime_type"/);
  assert.match(form, /name="item_photo_size_bytes"/);
  assert.doesNotMatch(form, /name="miniatura_url"/);
  assert.doesNotMatch(form, /name="file"/);
  assert.doesNotMatch(form, /name="storagePath"/);
});

test("item photo draft changes invalidate old analysis state and requests", () => {
  const form = readFileSync("src/components/items/item-form.tsx", "utf8");
  const removeStart = form.indexOf("function removePhotoDraft");
  const uploadStart = form.indexOf("function uploadSelectedPhoto");
  const analysisStart = form.indexOf("function applyPhotoSuggestions");
  const returnStart = form.indexOf("  return (", analysisStart);
  const removePhotoDraft = form.slice(removeStart, uploadStart);
  const uploadSelectedPhoto = form.slice(uploadStart, analysisStart);
  const applyPhotoSuggestions = form.slice(analysisStart, returnStart);

  assert.notEqual(removeStart, -1);
  assert.notEqual(uploadStart, -1);
  assert.notEqual(analysisStart, -1);
  assert.match(form, /const photoAnalysisRunIdRef = useRef\(0\)/);
  assert.match(form, /function resetPhotoAnalysisState\(\)/);
  assert.match(removePhotoDraft, /resetPhotoAnalysisState\(\)/);
  assert.match(removePhotoDraft, /setPhotoDraft\(null\)/);
  assert.match(removePhotoDraft, /clearPhotoInput\(\)/);
  assert.match(uploadSelectedPhoto, /resetPhotoAnalysisState\(\)/);
  assert.match(uploadSelectedPhoto, /setPhotoDraft\(\{/);
  assert.match(applyPhotoSuggestions, /const analyzedDraft = photoDraft/);
  assert.match(applyPhotoSuggestions, /storagePath: analyzedDraft\.storagePath/);
  assert.doesNotMatch(applyPhotoSuggestions, /storagePath: photoDraft\.storagePath/);
  assert.match(
    applyPhotoSuggestions,
    /analysisRunId !== photoAnalysisRunIdRef\.current/,
  );
});

test("item creation validates and persists a draft photo without storing signed URLs", () => {
  const actions = readFileSync("src/app/(app)/items/actions.ts", "utf8");
  const createStart = actions.indexOf(
    "export async function createItem(formData: FormData)",
  );
  const updateStart = actions.indexOf("export async function updateItem");
  const archiveStart = actions.indexOf("export async function archiveItem");
  const createAction = actions.slice(createStart, updateStart);
  const updateAction = actions.slice(updateStart, archiveStart);

  assert.notEqual(createStart, -1);
  assert.notEqual(updateStart, -1);
  assert.notEqual(archiveStart, -1);
  assert.match(createAction, /getItemPhotoDraftForPersistence/);
  assert.match(createAction, /validateItemPhotoDraftForPersistence/);
  assert.match(createAction, /persistItemPhoto/);
  assert.match(actions, /isItemPhotoDraftPathForHousehold/);
  assert.match(actions, /\.download\(draft\.storagePath\)/);
  assert.match(actions, /\.move\(draft\.storagePath, finalPath\)/);
  assert.match(actions, /miniatura_url: finalPath/);
  assert.match(actions, /\.from\("file"\)\.insert/);
  assert.doesNotMatch(createAction, /createSignedUrl/);
  assert.doesNotMatch(updateAction, /persistItemPhoto|item_photo_draft_path/);
});

test("item list creates signed previews only for household-scoped final photo paths", () => {
  const itemsPage = readFileSync("src/app/(app)/items/page.tsx", "utf8");
  const itemCard = readFileSync("src/components/items/item-card.tsx", "utf8");

  assert.match(itemsPage, /isItemPhotoFinalPathForHousehold/);
  assert.match(itemsPage, /createSignedUrl\(item\.miniatura_url/);
  assert.match(itemsPage, /photoPreviewUrl=/);
  assert.match(itemCard, /photoPreviewUrl/);
  assert.match(itemCard, /<Image/);
  assert.match(itemCard, /unoptimized/);
});

test("item photo AI config accepts the approved Groq provider", () => {
  const result = parseItemPhotoAiConfig({
    GROQ_API_KEY: "secret",
    ITEM_PHOTO_AI_MODEL: "owner-selected-vision-model",
    ITEM_PHOTO_AI_PROVIDER: "groq",
  });

  assert.deepEqual(result, {
    ok: true,
    data: {
      provider: "groq",
      groqApiKey: "secret",
      model: "owner-selected-vision-model",
    },
  });
});

test("item photo AI config rejects unsupported providers with a controlled error", () => {
  assert.deepEqual(
    parseItemPhotoAiConfig({
      ITEM_PHOTO_AI_PROVIDER: "gemini",
    }),
    { ok: false, code: "unsupported_provider" },
  );
});

test("Groq item photo provider reports missing API key only for analysis", async () => {
  const config = parseItemPhotoAiConfig({
    ITEM_PHOTO_AI_MODEL: "owner-selected-vision-model",
    ITEM_PHOTO_AI_PROVIDER: "groq",
  });

  assert.equal(config.ok, true);

  if (!config.ok) {
    return;
  }

  const provider = getItemPhotoAiProvider(config.data);
  assert.deepEqual(await provider.analyze(VALID_ANALYSIS_INPUT), {
    ok: false,
    code: "missing_api_key",
  });
});

test("Groq item photo provider reports missing model only for analysis", async () => {
  const config = parseItemPhotoAiConfig({
    GROQ_API_KEY: "secret",
    ITEM_PHOTO_AI_PROVIDER: "groq",
  });

  assert.equal(config.ok, true);

  if (!config.ok) {
    return;
  }

  const provider = getItemPhotoAiProvider(config.data);
  assert.deepEqual(await provider.analyze(VALID_ANALYSIS_INPUT), {
    ok: false,
    code: "missing_model",
  });
});

test("Groq item photo provider sends the signed URL and validates JSON", async () => {
  let request: RequestInit | undefined;
  const provider = createGroqItemPhotoAiProvider(
    {
      provider: "groq",
      groqApiKey: "secret",
      model: "owner-selected-vision-model",
    },
    async (_url, init) => {
      request = init;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(VALID_ANALYSIS_SUGGESTION) } }],
        }),
        { status: 200 },
      );
    },
  );

  assert.deepEqual(await provider.analyze(VALID_ANALYSIS_INPUT), {
    ok: true,
    data: VALID_ANALYSIS_SUGGESTION,
  });
  assert.match(String(request?.body), /storage\.example\.test\/signed-item-photo/);
  assert.match(String(request?.body), /response_format/);
});

test("Groq item photo provider rejects invalid JSON with a controlled error", async () => {
  const provider = createGroqItemPhotoAiProvider(
    {
      provider: "groq",
      groqApiKey: "secret",
      model: "owner-selected-vision-model",
    },
    async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: "not-json" } }] }),
        { status: 200 },
      ),
  );

  assert.deepEqual(await provider.analyze(VALID_ANALYSIS_INPUT), {
    ok: false,
    code: "invalid_model_response",
  });
});

test("Groq item photo provider falls back when JSON response format is unavailable", async () => {
  const requestBodies: string[] = [];
  const provider = createGroqItemPhotoAiProvider(
    {
      provider: "groq",
      groqApiKey: "secret",
      model: "owner-selected-vision-model",
    },
    async (_url, init) => {
      requestBodies.push(String(init?.body));

      return requestBodies.length === 1
        ? new Response(null, { status: 400 })
        : new Response(
            JSON.stringify({
              choices: [{ message: { content: JSON.stringify(VALID_ANALYSIS_SUGGESTION) } }],
            }),
            { status: 200 },
          );
    },
  );

  assert.deepEqual(await provider.analyze(VALID_ANALYSIS_INPUT), {
    ok: true,
    data: VALID_ANALYSIS_SUGGESTION,
  });
  assert.match(requestBodies[0] ?? "", /response_format/);
  assert.doesNotMatch(requestBodies[1] ?? "", /response_format/);
});

test("item photo AI analysis helper returns configuration errors without calling Groq", async () => {
  assert.deepEqual(await analyzeItemPhoto(VALID_ANALYSIS_INPUT, {}), {
    ok: false,
    code: "missing_api_key",
  });
});

test("item photo AI schema accepts a valid suggestion", () => {
  assert.deepEqual(
    validateItemPhotoAnalysisSuggestion(VALID_ANALYSIS_SUGGESTION),
    {
      ok: true,
      data: VALID_ANALYSIS_SUGGESTION,
    },
  );
});

test("item photo AI schema rejects unknown category confidence", () => {
  assert.deepEqual(
    validateItemPhotoAnalysisSuggestion({
      ...VALID_ANALYSIS_SUGGESTION,
      categoryConfidence: "certain",
    }),
    { ok: false, code: "invalid_model_response" },
  );
});

test("item photo AI schema rejects unknown item type", () => {
  assert.deepEqual(
    validateItemPhotoAnalysisSuggestion({
      ...VALID_ANALYSIS_SUGGESTION,
      typ: "consumable",
    }),
    { ok: false, code: "invalid_model_response" },
  );
});

test("item photo AI schema rejects invalid field types", () => {
  assert.deepEqual(
    validateItemPhotoAnalysisSuggestion({
      ...VALID_ANALYSIS_SUGGESTION,
      ilosc: "1",
    }),
    { ok: false, code: "invalid_model_response" },
  );
});

test("item photo AI prompt stays provider and model agnostic", () => {
  const prompt = buildItemPhotoAnalysisPrompt(VALID_ANALYSIS_INPUT);

  assert.match(prompt, /Return user-facing text in Polish/);
  assert.match(prompt, /"id":"cat-1"/);
  assert.doesNotMatch(prompt, /groq|qwen|gemini|flash/i);
});

test("item photo analysis action and form keep the draft household-scoped", () => {
  const form = readFileSync("src/components/items/item-form.tsx", "utf8");
  const actions = readFileSync("src/app/(app)/items/actions.ts", "utf8");

  const actionStart = actions.indexOf("export async function analyzeItemPhotoDraft");
  const actionEnd = actions.indexOf("async function validateCategory", actionStart);
  const analysisAction = actions.slice(actionStart, actionEnd);

  assert.match(form, /analyzeItemPhotoDraft/);
  assert.match(form, /fillFromPhoto/);
  assert.match(form, /setItemName\(suggestion\.nazwa\)/);
  assert.match(form, /setItemDescription\(suggestion\.opis\)/);
  assert.match(form, /setSelectedCategoryId|selectCategory\(suggestion\.categoryId\)/);
  assert.match(analysisAction, /getActiveAdminContext\(supabase\)/);
  assert.match(analysisAction, /isItemPhotoDraftPathForHousehold/);
  assert.doesNotMatch(analysisAction, /getStringProperty\(value, "household_id"\)/);
  assert.doesNotMatch(form, /name="miniatura_url"|name="storagePath"/);
});
