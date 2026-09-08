import { expect, test, type Locator } from "@playwright/test";
import { itemCard, prepareDeletionDataset } from "./support/m4d8";
import { registerAndCreateHousehold } from "./support/auth";

async function search(region: Locator, query: string) {
  await region.getByRole("searchbox", { name: "Nazwa obiektu", exact: true }).fill(query);
  await region.getByRole("button", { name: "Szukaj", exact: true }).click();
}

function results(region: Locator) {
  return region.getByRole("list", { name: "Wyniki wyszukiwania", exact: true });
}

test("global search defaults to all, finds four types and applies every type filter", async ({ page }) => {
  const data = await prepareDeletionDataset(page, "global-types");
  await page.goto("/dashboard");
  await page.getByRole("banner").getByRole("button", { name: "Wyszukiwarka", exact: true }).click();
  const region = page.getByRole("dialog", { name: "Wyszukiwarka", exact: true });
  await expect(region.getByRole("button", { name: "Wszystko", exact: true })).toHaveAttribute("aria-pressed", "true");
  await search(region, data.suffix);
  const list = results(region);
  for (const name of [data.item.charger, data.room.salon, data.furniture.chest, data.storageSpace.upperDrawer]) {
    await expect(list.getByRole("link").filter({ hasText: name }).first()).toBeVisible();
  }
  const cases = [
    ["Rzeczy", "Rzecz", "/items#item-"],
    ["Pomieszczenia", "Pomieszczenie", "/home#room-"],
    ["Meble", "Mebel", "/home#furniture-"],
    ["Schowki", "Schowek", "/home#storage-"],
  ];
  for (const [label, badge, href] of cases) {
    await region.getByRole("button", { name: label, exact: true }).click();
    await expect(list).toBeVisible();
    const links = list.getByRole("link");
    expect(await links.count()).toBeGreaterThan(0);
    for (const link of await links.all()) {
      expect(await link.getAttribute("href")).toMatch(new RegExp(`^${href}`));
      await expect(link.getByText(badge, { exact: true })).toBeVisible();
    }
  }
  await region.getByRole("button", { name: "Wszystko", exact: true }).click();
  await expect(list.getByRole("link").filter({ hasText: data.item.charger })).toBeVisible();
});

