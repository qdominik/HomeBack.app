import { expect, test } from "@playwright/test";
import { registerAndCreateHousehold } from "./support/auth";

for (const width of [390, 768, 1280]) {
  test(`header and menu work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await registerAndCreateHousehold(page, `navigation-${width}`);
    const header = page.getByRole("banner");
    const toggle = header.getByRole("button", { name: /menu$/ });
    const menu = page.getByRole("navigation", { name: "Główna nawigacja" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(menu).not.toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAttribute("aria-controls", await menu.getAttribute("id") as string);
    await expect(menu).toBeVisible();
    for (const name of ["Osoby", "Dokumenty"]) {
      const soon = menu.getByRole("button", { name: `${name} Wkrótce` });
      await expect(soon).toHaveAttribute("aria-disabled", "true");
      await soon.click({ force: true });
      await expect(page).toHaveURL(/\/dashboard$/);
    }
    for (const element of [header, menu]) {
      expect(await element.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      const bounds = await element.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    }
    await page.screenshot({ path: `test-results/authenticated-navigation-${width}.png`, fullPage: true });
    const logo = header.getByRole("link", { name: "HomeBack.app" });
    const logoBox = await logo.boundingBox();
    const searchBox = await header.getByRole("button", { name: "Wyszukiwarka", exact: true }).boundingBox();
    expect(logoBox!.x + logoBox!.width).toBeLessThanOrEqual(searchBox!.x);
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await toggle.click();
    await expect(menu).not.toBeVisible();
    await toggle.click();
    await page.getByRole("main").click({ position: { x: 5, y: 5 } });
    await expect(menu).not.toBeVisible();
    for (const [name, href] of [["Rzeczy", "/items"], ["Pomieszczenia", "/home"], ["Kategorie", "/categories"], ["Ustawienia", "/settings"], ["Dashboard", "/dashboard"]]) {
      await toggle.click();
      await menu.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(menu).not.toBeVisible();
      await toggle.click();
      await expect(menu.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
      await page.keyboard.press("Escape");
    }
    await expect(logo).toHaveAttribute("href", "/dashboard");
    await logo.click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/items");
    await logo.click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const search = header.getByRole("button", { name: "Wyszukiwarka", exact: true });
    const dialog = page.getByRole("dialog", { name: "Wyszukiwarka" });
    for (const close of ["text", "icon", "escape"]) {
      await search.click();
      await expect(dialog.getByRole("searchbox")).toBeFocused();
      for (const name of ["Wszystko", "Rzeczy", "Pomieszczenia", "Meble", "Schowki"]) {
        await expect(dialog.getByRole("button", { name, exact: true })).toBeInViewport();
      }
      if (close === "escape") await page.keyboard.press("Escape");
      else await dialog.getByRole("button", { name: "Zamknij wyszukiwarkę", exact: true }).nth(close === "text" ? 0 : 1).click();
      await expect(dialog).not.toBeVisible();
      await expect(search).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await toggle.click();
    await menu.getByRole("button", { name: "Wyloguj", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByRole("button", { name: "Otwórz menu" }).click();
    await expect(menu.getByRole("link", { name: "Zaloguj", exact: true })).toHaveAttribute("href", "/login");
    await expect(menu.getByRole("button", { name: "Wyloguj" })).toHaveCount(0);
  });
}

test("guest menu and search controls fit mobile, tablet and desktop", async ({ page }) => {
  await page.goto("/login");
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const header = page.getByRole("banner");
    const menu = page.getByRole("navigation", { name: "Główna nawigacja" });
    const toggle = header.getByRole("button", { name: /menu$/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("link", { name: "Zaloguj", exact: true })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Wyloguj" })).toHaveCount(0);
    for (const element of [header, menu]) {
      expect(await element.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      const box = await element.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    await page.screenshot({ path: `test-results/navigation-${width}.png`, fullPage: true });
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    await expect(menu).not.toBeVisible();
    await toggle.click();
    await toggle.click();
    await expect(menu).not.toBeVisible();
    await toggle.click();
    await page.getByRole("heading", { name: "Logowanie" }).click();
    await expect(menu).not.toBeVisible();
    const trigger = header.getByRole("button", { name: "Wyszukiwarka", exact: true });
    const dialog = page.getByRole("dialog", { name: "Wyszukiwarka" });
    for (const close of ["text", "icon", "escape"]) {
      await trigger.click();
      await expect(dialog.getByRole("searchbox")).toBeFocused();
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      if (close === "escape") await page.keyboard.press("Escape");
      else await dialog.getByRole("button", { name: "Zamknij wyszukiwarkę", exact: true }).nth(close === "text" ? 0 : 1).click();
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
    await expect(header.getByRole("link", { name: "HomeBack.app" })).toHaveAttribute("href", "/dashboard");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
