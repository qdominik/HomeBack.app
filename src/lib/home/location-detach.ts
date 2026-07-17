import {
  isLocationDependencyEntityType,
  isUuid,
  type LocationDependencyEntityType,
} from "./location-dependency-summary";

export type LocationDetachInput = {
  entityType: LocationDependencyEntityType;
  entityId: string;
};

export type LocationDetachSummary = LocationDetachInput & {
  status: "success";
  detachedItemCount: number;
  detachedLinkCount: number;
  activeItemCount: number;
  archivedItemCount: number;
};

export type LocationDetachErrorCode =
  | "invalid_location_id"
  | "auth_required"
  | "active_profile_required"
  | "admin_required"
  | "location_not_available"
  | "detach_failed"
  | "detach_unavailable";

export type LocationDetachErrorResult = {
  ok: false;
  code: LocationDetachErrorCode;
};

export type LocationDetachResult =
  | { ok: true; summary: LocationDetachSummary }
  | LocationDetachErrorResult;

export type LocationDetachRpcRow = {
  status: string;
  detached_item_count: number | string;
  detached_link_count: number | string;
  active_item_count: number | string;
  archived_item_count: number | string;
};

export function parseLocationDetachInput(
  value: unknown,
):
  | { ok: true; input: LocationDetachInput }
  | { ok: false; code: "invalid_location_id" } {
  if (!value || typeof value !== "object") {
    return { ok: false, code: "invalid_location_id" };
  }

  const input = value as Record<string, unknown>;

  if (
    !isLocationDependencyEntityType(input.entityType) ||
    !isUuid(input.entityId)
  ) {
    return { ok: false, code: "invalid_location_id" };
  }

  return {
    ok: true,
    input: {
      entityType: input.entityType,
      entityId: input.entityId.toLowerCase(),
    },
  };
}

export function getLocationDetachRpcName(
  entityType: LocationDependencyEntityType,
) {
  switch (entityType) {
    case "room":
      return "detach_items_from_room_location" as const;
    case "storage":
      return "detach_items_from_storage_location_l2" as const;
    case "position":
      return "detach_items_from_storage_location_l3" as const;
  }
}

function count(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("Invalid location detach count");
  }

  return parsed;
}

export function mapLocationDetachRow(
  input: LocationDetachInput,
  row: LocationDetachRpcRow,
): LocationDetachSummary {
  if (row.status !== "success") {
    throw new Error("Invalid location detach status");
  }

  const summary: LocationDetachSummary = {
    ...input,
    status: "success",
    detachedItemCount: count(row.detached_item_count),
    detachedLinkCount: count(row.detached_link_count),
    activeItemCount: count(row.active_item_count),
    archivedItemCount: count(row.archived_item_count),
  };

  if (
    summary.activeItemCount + summary.archivedItemCount !==
      summary.detachedItemCount ||
    summary.detachedItemCount > summary.detachedLinkCount
  ) {
    throw new Error("Invalid location detach invariant");
  }

  return summary;
}

export function mapLocationDetachError(error: {
  message?: string | null;
}): LocationDetachErrorResult {
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

  if (message.includes("LOCATION_NOT_AVAILABLE")) {
    return { ok: false, code: "location_not_available" };
  }

  if (message.includes("DETACH_FAILED")) {
    return { ok: false, code: "detach_failed" };
  }

  return { ok: false, code: "detach_unavailable" };
}
