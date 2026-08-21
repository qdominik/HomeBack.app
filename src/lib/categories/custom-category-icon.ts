import {
  getEntityIconDefinition,
  getEntityIconFallback,
  isPhosphorIconNameCandidate,
  type EntityIconKey,
} from "../icons/entity-icon-validation";

export function normalizeCustomCategoryIconKey(
  value: unknown,
): EntityIconKey | string {
  const trimmed = typeof value === "string" ? value.trim() : null;
  if (isPhosphorIconNameCandidate(trimmed)) return trimmed;
  const definition = getEntityIconDefinition(
    trimmed,
  );

  if (definition?.group === "category" || definition?.group === "generic") {
    return definition.key as EntityIconKey;
  }

  return getEntityIconFallback("category");
}
