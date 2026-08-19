import type { EntityIconKey } from "./entity-icon-definitions";
import { isEntityIconKey } from "./entity-icon-validation";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function resolveStorageLocationIconKey(
  storageKind: string | null | undefined,
  savedIconKey?: string | null,
): EntityIconKey {
  if (isEntityIconKey(savedIconKey)) {
    return savedIconKey;
  }

  const normalizedKind = normalize(storageKind ?? "");

  if (normalizedKind.includes("szafa") || normalizedKind.includes("wardrobe")) {
    return "wardrobe";
  }

  if (normalizedKind.includes("komoda") || normalizedKind.includes("dresser")) {
    return "dresser";
  }

  if (
    normalizedKind.includes("regal") ||
    normalizedKind.includes("polka") ||
    normalizedKind.includes("shelf")
  ) {
    return "shelf";
  }

  if (normalizedKind.includes("szuflada") || normalizedKind.includes("drawer")) {
    return "drawer";
  }

  if (
    normalizedKind.includes("pudelko") ||
    normalizedKind.includes("pojemnik") ||
    normalizedKind.includes("box")
  ) {
    return "box";
  }

  return "storage";
}

export function resolvePositionIconKey(
  savedIconKey?: string | null,
): EntityIconKey {
  if (isEntityIconKey(savedIconKey)) {
    return savedIconKey;
  }

  return "position";
}
