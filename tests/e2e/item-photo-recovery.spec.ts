import { test, expect } from "./support/item-photo-browser/fixture";
import type { ActionName, Step } from "./support/item-photo-browser/types";
import type { Page } from "@playwright/test";
const browserFailures = new WeakMap<Page, string[]>();

const messages = {
  upload: "Nie udało się wgrać zdjęcia. Spróbuj ponownie. Poprzednio wybrane zdjęcie pozostaje w formularzu.",
  analysis: "Nie udało się przeanalizować zdjęcia. Możesz spróbować ponownie lub uzupełnić formularz ręcznie. Wybrane zdjęcie pozostaje w formularzu.",
  cleanup: "Nie udało się usunąć wybranego zdjęcia. Pozostaje w formularzu; spróbuj ponownie.",
  replacement: "Nowe zdjęcie jest gotowe. Nie udało się usunąć poprzedniego pliku tymczasowego.",
};
async function queue(page: Page, action: ActionName, step: Step) {
  await page.evaluate(({ action, step }) => window.photoHarness.queue(action, step), { action, step });
}
async function calls(page: Page, action: ActionName) {
  return page.evaluate((action) => window.photoHarness.calls.filter((call) => call.action === action), action);
}
async function selectPhoto(page: Page, name = "photo.jpg", padded = false) {
  const bytes = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 2000; canvas.height = 1000;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#1b6f4d"; ctx.fillRect(0, 0, 2000, 1000);
    return Array.from(atob(canvas.toDataURL("image/jpeg").split(",")[1]), (character) => character.charCodeAt(0));
  });
  const buffer = padded ? Buffer.concat([Buffer.from(bytes), Buffer.alloc(900 * 1024)]) : Buffer.from(bytes);
  await page.locator('input[type="file"]').setInputFiles({ name, mimeType: "image/jpeg", buffer });
}
async function path(page: Page) { return page.locator('[name="item_photo_draft_path"]').inputValue(); }
async function expectPhoto(page: Page, name: string) {
  const preview = page.getByAltText("Podgląd wybranego zdjęcia Rzeczy");
  await expect(preview).toBeVisible();
  if (name === "existing.webp") {
    await expect(page.locator('[name="item_photo_draft_path"]')).toHaveCount(0);
    await expect(preview).toHaveAttribute("src", /^data:image/);
  } else {
    await expect.poll(async () => {
      const matching = (await calls(page, "upload")).filter((entry) => entry.input.filename === name);
      const current = await page.locator('[name="item_photo_draft_path"]').inputValue().catch(() => "");
      return matching.some((entry) => entry.input.storagePath === current);
    }).toBe(true);
  }
}
async function ready(page: Page) {
  await expect(page.locator('input[type="file"]')).toBeEnabled();
  await expect(page.getByRole("button", { name: "Zapisz fixture", exact: true })).toBeEnabled();
}
async function entered(page: Page) {
  await page.locator('[name="nazwa"]').fill("Moja ręczna nazwa");
  await page.locator('[name="opis"]').fill("Mój prywatny opis fixture");
  await page.locator('[name="jednostka"]').fill("sztuka");
}
async function retained(page: Page) {
  await expect(page.locator('[name="nazwa"]')).toHaveValue("Moja ręczna nazwa");
  await expect(page.locator('[name="opis"]')).toHaveValue("Mój prywatny opis fixture");
  await expect(page.locator('[name="jednostka"]')).toHaveValue("sztuka");
}
const suggestion = (nazwa: string | null, categoryConfidence = "high") => ({ ok: true, suggestion: {
  nazwa, categoryConfidence, opis: null, categoryId: null, typ: null, ilosc: null, jednostka: null, userMessage: null,
} });

