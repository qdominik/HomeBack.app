import { expect, test } from "@playwright/test";
import {
  createHousehold,
  newE2ECredentials,
  registerAndConfirmEmail,
} from "./support/auth";

test("registration, Mailpit confirmation, household, login and route protection", async ({
  page,
}) => {
  const credentials = newE2ECredentials("auth-e2e");

  await registerAndConfirmEmail(page, credentials);
  await createHousehold(page, credentials);
  await expect(page.getByText(credentials.householdName)).toBeVisible();
  await expect(page.getByRole("button", { name: "Wyloguj" })).toBeVisible();

  await page.getByRole("button", { name: "Wyloguj" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: /Zaloguj/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(credentials.householdName)).toBeVisible();
});
