import { expect, test } from "@playwright/test";
import {
  createHousehold,
  newE2ECredentials,
  registerAndConfirmEmail,
} from "./support/auth";

test("administrator confirms and revokes an invitation without a native browser dialog", async ({ page }) => {
  const credentials = newE2ECredentials("roles-invites");

  await registerAndConfirmEmail(page, credentials);
  await createHousehold(page, credentials);
  await page.goto("/family");

  const email = `invite-${Date.now()}@example.test`;
  await page.getByLabel("Adres e-mail").fill(email);
  await page.getByRole("button", { name: "Przygotuj zaproszenie" }).click();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await expect(page.getByText("Oczekuje", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Odwołaj", exact: true }).click();
  await expect(page.getByRole("button", { name: "Potwierdź odwołanie", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(page.getByText("Oczekuje", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Odwołaj", exact: true }).click();
  const revokeResponse = page.waitForResponse(response => new URL(response.url()).pathname === "/family" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Potwierdź odwołanie", exact: true }).click();
  expect((await revokeResponse).ok()).toBe(true);
  await expect(page.getByText("Odwołane", { exact: true })).toBeVisible();
});
