import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_PREVIEW_BASE_URL;

if (!baseURL) {
  throw new Error("Set E2E_PREVIEW_BASE_URL to the preview deployment URL.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["preview-smoke.spec.ts"],
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
