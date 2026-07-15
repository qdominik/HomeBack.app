export const locationDependencyEntityTypes = [
  "room",
  "storage",
  "position",
] as const;

export type LocationDependencyEntityType =
  (typeof locationDependencyEntityTypes)[number];

export type LocationDependencySummaryInput = {
  entityType: LocationDependencyEntityType;
  entityId: string;
};

export type LocationDependencySummary = {
  entityType: LocationDependencyEntityType;
  entityId: string;
  storageCount: number;
  positionCount: number;
  activeDirectItemsCount: number;
  activeNestedItemsCount: number;
  activeItemsCount: number;
  archivedDirectItemsCount: number;
  archivedNestedItemsCount: number;
  archivedItemsCount: number;
  totalDistinctItemsCount: number;
  primaryLocationLinksCount: number;
  nonPrimaryLocationLinksCount: number;
  totalLocationLinksCount: number;
  requiresItemResolution: boolean;
  requiresSubtreeDeletion: boolean;
  canDeleteImmediately: boolean;
};

export type LocationDependencySummaryErrorCode =
  | "invalid_location_id"
  | "auth_required"
  | "active_profile_required"
  | "admin_required"
  | "location_not_available"
  | "summary_unavailable";

export type LocationDependencySummaryErrorResult = {
  ok: false;
  code: LocationDependencySummaryErrorCode;
};

export type LocationDependencySummaryResult =
  | { ok: true; summary: LocationDependencySummary }
  | LocationDependencySummaryErrorResult;

export type LocationDependencySummaryRpcRow = {
  entity_id: string;
  storage_count: number | string;
  position_count: number | string;
  active_direct_items_count: number | string;
  active_nested_items_count: number | string;
  active_items_count: number | string;
  archived_direct_items_count: number | string;
  archived_nested_items_count: number | string;
  archived_items_count: number | string;
  total_distinct_items_count: number | string;
  primary_location_links_count: number | string;
  non_primary_location_links_count: number | string;
  total_location_links_count: number | string;
  requires_item_resolution: boolean;
  requires_subtree_deletion: boolean;
  can_delete_immediately: boolean;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isLocationDependencyEntityType(
  value: unknown,
): value is LocationDependencyEntityType {
  return (
    typeof value === "string" &&
    locationDependencyEntityTypes.includes(
      value as LocationDependencyEntityType,
    )
  );
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export function parseLocationDependencySummaryInput(
  value: unknown,
):
  | { ok: true; input: LocationDependencySummaryInput }
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

export function getLocationDependencySummaryRpcName(
  entityType: LocationDependencyEntityType,
) {
  switch (entityType) {
    case "room":
      return "get_room_location_dependency_summary" as const;
    case "storage":
      return "get_storage_location_l2_dependency_summary" as const;
    case "position":
      return "get_storage_location_l3_dependency_summary" as const;
  }
}

function count(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("Invalid location dependency count");
  }

  return parsed;
}

function boolean(value: unknown) {
  if (typeof value !== "boolean") {
    throw new Error("Invalid location dependency flag");
  }

  return value;
}

function validateLocationDependencySummary(
  summary: LocationDependencySummary,
): LocationDependencySummary {
  const invalid = () => {
    throw new Error("Invalid location dependency summary invariant");
  };

  if (
    summary.activeDirectItemsCount + summary.activeNestedItemsCount !==
      summary.activeItemsCount ||
    summary.archivedDirectItemsCount + summary.archivedNestedItemsCount !==
      summary.archivedItemsCount ||
    summary.activeItemsCount + summary.archivedItemsCount !==
      summary.totalDistinctItemsCount ||
    summary.primaryLocationLinksCount +
      summary.nonPrimaryLocationLinksCount !==
      summary.totalLocationLinksCount ||
    summary.requiresItemResolution !==
      (summary.totalLocationLinksCount > 0)
  ) {
    invalid();
  }

  switch (summary.entityType) {
    case "room":
      if (
        summary.activeDirectItemsCount !== 0 ||
        summary.archivedDirectItemsCount !== 0 ||
        summary.requiresSubtreeDeletion !==
          (summary.storageCount > 0 || summary.positionCount > 0) ||
        summary.canDeleteImmediately !==
          (
            summary.storageCount === 0 &&
            summary.positionCount === 0 &&
            summary.totalLocationLinksCount === 0
          )
      ) {
        invalid();
      }
      break;
    case "storage":
      if (
        summary.storageCount !== 0 ||
        summary.activeDirectItemsCount !== 0 ||
        summary.archivedDirectItemsCount !== 0 ||
        summary.requiresSubtreeDeletion !== (summary.positionCount > 0) ||
        summary.canDeleteImmediately !==
          (
            summary.positionCount === 0 &&
            summary.totalLocationLinksCount === 0
          )
      ) {
        invalid();
      }
      break;
    case "position":
      if (
        summary.storageCount !== 0 ||
        summary.positionCount !== 0 ||
        summary.activeNestedItemsCount !== 0 ||
        summary.archivedNestedItemsCount !== 0 ||
        summary.requiresSubtreeDeletion !== false ||
        summary.canDeleteImmediately !==
          (summary.totalLocationLinksCount === 0)
      ) {
        invalid();
      }
      break;
  }

  return summary;
}
export function mapLocationDependencySummaryRow(
  entityType: LocationDependencyEntityType,
  row: LocationDependencySummaryRpcRow,
): LocationDependencySummary {
  if (!isUuid(row.entity_id)) {
    throw new Error("Invalid location dependency entity ID");
  }

  const summary: LocationDependencySummary = {
    entityType,
    entityId: row.entity_id.toLowerCase(),
    storageCount: count(row.storage_count),
    positionCount: count(row.position_count),
    activeDirectItemsCount: count(row.active_direct_items_count),
    activeNestedItemsCount: count(row.active_nested_items_count),
    activeItemsCount: count(row.active_items_count),
    archivedDirectItemsCount: count(row.archived_direct_items_count),
    archivedNestedItemsCount: count(row.archived_nested_items_count),
    archivedItemsCount: count(row.archived_items_count),
    totalDistinctItemsCount: count(row.total_distinct_items_count),
    primaryLocationLinksCount: count(row.primary_location_links_count),
    nonPrimaryLocationLinksCount: count(
      row.non_primary_location_links_count,
    ),
    totalLocationLinksCount: count(row.total_location_links_count),
    requiresItemResolution: boolean(row.requires_item_resolution),
    requiresSubtreeDeletion: boolean(row.requires_subtree_deletion),
    canDeleteImmediately: boolean(row.can_delete_immediately),
  };

  return validateLocationDependencySummary(summary);
}

export function mapLocationDependencySummaryError(error: {
  message?: string | null;
}): LocationDependencySummaryErrorResult {
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

  return { ok: false, code: "summary_unavailable" };
}
