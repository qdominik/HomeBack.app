export const restorableItemStatuses = [
  "w domu",
  "pożyczone",
  "zużyte",
] as const;

export type RestorableItemStatus = (typeof restorableItemStatuses)[number];

const restorableItemStatusSet = new Set<string>(restorableItemStatuses);

export const itemArchiveResults = [
  "success",
  "auth_required",
  "active_profile_required",
  "admin_required",
  "item_not_available",
  "item_already_archived",
  "action_failed",
] as const;

export type ItemArchiveResult = (typeof itemArchiveResults)[number];

export const itemRestoreResults = [
  "success",
  "auth_required",
  "active_profile_required",
  "admin_required",
  "item_not_available",
  "item_not_archived",
  "restore_status_required",
  "invalid_restore_status",
  "action_failed",
] as const;

export type ItemRestoreResult = (typeof itemRestoreResults)[number];

const archiveResultSet = new Set<string>(itemArchiveResults);
const restoreResultSet = new Set<string>(itemRestoreResults);

export function parseLegacyRestoreStatus(
  value: string,
): RestorableItemStatus | null {
  return restorableItemStatusSet.has(value)
    ? (value as RestorableItemStatus)
    : null;
}

export function normalizeItemArchiveResult(value: unknown): ItemArchiveResult {
  return typeof value === "string" && archiveResultSet.has(value)
    ? (value as ItemArchiveResult)
    : "action_failed";
}

export function normalizeItemRestoreResult(value: unknown): ItemRestoreResult {
  return typeof value === "string" && restoreResultSet.has(value)
    ? (value as ItemRestoreResult)
    : "action_failed";
}

export function resolveItemArchiveResult(
  data: unknown,
  error: unknown,
): ItemArchiveResult {
  return error ? "action_failed" : normalizeItemArchiveResult(data);
}

export function resolveItemRestoreResult(
  data: unknown,
  error: unknown,
): ItemRestoreResult {
  return error ? "action_failed" : normalizeItemRestoreResult(data);
}

export function getArchivedItemRestoreMode(
  statusBeforeArchive: string | null,
) {
  return parseLegacyRestoreStatus(statusBeforeArchive ?? "")
    ? "stored"
    : "legacy";
}
