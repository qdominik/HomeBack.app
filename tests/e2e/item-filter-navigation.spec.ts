import { expect, test, type Page, type Request, type Route } from "@playwright/test";
import { itemCard, prepareDeletionDataset } from "./support/m4d8";

function isItemsNavigation(request: Request) {
  return request.method() === "GET"
    && new URL(request.url()).pathname === "/items"
    && request.headers().rsc === "1"
    && !request.headers()["next-router-prefetch"];
}

// A response barrier, not a timing assumption: the first navigation cannot
// commit until the test explicitly releases it after the newer user action.
async function holdNextItemsNavigation(page: Page) {
  let release!: () => void;
  let reached!: () => void;
  let finished!: () => void;
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const ready = new Promise<void>((resolve) => { reached = resolve; });
  const done = new Promise<void>((resolve) => { finished = resolve; });
  let captured = false;
  const handler = async (route: Route) => {
    if (captured || !isItemsNavigation(route.request())) {
      await route.continue();
      return;
    }
    captured = true;
    try {
      const response = await route.fetch();
      reached();
      await barrier;
      await route.fulfill({ response });
    } catch (error) {
      // A superseding navigation may cancel the held browser request.
      if (!String(error).match(/aborted|closed|canceled|cancelled|Invalid InterceptionId/i)) throw error;
    } finally {
      finished();
    }
  };
  await page.route("**/items?**", handler);
  return {
    ready,
    async release() {
      release();
      await done;
      await page.unroute("**/items?**", handler);
    },
  };
}

async function optionId(page: Page, name: string, label: string) {
  const option = page.locator(`select[name="${name}"] option`).filter({ hasText: label });
  return (await option.getAttribute("value"))!;
}

async function expectParams(page: Page, values: Record<string, string | null>) {
  await expect.poll(() => Object.fromEntries(Object.keys(values).map((key) => [key, new URL(page.url()).searchParams.get(key)]))).toEqual(values);
}

for (const [viewportName, viewport] of [
  ["desktop", { width: 1440, height: 1000 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  for (const order of ["category-room", "room-category"] as const) {
    test(`Delayed item navigation preserves both rapid filters (${viewportName}, ${order})`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize(viewport);
      const data = await prepareDeletionDataset(page, `filter-race-${viewportName}-${order}`);
      await page.goto("/items");
      const categoryId = await optionId(page, "category", "Elektronika");
      const roomId = await optionId(page, "room", data.room.salon);
      const category = page.locator('select[name="category"]');
      const room = page.locator('select[name="room"]');
      const held = await holdNextItemsNavigation(page);
      try {
        if (order === "category-room") await category.selectOption(categoryId);
        else await room.selectOption(roomId);
        await held.ready;
        // Assert while the first response is still withheld, then allow the
        // newer response to commit before releasing the obsolete response.
        const nextRequest = page.waitForRequest(isItemsNavigation);
        if (order === "category-room") await room.selectOption(roomId);
        else await category.selectOption(categoryId);
        const requested = new URL((await nextRequest).url()).searchParams;
        expect(requested.get("category")).toBe(categoryId);
        expect(requested.get("room")).toBe(roomId);
        await expectParams(page, { category: categoryId, room: roomId });
      } finally {
        await held.release();
      }
      for (const reload of [false, true]) {
        if (reload) await page.reload();
        await expectParams(page, { category: categoryId, room: roomId });
        await expect(category).toHaveValue(categoryId);
        await expect(room).toHaveValue(roomId);
        await expect(page.getByLabel("Aktywne filtry")).toContainText("Elektronika");
        await expect(page.getByLabel("Aktywne filtry")).toContainText(data.room.salon);
        await expect(itemCard(page, data.item.charger)).toBeVisible();
        await expect(itemCard(page, data.item.remote)).toHaveCount(0);
        await expect(itemCard(page, data.item.album)).toHaveCount(0);
      }
    });
  }
}

test("Latest repeated filter choice survives a pending navigation", async ({ page }) => {
  test.setTimeout(120_000);
  const data = await prepareDeletionDataset(page, "filter-repeat");
  await page.goto("/items");
  const categoryId = await optionId(page, "category", "Elektronika");
  const roomId = await optionId(page, "room", data.room.salon);
  const kitchenId = await optionId(page, "room", data.room.kitchen);
  const held = await holdNextItemsNavigation(page);
  try {
    await page.locator('select[name="category"]').selectOption(categoryId);
    await held.ready;
    await page.locator('select[name="room"]').selectOption(kitchenId);
    await page.locator('select[name="room"]').selectOption(roomId);
    await expectParams(page, { category: categoryId, room: roomId });
  } finally {
    await held.release();
  }
  await page.reload();
  await expectParams(page, { category: categoryId, room: roomId });
  await expect(page.locator('select[name="room"]')).toHaveValue(roomId);
  await expect(itemCard(page, data.item.charger)).toBeVisible();
  await expect(itemCard(page, data.item.remote)).toHaveCount(0);
});

test("Reset during a pending navigation does not restore older filters", async ({ page }) => {
  test.setTimeout(120_000);
  const data = await prepareDeletionDataset(page, "filter-reset-race");
  await page.goto(`/items?q=${data.suffix}`);
  const held = await holdNextItemsNavigation(page);
  try {
    await page.locator('select[name="category"]').selectOption({ label: "Elektronika" });
    await held.ready;
    await page.getByRole("link", { name: "Wyczyść filtry", exact: true }).click();
    await expect(page).toHaveURL(/\/items$/);
  } finally {
    await held.release();
  }
  for (const reload of [false, true]) {
    if (reload) await page.reload();
    await expect(page).toHaveURL(/\/items$/);
    await expect(page.locator('select[name="category"]')).toHaveValue("");
    await expect(page.getByRole("searchbox", { name: "Szukaj", exact: true })).toHaveValue("");
    await expect(page.getByLabel("Aktywne filtry")).toHaveCount(0);
    await expect(itemCard(page, data.item.charger)).toBeVisible();
    await expect(itemCard(page, data.item.album)).toBeVisible();
  }
});

test("Removing a chip retains the other pending filter", async ({ page }) => {
  test.setTimeout(120_000);
  const data = await prepareDeletionDataset(page, "filter-chip-race");
  await page.goto("/items");
  const categoryId = await optionId(page, "category", "Elektronika");
  const roomId = await optionId(page, "room", data.room.salon);
  await page.goto(`/items?category=${categoryId}`);
  const held = await holdNextItemsNavigation(page);
  try {
    await page.locator('select[name="room"]').selectOption(roomId);
    await held.ready;
    await page.getByLabel("Aktywne filtry").getByRole("link", { name: "Elektronika", exact: true }).click();
    await expectParams(page, { category: null, room: roomId });
  } finally {
    await held.release();
  }
  await page.reload();
  await expectParams(page, { category: null, room: roomId });
  await expect(page.locator('select[name="category"]')).toHaveValue("");
  await expect(page.locator('select[name="room"]')).toHaveValue(roomId);
  await expect(itemCard(page, data.item.charger)).toBeVisible();
  await expect(itemCard(page, data.item.album)).toBeVisible();
  await expect(itemCard(page, data.item.remote)).toHaveCount(0);
});
