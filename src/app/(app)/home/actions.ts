"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HOME_KIND_OTHER } from "@/lib/home/home-kind-suggestions";
import { normalizeEntityIconKey } from "@/lib/icons/entity-icon-validation";
import {
  getLocationDependencySummaryRpcName,
  mapLocationDependencySummaryError,
  mapLocationDependencySummaryRow,
  parseLocationDependencySummaryInput,
  type LocationDependencySummaryInput,
  type LocationDependencySummaryResult,
  type LocationDependencySummaryRpcRow,
} from "@/lib/home/location-dependency-summary";
import { generateLocationCode } from "@/lib/home/location-code";
import {
  buildLocationDeleteTargetOptions,
  locationDeleteResolutionRpcName,
  mapLocationDeleteResolutionError,
  mapLocationDeleteResolutionRow,
  parseLocationDeleteResolutionInput,
  type LocationDeleteResolutionResult,
  type LocationDeleteResolutionRpcRow,
  type LocationDeleteTargetOption,
} from "@/lib/home/location-delete-resolution";
import {
  buildStorageLocationL2DeleteTargetOptions,
  mapStorageLocationL2DeleteResolutionError,
  mapStorageLocationL2DeleteResolutionRow,
  parseStorageLocationL2DeleteResolutionInput,
  storageLocationL2DeleteResolutionRpcName,
  type StorageLocationL2DeleteContextResult,
  type StorageLocationL2DeleteResolutionResult,
  type StorageLocationL2DeleteResolutionRpcRow,
} from "@/lib/home/storage-location-l2-delete-resolution";
import {
  buildRoomDeleteTargetOptions,
  mapRoomDeleteResolutionError,
  mapRoomDeleteResolutionRow,
  parseRoomDeleteResolutionInput,
  roomDeleteResolutionRpcName,
  type RoomDeleteContextResult,
  type RoomDeleteResolutionResult,
  type RoomDeleteResolutionRpcRow,
} from "@/lib/home/room-delete-resolution";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { resolveTemplateOrCustomValue } from "@/lib/templates/normalize-template-value";
import type { Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProfileRole = Database["public"]["Enums"]["profile_role"];

type LocationDeleteContextResult =
  | {
      ok: true;
      context: {
        summary: ReturnType<typeof mapLocationDependencySummaryRow>;
        targets: LocationDeleteTargetOption[];
      };
    }
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

const orderColumn = "kolejno\u015b\u0107" as const;

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value ? value : null;
}
function roomIconField(formData: FormData) {
  return normalizeEntityIconKey(field(formData, "ikona"), "room");
}

function redirectWithError(error: string): never {
  redirect(`${routes.home}?error=${encodeURIComponent(error)}`);
}

function redirectWithStatus(status: string): never {
  redirect(`${routes.home}?status=${encodeURIComponent(status)}`);
}

function parseOptionalOrder(formData: FormData) {
  const raw = field(formData, "kolejnosc");

  if (!raw) {
    return null;
  }

  const order = Number.parseInt(raw, 10);

  if (!Number.isFinite(order) || order < 0) {
    redirectWithError("invalid_order");
  }

  return order;
}

function parseTemplateOrCustomValue(
  formData: FormData,
  name: string,
  fallback: string,
) {
  const templateValue = field(formData, name + "_template");
  const customValue = field(formData, name + "_custom");

  if (templateValue || customValue) {
    return resolveTemplateOrCustomValue(templateValue, customValue, fallback);
  }

  return field(formData, name) || fallback;
}

function parseFlexibleType(formData: FormData) {
  return parseTemplateOrCustomValue(formData, "typ", HOME_KIND_OTHER);
}

function normalizedName(value: string) {
  return value.trim().toLowerCase();
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

async function getActiveProfile(supabase: SupabaseClient) {
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect(`${routes.login}?error=session_expired`);
  }

  const { data: profile, error } = await supabase
    .from("profile")
    .select("household_id, rola")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    redirect(`${routes.register}?step=household`);
  }

  return profile;
}

