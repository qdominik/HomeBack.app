import { expect, test, type Locator } from "@playwright/test";
import { itemCard, prepareDeletionDataset } from "./support/m4d8";
import { registerAndCreateHousehold } from "./support/auth";
import {
  dashboardModule,
  dashboardModuleTitles,
  expectNoHorizontalOverflow,
  generateQaSmokeDataset,
  showRoomsDashboardModule,
} from "./support/dashboard";

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
  const target = page.locator(href!.slice(href!.indexOf("#")));
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeInViewport();
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


test("direct L1/L2/L3 and empty locations persist in the mobile form and global search", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const data = await prepareDeletionDataset(page, "direct-location");
  const names: string[] = [];
  for (const level of [1, 2, 3, 0]) {
    const name = `Direct level ${level} ${data.suffix}`;
    names.push(name);
    await page.goto("/items");
    await page.locator("main details").first().locator("summary").first().click();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Utwórz rzecz", exact: true }) });
    await form.locator('[name="nazwa"]').fill(name);
    if (level >= 1) await form.locator('[name="room_id"]').selectOption({ label: data.room.salon });
    if (level >= 2) await form.locator('[name="storage_location_l2_id"]').selectOption({ label: data.furniture.chest });
    if (level >= 3) await form.locator('[name="storage_location_l3_id"]').selectOption({ label: data.storageSpace.upperDrawer });
    await form.getByRole("button", { name: "Utwórz rzecz", exact: true }).click();
    await expect(page).toHaveURL(/status=item_created/);
    await page.reload();
    const card = itemCard(page, name);
    await card.getByText("Edytuj rzecz", { exact: true }).click();
    const edit = card.locator("details form");
    for (const [field, label, selected] of [
      ["room_id", data.room.salon, level >= 1],
      ["storage_location_l2_id", data.furniture.chest, level >= 2],
      ["storage_location_l3_id", data.storageSpace.upperDrawer, level >= 3],
    ] as const) {
      if (selected) await expect(edit.locator(`[name="${field}"] option:checked`)).toHaveText(label);
      else await expect(edit.locator(`[name="${field}"]`)).toHaveValue("");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (level === 2) await card.screenshot({ path: test.info().outputPath("mobile-furniture-location.png") });
    await page.getByRole("banner").getByRole("button", { name: "Wyszukiwarka", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Wyszukiwarka", exact: true });
    await search(dialog, name);
    const result = results(dialog).getByRole("link").filter({ hasText: name });
    const path = [data.room.salon, data.furniture.chest, data.storageSpace.upperDrawer].slice(0, level).join(" → ");
    await expect(result).toContainText(path || "Brak lokalizacji");
    if (level) await expect(result).not.toContainText("Brak lokalizacji");
    await page.keyboard.press("Escape");
  }
  // Exercise edits, including parent reset, against the real server and database.
  for (const level of [2, 3, 1, 0]) {
    await page.goto("/items");
    const card = itemCard(page, names[0]);
    await card.getByText("Edytuj rzecz", { exact: true }).click();
    const edit = card.locator("details form");
    await edit.locator('[name="room_id"]').selectOption("");
    if (level >= 1) await edit.locator('[name="room_id"]').selectOption({ label: data.room.salon });
    if (level >= 2) await edit.locator('[name="storage_location_l2_id"]').selectOption({ label: data.furniture.chest });
    if (level >= 3) await edit.locator('[name="storage_location_l3_id"]').selectOption({ label: data.storageSpace.upperDrawer });
    await edit.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
    await expect(page).toHaveURL(/status=item_updated/);
    await page.reload();
    const path = [data.room.salon, data.furniture.chest, data.storageSpace.upperDrawer].slice(0, level).join(" / ");
    await expect(itemCard(page, names[0])).toContainText(path || "Brak przypisanej lokalizacji");
  }
  await page.goto("/items?view=unlocated");
  await expect(itemCard(page, names[0])).toBeVisible();
  await expect(itemCard(page, names[1])).toHaveCount(0);
  // A fresh household cannot see any of the four location variants.
  await page.context().clearCookies();
  await registerAndCreateHousehold(page, "direct-location-foreign");
  await page.getByRole("banner").getByRole("button", { name: "Wyszukiwarka", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Wyszukiwarka", exact: true });
  await search(dialog, data.suffix);
  await expect(results(dialog)).toHaveCount(0);
  await expect(dialog.getByRole("status")).toHaveText("Nie znaleziono obiektów o tej nazwie.");
});

test.describe("useful Dashboard widgets", () => {
  test("show household data, counts and working item and room links", async ({ page }) => {
    await registerAndCreateHousehold(page, "dashboard-widgets");
    await generateQaSmokeDataset(page);
    await showRoomsDashboardModule(page);
    await page.goto("/dashboard");

    const recentItems = dashboardModule(page, dashboardModuleTitles.recentItems);

    for (const title of Object.values(dashboardModuleTitles)) {
      await expect(dashboardModule(page, title)).toHaveAttribute(
        "data-module-status",
        "available",
      );
    }
    for (const title of ["Terminy ważności", "Ostatnia aktywność"]) {
      await expect(dashboardModule(page, title)).toHaveAttribute(
        "data-module-status",
        "soon",
      );
    }

    await expect(recentItems).toContainText("QA Kabel USB");
    await expect(recentItems).toContainText("Brak lokalizacji");
    await expect(recentItems).toContainText("QA Latarka");
    await expect(recentItems).toContainText(
      "QA Sypialnia / QA Komoda / QA Szuflada 1",
    );
    const itemLink = recentItems.getByRole("link").filter({
      hasText: "QA Kabel USB",
    });
    await expect(itemLink.locator("img, svg").first()).toBeVisible();
    await expect(itemLink).toHaveAttribute(
      "href",
      /^\/items\?focus=[0-9a-f-]{36}$/,
    );
    await itemLink.click();
    await expect(page).toHaveURL(/\/items\?focus=[0-9a-f-]{36}$/);
    await expect(itemCard(page, "QA Kabel USB")).toBeVisible();

    await page.goto("/dashboard");
    const toolsCategory = dashboardModule(
      page,
      dashboardModuleTitles.categories,
    )
      .getByRole("link")
      .filter({ hasText: "Narzędzia" });
    await expect(
      toolsCategory.getByLabel("Liczba Rzeczy: 1", { exact: true }),
    ).toBeVisible();
    await expect(toolsCategory).toHaveAttribute(
      "href",
      /^\/items\?category=[0-9a-f-]{36}$/,
    );
    await toolsCategory.click();
    await expect(page).toHaveURL(/\/items\?category=[0-9a-f-]{36}$/);
    await expect(itemCard(page, "QA Latarka")).toBeVisible();
    await expect(itemCard(page, "QA Kabel USB")).toHaveCount(0);

    await page.goto("/dashboard");
    const salon = dashboardModule(page, dashboardModuleTitles.rooms)
      .getByRole("link")
      .filter({ hasText: "QA Salon" });
    await expect(salon).toContainText(/\b1\b/);
    await expect(salon).toHaveAttribute(
      "href",
      /^\/home#room-[0-9a-f-]{36}$/,
    );
    const salonHref = await salon.getAttribute("href");
    await salon.click();
    await expect(page).toHaveURL(new RegExp(`${salonHref}$`));
    await expect(page.locator(salonHref!.slice(salonHref!.indexOf("#")))).toBeInViewport();
  });

  test("empty widgets do not expose data from another household", async ({
    page,
    browser,
  }) => {
    await registerAndCreateHousehold(page, "dashboard-isolation-source");
    await generateQaSmokeDataset(page);

    const other = await browser.newContext({ baseURL: new URL(page.url()).origin });
    try {
      const otherPage = await other.newPage();
      await registerAndCreateHousehold(otherPage, "dashboard-isolation-target");
      await showRoomsDashboardModule(otherPage);
      await otherPage.goto("/dashboard");

      for (const title of [
        dashboardModuleTitles.recentItems,
        dashboardModuleTitles.rooms,
      ]) {
        await expect(dashboardModule(otherPage, title).getByRole("status")).toBeVisible();
      }
      const unlocated = dashboardModule(
        otherPage,
        dashboardModuleTitles.categories,
      ).getByRole("link", { name: /Bez lokalizacji/ });
      await expect(unlocated).toBeVisible();
      await expect(unlocated.getByLabel("Liczba Rzeczy: 0")).toBeVisible();
      await expect(unlocated).toHaveAttribute("href", "/items?view=unlocated");
      await expect(otherPage.getByText("QA Kabel USB", { exact: true })).toHaveCount(0);
      await expect(otherPage.getByText("QA Salon", { exact: true })).toHaveCount(0);
    } finally {
      await other.close();
    }
  });

  test("Inventory preserves category, status, location and missing-location filters", async ({
    page,
  }) => {
    await registerAndCreateHousehold(page, "dashboard-inventory-filters");
    await generateQaSmokeDataset(page);

    await page.goto("/items");
    const categoryFilter = page.locator('select[name="category"]');
    const statusFilter = page.locator('select[name="status"]');
    const roomFilter = page.locator('select[name="room"]');
    const storageFilter = page.locator('select[name="storage"]');
    const positionFilter = page.locator('select[name="position"]');
    const applyFilters = page.getByRole("button", {
      name: "Filtruj",
      exact: true,
    });
    await categoryFilter.selectOption({
      label: "Elektronika",
    });
    await statusFilter.selectOption({
      label: "W domu",
    });
    await applyFilters.click();
    await expect(page).toHaveURL(/category=[0-9a-f-]{36}/);
    await expect(page).toHaveURL(/status=w(?:\+|%20)domu/);
    await expect(itemCard(page, "QA Kabel USB")).toBeVisible();
    await expect(itemCard(page, "QA Stary pilot")).toHaveCount(0);
    await expect(itemCard(page, "QA Latarka")).toHaveCount(0);

    await page.goto("/items");
    await roomFilter.selectOption({
      label: "QA Salon",
    });
    await storageFilter.selectOption({
      label: "QA Półka wisząca",
    });
    await positionFilter.selectOption({
      label: "QA Salon / QA Półka wisząca / QA Górna półka",
    });
    await applyFilters.click();
    await expect(itemCard(page, "QA Baterie AA")).toBeVisible();
    await expect(itemCard(page, "QA Latarka")).toHaveCount(0);

    await page.goto("/items?view=unlocated");
    await categoryFilter.selectOption({
      label: "Elektronika",
    });
    await statusFilter.selectOption({
      label: "W domu",
    });
    await applyFilters.click();
    await expect(page).toHaveURL(/view=unlocated/);
    await expect(itemCard(page, "QA Kabel USB")).toBeVisible();
    await expect(itemCard(page, "QA Stary pilot")).toHaveCount(0);

    await page.getByRole("link", { name: "Wyczyść filtry", exact: true }).click();
    await expect(page).toHaveURL(/\/items$/);
  });

  test("widgets remain usable at 390x844, 768 and 1280 pixels", async ({ page }) => {
    await registerAndCreateHousehold(page, "dashboard-responsive");
    await generateQaSmokeDataset(page);
    await showRoomsDashboardModule(page);

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/dashboard");
      await expectNoHorizontalOverflow(page);

      for (const title of Object.values(dashboardModuleTitles)) {
        const widget = dashboardModule(page, title);
        await widget.scrollIntoViewIfNeeded();
        await expect(widget).toBeVisible();
        expect((await widget.boundingBox())?.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });
});
