import { expect, test } from "@playwright/test";
import { itemCard, prepareDeletionDataset } from "./support/m4d8";
import { registerAndCreateHousehold } from "./support/auth";

test("Items share normalized search and combine category and location filters", async ({ page }) => {
  test.setTimeout(120_000);
  const data = await prepareDeletionDataset(page, "item-filters");
  await page.goto("/items");

  const search = page.getByRole("searchbox", { name: "Szukaj", exact: true });
  const searchButton = page.getByRole("button", { name: "Szukaj", exact: true });
  const category = page.getByRole("combobox", { name: "Kategoria", exact: true });
  const room = page.getByRole("combobox", { name: "Pomieszczenie", exact: true });
  const furniture = page.getByRole("combobox", { name: "Mebel", exact: true });
  const more = page.locator("summary").filter({ hasText: "Więcej filtrów" });
  await expect(searchButton).toBeVisible();
  await expect(searchButton.locator("svg")).toHaveCount(1);
  const tops = await Promise.all([search, searchButton, category, room, furniture, more].map(async (locator) => (await locator.boundingBox())?.y));
  const visibleTops = tops.filter((top): top is number => top !== undefined);
  expect(Math.max(...visibleTops) - Math.min(...visibleTops)).toBeLessThanOrEqual(2);

  await search.fill("ladowarka");
  await searchButton.click();
  await expect(page).toHaveURL(/q=ladowarka/);
  await expect(itemCard(page, data.item.charger)).toBeVisible();
  await expect(itemCard(page, data.item.remote)).toHaveCount(0);

  await search.fill("Pilot do telewizora");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=Pilot(\+|%20)do(\+|%20)telewizora/);
  await expect(itemCard(page, data.item.remote)).toBeVisible();
  await expect(itemCard(page, data.item.charger)).toHaveCount(0);

  await search.fill("ladowarka");
  await searchButton.click();

  await category.selectOption({ label: "Elektronika" });
  await expect(page).toHaveURL(/category=/);
  await expect(page.getByLabel("Aktywne filtry")).toContainText("Elektronika");
  await expect(itemCard(page, data.item.charger)).toBeVisible();
  await search.fill("");
  await searchButton.click();
  await expect(page).toHaveURL(/category=/);
  expect(page.url()).not.toContain("q=");
  await expect(page.getByLabel("Aktywne filtry")).toContainText("Elektronika");
  await expect(itemCard(page, data.item.charger)).toBeVisible();
  await room.selectOption({ label: data.room.salon });
  await expect(page.getByLabel("Aktywne filtry")).toContainText(data.room.salon);
  await furniture.selectOption({ label: data.furniture.chest });
  await expect(page.getByLabel("Aktywne filtry")).toContainText(data.furniture.chest);
  await expect(itemCard(page, data.item.charger)).toBeVisible();

  await more.click();
  const morePanel = page.locator("summary").filter({ hasText: "Więcej filtrów" }).locator("xpath=following-sibling::div[1]");
  const moreBox = await more.boundingBox();
  const morePanelBox = await morePanel.boundingBox();
  expect(morePanelBox?.y).toBeGreaterThanOrEqual((moreBox?.y ?? 0) + (moreBox?.height ?? 0));
  await expect(morePanel.getByText("Schowek", { exact: true })).toBeVisible();
  await expect(morePanel.getByText("Status", { exact: true })).toBeVisible();
  await expect(morePanel.getByText("Czas dodania", { exact: true })).toBeVisible();
  const storage = page.locator('select[name="position"]');
  await storage.selectOption({ label: `${data.room.salon} / ${data.furniture.chest} / ${data.storageSpace.upperDrawer}` });
  await expect(itemCard(page, data.item.charger)).toBeVisible();
  await expect(page.getByLabel("Aktywne filtry")).toContainText(data.storageSpace.upperDrawer);
  await page.getByRole("link", { name: "Wyczyść filtry", exact: true }).click();
  await expect(page).toHaveURL(/\/items$/);

  await more.click();
  await page.locator('select[name="itemStatus"]').selectOption("archived");
  await expect(itemCard(page, data.item.oldDocument)).toBeVisible();
  await expect(itemCard(page, data.item.charger)).toHaveCount(0);

  await more.click();
  await page.locator('select[name="added"]').selectOption("7d");
  await expect(page).toHaveURL(/added=7d/);
  await expect(page.getByLabel("Aktywne filtry")).toContainText("Ostatnie 7 dni");
  await expect(itemCard(page, data.item.oldDocument)).toBeVisible();
});