function requireAdmin(role: ProfileRole) {
  if (role !== "admin") {
    redirectWithError("admin_required");
  }
}


async function executeLocationDependencySummaryRpc(
  supabase: SupabaseClient,
  input: LocationDependencySummaryInput,
) {
  const rpcName = getLocationDependencySummaryRpcName(input.entityType);

  switch (rpcName) {
    case "get_room_location_dependency_summary":
      return supabase.rpc(rpcName, { p_room_id: input.entityId });
    case "get_storage_location_l2_dependency_summary":
      return supabase.rpc(rpcName, {
        p_storage_location_l2_id: input.entityId,
      });
    case "get_storage_location_l3_dependency_summary":
      return supabase.rpc(rpcName, {
        p_storage_location_l3_id: input.entityId,
      });
  }
}

export async function getLocationDependencySummary(
  value: unknown,
): Promise<LocationDependencySummaryResult> {
  const parsed = parseLocationDependencySummaryInput(value);

  if (!parsed.ok) {
    return parsed;
  }

  const supabase = await createClient();
  const response = await executeLocationDependencySummaryRpc(
    supabase,
    parsed.input,
  );

  if (response.error) {
    const result = mapLocationDependencySummaryError(response.error);

    if (result.code === "summary_unavailable") {
      console.error("Location dependency summary RPC failed", {
        code: response.error.code,
      });
    }

    return result;
  }

  const row = response.data?.[0] as
    | LocationDependencySummaryRpcRow
    | undefined;

  if (!row) {
    console.error("Location dependency summary RPC returned no row");
    return { ok: false, code: "summary_unavailable" };
  }

  try {
    return {
      ok: true,
      summary: mapLocationDependencySummaryRow(parsed.input.entityType, row),
    };
  } catch {
    console.error("Location dependency summary RPC returned invalid data");
    return { ok: false, code: "summary_unavailable" };
  }
}
async function ensureUniqueRoomName(
  supabase: SupabaseClient,
  householdId: string,
  nazwa: string,
  excludedRoomId?: string,
) {
  const { data, error } = await supabase
    .from("room")
    .select("id, nazwa")
    .eq("household_id", householdId);

  if (error) {
    redirectWithError("action_failed");
  }

  if (
    (data ?? []).some(
      (room) =>
        room.id !== excludedRoomId &&
        normalizedName(room.nazwa) === normalizedName(nazwa),
    )
  ) {
    redirectWithError("duplicate_room");
  }
}

async function ensureUniqueL2Name(
  supabase: SupabaseClient,
  roomId: string,
  nazwa: string,
  excludedLocationId?: string,
) {
  const { data, error } = await supabase
    .from("storage_location_l2")
    .select("id, nazwa")
    .eq("room_id", roomId);

  if (error) {
    redirectWithError("action_failed");
  }

  if (
    (data ?? []).some(
      (location) =>
        location.id !== excludedLocationId &&
        normalizedName(location.nazwa) === normalizedName(nazwa),
    )
  ) {
    redirectWithError("duplicate_location");
  }
}

async function ensureUniqueL3Name(
  supabase: SupabaseClient,
  locationId: string,
  nazwa: string,
  excludedPositionId?: string,
) {
  const { data, error } = await supabase
    .from("storage_location_l3")
    .select("id, nazwa")
    .eq("storage_location_l2_id", locationId);

  if (error) {
    redirectWithError("action_failed");
  }

  if (
    (data ?? []).some(
      (position) =>
        position.id !== excludedPositionId &&
        normalizedName(position.nazwa) === normalizedName(nazwa),
    )
  ) {
    redirectWithError("duplicate_position");
  }
}

