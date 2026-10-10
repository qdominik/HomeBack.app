import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

// Standalone client regression: no app server, Supabase, auth or provider needed.
export default defineConfig({
  ...config,
  testMatch: ["item-photo-recovery.spec.ts"],
  webServer: undefined,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/photo-recovery-results.json" }]],
});
