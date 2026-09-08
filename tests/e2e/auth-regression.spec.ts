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
  await page.getByRole("button", { name: "Otwórz menu", exact: true }).click();
  await expect(page.getByText(credentials.householdName)).toBeVisible();
  await expect(page.getByRole("button", { name: "Wyloguj" })).toBeVisible();

  const logoutResponse = page.waitForResponse(response => new URL(response.url()).pathname === "/auth/signout");
  const origin = new URL(page.url()).origin;
  await page.getByRole("button", { name: "Wyloguj" }).click();
  const response = await logoutResponse;
  expect(response.status()).toBe(303);
  expect(response.headers().location).toBe("/login");
  await expect(page).toHaveURL(/\/login$/);

  expect(new URL(page.url()).origin).toBe(origin);
  const loginResponse = await page.goto("/login");
  expect(loginResponse?.status()).toBe(200);
  await expect(page.getByText("410: GONE", { exact: true })).toHaveCount(0);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: /Zaloguj/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: "Otwórz menu", exact: true }).click();
  await expect(page.getByText(credentials.householdName)).toBeVisible();
});


test("logout redirect stays on the request origin even with an obsolete configured site URL", async ({ page }) => {
  const response = await page.request.post("/auth/signout", { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toBe("/login");
  const login = await page.goto(response.headers().location);
  expect(login?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Logowanie", exact: true })).toBeVisible();
});
