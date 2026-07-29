export type CopyEntityKind = "room" | "furniture" | "storage" | "item";

export type CopyActionCode =
  | "active_profile_required"
  | "admin_required"
  | "auth_required"
  | "copy_not_allowed"
  | "copy_unavailable"
  | "invalid_copy_input"
  | "source_not_available"
  | "target_not_available";

export type CopyActionResult =
  | { ok: true; id: string }
  | { ok: false; code: CopyActionCode };

export type CopyDialogOutcome = {
  closeDialog: boolean;
  clearError: boolean;
  errorMessage: string | null;
  refresh: boolean;
  resetForm: boolean;
};

export type CopyRoomInput = {
  copyStructure: boolean;
  name: string;
  roomId: string;
};

export type CopyFurnitureInput = {
  copyStorage: boolean;
  furnitureId: string;
  name: string;
  targetRoomId: string;
};

export type CopyStorageInput = {
  name: string;
  storageId: string;
  targetFurnitureId: string;
};

export type CopyItemInput = {
  itemId: string;
  name: string;
  targetStorageId: string | null;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function name(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function uuid(value: unknown) {
  return typeof value === "string" && uuidPattern.test(value) ? value : null;
}

function parsed<T>(value: T | null): { ok: true; input: T } | { ok: false } {
  return value ? { ok: true, input: value } : { ok: false };
}

export function isCopyUuid(value: unknown) {
  return uuid(value) !== null;
}

export function defaultCopyName(sourceName: string) {
  return `${sourceName.trim()} — kopia`;
}

export function canCopyEntity(kind: CopyEntityKind, role: string | null | undefined) {
  if (kind === "item") {
    return role === "admin" || role === "domownik";
  }

  return role === "admin";
}

export function parseCopyRoomInput(value: unknown) {
  const input = record(value);
  const roomId = uuid(input?.roomId);
  const copyStructure = input?.copyStructure;
  const copyName = name(input?.name);

  return parsed(
    roomId && copyName && typeof copyStructure === "boolean"
      ? { roomId, name: copyName, copyStructure }
      : null,
  );
}

export function parseCopyFurnitureInput(value: unknown) {
  const input = record(value);
  const furnitureId = uuid(input?.furnitureId);
  const targetRoomId = uuid(input?.targetRoomId);
  const copyStorage = input?.copyStorage;
  const copyName = name(input?.name);

  return parsed(
    furnitureId && targetRoomId && copyName && typeof copyStorage === "boolean"
      ? { furnitureId, targetRoomId, name: copyName, copyStorage }
      : null,
  );
}

export function parseCopyStorageInput(value: unknown) {
  const input = record(value);
  const storageId = uuid(input?.storageId);
  const targetFurnitureId = uuid(input?.targetFurnitureId);
  const copyName = name(input?.name);

  return parsed(
    storageId && targetFurnitureId && copyName
      ? { storageId, targetFurnitureId, name: copyName }
      : null,
  );
}

export function parseCopyItemInput(value: unknown) {
  const input = record(value);
  const itemId = uuid(input?.itemId);
  const targetStorageId = input?.targetStorageId;
  const copyName = name(input?.name);
  const validTarget = targetStorageId === null ? null : uuid(targetStorageId);

  return parsed(
    itemId && copyName && (targetStorageId === null || validTarget !== null)
      ? {
          itemId,
          targetStorageId: targetStorageId === null ? null : validTarget,
          name: copyName,
        }
      : null,
  );
}

export function mapCopyRpcError(message: string | null | undefined): CopyActionCode {
  switch (message?.trim().toUpperCase()) {
    case "AUTH_REQUIRED":
      return "auth_required";
    case "ACTIVE_PROFILE_REQUIRED":
      return "active_profile_required";
    case "ADMIN_REQUIRED":
      return "admin_required";
    case "COPY_NOT_ALLOWED":
      return "copy_not_allowed";
    case "SOURCE_NOT_AVAILABLE":
      return "source_not_available";
    case "TARGET_NOT_AVAILABLE":
      return "target_not_available";
    case "INVALID_NAME":
      return "invalid_copy_input";
    default:
      return "copy_unavailable";
  }
}

export function resolveCopyDialogOutcome(
  result: CopyActionResult,
  fallbackError: string,
): CopyDialogOutcome {
  if (result.ok) {
    return {
      closeDialog: true,
      clearError: true,
      errorMessage: null,
      refresh: true,
      resetForm: true,
    };
  }

  return {
    closeDialog: false,
    clearError: false,
    errorMessage: fallbackError,
    refresh: false,
    resetForm: false,
  };
}
