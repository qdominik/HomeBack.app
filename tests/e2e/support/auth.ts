import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

const appURL = "http://127.0.0.1:3001";
const mailpitAPIURL = "http://127.0.0.1:54324/api/v1";
const confirmationTimeout = 15_000;

export type E2ECredentials = {
  email: string;
  householdName: string;
  name: string;
  password: string;
};

type MailpitMessage = {
  ID?: string;
  To?: Array<{ Address?: string }>;
  to?: string;
};

function pause(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function confirmationURL(link: string) {
  const url = new URL(link.replaceAll("&amp;", "&"));
  url.protocol = "http:";
  url.host = new URL(appURL).host;
  return url.toString();
}

async function latestConfirmationLink(email: string) {
  const deadline = Date.now() + confirmationTimeout;

  while (Date.now() < deadline) {
    const inboxResponse = await fetch(`${mailpitAPIURL}/messages`);
    expect(inboxResponse.ok).toBeTruthy();

    const inbox = await inboxResponse.json();
    const messages = (inbox.messages ?? []) as MailpitMessage[];
    const message = messages.find((entry) =>
      String(entry.To?.[0]?.Address ?? entry.to ?? "").includes(email),
    );

    if (message?.ID) {
      const messageResponse = await fetch(
        `${mailpitAPIURL}/message/${message.ID}`,
      );
      expect(messageResponse.ok).toBeTruthy();

      const body = JSON.stringify(await messageResponse.json());
      const link = body.match(/https?:\/\/[^"'<\s]+\/auth\/confirm\?[^"'<\s]+/)?.[0];

      expect(link, "confirmation link").toBeTruthy();
      return link!;
    }

    await pause(250);
  }

  throw new Error(`Confirmation e-mail for ${email} did not arrive in Mailpit.`);
}

export function newE2ECredentials(prefix: string): E2ECredentials {
  const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;

  return {
    email: `${prefix}-${unique}@example.test`,
    householdName: `E2E Dom ${unique}`,
    name: "E2E Admin",
    password: "Password123!",
  };
}

export async function registerAndConfirmEmail(
  page: Page,
  credentials: E2ECredentials,
) {
  await page.goto("/register");
  await page.locator('input[name="name"]').fill(credentials.name);
  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: /Utw/ }).click();
  await expect(page.getByRole("heading", { name: /Sprawd/ })).toBeVisible();

  const response = await page.context().request.get(
    confirmationURL(await latestConfirmationLink(credentials.email)),
    { maxRedirects: 0 },
  );
  expect(response.status(), "email confirmation response").toBe(307);
}

export async function createHousehold(page: Page, credentials: E2ECredentials) {
  await page.goto("/register?step=household");
  await expect(page.getByRole("heading", { name: /Utw/ })).toBeVisible();
  await page.locator('input[name="name"]').fill(credentials.name);
  await page
    .locator('input[name="household_name"]')
    .fill(credentials.householdName);
  await page.locator('select[name="household_type"]').selectOption("dom");
  await page.getByRole("button", { name: /Utw/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function registerAndCreateHousehold(page: Page, prefix = "m3-e2e") {
  const credentials = newE2ECredentials(prefix);
  await registerAndConfirmEmail(page, credentials);
  await createHousehold(page, credentials);
  return credentials;
}
