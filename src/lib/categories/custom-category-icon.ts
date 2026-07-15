import {
  getEntityIconDefinition,
  getEntityIconFallback,
  type EntityIconKey,
} from "../icons/entity-icon-validation";

export function normalizeCustomCategoryIconKey(
  value: unknown,
): EntityIconKey {
  const definition = getEntityIconDefinition(
    typeof value === "string" ? value.trim() : null,
  );

  if (definition?.group === "category" || definition?.group === "generic") {
    return definition.key as EntityIconKey;
  }

  return getEntityIconFallback("category");
}
