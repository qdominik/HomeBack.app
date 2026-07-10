"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HOME_KIND_OTHER } from "@/lib/home/home-kind-suggestions";
import { generateLocationCode } from "@/lib/home/location-code";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { resolveTemplateOrCustomValue } from "@/lib/templates/normalize-template-value";
import type { Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProfileRole = Database["public"]["Enums"]["profile_role"];

const orderColumn = "kolejność" as const;

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value ? value : null;
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

  return (data?.kolejność ?? 0) + 1;
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

  return (data?.kolejność ?? 0) + 1;
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

  return (data?.kolejność ?? 0) + 1;
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
    ikona: nullableField(formData, "ikona"),
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
  redirectWithStatus("room_created");
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
    ikona: nullableField(formData, "ikona"),
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
  redirectWithStatus("room_updated");
}

export async function deleteRoom(formData: FormData) {
  const roomId = field(formData, "room_id");

  if (!roomId) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const { count, error: countError } = await supabase
    .from("storage_location_l2")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);

  if (countError) {
    redirectWithError("action_failed");
  }

  if ((count ?? 0) > 0) {
    redirectWithError("room_not_empty");
  }

  const { data, error } = await supabase
    .from("room")
    .delete()
    .eq("id", roomId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirectWithError("action_failed");
  }

  revalidatePath(routes.home);
  redirectWithStatus("room_deleted");
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
  redirectWithStatus("location_updated");
}

export async function deleteStorageLocationL2(formData: FormData) {
  const locationId = field(formData, "location_l2_id");

  if (!locationId) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const { count, error: countError } = await supabase
    .from("storage_location_l3")
    .select("id", { count: "exact", head: true })
    .eq("storage_location_l2_id", locationId);

  if (countError) {
    redirectWithError("action_failed");
  }

  if ((count ?? 0) > 0) {
    redirectWithError("location_not_empty");
  }

  const { data, error } = await supabase
    .from("storage_location_l2")
    .delete()
    .eq("id", locationId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirectWithError("action_failed");
  }

  revalidatePath(routes.home);
  redirectWithStatus("location_deleted");
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
  redirectWithStatus("position_deleted");
}
