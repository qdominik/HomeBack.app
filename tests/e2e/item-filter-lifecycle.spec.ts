import { expect, test, type Page } from "@playwright/test";
import { itemFilterLifecycleBundle, lifecycleIds } from "./support/item-filter-lifecycle";

type LifecycleWindow = Window & {
  filterLifecycle: {
    requests: string[];
    layoutStates: { search: string; pending: boolean }[];
    replayMountReconciliation(): void;
    release(index: number): void;
    external(search: string, history?: boolean): void;
  };
};

async function mountWithEarlyCategoryChange(page: Page, strictEffects = false) {
  await page.route("http://filter-lifecycle.test/**", (route) => route.fulfill({
    contentType: "text/html", body: '<!doctype html><div id="root"></div>',
  }));
  await page.goto("http://filter-lifecycle.test/items");
  await page.evaluate(itemFilterLifecycleBundle({ strictEffects }));
  await expect(page.locator('select[name="category"]')).toHaveValue(lifecycleIds.category);
  await expect(page.getByLabel("Aktywne filtry")).toContainText("Elektronika");
  await expect.poll(() => page.evaluate(() => (window as LifecycleWindow).filterLifecycle.requests)).toEqual([
    `/items?category=${lifecycleIds.category}`,
  ]);
}

async function requests(page: Page) {
  return page.evaluate(() => (window as LifecycleWindow).filterLifecycle.requests);
}

function room(page: Page, name: string) {
  return page.getByRole("navigation", { name: "Widok Rzeczy" }).getByRole("link", { name, exact: true });
}

for (const strictEffects of [false, true]) {
  test(`Early filter intent survives ${strictEffects ? "Strict Effects replay" : "the mount effect"} and repeated room choices`, async ({ page }) => {
    await mountWithEarlyCategoryChange(page, strictEffects);
    // Category is already handled by React and visibly optimistic, while its
    // response is still withheld. Preserve the two rapid changes of one field.
    await room(page, "Kuchnia").click();
    await room(page, "Salon").click();
    expect((await requests(page)).map((href) => Object.fromEntries(new URL(href, page.url()).searchParams))).toEqual([
      { category: lifecycleIds.category },
      { category: lifecycleIds.category, room: lifecycleIds.kitchen },
      { category: lifecycleIds.category, room: lifecycleIds.salon },
    ]);
    await page.evaluate(() => (window as LifecycleWindow).filterLifecycle.release(2));
    await expect(page.locator('select[name="category"]')).toHaveValue(lifecycleIds.category);
    await expect(room(page, "Salon")).toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Aktywne filtry")).toContainText("Salon");
    await page.evaluate(() => (window as LifecycleWindow).filterLifecycle.release(0));
    await expect(room(page, "Salon")).toHaveAttribute("aria-current", "page");
    // A settled render must remain a valid base for the next intent and reset.
    await room(page, "Kuchnia").click();
    expect(new URL((await requests(page)).at(-1)!, page.url()).searchParams.get("category")).toBe(lifecycleIds.category);
    await page.getByRole("link", { name: "Wyczyść filtry" }).click();
    expect((await requests(page)).at(-1)).toBe("/items");
    await page.evaluate(() => (window as LifecycleWindow).filterLifecycle.release(4));
    await expect(page.locator('select[name="category"]')).toHaveValue("");
    await expect(room(page, "Kuchnia")).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Aktywne filtry")).toHaveCount(0);
  });
}

test("Strict Effects replay preserves a room-first intent before the category choice", async ({ page }) => {
  await page.route("http://filter-lifecycle.test/**", (route) => route.fulfill({
    contentType: "text/html", body: '<!doctype html><div id="root"></div>',
  }));
  await page.goto("http://filter-lifecycle.test/items");
  await page.evaluate(itemFilterLifecycleBundle({ strictEffects: true, firstFilter: "room" }));
  await expect(room(page, "Kuchnia")).toHaveAttribute("aria-current", "page");
  await expect(page.getByLabel("Aktywne filtry")).toContainText("Kuchnia");
  expect(await requests(page)).toEqual([`/items?room=${lifecycleIds.kitchen}`]);
  await page.getByRole("button", { name: "Filtry", exact: true }).click();
  await page.locator('select[name="category"]').selectOption(lifecycleIds.category);
  expect((await requests(page)).map((href) => Object.fromEntries(new URL(href, page.url()).searchParams))).toEqual([
    { room: lifecycleIds.kitchen },
    { room: lifecycleIds.kitchen, category: lifecycleIds.category },
  ]);
  await page.evaluate(() => (window as LifecycleWindow).filterLifecycle.release(1));
  await expect(page.locator('select[name="category"]')).toHaveValue(lifecycleIds.category);
  await expect(room(page, "Kuchnia")).toHaveAttribute("aria-current", "page");
});

test("An older mount reconciliation cannot erase an intent after a pending commit", async ({ page }) => {
  await mountWithEarlyCategoryChange(page);
  await expect.poll(() => page.evaluate(() => (window as LifecycleWindow).filterLifecycle.layoutStates.some((state) => state.pending))).toBe(true);
  await page.evaluate(() => (window as LifecycleWindow).filterLifecycle.replayMountReconciliation());
  await room(page, "Salon").click();
  expect((await requests(page)).map((href) => Object.fromEntries(new URL(href, page.url()).searchParams))).toEqual([
    { category: lifecycleIds.category },
    { category: lifecycleIds.category, room: lifecycleIds.salon },
  ]);
  await page.evaluate(() => (window as LifecycleWindow).filterLifecycle.release(1));
  await expect(page.locator('select[name="category"]')).toHaveValue(lifecycleIds.category);
  await expect(room(page, "Salon")).toHaveAttribute("aria-current", "page");
});

for (const history of [false, true]) {
  test(`External ${history ? "history" : "navigation"} overrides a pending filter intent`, async ({ page }) => {
    await mountWithEarlyCategoryChange(page, true);
    await page.evaluate((history) => (window as LifecycleWindow).filterLifecycle.external("", history), history);
    await expect(page.locator('select[name="category"]')).toHaveValue("");
    await expect(page.getByLabel("Aktywne filtry")).toHaveCount(0);
    await room(page, "Salon").click();
    expect(new URL((await requests(page)).at(-1)!, page.url()).searchParams.get("category")).toBeNull();
    expect(new URL((await requests(page)).at(-1)!, page.url()).searchParams.get("room")).toBe(lifecycleIds.salon);
  });
}
