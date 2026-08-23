import assert from "node:assert/strict";
import test from "node:test";
import { en } from "../../src/lib/i18n/locales/en";
import { pl } from "../../src/lib/i18n/locales/pl";
import { ENTITY_ICON_DEFINITIONS } from "../../src/lib/icons/entity-icon-definitions";
import {
  DASHBOARD_MODULE_KEYS,
  dashboardModuleDefinitions,
} from "../../src/lib/dashboard/module-registry";
import {
  filterDashboardModulesForRole,
  isDashboardModuleVisibleForRole,
} from "../../src/lib/dashboard/module-access";
import {
  parseDashboardModuleKeysInput,
  resolveVisibleDashboardModules,
} from "../../src/lib/dashboard/dashboard-preferences";

const iconKeys = new Set(ENTITY_ICON_DEFINITIONS.map((entry) => entry.key));

test("runtime registry keys are unique and complete", () => {
  const keys = dashboardModuleDefinitions.map((module) => module.key);

  assert.equal(keys.length, new Set(keys).size);
  assert.deepEqual([...keys].sort(), [...DASHBOARD_MODULE_KEYS].sort());
});

test("every module copy key exists in PL and EN dictionaries", () => {
  for (const definition of dashboardModuleDefinitions) {
    assert.ok(pl.dashboardModules[definition.titleKey], `pl title ${definition.titleKey}`);
    assert.ok(en.dashboardModules[definition.titleKey], `en title ${definition.titleKey}`);
    assert.ok(
      pl.dashboardModules[definition.descriptionKey],
      `pl description ${definition.descriptionKey}`,
    );
    assert.ok(
      en.dashboardModules[definition.descriptionKey],
      `en description ${definition.descriptionKey}`,
    );
    assert.ok(
      pl.dashboardModules[definition.titleKey].title.length > 0,
      `non-empty pl title for ${definition.key}`,
    );
    assert.ok(
      en.dashboardModules[definition.titleKey].title.length > 0,
      `non-empty en title for ${definition.key}`,
    );
  }
});

test("module icons come from the existing entity icon catalog", () => {
  for (const definition of dashboardModuleDefinitions) {
    assert.ok(
      iconKeys.has(definition.icon),
      `unknown icon key ${definition.icon} for ${definition.key}`,
    );
  }
});

test("existing dashboard modules keep their current defaults", () => {
  const byKey = new Map(dashboardModuleDefinitions.map((m) => [m.key, m]));

  for (const key of [
    "recent-items",
    "expiring-items",
    "category-count",
    "activity",
  ] as const) {
    const definition = byKey.get(key);

    assert.ok(definition, `missing module ${key}`);
    assert.equal(definition.status, "soon");
    assert.equal(definition.defaultVisible, true);
  }
});

test("future modules are soon placeholders hidden by default", () => {
  const byKey = new Map(dashboardModuleDefinitions.map((m) => [m.key, m]));

  for (const key of [
    "rooms",
    "documents",
    "school-schedule",
    "shopping-list",
  ] as const) {
    const definition = byKey.get(key);

    assert.ok(definition, `missing module ${key}`);
    assert.equal(definition.status, "soon");
    assert.equal(definition.defaultVisible, false);
  }
});

test("preferences pipeline accepts every registry key and keeps registry order", () => {
  const parsed = parseDashboardModuleKeysInput([...DASHBOARD_MODULE_KEYS]);

  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.ok ? parsed.moduleKeys : [], [
    ...DASHBOARD_MODULE_KEYS,
  ]);

  const visible = resolveVisibleDashboardModules([...DASHBOARD_MODULE_KEYS]);

  assert.deepEqual(
    visible.map((module) => module.key),
    [...DASHBOARD_MODULE_KEYS],
  );
});

test("modules without requiredRoles are visible to every role", () => {
  const openModule = { key: "recent-items" };

  assert.equal(isDashboardModuleVisibleForRole(openModule, "admin"), true);
  assert.equal(isDashboardModuleVisibleForRole(openModule, "domownik"), true);
  assert.equal(isDashboardModuleVisibleForRole(openModule, "dziecko"), true);
  assert.equal(isDashboardModuleVisibleForRole(openModule, null), true);
  assert.equal(isDashboardModuleVisibleForRole(openModule, undefined), true);
});

test("role-restricted modules are hidden without an allowed role", () => {
  const adminOnly = { key: "secret", requiredRoles: ["admin" as const] };

  assert.equal(isDashboardModuleVisibleForRole(adminOnly, "admin"), true);
  assert.equal(isDashboardModuleVisibleForRole(adminOnly, "domownik"), false);
  assert.equal(isDashboardModuleVisibleForRole(adminOnly, null), false);

  const multiRole = {
    key: "shared",
    requiredRoles: ["admin" as const, "domownik" as const],
  };

  assert.equal(isDashboardModuleVisibleForRole(multiRole, "dziecko"), false);
  assert.equal(isDashboardModuleVisibleForRole(multiRole, "domownik"), true);
});

test("role filter keeps registry order and drops restricted modules", () => {
  const modules = [
    { key: "a" },
    { key: "b", requiredRoles: ["admin" as const] },
    { key: "c" },
    { key: "d", requiredRoles: ["dziecko" as const] },
  ];

  assert.deepEqual(
    filterDashboardModulesForRole(modules, "admin").map((m) => m.key),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    filterDashboardModulesForRole(modules, null).map((m) => m.key),
    ["a", "c"],
  );
});
