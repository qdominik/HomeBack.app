import { expect, test } from "@playwright/test";
import { itemCard, prepareDeletionDataset } from "./support/m4d8";

test("Items share normalized search and combine category and location filters", async ({ page }) => {
  test.setTimeout(120_000);
  const data = await prepareDeletionDataset(page, "item-filters");
  await page.goto("/items");

  const search = page.getByRole("searchbox", { name: "Szukaj", exact: true });
  const category = page.getByRole("combobox", { name: "Kategoria", exact: true });
  const room = page.getByRole("combobox", { name: "Pomieszczenie", exact: true });
  const furniture = page.getByRole("combobox", { name: "Mebel", exact: true });
  const more = page.locator("summary").filter({ hasText: "Więcej filtrów" });
  const tops = await Promise.all([search, category, room, furniture, more].map(async (locator) => (await locator.boundingBox())?.y));
  const visibleTops = tops.filter((top): top is number => top !== undefined);
  expect(Math.max(...visibleTops) - Math.min(...visibleTops)).toBeLessThanOrEqual(2);

  await search.fill("ladowarka");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=ladowarka/);
  await expect(itemCard(page, data.item.charger)).toBeVisible();
  await expect(itemCard(page, data.item.remote)).toHaveCount(0);

  await category.selectOption({ label: "Elektronika" });
  await expect(page).toHaveURL(/category=/);
  await expect(page.getByLabel("Aktywne filtry")).toContainText("Elektronika");
  await expect(itemCard(page, data.item.charger)).toBeVisible();
  await room.selectOption({ label: data.room.salon });
  await expect(page.getByLabel("Aktywne filtry")).toContainText(data.room.salon);
  await furniture.selectOption({ label: data.furniture.chest });
  await expect(page.getByLabel("Aktywne filtry")).toContainText(data.furniture.chest);
  await expect(itemCard(page, data.item.charger)).toBeVisible();

  await more.click();
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
});

test("Structure search is removed while icon search remains and mobile filters do not overflow", async ({ page }) => {
  await prepareDeletionDataset(page, "item-filter-layout");
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

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/items");
  await expect(page.getByRole("searchbox", { name: "Szukaj", exact: true })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Więcej filtrów" }).click();
  await expect(page.getByText("Czas dodania", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
