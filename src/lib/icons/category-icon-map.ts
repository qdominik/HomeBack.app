import type { EntityIconKey } from "./entity-icon-definitions";

const SYSTEM_CATEGORY_ICON_KEYS: Record<string, EntityIconKey> = {
  books: "books",
  documents: "documents",
  electronics: "electronics",
  food: "food",
  medicines: "medicine",
  other: "other",
  spare_parts: "spare-parts",
  tools: "tools",
  winter_clothes: "clothing",
};

export function getCategoryIconKey(
  categoryKey: string | null | undefined,
): EntityIconKey {
  if (!categoryKey) {
    return "other";
  }

  return SYSTEM_CATEGORY_ICON_KEYS[categoryKey] ?? "other";
}