async function nextRoomOrder(supabase: SupabaseClient, householdId: string) {
  const { data, error } = await supabase
    .from("room")
    .select("*")
    .eq("household_id", householdId)
    .order(orderColumn, { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    redirectWithError("action_failed");
  }

  return (data?.[orderColumn] ?? 0) + 1;
}

async function nextL2Order(supabase: SupabaseClient, roomId: string) {
  const { data, error } = await supabase
    .from("storage_location_l2")
    .select("*")
    .eq("room_id", roomId)
    .order(orderColumn, { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    redirectWithError("action_failed");
  }

  return (data?.[orderColumn] ?? 0) + 1;
}

async function nextL3Order(supabase: SupabaseClient, locationId: string) {
  const { data, error } = await supabase
    .from("storage_location_l3")
    .select("*")
    .eq("storage_location_l2_id", locationId)
    .order(orderColumn, { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    redirectWithError("action_failed");
  }

  return (data?.[orderColumn] ?? 0) + 1;
}

export async function createRoom(formData: FormData) {
  const nazwa = field(formData, "nazwa");
  const typ = parseFlexibleType(formData);

  if (!nazwa) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);
  await ensureUniqueRoomName(supabase, profile.household_id, nazwa);

  const order =
    parseOptionalOrder(formData) ??
    (await nextRoomOrder(supabase, profile.household_id));

  const { error } = await supabase.from("room").insert({
    household_id: profile.household_id,
    ikona: roomIconField(formData),
    [orderColumn]: order,
    nazwa,
    opis: nullableField(formData, "opis"),
    typ,
  });

  if (error) {
    redirectWithError(
      isUniqueViolation(error) ? "duplicate_room" : "action_failed",
    );
  }

  revalidatePath(routes.home);
  revalidatePath(routes.items);
  redirectWithStatus("room_created");
}

type CopyResult = { ok: true; id: string } | { ok: false; code: string };

async function copyRpc(name: string, args: Record<string, unknown>): Promise<CopyResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error || !data) return { ok: false, code: error?.message ?? "copy_failed" };
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
  const id = Object.values(row).find((value) => typeof value === "string");
  return typeof id === "string" ? { ok: true, id } : { ok: false, code: "copy_failed" };
}

export async function copyRoom(input: { roomId: string; name: string; copyStructure: boolean }) {
  if (!input.roomId || !input.name.trim()) return { ok: false as const, code: "invalid_input" };
  return copyRpc("copy_room_with_structure", {
    p_room_id: input.roomId,
    p_name: input.name.trim(),
    p_copy_structure: input.copyStructure,
  });
}

export async function copyFurniture(input: { storageId: string; targetRoomId: string; name: string; copyStorage: boolean }) {
  if (!input.storageId || !input.targetRoomId || !input.name.trim()) return { ok: false as const, code: "invalid_input" };
  return copyRpc("copy_furniture_with_storage", {
    p_storage_location_l2_id: input.storageId,
    p_target_room_id: input.targetRoomId,
    p_name: input.name.trim(),
    p_copy_storage: input.copyStorage,
  });
}

export async function copyStorage(input: { storageId: string; targetFurnitureId: string; name: string }) {
  if (!input.storageId || !input.targetFurnitureId || !input.name.trim()) return { ok: false as const, code: "invalid_input" };
  return copyRpc("copy_storage_space", {
    p_storage_location_l3_id: input.storageId,
    p_target_storage_location_l2_id: input.targetFurnitureId,
    p_name: input.name.trim(),
  });
}

export async function updateRoom(formData: FormData) {
  const roomId = field(formData, "room_id");
  const nazwa = field(formData, "nazwa");
  const typ = parseFlexibleType(formData);

  if (!roomId || !nazwa) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);
  await ensureUniqueRoomName(supabase, profile.household_id, nazwa, roomId);

  const payload: Database["public"]["Tables"]["room"]["Update"] = {
    ikona: roomIconField(formData),
    nazwa,
    opis: nullableField(formData, "opis"),
    typ,
  };
  const order = parseOptionalOrder(formData);

  if (order !== null) {
    payload[orderColumn] = order;
  }

  const { data, error } = await supabase
    .from("room")
    .update(payload)
    .eq("id", roomId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirectWithError(
      isUniqueViolation(error) ? "duplicate_room" : "action_failed",
    );
  }

  if (!data) {
    redirectWithError("action_failed");
  }

  revalidatePath(routes.home);
  revalidatePath(routes.items);
  redirectWithStatus("room_updated");
}

