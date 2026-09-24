import { expect, test } from "@playwright/test";

test.skip(
  process.env.HOUSEHOLD_INVITATIONS_ENABLED !== "false",
  "runs only in the dedicated kill-switch E2E pass",
);

test("disabled flag blocks invitation token capture and session creation", async ({ page }) => {
  await page.goto(`/invite/accept#token=${"a".repeat(64)}`);
  await expect(
    page.getByRole("heading", { name: "Zaproszenia są obecnie wyłączone" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/invite\/accept$/);
  await expect
    .poll(async () =>
      (await page.context().cookies()).some(
        (cookie) => cookie.name === "homeback_invitation",
      ),
    )
    .toBe(false);

  const response = await page.request.post("/invite/session", {
    data: { token: "a".repeat(64) },
  });
  expect(response.status()).toBe(404);
});
