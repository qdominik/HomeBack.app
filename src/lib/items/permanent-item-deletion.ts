export const permanentItemDeletionResults = [
  "success",
  "invalid_item_id",
  "auth_required",
  "active_profile_required",
  "admin_required",
  "item_not_available",
  "item_has_files",
  "deletion_failed",
] as const;

export type PermanentItemDeletionResult =
  (typeof permanentItemDeletionResults)[number];

export type PermanentItemDeletionActionResult =
  | { ok: true }
  | { ok: false; code: Exclude<PermanentItemDeletionResult, "success"> };

const permanentItemDeletionResultSet = new Set<string>(
  permanentItemDeletionResults,
);

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidItemId(value: string) {
  return uuidPattern.test(value);
}

export function normalizePermanentItemDeletionResult(
  value: unknown,
): PermanentItemDeletionResult {
  return typeof value === "string" && permanentItemDeletionResultSet.has(value)
    ? (value as PermanentItemDeletionResult)
    : "deletion_failed";
}

export function resolvePermanentItemDeletionResult(
  data: unknown,
  error: unknown,
): PermanentItemDeletionResult {
  return error ? "deletion_failed" : normalizePermanentItemDeletionResult(data);
}

export function toPermanentItemDeletionActionResult(
  result: PermanentItemDeletionResult,
): PermanentItemDeletionActionResult {
  return result === "success" ? { ok: true } : { ok: false, code: result };
}
