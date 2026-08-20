import { ENTITY_ICON_FALLBACKS } from "./entity-icon-definitions";
import { isEntityIconKey, type EntityIconGroup } from "./entity-icon-validation";
import { isPhosphorIconName } from "./phosphor-icon-registry";

export function isAllowedStoredEntityIcon(value: unknown): value is string {
  return isEntityIconKey(value) || isPhosphorIconName(value);
}

export function normalizeStoredEntityIcon(value: unknown, group: EntityIconGroup): string {
  return isAllowedStoredEntityIcon(value) ? value : ENTITY_ICON_FALLBACKS[group];
}
