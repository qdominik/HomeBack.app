"use server";

import { revalidatePath } from "next/cache";
import { createCustomCategoryForActiveAdmin } from "@/lib/categories/create-custom-category";
import { redirect } from "next/navigation";
import {
  parseItemType,
  resolveItemQuantity,
} from "@/lib/items/item-form-values";
import {
  parseLegacyRestoreStatus,
  resolveItemArchiveResult,
  resolveItemRestoreResult,
} from "@/lib/items/item-archive-restore";
import {
  isValidItemId,
  resolvePermanentItemDeletionResult,
} from "@/lib/items/permanent-item-deletion";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProfileRole = Database["public"]["Enums"]["profile_role"];

const ARCHIVED_STATUS = "archiwalne" as const;
const AT_HOME_STATUS = "w domu" as const;

function field(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function nullableField(formData: FormData, key: string) {
  return field(formData, key) || null;
}

function redirectWithError(error: string): never {
  redirect(`${routes.items}?error=${encodeURIComponent(error)}`);
}

function redirectWithStatus(status: string): never {
  redirect(`${routes.items}?status=${encodeURIComponent(status)}`);
}

function redirectArchivedWithError(error: string): never {
  redirect(
    `${routes.items}?view=archived&error=${encodeURIComponent(error)}`,
  );
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

  return { profile, userId };
}

function requireAdmin(role: ProfileRole) {
  if (role !== "admin") {
    redirectWithError("admin_required");
  }
}

async function validateCategory(
  supabase: SupabaseClient,
  householdId: string,
  categoryId: string,
) {
  const { data: category, error } = await supabase
    .from("category")
    .select("id, household_id, czy_systemowa")
    .eq("id", categoryId)
    .maybeSingle();

  if (error || !category) {
    redirectWithError("invalid_category");
  }

  const isSystemCategory =
    category.czy_systemowa && category.household_id === null;
  const isOwnCustomCategory =
    !category.czy_systemowa && category.household_id === householdId;

  if (!isSystemCategory && !isOwnCustomCategory) {
    redirectWithError("invalid_category");
  }

  return category.id;
}

async function validatePosition(
  supabase: SupabaseClient,
  householdId: string,
  positionId: string,
) {
  if (!positionId) {
    return null;
  }

  const { data: position, error: positionError } = await supabase
    .from("storage_location_l3")
    .select("id, storage_location_l2_id")
    .eq("id", positionId)
    .maybeSingle();

  if (positionError || !position) {
    redirectWithError("invalid_location");
  }

  const { data: storageLocation, error: storageError } = await supabase
    .from("storage_location_l2")
    .select("id, room_id")
    .eq("id", position.storage_location_l2_id)
    .maybeSingle();

  if (storageError || !storageLocation) {
    redirectWithError("invalid_location");
  }

  const { data: room, error: roomError } = await supabase
    .from("room")
    .select("id, household_id")
    .eq("id", storageLocation.room_id)
    .maybeSingle();

  if (roomError || !room || room.household_id !== householdId) {
    redirectWithError("invalid_location");
  }

  return position.id;
}

async function getActiveItem(
  supabase: SupabaseClient,
  householdId: string,
  itemId: string,
) {
  const { data: item, error } = await supabase
    .from("item")
    .select("id, household_id, status")
    .eq("id", itemId)
    .eq("household_id", householdId)
    .maybeSingle();

  if (error || !item || item.status === ARCHIVED_STATUS) {
    redirectWithError("item_not_found");
  }

  return item;
}

async function setPrimaryLocation(
  supabase: SupabaseClient,
  itemId: string,
  positionId: string | null,
) {
  const { error } = await supabase.rpc("set_item_primary_location", {
    p_item_id: itemId,
    p_storage_location_l3_id: positionId,
  });

  if (error) {
    redirectWithError("action_failed");
  }
}

function parseItemPayload(formData: FormData) {
  const nazwa = field(formData, "nazwa");
  const categoryId = field(formData, "category_id");
  const itemType = parseItemType(field(formData, "typ"));

  if (!nazwa || !categoryId) {
    redirectWithError("missing_fields");
  }

  if (!itemType) {
    redirectWithError("invalid_item_type");
  }

  const quantity = resolveItemQuantity(itemType, field(formData, "ilosc"));

  if (quantity === null) {
    redirectWithError("invalid_quantity");
  }

  return {
    categoryId,
    ilosc: quantity,
    nazwa,
    opis: nullableField(formData, "opis"),
    positionId: field(formData, "storage_location_l3_id"),
    typ: itemType,
  };
}

export async function createItem(formData: FormData) {
  const payload = parseItemPayload(formData);
  const supabase = await createClient();
  const { profile, userId } = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const categoryId = await validateCategory(
    supabase,
    profile.household_id,
    payload.categoryId,
  );
  const positionId = await validatePosition(
    supabase,
    profile.household_id,
    payload.positionId,
  );

  const { data: item, error } = await supabase
    .from("item")
    .insert({
      category_id: categoryId,
      created_by_id: userId,
      household_id: profile.household_id,
      ilosc: payload.ilosc,
      jednostka: null,
      nazwa: payload.nazwa,
      opis: payload.opis,
      status: AT_HOME_STATUS,
      typ: payload.typ,
    })
    .select("id")
    .maybeSingle();

  if (error || !item) {
    redirectWithError("action_failed");
  }

  if (positionId) {
    await setPrimaryLocation(supabase, item.id, positionId);
  }

  revalidatePath(routes.items);
  redirectWithStatus("item_created");
}

export async function updateItem(formData: FormData) {
  const itemId = field(formData, "item_id");

  if (!itemId) {
    redirectWithError("missing_fields");
  }

  const payload = parseItemPayload(formData);
  const supabase = await createClient();
  const { profile } = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  await getActiveItem(supabase, profile.household_id, itemId);
  const categoryId = await validateCategory(
    supabase,
    profile.household_id,
    payload.categoryId,
  );
  const positionId = await validatePosition(
    supabase,
    profile.household_id,
    payload.positionId,
  );

  const { data, error } = await supabase
    .from("item")
    .update({
      category_id: categoryId,
      ilosc: payload.ilosc,
      jednostka: null,
      nazwa: payload.nazwa,
      opis: payload.opis,
      typ: payload.typ,
    })
    .eq("id", itemId)
    .eq("household_id", profile.household_id)
    .neq("status", ARCHIVED_STATUS)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirectWithError("action_failed");
  }

  await setPrimaryLocation(supabase, data.id, positionId);

  revalidatePath(routes.items);
  redirectWithStatus("item_updated");
}

