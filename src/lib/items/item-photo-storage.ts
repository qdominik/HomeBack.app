export const ITEM_PHOTO_BUCKET = "item-photos";
export const ITEM_PHOTO_MAX_SIZE_BYTES = 2 * 1024 * 1024;
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

export type ItemPhotoDraftPathInput = {
  draftId?: string;
  filename: string;
  householdId: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ITEM_PHOTO_DRAFT_SEGMENT = "item-photo-drafts";

function isAllowedMimeType(value: string): value is ItemPhotoAllowedMimeType {
  return ITEM_PHOTO_ALLOWED_MIME_TYPES.includes(
    value as ItemPhotoAllowedMimeType,
  );
}

export function validateItemPhotoFile(value: unknown): ItemPhotoValidationResult {
  if (!(value instanceof File)) {
    return { ok: false, code: "missing_file" };
  }

  if (!isAllowedMimeType(value.type)) {
    return { ok: false, code: "unsupported_file_type" };
  }

  if (value.size > ITEM_PHOTO_MAX_SIZE_BYTES) {
    return { ok: false, code: "file_too_large" };
  }

  return {
    ok: true,
    file: value,
    mimeType: value.type,
    sizeBytes: value.size,
  };
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
