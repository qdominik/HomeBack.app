export const ITEM_PHOTO_BUCKET = "item-photos";
export const ITEM_PHOTO_MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const ITEM_PHOTO_SIGNED_URL_TTL_SECONDS = 60;
export const ITEM_PHOTO_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/webp",
] as const;

export type ItemPhotoAllowedMimeType =
  (typeof ITEM_PHOTO_ALLOWED_MIME_TYPES)[number];

export type ItemPhotoValidationError =
  | "missing_file"
  | "unsupported_file_type"
  | "file_too_large";

export type ItemPhotoValidationResult =
  | {
      ok: true;
      file: File;
      mimeType: ItemPhotoAllowedMimeType;
      sizeBytes: number;
    }
  | { ok: false; code: ItemPhotoValidationError };

export type ItemPhotoMetadata = {
  mimeType: ItemPhotoAllowedMimeType;
  sizeBytes: number;
};

export type ItemPhotoDraftPathInput = {
  draftId?: string;
  filename: string;
  householdId: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ITEM_PHOTO_DRAFT_SEGMENT = "item-photo-drafts";
const ITEM_PHOTO_FINAL_SEGMENT = "items";

function isAllowedMimeType(value: string): value is ItemPhotoAllowedMimeType {
  return ITEM_PHOTO_ALLOWED_MIME_TYPES.includes(
    value as ItemPhotoAllowedMimeType,
  );
}

export function validateItemPhotoFile(value: unknown): ItemPhotoValidationResult {
  if (!(value instanceof File)) {
    return { ok: false, code: "missing_file" };
  }

  const metadata = validateItemPhotoMetadata(value.type, value.size);

  if (!metadata.ok) return metadata;

  return {
    file: value,
    ...metadata,
  };
}

export function validateItemPhotoMetadata(
  mimeType: string,
  sizeBytes: number,
):
  | ({ ok: true } & ItemPhotoMetadata)
  | { ok: false; code: ItemPhotoValidationError } {
  if (!isAllowedMimeType(mimeType)) {
    return { ok: false, code: "unsupported_file_type" };
  }

  if (
    !Number.isInteger(sizeBytes) ||
    sizeBytes < 0 ||
    sizeBytes > ITEM_PHOTO_MAX_SIZE_BYTES
  ) {
    return { ok: false, code: "file_too_large" };
  }

  return { ok: true, mimeType, sizeBytes };
}

export function createItemPhotoDraftId() {
  return crypto.randomUUID();
}

export function sanitizeItemPhotoFilename(filename: string) {
  const fallback = "item-photo";
  const normalized = filename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120);

  return normalized || fallback;
}

export function buildItemPhotoDraftPath({
  draftId = createItemPhotoDraftId(),
  filename,
  householdId,
}: ItemPhotoDraftPathInput) {
  if (!UUID_PATTERN.test(householdId)) {
    throw new Error("Invalid household id");
  }

  if (!UUID_PATTERN.test(draftId)) {
    throw new Error("Invalid draft id");
  }

  return {
    draftId,
    path: `households/${householdId}/item-photo-drafts/${draftId}/${sanitizeItemPhotoFilename(
      filename,
    )}`,
  };
}

export function getItemPhotoDraftPrefix(householdId: string) {
  if (!UUID_PATTERN.test(householdId)) {
    throw new Error("Invalid household id");
  }

  return `households/${householdId}/${ITEM_PHOTO_DRAFT_SEGMENT}/`;
}

export function buildItemPhotoFinalPath({
  householdId,
  itemId,
  mimeType,
}: {
  householdId: string;
  itemId: string;
  mimeType: ItemPhotoAllowedMimeType;
}) {
  if (!UUID_PATTERN.test(householdId) || !UUID_PATTERN.test(itemId)) {
    throw new Error("Invalid item photo path identifiers");
  }

  const extension = mimeType === "image/jpeg" ? "jpg" : "webp";

  return `households/${householdId}/${ITEM_PHOTO_FINAL_SEGMENT}/${itemId}/photo.${extension}`;
}

export function isItemPhotoDraftPathForHousehold(
  storagePath: string,
  householdId: string,
) {
  if (!UUID_PATTERN.test(householdId)) {
    return false;
  }

  const prefix = getItemPhotoDraftPrefix(householdId);
  const rest = storagePath.slice(prefix.length);
  const [draftId, filename, ...extraParts] = rest.split("/");

  return (
    storagePath.startsWith(prefix) &&
    UUID_PATTERN.test(draftId ?? "") &&
    Boolean(filename) &&
    extraParts.length === 0
  );
}

export function isItemPhotoFinalPathForHousehold(
  storagePath: string,
  householdId: string,
) {
  if (!UUID_PATTERN.test(householdId)) {
    return false;
  }

  const prefix = `households/${householdId}/${ITEM_PHOTO_FINAL_SEGMENT}/`;
  const rest = storagePath.slice(prefix.length);
  const [itemId, filename, ...extraParts] = rest.split("/");

  return (
    storagePath.startsWith(prefix) &&
    UUID_PATTERN.test(itemId ?? "") &&
    (filename === "photo.jpg" || filename === "photo.webp") &&
    extraParts.length === 0
  );
}
