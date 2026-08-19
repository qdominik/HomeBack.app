import { expect, test, devices, type Page } from "@playwright/test";

const email = process.env.E2E_PREVIEW_EMAIL;
const password = process.env.E2E_PREVIEW_PASSWORD;
const photoPath = process.env.E2E_PREVIEW_PHOTO;

test.describe.configure({ mode: "serial" });

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email ?? "");
  await page.locator('input[name="password"]').fill(password ?? "");
  await page.getByRole("button", { name: "Zaloguj" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
}

test("1. Wejście na aplikację (root → login)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "Logowanie" }),
  ).toBeVisible();
});

test("2. Logowanie na koncie testowym", async ({ page }) => {
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Dashboard" }),
  ).toBeVisible();
  await expect(page.getByText(/Dzień dobry/)).toBeVisible();
});

test("3. Kategorie — widoczna kategoria systemowa Ubrania", async ({
  page,
}) => {
  await login(page);
  await page.goto("/categories");
  await expect(
    page.getByRole("heading", { name: "Kategorie" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ubrania" }),
  ).toBeVisible();
});

test("4. Dodanie rzeczy bez zdjęcia", async ({ page }) => {
  await login(page);
  await page.goto("/items");
  await page.getByText("Dodaj rzecz").click();
  const creationForm = page.locator("form", {
    has: page.getByRole("button", { name: "Utwórz rzecz" }),
  });
  const itemName = `Smoke bez zdjęcia ${Date.now()}`;
  await creationForm.locator('input[name="nazwa"]').fill(itemName);
  await creationForm.getByRole("button", { name: "Utwórz rzecz" }).click();
  await expect(page.getByText("Rzecz została utworzona.")).toBeVisible();
  await expect(page.getByText(itemName).first()).toBeVisible();
});

test("5. Dodanie rzeczy ze zdjęciem + analiza AI", async ({ page }) => {
  test.skip(!photoPath, "Brak E2E_PREVIEW_PHOTO");

  await login(page);
  await page.goto("/items");
  await page.getByText("Dodaj rzecz").click();
  const creationForm = page.locator("form", {
    has: page.getByRole("button", { name: "Utwórz rzecz" }),
  });

  await creationForm
    .locator('input[type="file"]')
    .first()
    .setInputFiles(photoPath!);
  await expect(page.getByText("Zdjęcie gotowe do podglądu.")).toBeVisible({
    timeout: 60_000,
  });

  await creationForm
    .getByRole("button", { name: "Uzupełnij ze zdjęcia" })
    .click();

  await expect(
    creationForm.getByRole("button", { name: "Uzupełnij ze zdjęcia" }),
  ).toBeVisible({ timeout: 90_000 });

  const photoSection = creationForm.locator("section", {
    hasText: "Zdjęcie Rzeczy",
  });
  const feedback = await photoSection.locator("p").allTextContents();
  test.info().annotations.push({
    type: "photo-analysis",
    description: feedback.join(" | "),
  });

  if (
    (await creationForm.locator('input[name="nazwa"]').inputValue()).trim() ===
    ""
  ) {
    await creationForm
      .locator('input[name="nazwa"]')
      .fill(`Smoke ze zdjęciem ${Date.now()}`);
  }

  const finalName = await creationForm.locator('input[name="nazwa"]').inputValue();
  await creationForm.getByRole("button", { name: "Utwórz rzecz" }).click();
  await expect(page.getByText("Rzecz została utworzona.")).toBeVisible();
  await expect(page.getByText(finalName).first()).toBeVisible();

  await page.goto("/items");
  await expect(
    page.locator('img[src*="/api/item-photos/photo"]').first(),
  ).toBeVisible({ timeout: 30_000 });
});

test("6. Widok mobilny (iPhone)", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPhone 14"] });
  const page = await context.newPage();
  await login(page);

  for (const route of ["/dashboard", "/categories", "/items"]) {
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow, `${route} overflow`).toBe(false);
  }

  await context.close();
});