export async function getRoomDeletionContext(
  value: unknown,
): Promise<RoomDeleteContextResult> {
  const parsed = parseLocationDependencySummaryInput({
    entityType: "room",
    entityId: value,
  });

  if (!parsed.ok) {
    return { ok: false, code: "invalid_delete_resolution" };
  }

  const supabase = await createClient();
  const summaryResponse = await executeLocationDependencySummaryRpc(
    supabase,
    parsed.input,
  );

  if (summaryResponse.error) {
    const result = mapLocationDependencySummaryError(summaryResponse.error);

    if (result.code === "summary_unavailable") {
      console.error("Room deletion context summary failed", {
        code: summaryResponse.error.code,
      });
      return { ok: false, code: "context_unavailable" };
    }

    if (
      result.code === "auth_required" ||
      result.code === "active_profile_required" ||
      result.code === "admin_required" ||
      result.code === "location_not_available"
    ) {
      return { ok: false, code: result.code };
    }

    return { ok: false, code: "context_unavailable" };
  }

  const summaryRow = summaryResponse.data?.[0] as
    | LocationDependencySummaryRpcRow
    | undefined;

  if (!summaryRow) {
    return { ok: false, code: "context_unavailable" };
  }

  let summary;

  try {
    summary = mapLocationDependencySummaryRow("room", summaryRow);
  } catch {
    return { ok: false, code: "context_unavailable" };
  }

  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const { data: rooms, error: roomsError } = await supabase
    .from("room")
    .select("id, nazwa")
    .eq("household_id", profile.household_id);

  if (roomsError) {
    return { ok: false, code: "context_unavailable" };
  }

  const sourceRoom = (rooms ?? []).find(
    (room) => room.id === parsed.input.entityId,
  );

  if (!sourceRoom) {
    return { ok: false, code: "location_not_available" };
  }

  const roomIds = (rooms ?? []).map((room) => room.id);
  const storageResponse = roomIds.length
    ? await supabase
        .from("storage_location_l2")
        .select("id, nazwa, room_id")
        .in("room_id", roomIds)
    : { data: [], error: null };

  if (storageResponse.error) {
    return { ok: false, code: "context_unavailable" };
  }

  const storageIds = (storageResponse.data ?? []).map(
    (storage) => storage.id,
  );
  const positionsResponse = storageIds.length
    ? await supabase
        .from("storage_location_l3")
        .select("id, nazwa, storage_location_l2_id")
        .in("storage_location_l2_id", storageIds)
    : { data: [], error: null };

  if (positionsResponse.error) {
    return { ok: false, code: "context_unavailable" };
  }

  return {
    ok: true,
    context: {
      summary,
      sourcePath: sourceRoom.nazwa,
      targets: buildRoomDeleteTargetOptions(
        rooms ?? [],
        storageResponse.data ?? [],
        positionsResponse.data ?? [],
        parsed.input.entityId,
      ),
    },
  };
}

