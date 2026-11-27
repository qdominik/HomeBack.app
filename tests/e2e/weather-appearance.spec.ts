import { expect, test } from "@playwright/test";
import { registerAndCreateHousehold } from "./support/auth";

test("appearance preview saves to the account and restores in a new session", async ({ page, browser }) => {
  const credentials = await registerAndCreateHousehold(page, "appearance-6b");
  await page.goto("/settings?tab=appearance");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Zapisz preferencje" }) });
  const mode = form.locator("select").first();
  await expect(mode).toHaveValue("auto");
  await mode.selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(mode).toHaveValue("auto"); // Preview is not persisted.
  const weather = form.locator("select").nth(3);
  await weather.selectOption("rain");
  const scene = page.locator('.rhythm-welcome .ambient-scene-host[data-weather="rain"]').last();
  await expect(scene).toBeVisible();
  await expect(page.getByText("Dane przykładowe", { exact: true }).last()).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene.locator(".raindrop").first()).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = form.getByRole("switch", { name: "Animacje" });
  await motion.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(scene.locator(".raindrop").first()).toHaveCSS("animation-name", "none");
  await motion.check();
  await mode.selectOption("dark");
  await form.getByRole("button", { name: "Zapisz preferencje" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Preferencje zapisane." })).toBeVisible();

  const other = await browser.newContext();
  try {
    const second = await other.newPage();
    await second.goto(new URL("/login", page.url()).href);
    await second.locator('input[name="email"]').fill(credentials.email);
    await second.locator('input[name="password"]').fill(credentials.password);
    await second.locator("form").filter({ has: second.locator('input[name="password"]') }).getByRole("button", { name: /Zaloguj/ }).click();
    await expect(second).toHaveURL(/\/dashboard$/);
    await second.goto(new URL("/settings?tab=appearance", page.url()).href);
    const secondForm = second.locator("form").filter({ has: second.getByRole("button", { name: "Zapisz preferencje" }) });
    await expect(secondForm.locator("select").first()).toHaveValue("dark");
    await expect(second.locator("html")).toHaveAttribute("data-theme", "dark");
  } finally {
    await other.close();
  }
});
