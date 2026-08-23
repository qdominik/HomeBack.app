import { dashboardModuleDefinitions } from "./module-registry";
import type { DashboardModuleDefinition } from "./module-registry";

export type DashboardModuleKeysInput =
  | { ok: true; moduleKeys: string[] }
  | { ok: false };

const knownModuleKeys = new Set<string>(
  dashboardModuleDefinitions.map((module) => module.key),
);

export function isKnownDashboardModuleKey(moduleKey: string): boolean {
  return knownModuleKeys.has(moduleKey);
}

/**
 * Validates a raw list of module keys coming from an untrusted client.
 * Non-array payloads and non-string entries are rejected outright.
 * Unknown module ids and duplicates are dropped instead of being saved.
 */
export function parseDashboardModuleKeysInput(
  value: unknown,
): DashboardModuleKeysInput {
  if (!Array.isArray(value)) {
    return { ok: false };
  }

  const uniqueKnownKeys = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string") {
      return { ok: false };
    }
    if (isKnownDashboardModuleKey(entry)) {
      uniqueKnownKeys.add(entry);
    }
  }

  return { ok: true, moduleKeys: [...uniqueKnownKeys] };
}

export function filterKnownDashboardModuleKeys(value: unknown[]): string[] {
  const uniqueKnownKeys = new Set<string>();

  for (const entry of value) {
    if (typeof entry === "string" && isKnownDashboardModuleKey(entry)) {
      uniqueKnownKeys.add(entry);
    }
  }

  return [...uniqueKnownKeys];
}

/**
 * Single source of truth for which Dashboard modules are rendered.
 * Without stored preferences the registry defaultVisible wins.
 * Stored preferences take over control: only selected, still-known
 * modules are shown; removed module ids are ignored without errors.
 */
export function resolveVisibleDashboardModules(
  storedVisibleModules: string[] | null | undefined,
): DashboardModuleDefinition[] {
  if (!storedVisibleModules) {
    return dashboardModuleDefinitions.filter(
      (module) => module.defaultVisible,
    );
  }

  const allowedKeys = new Set(
    filterKnownDashboardModuleKeys(storedVisibleModules),
  );

  return dashboardModuleDefinitions.filter((module) =>
    allowedKeys.has(module.key),
  );
}
