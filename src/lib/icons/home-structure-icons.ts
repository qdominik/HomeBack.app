import { normalizeEntityIconValue } from "./entity-icon-validation";

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
): string {
  const normalizedSaved = normalizeEntityIconValue(savedIconKey, "storage");
  if (normalizedSaved !== "storage") {
    return normalizedSaved;
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
): string {
  const normalizedSaved = normalizeEntityIconValue(savedIconKey, "position");
  if (normalizedSaved !== "position") {
    return normalizedSaved;
  }

  return "position";
}
