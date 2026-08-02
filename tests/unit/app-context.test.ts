import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

test("SSR app context is request-scoped and keeps household lookup tied to the profile", () => {
  const context = source("src/lib/app-context.ts");

  assert.match(context, /import \{ cache \} from "react"/);
  assert.match(context, /export const getAppContext = cache\(async/);
  assert.equal((context.match(/auth\.getClaims\(\)/g) ?? []).length, 1);
  assert.match(context, /select\("household_id, imie, rola, status"\)/);
  assert.match(context, /\.eq\("id", profile\.household_id\)/);
  assert.match(context, /household: null, profile: null, supabase, userId: null/);
  assert.match(context, /household: null, profile: null, supabase, userId/);
});

test("protected routes reuse the SSR app context without changing access redirects", () => {
  const consumers = [
    "src/app/(app)/layout.tsx",
    "src/app/(app)/dashboard/page.tsx",
    "src/app/(app)/home/page.tsx",
    "src/app/(app)/items/page.tsx",
    "src/app/(app)/categories/page.tsx",
  ];

  for (const path of consumers) {
    const file = source(path);
    assert.match(file, /getAppContext/);
    assert.doesNotMatch(file, /auth\.getClaims\(\)/);
    assert.doesNotMatch(file, /createClient\(\)/);
  }

  const layout = source("src/app/(app)/layout.tsx");
  assert.match(layout, /if \(!userId\) \{\n    redirect\(routes\.login\);/);
  assert.match(layout, /if \(!profile\) \{\n    redirect\(`\$\{routes\.register\}\?step=household`\);/);
  assert.match(layout, /if \(!household\) \{\n    redirect\(`\$\{routes\.register\}\?error=household_failed`\);/);
});
