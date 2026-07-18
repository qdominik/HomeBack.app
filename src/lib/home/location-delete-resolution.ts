import {
  isUuid,
  type LocationDependencySummary,
} from "./location-dependency-summary";

export const locationDeleteResolutionRpcName =
  "delete_storage_location_l3_with_resolution" as const;

export const locationDeleteResolutions = ["delete", "detach", "move"] as const;

export type LocationDeleteResolution =
  (typeof locationDeleteResolutions)[number];

export type LocationDeleteResolutionInput = {
  positionId: string;
  resolution: LocationDeleteResolution;
  targetPositionId: string | null;
  expectedDistinctItemCount: number;
  expectedLocationLinkCount: number;
};

export type LocationDeleteResolutionSummary =
  LocationDeleteResolutionInput & {
    status: "success";
    deletedPositionId: string;
    affectedItemCount: number;
    activeItemCount: number;
    archivedItemCount: number;
    movedItemCount: number;
    detachedLinkCount: number;
    reusedTargetLinkCount: number;
    createdTargetLinkCount: number;
  };

export type LocationDeleteResolutionErrorCode =
  | "invalid_delete_resolution"
  | "auth_required"
  | "active_profile_required"
  | "admin_required"
  | "location_not_available"
  | "target_required"
  | "target_not_available"
  | "target_inside_source"
  | "dependencies_changed"
  | "delete_failed"
  | "delete_unavailable";

export type LocationDeleteResolutionResult =
  | { ok: true; summary: LocationDeleteResolutionSummary }
  | { ok: false; code: LocationDeleteResolutionErrorCode };

export type LocationDeleteResolutionRpcRow = {
  status: string;
  resolution: string;
  deleted_storage_location_l3_id: string;
  affected_item_count: number | string;
  active_item_count: number | string;
  archived_item_count: number | string;
  moved_item_count: number | string;
  detached_link_count: number | string;
  reused_target_link_count: number | string;
  created_target_link_count: number | string;
};

export type LocationDeleteTargetRoomRow = { id: string; nazwa: string };
export type LocationDeleteTargetStorageRow = {
  id: string;
  nazwa: string;
  room_id: string;
};
export type LocationDeleteTargetPositionRow = {
  id: string;
  nazwa: string;
  storage_location_l2_id: string;
};
export type LocationDeleteTargetOption = { id: string; label: string };

export type LocationDeleteContext = {
  summary: LocationDependencySummary;
  targets: LocationDeleteTargetOption[];
};

export type LocationDeleteContextResult =
  | { ok: true; context: LocationDeleteContext }
  | {
      ok: false;
      code:
        | "invalid_delete_resolution"
        | "auth_required"
        | "active_profile_required"
        | "admin_required"
        | "location_not_available"
        | "context_unavailable";

    };
function isResolution(value: unknown): value is LocationDeleteResolution {
  return locationDeleteResolutions.includes(value as LocationDeleteResolution);
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

export function parseLocationDeleteResolutionInput(
  value: unknown,
):
  | { ok: true; input: LocationDeleteResolutionInput }
  | { ok: false; code: "invalid_delete_resolution" } {
  if (!value || typeof value !== "object") {
    return { ok: false, code: "invalid_delete_resolution" };
  }

  const candidate = value as Record<string, unknown>;
  const targetPositionId =
    typeof candidate.targetPositionId === "string"
      ? candidate.targetPositionId
      : null;

  if (
    !isUuid(candidate.positionId) ||
    !isResolution(candidate.resolution) ||
    !isCount(candidate.expectedDistinctItemCount) ||
    !isCount(candidate.expectedLocationLinkCount)
  ) {
    return { ok: false, code: "invalid_delete_resolution" };
  }

  if (
    (candidate.resolution === "move" && !isUuid(targetPositionId)) ||
    (candidate.resolution !== "move" && targetPositionId !== null) ||
    (candidate.resolution === "move" &&
      candidate.positionId.toLowerCase() === targetPositionId?.toLowerCase())
  ) {
    return { ok: false, code: "invalid_delete_resolution" };
  }

  return {
    ok: true,
    input: {
      positionId: candidate.positionId.toLowerCase(),
      resolution: candidate.resolution,
      targetPositionId: targetPositionId?.toLowerCase() ?? null,
      expectedDistinctItemCount: candidate.expectedDistinctItemCount,
      expectedLocationLinkCount: candidate.expectedLocationLinkCount,
    },
  };
}

function count(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("Invalid location delete count");
  }

  return parsed;
}

