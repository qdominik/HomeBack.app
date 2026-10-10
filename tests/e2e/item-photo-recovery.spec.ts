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

    test("upload exception preserves existing photo, values and same-file retry", async ({ page, photoURL }) => {
      await page.goto(`${photoURL}?edit`); await entered(page);
      await queue(page, "upload", { reject: true, gate: "upload" }); await selectPhoto(page);
      await expect(page.locator('input[type="file"]')).toBeDisabled();
      await expect(page.getByRole("button", { name: "Zapisz fixture" })).toBeDisabled();
      await expect.poll(async () => (await calls(page, "upload")).length).toBe(1);
      await page.evaluate(() => window.photoHarness.release("upload"));
      await expect(page.getByText(messages.upload, { exact: true })).toBeVisible();
      await ready(page); await retained(page);
      await expect(page.getByText("existing.webp", { exact: true })).toBeVisible();
      expect(await calls(page, "cleanup")).toEqual([]);
      await expect(page.locator('input[type="file"]')).toHaveValue("");
      await selectPhoto(page); await expect(page.getByText("photo.jpg", { exact: true })).toBeVisible();
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
      await expect(page.getByText("old.jpg", { exact: true })).toBeVisible();
      await selectPhoto(page, "new.jpg"); await ready(page);
      await expect(page.getByText("new.jpg", { exact: true })).toBeVisible();
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
      await expect(page.getByText("existing.webp", { exact: true })).toBeVisible();
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
      await expect(page.getByText("new.jpg", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Usuń zdjęcie", exact: true }).click(); await ready(page);
      expect((await calls(page, "cleanup")).map((call) => call.input.storagePath)).toEqual([original, replacement]);
      await expect(page.getByText("existing.webp", { exact: true })).toBeVisible();
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
      await retained(page); await ready(page); await expect(page.getByText("existing.webp", { exact: true })).toBeVisible();
      const uploaded = (await calls(page, "upload"))[0].input;
      expect((await calls(page, "rollback")).map((call) => call.input.storagePath)).toEqual([uploaded.storagePath]);
      expect(await calls(page, "cleanup")).toEqual([]);
      await selectPhoto(page); await expect(page.getByText("photo.jpg", { exact: true })).toBeVisible(); await ready(page);
    });

    test("invalid large image fails compression locally without discarding previous draft", async ({ page }) => {
      await entered(page); await selectPhoto(page, "old.jpg"); await ready(page); const original = await path(page);
      await page.locator('input[type="file"]').setInputFiles({ name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(900 * 1024) });
      await expect(page.getByText("Nie udało się odczytać lub skompresować zdjęcia.", { exact: true })).toBeVisible();
      await retained(page); await ready(page); expect(await path(page)).toBe(original);
      expect(await calls(page, "upload")).toHaveLength(1); expect(await calls(page, "cleanup")).toEqual([]);
      await selectPhoto(page, "valid.jpg"); await expect(page.getByText("valid.jpg", { exact: true })).toBeVisible(); await ready(page);
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
      await expect(page.getByText("new.jpg", { exact: true })).toBeVisible();
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
