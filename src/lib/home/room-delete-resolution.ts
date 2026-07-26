import {
  isUuid,
  type LocationDependencySummary,
} from "./location-dependency-summary";

export const roomDeleteResolutionRpcName =
  "delete_room_with_resolution" as const;

export const roomMoveSourceType = "room" as const;

export const roomDeleteResolutions = ["delete", "detach", "move"] as const;

export type RoomDeleteResolution = (typeof roomDeleteResolutions)[number];

export type RoomDeleteResolutionInput = {
  roomId: string;
  resolution: RoomDeleteResolution;
  targetPositionId: string | null;
  expectedStorageLocationL2Count: number;
  expectedStorageLocationL3Count: number;
  expectedDistinctItemCount: number;
  expectedLocationLinkCount: number;
};

export type RoomDeleteResolutionSummary = RoomDeleteResolutionInput & {
  status: "success";
  deletedRoomId: string;
  deletedStorageLocationL2Count: number;
  deletedStorageLocationL3Count: number;
  affectedItemCount: number;
  activeItemCount: number;
  archivedItemCount: number;
  movedItemCount: number;
  detachedLinkCount: number;
  reusedTargetLinkCount: number;
  createdTargetLinkCount: number;
  removedSourceLinkCount: number;
};

export type RoomDeleteErrorCode =
  | "invalid_delete_resolution"
  | "auth_required"
  | "active_profile_required"
  | "admin_required"
  | "location_not_available"
  | "target_required"
  | "target_not_allowed"
  | "target_not_available"
  | "target_in_source_subtree"
  | "dependencies_changed"
  | "delete_failed"
  | "delete_unavailable";

export type RoomDeleteResolutionResult =
  | { ok: true; summary: RoomDeleteResolutionSummary }
  | { ok: false; code: RoomDeleteErrorCode };

export type RoomDeleteResolutionRpcRow = {
  status: string;
  resolution: string;
  deleted_room_id: string;
  deleted_storage_location_l2_count: number | string;
  deleted_storage_location_l3_count: number | string;
  affected_item_count: number | string;
  active_item_count: number | string;
  archived_item_count: number | string;
  moved_item_count: number | string;
  detached_link_count: number | string;
  reused_target_link_count: number | string;
  created_target_link_count: number | string;
  removed_source_link_count: number | string;
};

export type RoomDeleteTargetRoomRow = {
  id: string;
  nazwa: string;
};

export type RoomDeleteTargetStorageRow = {
  id: string;
  nazwa: string;
  room_id: string;
};

export type RoomDeleteTargetPositionRow = {
  id: string;
  nazwa: string;
  storage_location_l2_id: string;
};

export type RoomDeleteTargetOption = {
  id: string;
  label: string;
};

export type RoomDeleteContext = {
  summary: LocationDependencySummary;
  sourcePath: string;
  targets: RoomDeleteTargetOption[];
};

export type RoomDeleteContextResult =
  | { ok: true; context: RoomDeleteContext }
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

function isResolution(value: unknown): value is RoomDeleteResolution {
  return roomDeleteResolutions.includes(value as RoomDeleteResolution);
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

export function parseRoomDeleteResolutionInput(
  value: unknown,
):
  | { ok: true; input: RoomDeleteResolutionInput }
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
    !isUuid(candidate.roomId) ||
    !isResolution(candidate.resolution) ||
    !isCount(candidate.expectedStorageLocationL2Count) ||
    !isCount(candidate.expectedStorageLocationL3Count) ||
    !isCount(candidate.expectedDistinctItemCount) ||
    !isCount(candidate.expectedLocationLinkCount)
  ) {
    return { ok: false, code: "invalid_delete_resolution" };
  }

  if (
    (candidate.resolution === "move" && !isUuid(targetPositionId)) ||
    (candidate.resolution !== "move" && targetPositionId !== null)
  ) {
    return { ok: false, code: "invalid_delete_resolution" };
  }

  return {
    ok: true,
    input: {
      roomId: candidate.roomId.toLowerCase(),
      resolution: candidate.resolution,
      targetPositionId: targetPositionId?.toLowerCase() ?? null,
      expectedStorageLocationL2Count:
        candidate.expectedStorageLocationL2Count,
      expectedStorageLocationL3Count:
        candidate.expectedStorageLocationL3Count,
      expectedDistinctItemCount: candidate.expectedDistinctItemCount,
      expectedLocationLinkCount: candidate.expectedLocationLinkCount,
    },
  };
}

function count(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("Invalid room delete count");
  }

  return parsed;
}