export async function deleteRoomWithResolution(
  value: unknown,
): Promise<RoomDeleteResolutionResult> {
  const parsed = parseRoomDeleteResolutionInput(value);

  if (!parsed.ok) {
    return parsed;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(roomDeleteResolutionRpcName, {
    p_room_id: parsed.input.roomId,
    p_resolution: parsed.input.resolution,
    p_target_storage_location_l3_id: parsed.input.targetPositionId,
    p_expected_storage_location_l2_count:
      parsed.input.expectedStorageLocationL2Count,
    p_expected_storage_location_l3_count:
      parsed.input.expectedStorageLocationL3Count,
    p_expected_distinct_item_count:
      parsed.input.expectedDistinctItemCount,
    p_expected_location_link_count:
      parsed.input.expectedLocationLinkCount,
  });

  if (error) {
    const result = mapRoomDeleteResolutionError(error);

    if (result.code === "delete_unavailable") {
      console.error("Room deletion resolution RPC failed", {
        code: error.code,
      });
    }

    return result;
  }

  const row = data?.[0] as RoomDeleteResolutionRpcRow | undefined;

  if (!row) {
    return { ok: false, code: "delete_unavailable" };
  }

  try {
    const summary = mapRoomDeleteResolutionRow(parsed.input, row);

    revalidatePath(routes.home);
    revalidatePath(routes.items);

    return { ok: true, summary };
  } catch {
    return { ok: false, code: "delete_unavailable" };
  }
}

export async function createStorageLocationL2(formData: FormData) {
  const roomId = field(formData, "room_id");
  const nazwa = field(formData, "nazwa");
  const typ = parseFlexibleType(formData);

  if (!roomId || !nazwa) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);
  await ensureUniqueL2Name(supabase, roomId, nazwa);

  const order =
    parseOptionalOrder(formData) ?? (await nextL2Order(supabase, roomId));

  const { error } = await supabase.from("storage_location_l2").insert({
    [orderColumn]: order,
    nazwa,
    opis: nullableField(formData, "opis"),
    room_id: roomId,
    typ,
  });

  if (error) {
    redirectWithError(
      isUniqueViolation(error) ? "duplicate_location" : "action_failed",
    );
  }

  revalidatePath(routes.home);
  revalidatePath(routes.items);
  redirectWithStatus("location_created");
}

export async function updateStorageLocationL2(formData: FormData) {
  const locationId = field(formData, "location_l2_id");
  const nazwa = field(formData, "nazwa");
  const typ = parseFlexibleType(formData);

  if (!locationId || !nazwa) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const { data: existingLocation, error: existingLocationError } =
    await supabase
      .from("storage_location_l2")
      .select("room_id")
      .eq("id", locationId)
      .maybeSingle();

  if (existingLocationError || !existingLocation) {
    redirectWithError("action_failed");
  }

  await ensureUniqueL2Name(
    supabase,
    existingLocation.room_id,
    nazwa,
    locationId,
  );

  const payload: Database["public"]["Tables"]["storage_location_l2"]["Update"] =
    {
      nazwa,
      opis: nullableField(formData, "opis"),
      typ,
    };
  const order = parseOptionalOrder(formData);

  if (order !== null) {
    payload[orderColumn] = order;
  }

  const { data, error } = await supabase
    .from("storage_location_l2")
    .update(payload)
    .eq("id", locationId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirectWithError(
      isUniqueViolation(error) ? "duplicate_location" : "action_failed",
    );
  }

  if (!data) {
    redirectWithError("action_failed");
  }

  revalidatePath(routes.home);
  revalidatePath(routes.items);
  redirectWithStatus("location_updated");
}

