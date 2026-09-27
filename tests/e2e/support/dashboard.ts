import { expect, type Locator, type Page } from "@playwright/test";

export const dashboardModuleTitles = {
  categories: "Rzeczy według kategorii",
  recentItems: "Ostatnie Rzeczy",
  rooms: "Pomieszczenia",
} as const;

export function dashboardModule(page: Page, title: string): Locator {
  return page
    .getByRole("heading", { level: 2, name: title, exact: true })
    .locator("xpath=ancestor::section[1]");
}

export async function generateQaSmokeDataset(page: Page) {
  await page.goto("/settings?tab=test-data");
  const form = page.locator('form:has(input[name="dataset_type"][value="qa_smoke"])');

  await form.getByRole("button").click();
  await expect(page).toHaveURL(/status=test_data_generated/);
  await expect(
    page.getByText("Dane testowe zostały wygenerowane.", { exact: true }),
  ).toBeVisible();
}

export async function showRoomsDashboardModule(page: Page) {
  await page.goto("/settings?tab=dashboard-personalization");
  const roomsToggle = page.getByRole("checkbox", {
    name: dashboardModuleTitles.rooms,
    exact: true,
  });

  if (!(await roomsToggle.isChecked())) {
    await roomsToggle.check();
    await page.getByRole("button", { name: "Zapisz widoczność", exact: true }).click();
    await expect(page).toHaveURL(/status=dashboard_preferences_saved/);
  }
}

export async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
