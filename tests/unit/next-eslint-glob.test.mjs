import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { after, before, test } from "node:test";
import { Linter } from "eslint";

const require = createRequire(import.meta.url);
const pluginRequire = createRequire(require.resolve("@next/eslint-plugin-next"));
const { getRootDirs } = pluginRequire("./utils/get-root-dirs.js");
const originalCwd = process.cwd();
let fixture;

before(() => {
  const cache = path.join(originalCwd, ".npm-cache");
  mkdirSync(cache, { recursive: true });
  fixture = mkdtempSync(path.join(cache, "next-eslint-glob-"));
  for (const directory of [
    "apps/web/pages",
    "apps/web/nested",
    "apps/admin/src/app",
    "apps/.hidden",
    "packages/ui",
  ]) {
    mkdirSync(path.join(fixture, directory), { recursive: true });
  }
  writeFileSync(path.join(fixture, "apps/web/pages/about.jsx"), "");
  writeFileSync(path.join(fixture, "apps/file.txt"), "");
  process.chdir(fixture);
});

after(() => {
  process.chdir(originalCwd);
  const cache = path.resolve(originalCwd, ".npm-cache") + path.sep;
  assert.ok(path.resolve(fixture).startsWith(cache));
  rmSync(fixture, { recursive: true, force: true });
});

function roots(rootDir) {
  return getRootDirs({ cwd: fixture, settings: { next: { rootDir } } }).sort();
}

test("Next ESLint retains its default root", () => {
  assert.deepEqual(roots(undefined), [fixture]);
});

for (const [pattern, expected] of [
  ["apps/web", ["apps/web"]],
  ["apps/*", ["apps/admin", "apps/web"]],
  ["apps/{web,admin}", ["apps/admin", "apps/web"]],
  ["apps/**", ["apps/admin", "apps/admin/src", "apps/admin/src/app", "apps/web", "apps/web/nested", "apps/web/pages"]],
  ["apps/missing", []],
  ["apps/file.txt", []],
]) {
  test(`Next ESLint directory discovery: ${pattern}`, () => {
    assert.deepEqual(roots(pattern), expected.sort());
  });
}

test("Next ESLint supports arrays and ignores non-string entries", () => {
  assert.deepEqual(roots(["apps/*", "packages/*", false]), ["apps/admin", "apps/web", "packages/ui"]);
});

test("Next ESLint normalizes Windows paths", () => {
  assert.deepEqual(roots("apps\\*"), ["apps/admin", "apps/web"]);
});

test("Next ESLint preserves absolute roots", () => {
  const absolute = fixture.replaceAll(path.sep, "/");
  assert.deepEqual(roots(`${absolute}/apps/*`), [`${absolute}/apps/admin`, `${absolute}/apps/web`]);
});

test("Next ESLint still detects internal HTML links with a glob rootDir", () => {
  const linter = new Linter();
  const messages = linter.verify('const link = <a href="/about">About</a>;', {
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { next: pluginRequire("@next/eslint-plugin-next") },
    settings: { next: { rootDir: "apps/*" } },
    rules: { "next/no-html-link-for-pages": "error" },
  });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "next/no-html-link-for-pages");
});

test("Unsupported fast-glob APIs fail explicitly", () => {
  assert.throws(() => pluginRequire("fast-glob").globSync("apps/*", {}), TypeError);
});