export async function getStorageLocationL2DeletionContext(
  value: unknown,
): Promise<StorageLocationL2DeleteContextResult> {
  const parsed = parseLocationDependencySummaryInput({
    entityType: "storage",
    entityId: value,
  });

  if (!parsed.ok) {
    return { ok: false, code: "invalid_delete_resolution" };
  }

  const supabase = await createClient();
  const summaryResponse = await executeLocationDependencySummaryRpc(
    supabase,
    parsed.input,
  );

  if (summaryResponse.error) {
    const result = mapLocationDependencySummaryError(summaryResponse.error);

    if (result.code === "summary_unavailable") {
      console.error("L2 deletion context summary failed", {
        code: summaryResponse.error.code,
      });
      return { ok: false, code: "context_unavailable" };
    }

    if (
      result.code === "auth_required" ||
      result.code === "active_profile_required" ||
      result.code === "admin_required" ||
      result.code === "location_not_available"
    ) {
      return { ok: false, code: result.code };
    }

    return { ok: false, code: "context_unavailable" };
  }

  const summaryRow = summaryResponse.data?.[0] as
    | LocationDependencySummaryRpcRow
    | undefined;

  if (!summaryRow) {
    return { ok: false, code: "context_unavailable" };
  }

  let summary;

  try {
    summary = mapLocationDependencySummaryRow("storage", summaryRow);
  } catch {
    return { ok: false, code: "context_unavailable" };
  }

  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const { data: rooms, error: roomsError } = await supabase
    .from("room")
    .select("id, nazwa")
    .eq("household_id", profile.household_id);

  if (roomsError) {
    return { ok: false, code: "context_unavailable" };
  }

  const roomIds = (rooms ?? []).map((room) => room.id);
  const storageResponse = roomIds.length
    ? await supabase
        .from("storage_location_l2")
        .select("id, nazwa, room_id")
        .in("room_id", roomIds)
    : { data: [], error: null };

  if (storageResponse.error) {
    return { ok: false, code: "context_unavailable" };
  }

  const sourceStorage = (storageResponse.data ?? []).find(
    (storage) => storage.id === parsed.input.entityId,
  );
  const sourceRoom = sourceStorage
    ? (rooms ?? []).find((room) => room.id === sourceStorage.room_id)
    : null;

  if (!sourceStorage || !sourceRoom) {
    return { ok: false, code: "location_not_available" };
  }

  const storageIds = (storageResponse.data ?? []).map(
    (storage) => storage.id,
  );
  const positionsResponse = storageIds.length
    ? await supabase
        .from("storage_location_l3")
        .select("id, nazwa, storage_location_l2_id")
        .in("storage_location_l2_id", storageIds)
    : { data: [], error: null };

  if (positionsResponse.error) {
    return { ok: false, code: "context_unavailable" };
  }

  return {
    ok: true,
    context: {
      summary,
      sourcePath: sourceRoom.nazwa + " -> " + sourceStorage.nazwa,
      targets: buildStorageLocationL2DeleteTargetOptions(
        rooms ?? [],
        storageResponse.data ?? [],
        positionsResponse.data ?? [],
        parsed.input.entityId,
      ),
    },
  };
}

export async function deleteStorageLocationL2WithResolution(
  value: unknown,
): Promise<StorageLocationL2DeleteResolutionResult> {
  const parsed = parseStorageLocationL2DeleteResolutionInput(value);

  if (!parsed.ok) {
    return parsed;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    storageLocationL2DeleteResolutionRpcName,
    {
      p_storage_location_l2_id: parsed.input.storageLocationL2Id,
      p_resolution: parsed.input.resolution,
      p_target_storage_location_l3_id: parsed.input.targetPositionId,
      p_expected_storage_location_l3_count:
        parsed.input.expectedStorageLocationL3Count,
      p_expected_distinct_item_count:
        parsed.input.expectedDistinctItemCount,
      p_expected_location_link_count:
        parsed.input.expectedLocationLinkCount,
    },
  );

  if (error) {
    const result = mapStorageLocationL2DeleteResolutionError(error);

    if (result.code === "delete_unavailable") {
      console.error("L2 deletion resolution RPC failed", {
        code: error.code,
      });
    }

    return result;
  }

  const row = data?.[0] as
    | StorageLocationL2DeleteResolutionRpcRow
    | undefined;

  if (!row) {
    return { ok: false, code: "delete_unavailable" };
  }

  try {
    const summary = mapStorageLocationL2DeleteResolutionRow(
      parsed.input,
      row,
    );

    revalidatePath(routes.home);
    revalidatePath(routes.items);

    return { ok: true, summary };
  } catch {
    return { ok: false, code: "delete_unavailable" };
  }
}

async function parentLocationContext(
  supabase: SupabaseClient,
  locationId: string,
) {
  const { data: location, error } = await supabase
    .from("storage_location_l2")
    .select("id, nazwa, typ, room_id")
    .eq("id", locationId)
    .maybeSingle();

  if (error || !location) {
    redirectWithError("action_failed");
  }

  const { data: room, error: roomError } = await supabase
    .from("room")
    .select("id, nazwa, typ")
    .eq("id", location.room_id)
    .maybeSingle();

  if (roomError || !room) {
    redirectWithError("action_failed");
  }

  return { location, room };
}

