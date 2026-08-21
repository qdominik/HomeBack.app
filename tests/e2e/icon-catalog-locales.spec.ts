import { expect, test, type Locator, type Page, type Response } from "@playwright/test";
import { registerAndCreateHousehold } from "./support/auth";
import { furnitureCard, roomCard, storageSpaceCard } from "./support/m4d8";

const unique = () => `E2E ikony ${Date.now()}`;

async function openCatalog(scope: Locator) {
  const trigger = scope.getByRole("button", { name: "Zmień ikonę" });
  await trigger.click();
  const dialog = scope.page().getByRole("dialog", { name: "Wybierz ikonę" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Wszystkie ikony" }).click();
  await expect(dialog.getByRole("searchbox", { name: "Szukaj ikony" })).toBeVisible();
  return { dialog, trigger };
}

async function chooseByAlias(scope: Locator, alias: string, icon: string) {
  const { dialog } = await openCatalog(scope);
  const search = dialog.getByRole("searchbox", { name: "Szukaj ikony" });
  await search.fill(alias);
  const choice = dialog.getByRole("button", { name: icon, exact: true });
  await expect(choice).toBeVisible();
  await choice.click();
  await expect(dialog).toBeHidden();
}

async function expectReopenedIcon(scope: Locator, icon: string) {
  const { dialog } = await openCatalog(scope);
  const search = dialog.getByRole("searchbox", { name: "Szukaj ikony" });
  await search.fill(icon);
  await expect(dialog.getByRole("button", { name: icon, exact: true })).toHaveAttribute("aria-pressed", "true");
  await pageCloseDialog(dialog);
}

async function pageCloseDialog(dialog: Locator) {
  await dialog.getByRole("button", { name: "Zamknij" }).click();
  await expect(dialog).toBeHidden();
}

async function createRoom(page: Page, name: string) {
  await page.goto("/home");
  await page.getByRole("button", { name: "Dodaj pomieszczenie" }).click();
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Utwórz pomieszczenie" }) });
  await form.getByLabel("Nazwa Pomieszczenia").fill(name);
  await form.getByLabel("Rodzaj Pomieszczenia", { exact: true }).selectOption("Inne");
  await form.getByLabel("Własny rodzaj Pomieszczenia").fill("Test E2E");
  await chooseByAlias(form, "samolot", "AirplaneIcon");
  await expect(form.locator('input[name="ikona"]')).toHaveValue("AirplaneIcon");
  await form.getByRole("button", { name: "Utwórz pomieszczenie" }).click();
  return roomCard(page, name);
}

test.describe("localized Phosphor icon catalog", () => {
  test("dialog escape, lazy locale loading, Polish search, AND and responsive paging", async ({ page }) => {
    await registerAndCreateHousehold(page, "icons-e2e-ui");
    await page.goto("/home");
    await page.getByRole("button", { name: "Dodaj pomieszczenie" }).click();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Utwórz pomieszczenie" }) });
    const trigger = form.getByRole("button", { name: "Zmień ikonę" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Wybierz ikonę" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await pageCloseDialog(dialog);
    await form.getByLabel("Nazwa Pomieszczenia").fill("Escape still usable");
    await expect(form.getByRole("button", { name: "Utwórz pomieszczenie" })).toBeEnabled();

    const javascriptResponses: Response[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/_next/static/chunks/") && response.url().includes(".js")) {
        javascriptResponses.push(response);
      }
    });
    await trigger.click();
    await expect(dialog.getByRole("button", { name: "Domyślne" })).toHaveAttribute("aria-pressed", "true");
    const beforeCatalog = await Promise.all(javascriptResponses.map((response) => response.text()));
    expect(beforeCatalog.some((body) => body.includes("archiwum dokumentów") || body.includes("segregator"))).toBe(false);
    await dialog.getByRole("button", { name: "Wszystkie ikony" }).click();
    const search = dialog.getByRole("searchbox", { name: "Szukaj ikony" });
    await expect(search).toBeVisible();
    await expect(dialog.getByRole("button", { name: "AcornIcon", exact: true })).toBeVisible();
    const localeBeforeSearch = (await Promise.all(javascriptResponses.map((response) => response.text())))
      .filter((body) => body.includes("archiwum dokumentów") || body.includes("segregator"));
    expect(localeBeforeSearch).toHaveLength(1);
    await search.fill("samolot");
    await expect(dialog.getByRole("button", { name: "AirplaneIcon", exact: true })).toBeVisible();
    await search.fill("segregator");
    await expect(dialog.getByRole("button", { name: "FileArchiveIcon", exact: true })).toBeVisible();
    const localeAfterSearch = (await Promise.all(javascriptResponses.map((response) => response.text())))
      .filter((body) => body.includes("archiwum dokumentów") || body.includes("segregator"));
    expect(localeAfterSearch).toHaveLength(1);

    for (const [query, name] of [["krzesło", "ChairIcon"], ["krzeslo", "ChairIcon"], ["fotel", "ArmchairIcon"], ["samochód", "CarIcon"], ["samochod", "CarIcon"], ["auto", "CarIcon"], ["łóżko", "BedIcon"], ["lozko", "BedIcon"], ["apteczka", "FirstAidKitIcon"], ["pralka", "WashingMachineIcon"], ["AirplaneIcon", "AirplaneIcon"], ["airplane", "AirplaneIcon"]] as const) {
      await search.fill(query);
      await expect(dialog.getByRole("button", { name, exact: true })).toBeVisible();
    }
    await search.fill("  SAMOLOT  ");
    await expect(dialog.getByRole("button", { name: "AirplaneIcon", exact: true })).toBeVisible();
    await search.fill("plik");
    const fileCount = await dialog.getByRole("button").count();
    await search.fill("archiwum");
    const archiveCount = await dialog.getByRole("button").count();
    await search.fill("plik archiwum");
    const bothCount = await dialog.getByRole("button").count();
    await expect(dialog.getByRole("button", { name: "FileArchiveIcon", exact: true })).toBeVisible();
    expect(bothCount).toBeLessThan(fileCount);
    expect(bothCount).toBeLessThan(archiveCount);
    await search.fill("plik archiwum nieistniejacy");
    await expect(dialog.getByText("Nie znaleziono ikon", { exact: true })).toBeVisible();
    await search.fill("");
    await expect(dialog.getByText("Strona 1 / 32", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "AcornIcon", exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Następna" }).click();
    await expect(dialog.getByText("Strona 2 / 32", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Poprzednia" }).click();
    await expect(dialog.getByText("Strona 1 / 32", { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 320, height: 720 });
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await pageCloseDialog(dialog);
  });

  test("stores canonical icon names and restores selections in all four forms", async ({ page }) => {
    await registerAndCreateHousehold(page, "icons-e2e-forms");
    const suffix = unique();
    const roomName = `${suffix} room`;
    const room = await createRoom(page, roomName);
    await expect(room).toBeVisible();
    await room.getByText("Edytuj pomieszczenie", { exact: true }).click();
    const roomForm = room.locator("details[open] form").first();
    await expect(roomForm.locator('input[name="ikona"]')).toHaveValue("AirplaneIcon");
    await expectReopenedIcon(roomForm, "AirplaneIcon");

    await page.goto("/categories");
    await page.getByText("Dodaj kategorię", { exact: true }).click();
    const categoryForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Utwórz kategorię" }) });
    await categoryForm.getByLabel("Własna nazwa kategorii").fill(`${suffix} category`);
    await chooseByAlias(categoryForm, "segregator", "FileArchiveIcon");
    await expect(categoryForm.locator('input[name="ikona"]')).toHaveValue("FileArchiveIcon");
    await categoryForm.getByRole("button", { name: "Utwórz kategorię" }).click();
    const category = page.getByRole("heading", { level: 2, name: `${suffix} category`, exact: true }).locator("xpath=ancestor::article[1]");
    await expect(category).toBeVisible();
    await category.getByText("Edytuj kategorię", { exact: true }).click();
    await expectReopenedIcon(category.locator("details[open] form").first(), "FileArchiveIcon");

    await page.goto("/home");
    const persistedRoom = roomCard(page, roomName);
    await persistedRoom.getByText("Dodaj mebel", { exact: true }).click();
    const furnitureForm = persistedRoom.locator("details[open] form").first();
    await furnitureForm.getByLabel("Nazwa Mebla").fill(`${suffix} furniture`);
    await furnitureForm.getByLabel("Własny rodzaj Mebla").fill("Test E2E");
    await chooseByAlias(furnitureForm, "fotel", "ArmchairIcon");
    await expect(furnitureForm.locator('input[name="ikona"]')).toHaveValue("ArmchairIcon");
    await furnitureForm.getByRole("button", { name: "Utwórz mebel" }).click();
    const furniture = furnitureCard(persistedRoom, `${suffix} furniture`);
    await expect(furniture).toBeVisible();
    await furniture.getByText("Edytuj mebel", { exact: true }).click();
    await expectReopenedIcon(furniture.locator("details[open] form").first(), "ArmchairIcon");

    await furniture.getByText("Dodaj schowek", { exact: true }).click();
    const storageForm = furniture.locator("details[open] form").last();
    await storageForm.getByLabel("Własna nazwa Schowka").fill(`${suffix} storage`);
    await chooseByAlias(storageForm, "pralka", "WashingMachineIcon");
    await expect(storageForm.locator('input[name="ikona"]')).toHaveValue("WashingMachineIcon");
    await storageForm.getByRole("button", { name: "Utwórz schowek" }).click();
    const storage = storageSpaceCard(furniture, `${suffix} storage`);
    await expect(storage).toBeVisible();
    await storage.getByText("Edytuj schowek", { exact: true }).click();
    await expectReopenedIcon(storage.locator("details[open] form").first(), "WashingMachineIcon");
  });
});