test("Polish normalization preserves item breadcrumbs and the item hash link", async ({ page }) => {
  const data = await prepareDeletionDataset(page, "global-item");
  await page.goto("/dashboard");
  await page.getByRole("banner").getByRole("button", { name: "Wyszukiwarka", exact: true }).click();
  const region = page.getByRole("dialog", { name: "Wyszukiwarka", exact: true });
  await search(region, "ladowarka");
  const result = results(region).getByRole("link").filter({ hasText: data.item.charger });
  await expect(result).toContainText("Rzecz");
  await expect(result).not.toContainText("Brak lokalizacji");
  await expect(result).toContainText(`${data.room.salon} → ${data.furniture.chest} → ${data.storageSpace.upperDrawer}`);
  const href = await result.getAttribute("href");
  expect(href).toMatch(/^\/items#item-[0-9a-f-]+$/);
  await result.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(itemCard(page, data.item.charger)).toBeVisible();
  await expect(page.locator(href!.slice(href!.indexOf("#")))).toBeInViewport();
});

test("main navigation opens search from Structure and each structural result links to its card", async ({ page }) => {
  const data = await prepareDeletionDataset(page, "global-navigation");
  for (const [name, type, path] of [
    [data.room.salon, "Pomieszczenie", data.room.salon],
    [data.furniture.chest, "Mebel", `${data.room.salon} → ${data.furniture.chest}`],
    [data.storageSpace.upperDrawer, "Schowek", `${data.room.salon} → ${data.furniture.chest} → ${data.storageSpace.upperDrawer}`],
  ]) {
    const trigger = page.getByRole("banner").getByRole("button", { name: "Wyszukiwarka", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Wyszukiwarka", exact: true });
    await expect(dialog.getByRole("searchbox")).toBeFocused();
    await search(dialog, name);
    const result = results(dialog).getByRole("link").filter({ has: page.getByText(type, { exact: true }) });
    await expect(result).toContainText(path);
    const href = await result.getAttribute("href");
    expect(href).toMatch(/^\/home#(room|furniture|storage)-[0-9a-f-]+$/);
    await result.click();
    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator(href!.slice(href!.indexOf("#")))).toBeInViewport();
  }
});

test("mobile search supports empty, no-result, loading, stale response, error and retry states", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareDeletionDataset(page, "global-mobile");
  await page.goto("/dashboard");
  const trigger = page.getByRole("banner").getByRole("button", { name: "Wyszukiwarka", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Wyszukiwarka", exact: true });
  await expect(dialog.getByRole("status")).toContainText("Wpisz nazwę");
  await search(dialog, "nieistniejacy przedmiot");
  await expect(dialog.getByRole("status")).toHaveText("Nie znaleziono obiektów o tej nazwie.");
  await dialog.getByRole("button", { name: "Wyczyść wyszukiwanie" }).click();
  await expect(dialog.getByRole("searchbox")).toHaveValue("");
  await expect(dialog.getByRole("status")).toContainText("Wpisz nazwę");

  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/dashboard", async (route) => {
    if (route.request().method() === "POST" && route.request().headers()["next-action"]) await gate;
    await route.continue();
  });
  await search(dialog, "ladowarka");
  await expect(dialog.getByRole("status")).toHaveText("Wyszukiwanie…");
  await dialog.getByRole("button", { name: "Wyczyść wyszukiwanie" }).click();
  release();
  await expect(dialog.getByRole("status")).toContainText("Wpisz nazwę");
  await expect(results(dialog)).toHaveCount(0);
  await page.unroute("**/dashboard");
  await page.route("**/dashboard", async (route) => {
    if (route.request().method() === "POST" && route.request().headers()["next-action"]) await route.fulfill({ status: 500, body: "Search unavailable" });
    else await route.continue();
  });
  await search(dialog, "ladowarka");
  await expect(dialog.getByRole("alert")).toHaveText("Nie udało się wyszukać obiektów. Spróbuj ponownie.");
  await page.unroute("**/dashboard");
  await dialog.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(results(dialog)).toBeVisible();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  for (const label of ["Wszystko", "Rzeczy", "Pomieszczenia", "Meble", "Schowki"]) await expect(dialog.getByRole("button", { name: label, exact: true })).toBeInViewport();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("global search never returns another household's items or structure", async ({ page, browser }) => {
  const data = await prepareDeletionDataset(page, "global-isolation-source");
  const other = await browser.newContext({ baseURL: new URL(page.url()).origin });
  try {
    const otherPage = await other.newPage();
    await registerAndCreateHousehold(otherPage, "global-isolation-target");
    await otherPage.getByRole("banner").getByRole("button", { name: "Wyszukiwarka", exact: true }).click();
    const region = otherPage.getByRole("dialog", { name: "Wyszukiwarka", exact: true });
    await search(region, data.suffix);
    await expect(region.getByRole("status")).toHaveText("Nie znaleziono obiektów o tej nazwie.");
    await expect(results(region)).toHaveCount(0);
  } finally {
    await other.close();
  }
});


test("an item without a persisted location displays Brak lokalizacji", async ({ page }) => {
  await registerAndCreateHousehold(page, "search-unlocated");
  await page.getByRole("banner").getByRole("button", { name: "Dodaj przedmiot", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Dodaj przedmiot", exact: true });
  await form.locator('input[name="nazwa"]').fill("Rzecz bez przypisania");
  await form.getByRole("button", { name: "Utwórz rzecz", exact: true }).click();
  await expect(page).toHaveURL(/status=item_created/);
  await page.getByRole("banner").getByRole("button", { name: "Wyszukiwarka", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Wyszukiwarka", exact: true });
  await search(dialog, "Rzecz bez przypisania");
  await expect(results(dialog).getByRole("link").filter({ hasText: "Rzecz bez przypisania" })).toContainText("Brak lokalizacji");
});
