import {
  isLocationDependencyEntityType,
  isUuid,
  type LocationDependencyEntityType,
} from "./location-dependency-summary";

export const locationMoveRpcName =
  "move_primary_items_from_location" as const;

export type LocationMoveInput = {
  sourceType: LocationDependencyEntityType;
  sourceId: string;
  targetPositionId: string;
};

export type LocationMoveSummary = LocationMoveInput & {
  status: "success";
  movedItemCount: number;
  activeItemCount: number;
  archivedItemCount: number;
  reusedTargetLinkCount: number;
  createdTargetLinkCount: number;
  removedSourceLinkCount: number;
};

export type LocationMoveErrorCode =
  | "invalid_location_move"
  | "auth_required"
  | "active_profile_required"
  | "admin_required"
  | "invalid_source_type"
  | "source_not_available"
  | "target_not_available"
  | "target_inside_source"
  | "move_failed"
  | "move_unavailable";

export type LocationMoveErrorResult = {
  ok: false;
  code: LocationMoveErrorCode;
};

export type LocationMoveResult =
  | { ok: true; summary: LocationMoveSummary }
  | LocationMoveErrorResult;

export type LocationMoveRpcRow = {
  status: string;
  moved_item_count: number | string;
  active_item_count: number | string;
  archived_item_count: number | string;
  reused_target_link_count: number | string;
  created_target_link_count: number | string;
  removed_source_link_count: number | string;
};

export function parseLocationMoveInput(
  value: unknown,
):
  | { ok: true; input: LocationMoveInput }
  | { ok: false; code: "invalid_location_move" } {
  if (!value || typeof value !== "object") {
    return { ok: false, code: "invalid_location_move" };
  }

  const input = value as Record<string, unknown>;

  if (
    !isLocationDependencyEntityType(input.sourceType) ||
    !isUuid(input.sourceId) ||
    !isUuid(input.targetPositionId)
  ) {
    return { ok: false, code: "invalid_location_move" };
  }

  return {
    ok: true,
    input: {
      sourceType: input.sourceType,
      sourceId: input.sourceId.toLowerCase(),
      targetPositionId: input.targetPositionId.toLowerCase(),
    },
  };
}

function count(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("Invalid location move count");
  }

  return parsed;
}

export function mapLocationMoveRow(
  input: LocationMoveInput,
  row: LocationMoveRpcRow,
): LocationMoveSummary {
  if (row.status !== "success") {
    throw new Error("Invalid location move status");
  }

  const summary: LocationMoveSummary = {
    ...input,
    status: "success",
    movedItemCount: count(row.moved_item_count),
    activeItemCount: count(row.active_item_count),
    archivedItemCount: count(row.archived_item_count),
    reusedTargetLinkCount: count(row.reused_target_link_count),
    createdTargetLinkCount: count(row.created_target_link_count),
    removedSourceLinkCount: count(row.removed_source_link_count),
  };

  if (
    summary.activeItemCount + summary.archivedItemCount !==
      summary.movedItemCount ||
    summary.reusedTargetLinkCount + summary.createdTargetLinkCount !==
      summary.movedItemCount ||
    summary.removedSourceLinkCount !== summary.movedItemCount
  ) {
    throw new Error("Invalid location move invariant");
  }

  return summary;
}

export function mapLocationMoveError(error: {
  message?: string | null;
}): LocationMoveErrorResult {
  const message = error.message ?? "";

  if (message.includes("AUTH_REQUIRED")) {
    return { ok: false, code: "auth_required" };
  }

  if (message.includes("ACTIVE_PROFILE_REQUIRED")) {
    return { ok: false, code: "active_profile_required" };
  }

  if (message.includes("ADMIN_REQUIRED")) {
    return { ok: false, code: "admin_required" };
  }

  if (message.includes("INVALID_SOURCE_TYPE")) {
    return { ok: false, code: "invalid_source_type" };
  }

  if (message.includes("SOURCE_NOT_AVAILABLE")) {
    return { ok: false, code: "source_not_available" };
  }

  if (message.includes("TARGET_NOT_AVAILABLE")) {
    return { ok: false, code: "target_not_available" };
  }

  if (message.includes("TARGET_INSIDE_SOURCE")) {
    return { ok: false, code: "target_inside_source" };
  }

  if (message.includes("MOVE_FAILED")) {
    return { ok: false, code: "move_failed" };
  }

  return { ok: false, code: "move_unavailable" };
}
