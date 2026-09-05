import { expect, test } from "@playwright/test";
import {
  itemCard,
  prepareDeletionDataset,
} from "./support/m4d8";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("dashboard item search finds household items and links to the item list", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "dashboard-search-e2e");
  await page.goto("/dashboard");
  const search = page.getByRole("searchbox", {
    name: "Nazwa rzeczy",
    exact: true,
  });
  const submit = page.getByRole("button", { name: "Szukaj", exact: true });

  await expect(
    page.getByRole("heading", { name: "Znajdź rzecz", exact: true }),
  ).toBeVisible();
  await expect(search).toBeVisible();

  await search.fill("ladowarka");
  await submit.click();

  const result = page.getByRole("link", {
    name: new RegExp(escapeRegExp(data.item.charger)),
  });
  await expect(result).toBeVisible();
  await expect(result).toContainText(data.room.salon);
  await expect(result).toContainText(data.furniture.chest);
  await expect(result).toContainText(data.storageSpace.upperDrawer);

  await result.click();
  await expect(page).toHaveURL(/\/items#item-/);
  await expect(itemCard(page, data.item.charger)).toBeVisible();
});

test("dashboard item search shows no-result and clear states", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "dashboard-search-empty-e2e");

  await page.goto("/dashboard");
  const searchRegion = page.getByRole("region", {
    name: "Znajdź rzecz",
    exact: true,
  });
  const search = page.getByRole("searchbox", {
    name: "Nazwa rzeczy",
    exact: true,
  });

  await search.fill("nieistniejacy przedmiot");
  await page.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(
    searchRegion.locator("p:not(.sr-only)", {
      hasText: "Nie znaleziono rzeczy o tej nazwie.",
    }),
  ).toBeVisible();
  await expect(page.getByText(data.item.charger, { exact: true })).toHaveCount(
    0,
  );

  await page.getByRole("button", { name: "Wyczyść wyszukiwanie" }).click();
  await expect(search).toHaveValue("");
  await expect(
    searchRegion.locator("p:not(.sr-only)", {
      hasText: "Nie znaleziono rzeczy o tej nazwie.",
    }),
  ).toHaveCount(0);
});