test("Item filters and results remain isolated to the active household", async ({ page, browser }) => {
  const data = await prepareDeletionDataset(page, "item-filter-isolation-source");
  const other = await browser.newContext({ baseURL: new URL(page.url()).origin });

  try {
    const otherPage = await other.newPage();
    await registerAndCreateHousehold(otherPage, "item-filter-isolation-target");
    await otherPage.goto("/items");

    for (const [name, label] of [
      ["room", data.room.salon],
      ["storage", data.furniture.chest],
      ["position", data.storageSpace.upperDrawer],
    ] as const) {
      await expect(otherPage.locator(`select[name="${name}"] option`).filter({ hasText: label })).toHaveCount(0);
    }

    const search = otherPage.getByRole("searchbox", { name: "Szukaj", exact: true });
    await search.fill(data.suffix);
    await search.press("Enter");
    await expect(otherPage).toHaveURL(new RegExp(`q=${encodeURIComponent(data.suffix)}`));
    await expect(itemCard(otherPage, data.item.charger)).toHaveCount(0);
    await expect(otherPage.getByText("Brak przedmiotów pasujących do wybranych filtrów.", { exact: true })).toBeVisible();

    await otherPage.getByRole("link", { name: "Wyczyść filtry", exact: true }).click();
    await expect(otherPage).toHaveURL(/\/items$/);
    await expect(search).toHaveValue("");
  } finally {
    await other.close();
  }
});

test("Structure search is removed while icon search remains and mobile filters do not overflow", async ({ page }) => {
  const data = await prepareDeletionDataset(page, "item-filter-layout");
  await page.goto("/home");
  await expect(page.getByText("Szukaj w domu", { exact: true })).toHaveCount(0);
  await expect(page.getByPlaceholder("Pomieszczenie, Mebel, Schowek lub kod")).toHaveCount(0);

  await page.getByRole("button", { name: "Dodaj pomieszczenie" }).click();
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Utwórz pomieszczenie" }) });
  await form.getByRole("button", { name: "Zmień ikonę" }).click();
  const iconDialog = page.getByRole("dialog", { name: "Wybierz ikonę" });
  await iconDialog.getByRole("button", { name: "Wszystkie ikony" }).click();
  await expect(iconDialog.getByRole("searchbox", { name: "Szukaj ikony" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Dodaj rzecz", exact: true }).click();
  const desktopDialog = page.getByRole("dialog", { name: "Dodaj rzecz" });
  const desktopSelects = desktopDialog.locator('select[name="typ"], select[name="category_id"], select[name="room_id"], select[name="storage_location_l2_id"], select[name="storage_location_l3_id"]');
  const desktopWidths = await desktopSelects.evaluateAll((selects) => selects.map((select) => select.getBoundingClientRect().width));
  expect(Math.max(...desktopWidths) - Math.min(...desktopWidths)).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/items");
  await expect(page.getByRole("searchbox", { name: "Szukaj", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Szukaj", exact: true })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Więcej filtrów" }).click();
  await expect(page.getByText("Czas dodania", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Dodaj rzecz", exact: true }).click();
  const addDialog = page.getByRole("dialog", { name: "Dodaj rzecz" });
  const itemForm = addDialog.locator("form");
  const formSelects = itemForm.locator('select[name="typ"], select[name="category_id"], select[name="room_id"], select[name="storage_location_l2_id"], select[name="storage_location_l3_id"]');
  await expect(formSelects).toHaveCount(5);
  const mobileWidths = await formSelects.evaluateAll((selects) => selects.map((select) => select.getBoundingClientRect().width));
  expect(Math.max(...mobileWidths) - Math.min(...mobileWidths)).toBeLessThanOrEqual(1);
  const dialogBox = await addDialog.boundingBox();
  for (const select of await formSelects.all()) {
    const box = await select.boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(dialogBox?.x ?? 0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual((dialogBox?.x ?? 0) + (dialogBox?.width ?? 0));
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const roomSelect = itemForm.locator('select[name="room_id"]');
  const furnitureSelect = itemForm.locator('select[name="storage_location_l2_id"]');
  const storageSelect = itemForm.locator('select[name="storage_location_l3_id"]');
  await roomSelect.selectOption({ label: data.room.salon });
  await expect(furnitureSelect).toBeEnabled();
  await furnitureSelect.selectOption({ label: data.furniture.chest });
  await expect(storageSelect).toBeEnabled();
  await storageSelect.selectOption({ label: data.storageSpace.upperDrawer });
  await roomSelect.selectOption({ label: data.room.kitchen });
  await expect(furnitureSelect).toHaveValue("");
  await expect(storageSelect).toHaveValue("");

  await page.keyboard.press("Escape");
  const card = itemCard(page, data.item.charger);
  await card.getByText("Edytuj rzecz", { exact: true }).click();
  const editForm = card.locator("details form");
  const editSelects = editForm.locator('select[name="typ"], select[name="category_id"], select[name="room_id"], select[name="storage_location_l2_id"], select[name="storage_location_l3_id"]');
  await expect(editSelects).toHaveCount(5);
  const editFormBox = await editForm.boundingBox();
  for (const select of await editSelects.all()) {
    const box = await select.boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(editFormBox?.x ?? 0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual((editFormBox?.x ?? 0) + (editFormBox?.width ?? 0));
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