export async function createStorageLocationL3(formData: FormData) {
  const locationId = field(formData, "location_l2_id");
  const nazwa = field(formData, "nazwa");

  if (!locationId || !nazwa) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);
  await ensureUniqueL3Name(supabase, locationId, nazwa);

  const order =
    parseOptionalOrder(formData) ?? (await nextL3Order(supabase, locationId));
  const { location, room } = await parentLocationContext(supabase, locationId);
  const submittedCode = field(formData, "kod_lokalizacji");
  const kod_lokalizacji =
    submittedCode ||
    generateLocationCode({
      locationName: nazwa,
      locationOrder: order,
      roomName: room.nazwa,
      roomType: room.typ,
      storageLocationName: location.nazwa,
      storageLocationType: location.typ,
    });

  const { error } = await supabase.from("storage_location_l3").insert({
    [orderColumn]: order,
    kod_lokalizacji,
    nazwa,
    opis: nullableField(formData, "opis"),
    storage_location_l2_id: locationId,
  });

  if (error) {
    redirectWithError(
      isUniqueViolation(error) ? "duplicate_position" : "action_failed",
    );
  }

  revalidatePath(routes.home);
  revalidatePath(routes.items);
  redirectWithStatus("position_created");
}

export async function updateStorageLocationL3(formData: FormData) {
  const positionId = field(formData, "location_l3_id");
  const nazwa = field(formData, "nazwa");

  if (!positionId || !nazwa) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const { data: existingPosition, error: existingPositionError } =
    await supabase
      .from("storage_location_l3")
      .select("storage_location_l2_id")
      .eq("id", positionId)
      .maybeSingle();

  if (existingPositionError || !existingPosition) {
    redirectWithError("action_failed");
  }

  const locationId = existingPosition.storage_location_l2_id;
  await ensureUniqueL3Name(supabase, locationId, nazwa, positionId);

  const order = parseOptionalOrder(formData);
  const { location, room } = await parentLocationContext(supabase, locationId);
  const submittedCode = field(formData, "kod_lokalizacji");
  const payload: Database["public"]["Tables"]["storage_location_l3"]["Update"] =
    {
      kod_lokalizacji:
        submittedCode ||
        generateLocationCode({
          locationName: nazwa,
          locationOrder: order ?? 1,
          roomName: room.nazwa,
          roomType: room.typ,
          storageLocationName: location.nazwa,
          storageLocationType: location.typ,
        }),
      nazwa,
      opis: nullableField(formData, "opis"),
    };

  if (order !== null) {
    payload[orderColumn] = order;
  }

  const { data, error } = await supabase
    .from("storage_location_l3")
    .update(payload)
    .eq("id", positionId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirectWithError(
      isUniqueViolation(error) ? "duplicate_position" : "action_failed",
    );
  }

  if (!data) {
    redirectWithError("action_failed");
  }

  revalidatePath(routes.home);
  revalidatePath(routes.items);
  redirectWithStatus("position_updated");
}

export async function deleteStorageLocationL3(formData: FormData) {
  const positionId = field(formData, "location_l3_id");

  if (!positionId) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const { count, error: countError } = await supabase
    .from("item_location")
    .select("id", { count: "exact", head: true })
    .eq("storage_location_l3_id", positionId);

  if (countError) {
    redirectWithError("action_failed");
  }

  if ((count ?? 0) > 0) {
    redirectWithError("position_in_use");
  }

  const { data, error } = await supabase
    .from("storage_location_l3")
    .delete()
    .eq("id", positionId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirectWithError("action_failed");
  }

  revalidatePath(routes.home);
  revalidatePath(routes.items);
  redirectWithStatus("position_deleted");
}