export function mapLocationDeleteResolutionRow(
  input: LocationDeleteResolutionInput,
  row: LocationDeleteResolutionRpcRow,
): LocationDeleteResolutionSummary {
  if (
    row.status !== "success" ||
    row.resolution !== input.resolution ||
    !isUuid(row.deleted_storage_location_l3_id) ||
    row.deleted_storage_location_l3_id.toLowerCase() !== input.positionId
  ) {
    throw new Error("Invalid location delete result");
  }

  const summary: LocationDeleteResolutionSummary = {
    ...input,
    status: "success",
    deletedPositionId: row.deleted_storage_location_l3_id.toLowerCase(),
    affectedItemCount: count(row.affected_item_count),
    activeItemCount: count(row.active_item_count),
    archivedItemCount: count(row.archived_item_count),
    movedItemCount: count(row.moved_item_count),
    detachedLinkCount: count(row.detached_link_count),
    reusedTargetLinkCount: count(row.reused_target_link_count),
    createdTargetLinkCount: count(row.created_target_link_count),
  };

  if (
    summary.activeItemCount + summary.archivedItemCount !==
    summary.affectedItemCount
  ) {
    throw new Error("Invalid location delete invariant");
  }

  if (summary.resolution === "delete") {
    if (
      summary.affectedItemCount !== 0 ||
      summary.movedItemCount !== 0 ||
      summary.detachedLinkCount !== 0 ||
      summary.reusedTargetLinkCount !== 0 ||
      summary.createdTargetLinkCount !== 0
    ) {
      throw new Error("Invalid location delete invariant");
    }
  } else if (summary.resolution === "detach") {
    if (
      summary.movedItemCount !== 0 ||
      summary.reusedTargetLinkCount !== 0 ||
      summary.createdTargetLinkCount !== 0 ||
      summary.detachedLinkCount !== input.expectedLocationLinkCount
    ) {
      throw new Error("Invalid location delete invariant");
    }
  } else if (
    summary.reusedTargetLinkCount + summary.createdTargetLinkCount !==
      summary.movedItemCount ||
    summary.movedItemCount + summary.detachedLinkCount !==
      input.expectedLocationLinkCount
  ) {
    throw new Error("Invalid location delete invariant");
  }

  return summary;
}

export function mapLocationDeleteResolutionError(error: {
  message?: string | null;
}): Extract<LocationDeleteResolutionResult, { ok: false }> {
  const message = error.message ?? "";
  const mappings = [
    ["AUTH_REQUIRED", "auth_required"],
    ["ACTIVE_PROFILE_REQUIRED", "active_profile_required"],
    ["ADMIN_REQUIRED", "admin_required"],
    ["INVALID_RESOLUTION", "invalid_delete_resolution"],
    ["LOCATION_NOT_AVAILABLE", "location_not_available"],
    ["TARGET_REQUIRED", "target_required"],
    ["TARGET_NOT_AVAILABLE", "target_not_available"],
    ["TARGET_INSIDE_SOURCE", "target_inside_source"],
    ["DEPENDENCIES_CHANGED", "dependencies_changed"],
    ["DELETE_FAILED", "delete_failed"],
  ] as const;

  for (const [databaseCode, code] of mappings) {
    if (message.includes(databaseCode)) {
      return { ok: false, code };
    }
  }

  return { ok: false, code: "delete_unavailable" };
}

export function buildLocationDeleteTargetOptions(
  rooms: LocationDeleteTargetRoomRow[],
  storageLocations: LocationDeleteTargetStorageRow[],
  positions: LocationDeleteTargetPositionRow[],
  sourcePositionId: string,
): LocationDeleteTargetOption[] {
  const roomNames = new Map(rooms.map((room) => [room.id, room.nazwa]));
  const storageById = new Map(
    storageLocations.map((storage) => [storage.id, storage]),
  );

  return positions
    .filter((position) => position.id !== sourcePositionId)
    .flatMap((position) => {
      const storage = storageById.get(position.storage_location_l2_id);
      const roomName = storage ? roomNames.get(storage.room_id) : null;

      return storage && roomName
        ? [{ id: position.id, label: `${roomName} -> ${storage.nazwa} -> ${position.nazwa}` }]
        : [];
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function canSubmitLocationDelete(
  resolution: LocationDeleteResolution | null,
  targetPositionId: string | null,
) {
  return resolution !== null &&
    (resolution !== "move" || isUuid(targetPositionId));
}
