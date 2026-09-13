import { expect, test } from "@playwright/test";
import { itemCard } from "./support/m4d8";
import { registerAndCreateHousehold } from "./support/auth";
import {
  dashboardModule,
  dashboardModuleTitles,
  expectNoHorizontalOverflow,
  generateQaSmokeDataset,
  showRoomsDashboardModule,
} from "./support/dashboard";

test.describe("Dashboard widget regression", () => {
  test("available widgets render household content and working links", async ({ page }) => {
    await registerAndCreateHousehold(page, "dashboard-widget-regression");
    await generateQaSmokeDataset(page);
    await showRoomsDashboardModule(page);
    await page.goto("/dashboard");

    for (const title of Object.values(dashboardModuleTitles)) {
      const widget = dashboardModule(page, title);
      await expect(widget).toHaveAttribute("data-module-status", "available");
      await expect(widget.locator("[data-widget-content]")).toBeVisible();
      await expect(widget).not.toContainText("Wkrótce");
    }
    for (const title of ["Terminy ważności", "Ostatnia aktywność"]) {
      await expect(dashboardModule(page, title)).toHaveAttribute(
        "data-module-status",
        "soon",
      );
    }

    const recentItems = dashboardModule(page, dashboardModuleTitles.recentItems);
    await expect(recentItems).toContainText("QA Kabel USB");
    await expect(recentItems).toContainText("Brak lokalizacji");
    const itemLink = recentItems.getByRole("link").filter({ hasText: "QA Kabel USB" });
    await itemLink.click();
    await expect(page).toHaveURL(/\/items\?focus=[0-9a-f-]{36}$/);
    await expect(itemCard(page, "QA Kabel USB")).toBeVisible();

    await page.goto("/dashboard");
    const categories = dashboardModule(page, dashboardModuleTitles.categories);
    await expect(categories.getByRole("link", { name: /Bez lokalizacji/ })).toBeVisible();
    await expect(categories.getByLabel("Liczba Rzeczy: 1", { exact: true }).first()).toBeVisible();

    const room = dashboardModule(page, dashboardModuleTitles.rooms)
      .getByRole("link")
      .filter({ hasText: "QA Salon" });
    await expect(room).toHaveAttribute("href", /^\/home#room-[0-9a-f-]{36}$/);
  });

  test("empty household does not receive another household's widget data", async ({ page, browser }) => {
    await registerAndCreateHousehold(page, "dashboard-widget-source");
    await generateQaSmokeDataset(page);

    const other = await browser.newContext({ baseURL: new URL(page.url()).origin });
    try {
      const otherPage = await other.newPage();
      await registerAndCreateHousehold(otherPage, "dashboard-widget-target");
      await showRoomsDashboardModule(otherPage);
      await otherPage.goto("/dashboard");

      await expect(dashboardModule(otherPage, dashboardModuleTitles.recentItems).getByRole("status")).toBeVisible();
      await expect(dashboardModule(otherPage, dashboardModuleTitles.rooms).getByRole("status")).toBeVisible();
      const unlocated = dashboardModule(otherPage, dashboardModuleTitles.categories)
        .getByRole("link", { name: /Bez lokalizacji/ });
      await expect(unlocated.getByLabel("Liczba Rzeczy: 0")).toBeVisible();
      await expect(otherPage.getByText("QA Kabel USB", { exact: true })).toHaveCount(0);
      await expect(otherPage.getByText("QA Salon", { exact: true })).toHaveCount(0);
    } finally {
      await other.close();
    }
  });

  test("widgets remain responsive on mobile and desktop", async ({ page }) => {
    await registerAndCreateHousehold(page, "dashboard-widget-responsive");
    await generateQaSmokeDataset(page);
    await showRoomsDashboardModule(page);

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/dashboard");
      await expectNoHorizontalOverflow(page);
      for (const title of Object.values(dashboardModuleTitles)) {
        await expect(dashboardModule(page, title)).toBeVisible();
      }
    }
  });
});