export async function getStorageLocationL3DeletionContext(
  value: unknown,
): Promise<LocationDeleteContextResult> {
  const parsed = parseLocationDependencySummaryInput({
    entityType: "position",
    entityId: value,
  });

  if (!parsed.ok) {
    return { ok: false, code: "invalid_delete_resolution" };
  }

  const supabase = await createClient();
  const summaryResponse = await executeLocationDependencySummaryRpc(
    supabase,
    parsed.input,
  );

  if (summaryResponse.error) {
    const result = mapLocationDependencySummaryError(summaryResponse.error);

    if (result.code === "summary_unavailable") {
      console.error("L3 deletion context summary failed", {
        code: summaryResponse.error.code,
      });
      return { ok: false, code: "context_unavailable" };
    }

    if (
      result.code === "auth_required" ||
      result.code === "active_profile_required" ||
      result.code === "admin_required" ||
      result.code === "location_not_available"
    ) {
      return { ok: false, code: result.code };
    }

    return { ok: false, code: "context_unavailable" };
  }

  const summaryRow = summaryResponse.data?.[0] as
    | LocationDependencySummaryRpcRow
    | undefined;

  if (!summaryRow) {
    return { ok: false, code: "context_unavailable" };
  }

  let summary;

  try {
    summary = mapLocationDependencySummaryRow("position", summaryRow);
  } catch {
    return { ok: false, code: "context_unavailable" };
  }

  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const { data: rooms, error: roomsError } = await supabase
    .from("room")
    .select("id, nazwa")
    .eq("household_id", profile.household_id);

  if (roomsError) {
    return { ok: false, code: "context_unavailable" };
  }

  const roomIds = (rooms ?? []).map((room) => room.id);
  const storageResponse = roomIds.length
    ? await supabase
        .from("storage_location_l2")
        .select("id, nazwa, room_id")
        .in("room_id", roomIds)
    : { data: [], error: null };

  if (storageResponse.error) {
    return { ok: false, code: "context_unavailable" };
  }

  const storageIds = (storageResponse.data ?? []).map(
    (storage) => storage.id,
  );
  const positionsResponse = storageIds.length
    ? await supabase
        .from("storage_location_l3")
        .select("id, nazwa, storage_location_l2_id")
        .in("storage_location_l2_id", storageIds)
    : { data: [], error: null };

  if (positionsResponse.error) {
    return { ok: false, code: "context_unavailable" };
  }

  return {
    ok: true,
    context: {
      summary,
      targets: buildLocationDeleteTargetOptions(
        rooms ?? [],
        storageResponse.data ?? [],
        positionsResponse.data ?? [],
        parsed.input.entityId,
      ),
    },
  };
}

export async function deleteStorageLocationL3WithResolution(
  value: unknown,
): Promise<LocationDeleteResolutionResult> {
  const parsed = parseLocationDeleteResolutionInput(value);

  if (!parsed.ok) {
    return parsed;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(locationDeleteResolutionRpcName, {
    p_storage_location_l3_id: parsed.input.positionId,
    p_resolution: parsed.input.resolution,
    p_target_storage_location_l3_id: parsed.input.targetPositionId,
    p_expected_distinct_item_count: parsed.input.expectedDistinctItemCount,
    p_expected_location_link_count: parsed.input.expectedLocationLinkCount,
  });

  if (error) {
    const result = mapLocationDeleteResolutionError(error);

    if (result.code === "delete_unavailable") {
      console.error("L3 deletion resolution RPC failed", { code: error.code });
    }

    return result;
  }

  const row = data?.[0] as LocationDeleteResolutionRpcRow | undefined;

  if (!row) {
    return { ok: false, code: "delete_unavailable" };
  }

  try {
    const summary = mapLocationDeleteResolutionRow(parsed.input, row);

    revalidatePath(routes.home);
    revalidatePath(routes.items);

    return { ok: true, summary };
  } catch {
    return { ok: false, code: "delete_unavailable" };
  }
}