export async function archiveItem(formData: FormData) {
  const itemId = field(formData, "item_id");

  if (!isValidItemId(itemId)) {
    redirectWithError("invalid_item_id");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("archive_item", {
    p_item_id: itemId,
  });
  const result = resolveItemArchiveResult(data, error);

  if (result === "auth_required") {
    redirect(`${routes.login}?error=session_expired`);
  }

  if (result !== "success") {
    redirectWithError(result);
  }

  revalidatePath(routes.items);
  revalidatePath(routes.dashboard);
  redirectWithStatus("item_archived");
}

export async function restoreItem(formData: FormData) {
  const itemId = field(formData, "item_id");
  const submittedStatus = field(formData, "legacy_target_status");

  if (!isValidItemId(itemId)) {
    redirectArchivedWithError("invalid_item_id");
  }

  const legacyTargetStatus = parseLegacyRestoreStatus(submittedStatus);

  if (submittedStatus && !legacyTargetStatus) {
    redirectArchivedWithError("invalid_restore_status");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("restore_item", {
    p_item_id: itemId,
    p_legacy_target_status: legacyTargetStatus,
  });
  const result = resolveItemRestoreResult(data, error);

  if (result === "auth_required") {
    redirect(`${routes.login}?error=session_expired`);
  }

  if (result !== "success") {
    redirectArchivedWithError(result);
  }

  revalidatePath(routes.items);
  revalidatePath(routes.dashboard);
  redirectWithStatus("item_restored");
}
export async function deleteItemPermanently(formData: FormData) {
  const itemId = field(formData, "item_id");

  if (!isValidItemId(itemId)) {
    redirectWithError("invalid_item_id");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_item_permanently", {
    p_item_id: itemId,
  });
  const result = resolvePermanentItemDeletionResult(data, error);

  if (result === "success") {
    revalidatePath(routes.items);
    revalidatePath(routes.dashboard);
    redirectWithStatus("item_deleted");
  }

  if (result === "auth_required") {
    redirect(`${routes.login}?error=session_expired`);
  }

  if (result === "active_profile_required") {
    redirectWithError("active_profile_required");
  }

  if (result === "admin_required") {
    redirectWithError("admin_required");
  }

  if (result === "item_not_available") {
    redirectWithError("item_not_available");
  }

  if (result === "item_has_files") {
    redirectWithError("item_has_files");
  }

  redirectWithError("deletion_failed");
}

export async function createQuickCustomCategory(submittedName: string) {
  const result = await createCustomCategoryForActiveAdmin(submittedName);

  if (result.status === "created") {
    revalidatePath(routes.categories);
  }

  return result;
}

export async function copyItem(input: {
  itemId: string;
  name: string;
  targetStorageLocationL3Id: string | null;
}) {
  if (!input.itemId || !input.name.trim()) {
    return { ok: false as const, code: "invalid_input" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("copy_item", {
    p_item_id: input.itemId,
    p_name: input.name.trim(),
    p_target_storage_location_l3_id: input.targetStorageLocationL3Id,
  });
  if (error || !data) {
    return { ok: false as const, code: error?.message ?? "copy_failed" };
  }
  const row = (Array.isArray(data) ? data[0] : data) as { item_id?: string };
  return row.item_id
    ? { ok: true as const, id: row.item_id }
    : { ok: false as const, code: "copy_failed" };
}
