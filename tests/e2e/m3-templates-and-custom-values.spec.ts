import { expect, test } from "@playwright/test";

const mailApiUrl = "http://127.0.0.1:54324/api/v1";

async function latestConfirmationLink(email: string) {
  const inboxResponse = await fetch(`${mailApiUrl}/messages`);
  expect(inboxResponse.ok).toBeTruthy();

  const inbox = await inboxResponse.json();
  const messages = inbox.messages ?? [];
  const message = messages.find((entry) =>
    String(entry.To?.[0]?.Address ?? entry.to ?? "").includes(email),
  );

  expect(message, `confirmation e-mail for ${email}`).toBeTruthy();

  const messageResponse = await fetch(`${mailApiUrl}/message/${message.ID}`);
  expect(messageResponse.ok).toBeTruthy();

  const body = JSON.stringify(await messageResponse.json());
  const link = body.match(/https?:\/\/127\.0\.0\.1:3000\/auth\/confirm\?[^"'<\s]+/)?.[0];

  expect(link, "confirmation link").toBeTruthy();

  return link!;
}

async function registerAndCreateHousehold(page) {
  const unique = Date.now();
  const email = `m3-e2e-${unique}@example.test`;
  const password = process.env.E2E_PASSWORD;

  if (!password) {
    throw new Error("Set E2E_PASSWORD before running local end-to-end tests.");
  }

  await page.goto("/register");
  await page.getByLabel("Imię").fill("E2E Admin");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło").fill(password);
  await page.getByRole("button", { name: "Utwórz konto" }).click();
  await expect(page.getByText("Sprawdź skrzynkę e-mail")).toBeVisible();

  await page.goto(await latestConfirmationLink(email));
  await expect(page.getByRole("heading", { name: "Utwórz gospodarstwo" })).toBeVisible();
  await page.getByLabel("Imię").fill("E2E Admin");
  await page.getByLabel("Nazwa gospodarstwa").fill(`E2E Dom ${unique}`);
  await page.getByLabel("Typ gospodarstwa").selectOption("dom");
  await page.getByRole("button", { name: "Utwórz gospodarstwo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function fillTemplateOrCustomField(page, label: string, option: string, customValue?: string) {
  await page.getByLabel(label).selectOption(option);

  if (customValue) {
    await page.getByLabel(/Własny/).fill(customValue);
  }
}

test("M3 home and category template/custom flows", async ({ page }) => {
  await registerAndCreateHousehold(page);

  await page.goto("/home");
  await page.getByText("Dodaj pomieszczenie").click();
  await page.getByLabel("Nazwa").fill("Salon na dole");
  await fillTemplateOrCustomField(page, "Rodzaj", "Salon");
  await page.getByRole("button", { name: "Utwórz pomieszczenie" }).click();
  await expect(page.getByRole("heading", { name: "Salon na dole" })).toBeVisible();
  await expect(page.getByText("Salon", { exact: true })).toBeVisible();

  await page.getByText("Dodaj pomieszczenie").click();
  await page.getByLabel("Nazwa").fill("Pomieszczenie z rowerami");
  await fillTemplateOrCustomField(page, "Rodzaj", "Inne", "Rowerownia");
  await page.getByRole("button", { name: "Utwórz pomieszczenie" }).click();
  await expect(page.getByRole("heading", { name: "Pomieszczenie z rowerami" })).toBeVisible();
  await expect(page.getByText("Rowerownia", { exact: true })).toBeVisible();

  const salonCard = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: "Salon na dole" }) });

  await salonCard.getByText("Dodaj schowek").click();
  await salonCard.getByLabel("Nazwa").fill("Szafka narożna w kuchni");
  await salonCard.getByLabel("Rodzaj").selectOption("Szafka narożna");
  await salonCard.getByRole("button", { name: "Utwórz schowek" }).click();
  await expect(salonCard.getByRole("heading", { name: "Szafka narożna w kuchni" })).toBeVisible();
  await expect(salonCard.getByText("Szafka narożna", { exact: true })).toBeVisible();

  await salonCard.getByText("Dodaj schowek").click();
  await salonCard.getByLabel("Nazwa").fill("Stary kuferek");
  await salonCard.getByLabel("Rodzaj").selectOption("Inne");
  await salonCard.getByLabel("Własny rodzaj schowka").fill("Kuferek");
  await salonCard.getByRole("button", { name: "Utwórz schowek" }).click();
  await expect(salonCard.getByRole("heading", { name: "Stary kuferek" })).toBeVisible();
  await expect(salonCard.getByText("Kuferek", { exact: true })).toBeVisible();

  await page.goto("/categories");
  await page.getByText("Dodaj kategorię").click();
  await page.getByLabel("Nazwa kategorii").selectOption("Inne");
  await page.getByLabel("Własna nazwa kategorii").fill("Sport");
  await page.getByRole("button", { name: "Utwórz kategorię" }).click();
  await expect(page.getByRole("heading", { name: "Sport" })).toBeVisible();
  await expect(page.getByText("Własne", { exact: true })).toBeVisible();

  await page.getByText("Dodaj kategorię").click();
  await page.getByLabel("Nazwa kategorii").selectOption("Narzędzia");
  await page.getByRole("button", { name: "Utwórz kategorię" }).click();
  await expect(page.getByText("Ta kategoria systemowa jest już dostępna.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Narzędzia" })).toHaveCount(1);
});
