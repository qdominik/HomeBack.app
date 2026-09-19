import { expect, test, type Page } from "@playwright/test";
import {
  confirmLatestEmail,
  createHousehold,
  latestInvitationMessage,
  newE2ECredentials,
  registerAndConfirmEmail,
} from "./support/auth";

async function signOut(page: Page) {
  const response = await page.request.post("/auth/signout", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
  await page.goto("/login");
}

async function createAdministrator(page: Page, prefix: string) {
  const credentials = newE2ECredentials(prefix);
  await registerAndConfirmEmail(page, credentials);
  await createHousehold(page, credentials);
  return credentials;
}

async function sendInvitation(page: Page, email: string) {
  await page.goto("/family");
  await page.getByLabel("Adres e-mail").fill(email);
  await page.getByRole("button", { name: "Wyślij zaproszenie" }).click();
  await expect(
    page.getByText(
      `Zaproszenie zostało przekazane do wysyłki na adres ${email}.`,
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await expect(page.getByText("Oczekuje", { exact: true })).toBeVisible();
  return latestInvitationMessage(email);
}

test("existing verified account logs in and accepts an invitation", async ({
  page,
}) => {
  const invitee = newE2ECredentials("invite-existing");
  await registerAndConfirmEmail(page, invitee);
  await signOut(page);

  const administrator = await createAdministrator(page, "invite-admin-existing");
  const invitation = await sendInvitation(page, invitee.email);
  await signOut(page);

  await page.goto(invitation.link);
  await expect(page.getByRole("heading", { name: "Wymagane logowanie" })).toBeVisible();
  await page.getByRole("link", { name: "Zaloguj się" }).click();
  await expect(page.locator('input[name="email"]')).toHaveValue(invitee.email);
  await page.locator('input[name="password"]').fill(invitee.password);
  await page.getByRole("button", { name: /Zaloguj/ }).click();

  await expect(page.getByRole("heading", { name: "Gotowe do przyjęcia" })).toBeVisible();
  await expect(page.getByText(administrator.householdName, { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Przyjmij zaproszenie" }).click();
  await expect(page).toHaveURL(/\/family\?invitation=accepted$/);
  await expect(page.getByRole("status")).toContainText("Zaproszenie zostało przyjęte.");
  await expect(
    page.getByLabel("Członkowie").getByText("Dorosły", { exact: true }),
  ).toBeVisible();

  await page.goto(invitation.link);
  await expect(page.getByRole("heading", { name: "Zaproszenie zostało już użyte" })).toBeVisible();
});

test("new account keeps the invitation through registration and email confirmation", async ({
  page,
}) => {
  await createAdministrator(page, "invite-admin-new");
  const invitee = newE2ECredentials("invite-new");
  const invitation = await sendInvitation(page, invitee.email);
  await signOut(page);

  await page.goto(invitation.link);
  await expect(page.getByRole("heading", { name: "Utwórz konto HomeBack" })).toBeVisible();
  await page.getByRole("link", { name: "Zarejestruj się" }).click();
  await expect(page.locator('input[name="email"]')).toHaveValue(invitee.email);
  await page.locator('input[name="name"]').fill(invitee.name);
  await page.locator('input[name="password"]').fill(invitee.password);
  await page.getByRole("button", { name: /Utw/ }).click();
  await expect(page.getByRole("heading", { name: /Sprawd/ })).toBeVisible();

  await confirmLatestEmail(page, invitee.email);
  await page.goto("/invite/accept");
  await expect(page.getByRole("heading", { name: "Gotowe do przyjęcia" })).toBeVisible();

  await page.getByRole("button", { name: "Przyjmij zaproszenie" }).click();
  await expect(page).toHaveURL(/\/family\?invitation=accepted$/);
  await expect(
    page.getByLabel("Członkowie").getByText("Dorosły", { exact: true }),
  ).toBeVisible();
});

test("a logged-in account with another email cannot inspect household details", async ({
  page,
}) => {
  const invitee = newE2ECredentials("invite-wrong-target");
  await registerAndConfirmEmail(page, invitee);
  await signOut(page);

  const administrator = await createAdministrator(page, "invite-wrong-admin");
  const invitation = await sendInvitation(page, invitee.email);
  await signOut(page);

  await page.goto(invitation.link);
  await page.getByRole("link", { name: "Zaloguj się" }).click();
  await page.locator('input[name="email"]').fill(administrator.email);
  await page.locator('input[name="password"]').fill(administrator.password);
  await page.getByRole("button", { name: /Zaloguj/ }).click();

  await expect(page.getByRole("heading", { name: "Niewłaściwe konto" })).toBeVisible();
  await expect(page.getByText(administrator.householdName, { exact: false })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Wyloguj się" })).toBeVisible();
});

test("renewal rotates the one-time link and revocation uses in-app confirmation", async ({
  page,
}) => {
  await createAdministrator(page, "invite-admin-rotate");
  const email = `invite-rotate-${Date.now()}@example.test`;
  const oldInvitation = await sendInvitation(page, email);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Wyślij ponownie" }).click();
  await expect(
    page.getByText(
      `Zaproszenie zostało przekazane do wysyłki na adres ${email}.`,
      { exact: true },
    ),
  ).toBeVisible();
  const renewedInvitation = await latestInvitationMessage(email, oldInvitation.id);
  expect(renewedInvitation.link).not.toBe(oldInvitation.link);

  await page.goto(oldInvitation.link);
  await expect(page.getByRole("heading", { name: "Zaproszenie zostało odwołane" })).toBeVisible();

  await page.goto("/family");
  const pendingInvitation = page
    .locator("li")
    .filter({ hasText: email })
    .filter({ hasText: "Oczekuje" });
  await pendingInvitation.getByRole("button", { name: "Odwołaj", exact: true }).click();
  await expect(
    pendingInvitation.getByRole("button", {
      name: "Potwierdź odwołanie",
      exact: true,
    }),
  ).toBeVisible();
  await pendingInvitation.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(pendingInvitation.getByText("Oczekuje", { exact: true })).toBeVisible();

  await pendingInvitation.getByRole("button", { name: "Odwołaj", exact: true }).click();
  await pendingInvitation.getByRole("button", { name: "Potwierdź odwołanie", exact: true }).click();
  await expect(page.getByText("Zaproszenie zostało odwołane.", { exact: true })).toBeVisible();

  await page.goto(renewedInvitation.link);
  await expect(page.getByRole("heading", { name: "Zaproszenie zostało odwołane" })).toBeVisible();
});