export function mapRoomDeleteResolutionRow(
  input: RoomDeleteResolutionInput,
  row: RoomDeleteResolutionRpcRow,
): RoomDeleteResolutionSummary {
  if (
    row.status !== "success" ||
    row.resolution !== input.resolution ||
    !isUuid(row.deleted_room_id) ||
    row.deleted_room_id.toLowerCase() !== input.roomId
  ) {
    throw new Error("Invalid room delete result");
  }

  const summary: RoomDeleteResolutionSummary = {
    ...input,
    status: "success",
    deletedRoomId: row.deleted_room_id.toLowerCase(),
    deletedStorageLocationL2Count: count(
      row.deleted_storage_location_l2_count,
    ),
    deletedStorageLocationL3Count: count(
      row.deleted_storage_location_l3_count,
    ),
    affectedItemCount: count(row.affected_item_count),
    activeItemCount: count(row.active_item_count),
    archivedItemCount: count(row.archived_item_count),
    movedItemCount: count(row.moved_item_count),
    detachedLinkCount: count(row.detached_link_count),
    reusedTargetLinkCount: count(row.reused_target_link_count),
    createdTargetLinkCount: count(row.created_target_link_count),
    removedSourceLinkCount: count(row.removed_source_link_count),
  };

  if (
    summary.deletedStorageLocationL2Count !==
      input.expectedStorageLocationL2Count ||
    summary.deletedStorageLocationL3Count !==
      input.expectedStorageLocationL3Count ||
    summary.activeItemCount + summary.archivedItemCount !==
      summary.affectedItemCount
  ) {
    throw new Error("Invalid room delete invariant");
  }

  if (summary.resolution === "delete") {
    if (
      summary.affectedItemCount !== 0 ||
      summary.movedItemCount !== 0 ||
      summary.detachedLinkCount !== 0 ||
      summary.reusedTargetLinkCount !== 0 ||
      summary.createdTargetLinkCount !== 0 ||
      summary.removedSourceLinkCount !== 0
    ) {
      throw new Error("Invalid room delete invariant");
    }
  } else if (summary.resolution === "detach") {
    if (
      summary.movedItemCount !== 0 ||
      summary.reusedTargetLinkCount !== 0 ||
      summary.createdTargetLinkCount !== 0 ||
      summary.removedSourceLinkCount !== 0 ||
      summary.detachedLinkCount !== input.expectedLocationLinkCount
    ) {
      throw new Error("Invalid room delete invariant");
    }
  } else if (
    input.targetPositionId === null ||
    summary.movedItemCount > summary.affectedItemCount ||
    summary.reusedTargetLinkCount + summary.createdTargetLinkCount !==
      summary.movedItemCount ||
    summary.removedSourceLinkCount !== summary.movedItemCount ||
    summary.removedSourceLinkCount + summary.detachedLinkCount !==
      input.expectedLocationLinkCount
  ) {
    throw new Error("Invalid room delete invariant");
  }

  return summary;
}

export function mapRoomDeleteResolutionError(error: {
  message?: string | null;
}): Extract<RoomDeleteResolutionResult, { ok: false }> {
  const message = error.message ?? "";
  const mappings = [
    ["AUTH_REQUIRED", "auth_required"],
    ["ACTIVE_PROFILE_REQUIRED", "active_profile_required"],
    ["ADMIN_REQUIRED", "admin_required"],
    ["INVALID_RESOLUTION", "invalid_delete_resolution"],
    ["INVALID_EXPECTED_COUNTS", "invalid_delete_resolution"],
    ["LOCATION_NOT_AVAILABLE", "location_not_available"],
    ["TARGET_REQUIRED", "target_required"],
    ["TARGET_NOT_ALLOWED", "target_not_allowed"],
    ["TARGET_NOT_AVAILABLE", "target_not_available"],
    ["TARGET_IN_SOURCE_SUBTREE", "target_in_source_subtree"],
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

export function buildRoomDeleteTargetOptions(
  rooms: RoomDeleteTargetRoomRow[],
  storageLocations: RoomDeleteTargetStorageRow[],
  positions: RoomDeleteTargetPositionRow[],
  sourceRoomId: string,
): RoomDeleteTargetOption[] {
  const roomNames = new Map(rooms.map((room) => [room.id, room.nazwa]));
  const storageById = new Map(
    storageLocations.map((storage) => [storage.id, storage]),
  );

  return positions
    .flatMap((position) => {
      const storage = storageById.get(position.storage_location_l2_id);
      const roomName = storage ? roomNames.get(storage.room_id) : null;

      return storage && storage.room_id !== sourceRoomId && roomName
        ? [
            {
              id: position.id,
              label: `${roomName} -> ${storage.nazwa} -> ${position.nazwa}`,
            },
          ]
        : [];
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function canSubmitRoomDelete(
  resolution: RoomDeleteResolution | null,
  targetPositionId: string | null,
) {
  return (
    resolution !== null &&
    (resolution !== "move" || isUuid(targetPositionId))
  );
}
