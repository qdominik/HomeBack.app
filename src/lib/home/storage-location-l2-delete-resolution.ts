import {
  isUuid,
  type LocationDependencySummary,
} from "./location-dependency-summary";

export const storageLocationL2DeleteResolutionRpcName =
  "delete_storage_location_l2_with_resolution" as const;

export const storageLocationL2MoveSourceType = "storage" as const;

export const storageLocationL2DeleteResolutions = [
  "delete",
  "detach",
  "move",
] as const;

export type StorageLocationL2DeleteResolution =
  (typeof storageLocationL2DeleteResolutions)[number];

export type StorageLocationL2DeleteResolutionInput = {
  storageLocationL2Id: string;
  resolution: StorageLocationL2DeleteResolution;
  targetPositionId: string | null;
  expectedStorageLocationL3Count: number;
  expectedDistinctItemCount: number;
  expectedLocationLinkCount: number;
};

export type StorageLocationL2DeleteResolutionSummary =
  StorageLocationL2DeleteResolutionInput & {
    status: "success";
    deletedStorageLocationL2Id: string;
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

export type StorageLocationL2DeleteErrorCode =
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

export type StorageLocationL2DeleteResolutionResult =
  | { ok: true; summary: StorageLocationL2DeleteResolutionSummary }
  | { ok: false; code: StorageLocationL2DeleteErrorCode };

export type StorageLocationL2DeleteResolutionRpcRow = {
  status: string;
  resolution: string;
  deleted_storage_location_l2_id: string;
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

export type StorageLocationL2DeleteTargetRoomRow = {
  id: string;
  nazwa: string;
};

export type StorageLocationL2DeleteTargetStorageRow = {
  id: string;
  nazwa: string;
  room_id: string;
};

export type StorageLocationL2DeleteTargetPositionRow = {
  id: string;
  nazwa: string;
  storage_location_l2_id: string;
};

export type StorageLocationL2DeleteTargetOption = {
  id: string;
  label: string;
};

export type StorageLocationL2DeleteContext = {
  summary: LocationDependencySummary;
  sourcePath: string;
  targets: StorageLocationL2DeleteTargetOption[];
};

export type StorageLocationL2DeleteContextResult =
  | { ok: true; context: StorageLocationL2DeleteContext }
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

function isResolution(
  value: unknown,
): value is StorageLocationL2DeleteResolution {
  return storageLocationL2DeleteResolutions.includes(
    value as StorageLocationL2DeleteResolution,
  );
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

export function parseStorageLocationL2DeleteResolutionInput(
  value: unknown,
):
  | { ok: true; input: StorageLocationL2DeleteResolutionInput }
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
    !isUuid(candidate.storageLocationL2Id) ||
    !isResolution(candidate.resolution) ||
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
      storageLocationL2Id: candidate.storageLocationL2Id.toLowerCase(),
      resolution: candidate.resolution,
      targetPositionId: targetPositionId?.toLowerCase() ?? null,
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
    throw new Error("Invalid furniture delete count");
  }

  return parsed;
}

export function mapStorageLocationL2DeleteResolutionRow(
  input: StorageLocationL2DeleteResolutionInput,
  row: StorageLocationL2DeleteResolutionRpcRow,
): StorageLocationL2DeleteResolutionSummary {
  if (
    row.status !== "success" ||
    row.resolution !== input.resolution ||
    !isUuid(row.deleted_storage_location_l2_id) ||
    row.deleted_storage_location_l2_id.toLowerCase() !==
      input.storageLocationL2Id
  ) {
    throw new Error("Invalid furniture delete result");
  }

  const summary: StorageLocationL2DeleteResolutionSummary = {
    ...input,
    status: "success",
    deletedStorageLocationL2Id:
      row.deleted_storage_location_l2_id.toLowerCase(),
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
    summary.deletedStorageLocationL3Count !==
      input.expectedStorageLocationL3Count ||
    summary.activeItemCount + summary.archivedItemCount !==
      summary.affectedItemCount
  ) {
    throw new Error("Invalid furniture delete invariant");
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
      throw new Error("Invalid furniture delete invariant");
    }
  } else if (summary.resolution === "detach") {
    if (
      summary.movedItemCount !== 0 ||
      summary.reusedTargetLinkCount !== 0 ||
      summary.createdTargetLinkCount !== 0 ||
      summary.removedSourceLinkCount !== 0 ||
      summary.detachedLinkCount !== input.expectedLocationLinkCount
    ) {
      throw new Error("Invalid furniture delete invariant");
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
    throw new Error("Invalid furniture delete invariant");
  }

  return summary;
}

export function mapStorageLocationL2DeleteResolutionError(error: {
  message?: string | null;
}): Extract<StorageLocationL2DeleteResolutionResult, { ok: false }> {
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

export function buildStorageLocationL2DeleteTargetOptions(
  rooms: StorageLocationL2DeleteTargetRoomRow[],
  storageLocations: StorageLocationL2DeleteTargetStorageRow[],
  positions: StorageLocationL2DeleteTargetPositionRow[],
  sourceStorageLocationL2Id: string,
): StorageLocationL2DeleteTargetOption[] {
  const roomNames = new Map(rooms.map((room) => [room.id, room.nazwa]));
  const storageById = new Map(
    storageLocations.map((storage) => [storage.id, storage]),
  );

  return positions
    .filter(
      (position) =>
        position.storage_location_l2_id !== sourceStorageLocationL2Id,
    )
    .flatMap((position) => {
      const storage = storageById.get(position.storage_location_l2_id);
      const roomName = storage ? roomNames.get(storage.room_id) : null;

      return storage && roomName
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

export function canSubmitStorageLocationL2Delete(
  resolution: StorageLocationL2DeleteResolution | null,
  targetPositionId: string | null,
) {
  return (
    resolution !== null &&
    (resolution !== "move" || isUuid(targetPositionId))
  );
}
