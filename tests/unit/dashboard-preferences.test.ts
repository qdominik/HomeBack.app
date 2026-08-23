import assert from "node:assert/strict";
import test from "node:test";
import { dashboardModuleDefinitions } from "../../src/lib/dashboard/module-registry";
import {
  filterKnownDashboardModuleKeys,
  isKnownDashboardModuleKey,
  parseDashboardModuleKeysInput,
  resolveVisibleDashboardModules,
} from "../../src/lib/dashboard/dashboard-preferences";

test("module registry has unique keys and boolean defaultVisible", () => {
  const keys = dashboardModuleDefinitions.map((module) => module.key);

  assert.equal(keys.length, new Set(keys).size);
  assert.ok(keys.length > 0);
  assert.ok(
    dashboardModuleDefinitions.every(
      (module) => typeof module.defaultVisible === "boolean",
    ),
  );
});

test("without stored preferences the registry defaultVisible fallback wins", () => {
  const defaults = resolveVisibleDashboardModules(null);
  const expected = dashboardModuleDefinitions
    .filter((module) => module.defaultVisible)
    .map((module) => module.key);

  assert.deepEqual(
    defaults.map((module) => module.key),
    expected,
  );

  assert.deepEqual(
    resolveVisibleDashboardModules(undefined).map((module) => module.key),
    expected,
  );
});

test("stored preferences show only selected known modules", () => {
  const visible = resolveVisibleDashboardModules(["recent-items"]);

  assert.deepEqual(visible.map((module) => module.key), ["recent-items"]);

  const reordered = resolveVisibleDashboardModules([
    "activity",
    "recent-items",
  ]);

  // Registry order is preserved regardless of stored order.
  assert.deepEqual(reordered.map((module) => module.key), [
    "recent-items",
    "activity",
  ]);
});

test("unknown module ids are ignored without errors on read", () => {
  const visible = resolveVisibleDashboardModules([
    "recent-items",
    "removed-module",
    "plan-lesson-photo",
  ]);

  assert.deepEqual(visible.map((module) => module.key), ["recent-items"]);
  assert.deepEqual(resolveVisibleDashboardModules([]), []);
});

test("payload parsing rejects non-array payloads and non-string entries", () => {
  assert.equal(parseDashboardModuleKeysInput("recent-items").ok, false);
  assert.equal(parseDashboardModuleKeysInput({ modules: [] }).ok, false);
  assert.equal(parseDashboardModuleKeysInput(null).ok, false);
  assert.equal(parseDashboardModuleKeysInput(["recent-items", 42]).ok, false);
  assert.equal(
    parseDashboardModuleKeysInput([["recent-items"]]).ok,
    false,
  );
  assert.equal(parseDashboardModuleKeysInput([undefined]).ok, false);
});

test("payload parsing drops unknown ids and duplicates before saving", () => {
  const parsed = parseDashboardModuleKeysInput([
    "recent-items",
    "unknown-module",
    "recent-items",
    "activity",
  ]);

  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.ok ? parsed.moduleKeys : [], [
    "recent-items",
    "activity",
  ]);

  const allUnknown = parseDashboardModuleKeysInput(["ghost-module"]);

  assert.equal(allUnknown.ok, true);
  assert.deepEqual(allUnknown.ok ? allUnknown.moduleKeys : [], []);
});

test("filter helper keeps known string keys only and dedupes", () => {
  assert.deepEqual(filterKnownDashboardModuleKeys([]), []);
  assert.deepEqual(
    filterKnownDashboardModuleKeys(["recent-items", "recent-items"]),
    ["recent-items"],
  );
  assert.deepEqual(filterKnownDashboardModuleKeys([1, null, true]), []);

  for (const definition of dashboardModuleDefinitions) {
    assert.equal(isKnownDashboardModuleKey(definition.key), true);
  }
  assert.equal(isKnownDashboardModuleKey("not-a-module"), false);
});
