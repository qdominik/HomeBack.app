import { getCategoryIconKey } from "./category-icon-map";
import { isEntityIconKey } from "./entity-icon-validation";
import type { EntityIconKey } from "./entity-icon-definitions";

export function resolveItemIconKey({
  categoryKey,
  itemIconKey,
}: {
  categoryKey?: string | null;
  itemIconKey?: string | null;
}): EntityIconKey {
  if (isEntityIconKey(itemIconKey)) {
    return itemIconKey;
  }

  return getCategoryIconKey(categoryKey);
}