for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
  test.describe(viewport.name, () => {
    test.describe.configure({ retries: 0 });
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    test.beforeEach(async ({ page, photoURL }) => {
      const failures: string[] = []; browserFailures.set(page, failures);
      page.on("pageerror", (error) => failures.push(error.message));
      await page.route("**/*", (route) => {
        if (new URL(route.request().url()).origin === photoURL) return route.continue();
        failures.push(`Unexpected outbound request: ${route.request().url()}`); return route.abort();
      });
      await page.goto(photoURL);
      await expect(page.locator('[name="nazwa"]')).toBeVisible();
    });
    test.afterEach(async ({ page }, info) => {
      expect(browserFailures.get(page), "no React error boundary or outbound service request").toEqual([]);
      await expect(page.locator("body")).not.toContainText(/private-token|signed-url|private-provider-body/);
      if (!page.isClosed()) {
        await info.attach("form-and-controls", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
        await info.attach("fixture-action-calls", { body: JSON.stringify(await page.evaluate(() => window.photoHarness.calls), null, 2), contentType: "application/json" });
      }
    });

    test("photo preview and fill action appear before the form fields", async ({ page }) => {
      await selectPhoto(page);
      await ready(page);
      const preview = page.getByAltText("Podgląd wybranego zdjęcia Rzeczy");
      const fill = page.getByRole("button", { name: "Uzupełnij ze zdjęcia", exact: true });
      const name = page.locator('[name="nazwa"]');
      const previewBox = await preview.locator("..").boundingBox();
      const fillBox = await fill.boundingBox();
      const nameBox = await name.boundingBox();
      expect(previewBox?.width).toBeGreaterThanOrEqual(128);
      expect(previewBox?.height).toBeGreaterThanOrEqual(128);
      expect((previewBox?.y ?? 0) + (previewBox?.height ?? 0)).toBeLessThanOrEqual(nameBox?.y ?? 0);
      expect((fillBox?.y ?? 0) + (fillBox?.height ?? 0)).toBeLessThanOrEqual(nameBox?.y ?? 0);
      await expect(page.getByText("Zdjęcie gotowe do podglądu.")).toHaveCount(0);
      await expect(page.getByText("photo.jpg", { exact: true })).toHaveCount(0);
      await expect(page.getByText(/image\/jpeg/)).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Zmień zdjęcie", exact: true })).toHaveCount(0);
    });

    test("remove and add another photo replaces the current draft", async ({ page }) => {
      await selectPhoto(page, "old.jpg");
      await ready(page);
      const oldPath = await path(page);
      await page.getByRole("button", { name: "Usuń zdjęcie", exact: true }).click();
      await ready(page);
      await expect(page.getByAltText("Podgląd wybranego zdjęcia Rzeczy")).toHaveCount(0);
      const chooserPromise = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Dodaj zdjęcie", exact: true }).click();
      const chooser = await chooserPromise;
      const bytes = await page.evaluate(() => {
        const canvas = document.createElement("canvas"); canvas.width = 8; canvas.height = 8;
        return Array.from(atob(canvas.toDataURL("image/jpeg").split(",")[1]), (c) => c.charCodeAt(0));
      });
      await chooser.setFiles({ name: "replacement.jpg", mimeType: "image/jpeg", buffer: Buffer.from(bytes) });
      await expectPhoto(page, "replacement.jpg");
      await ready(page);
      expect((await calls(page, "cleanup")).map((entry) => entry.input.storagePath)).toContain(oldPath);
    });

    test("upload exception preserves existing photo, values and same-file retry", async ({ page, photoURL }) => {
      await page.goto(`${photoURL}?edit`); await entered(page);
      await queue(page, "upload", { reject: true, gate: "upload" }); await selectPhoto(page);
      await expect(page.locator('input[type="file"]')).toBeDisabled();
      await expect(page.getByRole("button", { name: "Zapisz fixture" })).toBeDisabled();
      await expect.poll(async () => (await calls(page, "upload")).length).toBe(1);
      await page.evaluate(() => window.photoHarness.release("upload"));
      await expect(page.getByText(messages.upload, { exact: true })).toBeVisible();
      await ready(page); await retained(page);
      await expectPhoto(page, "existing.webp");
      expect(await calls(page, "cleanup")).toEqual([]);
      await expect(page.locator('input[type="file"]')).toHaveValue("");
      await selectPhoto(page); await expectPhoto(page, "photo.jpg");
      await ready(page); expect(await calls(page, "upload")).toHaveLength(2);
      expect(await calls(page, "cleanup")).toEqual([]);
    });

    test("returned upload error keeps previous draft and hidden metadata", async ({ page }) => {
      await entered(page); await selectPhoto(page, "old.jpg"); await ready(page);
      const original = await path(page);
      await queue(page, "upload", { result: { ok: false, code: "upload_failed" } });
      await selectPhoto(page, "new.jpg"); await expect(page.getByText(messages.upload, { exact: true })).toBeVisible();
      await retained(page); await ready(page); expect(await path(page)).toBe(original);
      expect(await calls(page, "cleanup")).toEqual([]);
      await expectPhoto(page, "old.jpg");
      await selectPhoto(page, "new.jpg"); await ready(page);
      await expectPhoto(page, "new.jpg");
      expect((await calls(page, "cleanup")).map((call) => call.input.storagePath)).toEqual([original]);
    });

    test("AI exception unlocks controls, retains photo and fields, and permits retry", async ({ page }) => {
      await entered(page); await selectPhoto(page); await ready(page); const original = await path(page);
      await queue(page, "analyze", { reject: true, gate: "analysis" });
      await page.getByRole("button", { name: "Uzupełnij ze zdjęcia", exact: true }).click();
      await expect(page.locator('input[type="file"]')).toBeDisabled();
      await page.evaluate(() => window.photoHarness.release("analysis"));
      await expect(page.getByText(messages.analysis, { exact: true })).toBeVisible();
      await retained(page); await ready(page); expect(await path(page)).toBe(original);
      await expect(page.getByRole("button", { name: "Uzupełnij ze zdjęcia", exact: true })).toBeEnabled();
      await page.getByRole("button", { name: "Uzupełnij ze zdjęcia", exact: true }).click();
      await expect(page.locator('[name="nazwa"]')).toHaveValue("Wiertarka"); await ready(page);
      expect(await path(page)).toBe(original); expect(await calls(page, "analyze")).toHaveLength(2);
      expect(await calls(page, "cleanup")).toEqual([]);
    });

    test("cleanup exception retains draft; retry restores existing photo without deleting it", async ({ page, photoURL }) => {
      await page.goto(`${photoURL}?edit`); await entered(page); await selectPhoto(page); await ready(page);
      const original = await path(page);
      await queue(page, "cleanup", { reject: true, gate: "cleanup" });
      await page.getByRole("button", { name: "Usuń zdjęcie", exact: true }).click();
      await expect(page.locator('input[type="file"]')).toBeDisabled();
      await page.evaluate(() => window.photoHarness.release("cleanup"));
      await expect(page.getByText(messages.cleanup, { exact: true })).toBeVisible();
      expect(await path(page)).toBe(original); await retained(page); await ready(page);
      await page.getByRole("button", { name: "Usuń zdjęcie", exact: true }).click();
      await ready(page); await expect(page.locator('[name="item_photo_draft_path"]')).toHaveCount(0);
      await expectPhoto(page, "existing.webp");
      expect((await calls(page, "cleanup")).map((call) => call.input.storagePath)).toEqual([original, original]);
      await page.getByRole("button", { name: "Usuń zdjęcie", exact: true }).click();
      await expect(page.locator('[name="item_photo_remove_current"]')).toHaveValue("1");
      expect(await calls(page, "cleanup")).toHaveLength(2);
    });

    test("replacement cleanup failure keeps new draft and warns; only owned drafts are cleaned", async ({ page, photoURL }) => {
      await page.goto(`${photoURL}?edit`); await entered(page); await selectPhoto(page, "old.jpg"); await ready(page);
      const original = await path(page); await queue(page, "cleanup", { result: { ok: false, code: "cleanup_failed" } });
      await selectPhoto(page, "new.jpg"); await expect(page.getByText(messages.replacement, { exact: true })).toBeVisible();
      await ready(page); await retained(page); const replacement = await path(page); expect(replacement).not.toBe(original);
      await expectPhoto(page, "new.jpg");
      await page.getByRole("button", { name: "Usuń zdjęcie", exact: true }).click(); await ready(page);
      expect((await calls(page, "cleanup")).map((call) => call.input.storagePath)).toEqual([original, replacement]);
      await expectPhoto(page, "existing.webp");
    });

    test("quick category exception keeps submitted name and permits existing-category retry", async ({ page }) => {
      await entered(page); await page.locator('[name="category_id"]').selectOption("__another_category__");
      const input = page.getByLabel("Nazwa nowej kategorii", { exact: true }); await input.fill("Mój warsztat");
      await queue(page, "category", { reject: true, gate: "category" });
      await page.getByRole("button", { name: "Dodaj kategorię", exact: true }).click();
      await expect(page.getByRole("button", { name: "Zapisywanie...", exact: true })).toBeDisabled();
      await page.evaluate(() => window.photoHarness.release("category"));
      await expect(page.getByText("Nie udało się zapisać rzeczy.", { exact: true })).toBeVisible();
      await expect(input).toHaveValue("Mój warsztat"); await retained(page);
      await expect(page.getByRole("button", { name: "Dodaj kategorię", exact: true })).toBeEnabled();
      await queue(page, "category", { result: { status: "existing", category: { id: "custom-tools", label: "Mój warsztat", isSystem: false } } });
      await page.getByRole("button", { name: "Dodaj kategorię", exact: true }).click();
      await expect(page.locator('[name="category_id"]')).toHaveValue("custom-tools"); await ready(page);
      expect((await calls(page, "category")).map((call) => call.input.name)).toEqual(["Mój warsztat", "Mój warsztat"]);
    });

    test("weak AI suggestions preserve manual name", async ({ page }) => {
      await entered(page); await selectPhoto(page); await ready(page);
      for (const result of [suggestion("Nieznany przedmiot!"), suggestion("UNKNOWN OBJECT"), suggestion(null), suggestion("Narzędzie", "low"), suggestion("Narzędzie", "none")]) {
        await queue(page, "analyze", { result });
        await page.getByRole("button", { name: "Uzupełnij ze zdjęcia", exact: true }).click();
        await ready(page); await retained(page);
        await expect(page.getByText("Nie udało się pewnie rozpoznać przedmiotu. Sprawdź sugestie i uzupełnij nazwę ręcznie.", { exact: true })).toBeVisible();
      }
    });

    test("preview failure survives rollback exception and preserves existing photo", async ({ page, photoURL }) => {
      await page.goto(`${photoURL}?edit`); await entered(page);
      await queue(page, "preview", { reject: true }); await queue(page, "rollback", { reject: true });
      await selectPhoto(page);
      await expect(page.getByText("Nie udało się przygotować podglądu zdjęcia.", { exact: true })).toBeVisible();
      await expect(page.getByText(messages.cleanup, { exact: true })).toHaveCount(0);
      await retained(page); await ready(page); await expectPhoto(page, "existing.webp");
      const uploaded = (await calls(page, "upload"))[0].input;
      expect((await calls(page, "rollback")).map((call) => call.input.storagePath)).toEqual([uploaded.storagePath]);
      expect(await calls(page, "cleanup")).toEqual([]);
      await selectPhoto(page); await expectPhoto(page, "photo.jpg"); await ready(page);
    });

    test("invalid large image fails compression locally without discarding previous draft", async ({ page }) => {
      await entered(page); await selectPhoto(page, "old.jpg"); await ready(page); const original = await path(page);
      await page.locator('input[type="file"]').setInputFiles({ name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(900 * 1024) });
      await expect(page.getByText("Nie udało się odczytać lub skompresować zdjęcia.", { exact: true })).toBeVisible();
      await retained(page); await ready(page); expect(await path(page)).toBe(original);
      expect(await calls(page, "upload")).toHaveLength(1); expect(await calls(page, "cleanup")).toEqual([]);
      await selectPhoto(page, "valid.jpg"); await expectPhoto(page, "valid.jpg"); await ready(page);
    });

    test("manual typing and intentional clearing during late strong AI are preserved", async ({ page }) => {
      await entered(page); await selectPhoto(page); await ready(page);
      for (const manual of ["Nazwa wpisana podczas analizy", ""]) {
        await queue(page, "analyze", { result: suggestion("Spóźniona nazwa"), gate: "late-name" });
        await page.getByRole("button", { name: "Uzupełnij ze zdjęcia", exact: true }).click();
        await expect(page.locator('input[type="file"]')).toBeDisabled();
        await page.locator('[name="nazwa"]').fill(manual); await page.evaluate(() => window.photoHarness.release("late-name"));
        await ready(page); await expect(page.locator('[name="nazwa"]')).toHaveValue(manual);
      }
    });

    test("late upload cannot replace newer selection and cleans only its own draft", async ({ page }) => {
      await queue(page, "upload", { gate: "old-upload" }); await selectPhoto(page, "old.jpg");
      await expect.poll(async () => (await calls(page, "upload")).length).toBe(1);
      await expect(page.locator('input[type="file"]')).toBeDisabled();
      // Deliberately inject a second native change while disabled to exercise the defensive run-id guard.
      await selectPhoto(page, "new.jpg"); await expect.poll(async () => (await calls(page, "upload")).length).toBe(2);
      await page.evaluate(() => window.photoHarness.release("old-upload")); await ready(page);
      const uploaded = await calls(page, "upload"); expect(await path(page)).toBe(uploaded[1].input.storagePath);
      await expectPhoto(page, "new.jpg");
      expect((await calls(page, "cleanup")).map((call) => call.input.storagePath)).toEqual([uploaded[0].input.storagePath]);
    });

    test("late AI for older photo cannot populate newer selection", async ({ page }) => {
      await entered(page); await selectPhoto(page, "old.jpg"); await ready(page);
      await queue(page, "analyze", { result: suggestion("Stara odpowiedź"), gate: "old-analysis" });
      await page.getByRole("button", { name: "Uzupełnij ze zdjęcia", exact: true }).click();
      await expect(page.locator('input[type="file"]')).toBeDisabled();
      // Same injected-event stress as above; normal clicks are blocked while AI is pending.
      await selectPhoto(page, "new.jpg"); await expect.poll(async () => (await calls(page, "upload")).length).toBe(2);
      await page.evaluate(() => window.photoHarness.release("old-analysis")); await ready(page); await retained(page);
      const uploaded = await calls(page, "upload"); expect(await path(page)).toBe(uploaded[1].input.storagePath);
      await page.getByRole("button", { name: "Uzupełnij ze zdjęcia", exact: true }).click();
      await expect(page.locator('[name="nazwa"]')).toHaveValue("Wiertarka");
      expect((await calls(page, "analyze")).map((call) => call.input.storagePath)).toEqual(uploaded.map((call) => call.input.storagePath));
    });

    test("real browser compression, upload, analysis and form save remain connected", async ({ page }) => {
      await selectPhoto(page, "large.jpg", true); await ready(page); const uploaded = (await calls(page, "upload"))[0].input;
      expect(uploaded.sizeBytes).toBeLessThanOrEqual(750 * 1024); expect(uploaded.width).toBeLessThanOrEqual(1600);
      expect(uploaded.height).toBeLessThanOrEqual(1600); expect(uploaded.mimeType).toBe("image/jpeg");
      await page.getByRole("button", { name: "Uzupełnij ze zdjęcia", exact: true }).click();
      await expect(page.locator('[name="nazwa"]')).toHaveValue("Wiertarka");
      await page.getByRole("button", { name: "Zapisz fixture", exact: true }).click();
      await expect(page.getByRole("status")).toHaveText("Zapisano fixture");
      const saved = (await calls(page, "save"))[0].input;
      expect(saved.nazwa).toBe("Wiertarka"); expect(saved.opis).toBe("Opis z AI");
      expect(saved.item_photo_draft_path).toBe(uploaded.storagePath);
      expect(saved.item_photo_mime_type).toBe(uploaded.mimeType); expect(Number(saved.item_photo_size_bytes)).toBe(uploaded.sizeBytes);
      expect(saved).not.toHaveProperty("photo"); expect(await calls(page, "cleanup")).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  });
}


for (const width of [390, 1440]) {
  test(`location picker and quantity work without a database at ${width}px`, async ({ page, photoURL }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${photoURL}?locations`);
    if (width === 1440) await page.locator("main").evaluate((element) => { element.style.maxWidth = "48rem"; });
    const form = page.locator("form");
    const room = form.locator('[data-location-field="room_id"]');
    const furniture = form.locator('[data-location-field="storage_location_l2_id"]');
    const position = form.locator('[data-location-field="storage_location_l3_id"]');
    await expect(form.locator('[name="jednostka"]')).toHaveValue("szt.");
    const quantityBox = await form.getByLabel("Ilość", { exact: true }).boundingBox();
    const unitBox = await form.locator('[name="jednostka"]').boundingBox();
    expect(Math.abs((quantityBox?.width ?? 0) - (unitBox?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((quantityBox?.x ?? 0) - (unitBox?.x ?? 0))).toBeLessThanOrEqual(1);
    await expect(room.locator("svg")).toHaveCount(2);

    await expect(form.getByLabel("Ilość", { exact: true })).toHaveValue("1");
    await expect(form.getByLabel("Ilość", { exact: true })).toHaveAttribute("readonly", "");
    await form.locator('[name="typ"]').selectOption("zapas");
    const stepperBox = await form.getByLabel("Ilość", { exact: true }).locator("..").boundingBox();
    expect(Math.abs((stepperBox?.width ?? 0) - (unitBox?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((stepperBox?.x ?? 0) - (unitBox?.x ?? 0))).toBeLessThanOrEqual(1);
    await form.getByRole("button", { name: "Zwiększ ilość" }).click();
    await expect(form.getByLabel("Ilość", { exact: true })).toHaveValue("2");
    await form.getByRole("button", { name: "Zmniejsz ilość" }).click();
    await expect(form.getByLabel("Ilość", { exact: true })).toHaveValue("1");
    await room.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(room).toContainText("Kuchnia z bardzo długą nazwą pomieszczenia");
    await expect(room).toBeFocused();
    await furniture.click();
    await form.getByRole("option", { name: "Szafka", exact: true }).click();
    await position.click();
    await form.getByRole("option", { name: "Szuflada", exact: true }).click();
    await expect(form.locator("ol svg")).toHaveCount(3);
    const summaryBox = await form.locator("[data-location-summary]").boundingBox();
    const roomBox = await room.boundingBox();
    if (width === 1440) expect(summaryBox?.x).toBeGreaterThan((roomBox?.x ?? 0) + (roomBox?.width ?? 0));
    else expect(summaryBox?.y).toBeGreaterThan(roomBox?.y ?? 0);
    await expect(form.locator("[data-location-summary] li.rounded-full")).toHaveCount(0);
    await expect(form.locator("[data-location-summary] li > span.rounded-full")).toHaveCount(3);
    await test.info().attach("location-summary", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    await room.click();
    await page.keyboard.press("Escape");
    await expect(room).toBeFocused();
    await expect(room).toHaveAttribute("aria-expanded", "false");
    await room.click();
    await form.getByRole("option", { name: "Salon", exact: true }).click();
    await expect(form.locator('[name="storage_location_l2_id"]')).toHaveValue("");
    await expect(form.locator('[name="storage_location_l3_id"]')).toHaveValue("");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto(`${photoURL}?edit&locations`);
    await expect(form.locator('[name="jednostka"]')).toHaveValue("szt.");
    await expect(form.locator('[name="nazwa"]')).toHaveValue("Istniejąca rzecz");
  });
}
