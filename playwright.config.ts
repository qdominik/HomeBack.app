import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3001";
const baseURL = `http://127.0.0.1:${port}`;
const productionBundle = process.env.E2E_PRODUCTION_BUNDLE === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: [
    "auth-regression.spec.ts",
    "dashboard-item-search.spec.ts",
    "icon-catalog-locales.spec.ts",
    "m4d8-location-lifecycle.spec.ts",
  ],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: productionBundle
      ? `npm.cmd run start -- --hostname 127.0.0.1 --port ${port}`
      : `npm.cmd run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
