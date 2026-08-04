"use server";

import { revalidatePath } from "next/cache";
import { createCustomCategoryForActiveAdmin } from "@/lib/categories/create-custom-category";
import { redirect } from "next/navigation";
import {
  canCopyEntity,
  mapCopyRpcError,
  parseCopyItemInput,
  type CopyActionResult,
} from "@/lib/copy-entities/copy-contract";
import {
  buildItemPhotoFinalPath,
  buildItemPhotoDraftPath,
  ITEM_PHOTO_BUCKET,
  ITEM_PHOTO_ALLOWED_MIME_TYPES,
  ITEM_PHOTO_MAX_SIZE_BYTES,
  ITEM_PHOTO_SIGNED_URL_TTL_SECONDS,
  isItemPhotoDraftPathForHousehold,
  validateItemPhotoMetadata,
  validateItemPhotoFile,
  type ItemPhotoAllowedMimeType,
  type ItemPhotoValidationError,
} from "@/lib/items/item-photo-storage";
import {
  analyzeItemPhoto,
  type ItemPhotoAiErrorCode,
  type ItemPhotoAnalysisSuggestion,
} from "@/lib/items/item-photo-ai";
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
  toPermanentItemDeletionActionResult,
  type PermanentItemDeletionActionResult,
  resolvePermanentItemDeletionResult,
} from "@/lib/items/permanent-item-deletion";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProfileRole = Database["public"]["Enums"]["profile_role"];

const ARCHIVED_STATUS = "archiwalne" as const;
const AT_HOME_STATUS = "w domu" as const;

export type ItemPhotoDraftUploadResult =
  | {
      ok: true;
      draftId: string;
      file: {
        mimeType: ItemPhotoAllowedMimeType;
        sizeBytes: number;
      };
      previewUrl: string;
      storagePath: string;
    }
  | {
      ok: false;
      code:
        | ItemPhotoValidationError
        | "admin_required"
        | "upload_failed"
        | "preview_url_failed";
    };

export type ItemPhotoPreviewUrlResult =
  | { ok: true; previewUrl: string }
  | { ok: false; code: "admin_required" | "invalid_storage_path" | "preview_url_failed" };

export type ItemPhotoDraftCleanupResult =
  | { ok: true }
  | { ok: false; code: "admin_required" | "invalid_storage_path" | "cleanup_failed" };

export type ItemPhotoAnalysisActionResult =
  | { ok: true; suggestion: ItemPhotoAnalysisSuggestion }
  | {
      ok: false;
      code:
        | ItemPhotoAiErrorCode
        | "admin_required"
        | "categories_unavailable"
        | "invalid_photo_input"
        | "invalid_storage_path"
        | "preview_url_failed";
    };

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

function isAdmin(role: ProfileRole) {
  return role === "admin";
}

async function getActiveAdminContext(supabase: SupabaseClient) {
  const { profile } = await getActiveProfile(supabase);

  if (!isAdmin(profile.rola)) {
    return { ok: false as const, code: "admin_required" as const };
  }

  return { ok: true as const, householdId: profile.household_id };
}

function getStringProperty(value: unknown, key: string) {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>)[key] === "string"
    ? ((value as Record<string, string>)[key] ?? "").trim()
    : "";
}

function getNumberProperty(value: unknown, key: string) {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>)[key] === "number"
    ? (value as Record<string, number>)[key]
    : Number.NaN;
}

function getItemPhotoAnalysisInput(value: unknown) {
  const storagePath = getStringProperty(value, "storagePath");
  const mimeType = getStringProperty(value, "mimeType");
  const sizeBytes = getNumberProperty(value, "sizeBytes");

  if (
    !ITEM_PHOTO_ALLOWED_MIME_TYPES.includes(
      mimeType as ItemPhotoAllowedMimeType,
    ) ||
    !Number.isInteger(sizeBytes) ||
    sizeBytes < 0 ||
    sizeBytes > ITEM_PHOTO_MAX_SIZE_BYTES
  ) {
    return null;
  }

  return {
    storagePath,
    mimeType: mimeType as ItemPhotoAllowedMimeType,
    sizeBytes,
  };
}

type ItemPhotoDraftForPersistence = {
  storagePath: string;
  mimeType: ItemPhotoAllowedMimeType;
  sizeBytes: number;
};

function getItemPhotoDraftForPersistence(formData: FormData) {
  const storagePath = field(formData, "item_photo_draft_path");
  const mimeType = field(formData, "item_photo_mime_type");
  const sizeBytes = field(formData, "item_photo_size_bytes");

  if (!storagePath) {
    return null;
  }

  const metadata = validateItemPhotoMetadata(mimeType, Number(sizeBytes));

  if (!mimeType || !sizeBytes || !metadata.ok) {
    redirectWithError("invalid_item_photo");
  }

  return { storagePath, ...metadata } satisfies ItemPhotoDraftForPersistence;
}

async function validateItemPhotoDraftForPersistence(
  supabase: SupabaseClient,
  householdId: string,
  draft: ItemPhotoDraftForPersistence,
) {
  if (!isItemPhotoDraftPathForHousehold(draft.storagePath, householdId)) {
    return null;
  }

  const { data: file, error } = await supabase.storage
    .from(ITEM_PHOTO_BUCKET)
    .download(draft.storagePath);

  if (error || !file) {
    return null;
  }

  const metadata = validateItemPhotoMetadata(file.type, file.size);

  if (
    !metadata.ok ||
    metadata.mimeType !== draft.mimeType ||
    metadata.sizeBytes !== draft.sizeBytes
  ) {
    return null;
  }

  return { ...draft, ...metadata };
}

async function persistItemPhoto(
  supabase: SupabaseClient,
  {
    createdById,
    householdId,
    itemId,
    draft,
  }: {
    createdById: string;
    householdId: string;
    itemId: string;
    draft: ItemPhotoDraftForPersistence;
  },
) {
  const finalPath = buildItemPhotoFinalPath({
    householdId,
    itemId,
    mimeType: draft.mimeType,
  });
  const { error: moveError } = await supabase.storage
    .from(ITEM_PHOTO_BUCKET)
    .move(draft.storagePath, finalPath);

  if (moveError) {
    return false;
  }

  const { error: fileError } = await supabase.from("file").insert({
    item_id: itemId,
    household_id: householdId,
    nazwa: finalPath.split("/").at(-1) ?? "photo",
    plik_url: finalPath,
    typ: "zdjecie",
    rozmiar_kb: Math.ceil(draft.sizeBytes / 1024),
    czy_zaszyfrowany: false,
    created_by_id: createdById,
  });

  if (fileError) {
    await supabase.storage
      .from(ITEM_PHOTO_BUCKET)
      .move(finalPath, draft.storagePath);
    return false;
  }

  const { error: itemError } = await supabase
    .from("item")
    .update({ miniatura_url: finalPath })
    .eq("id", itemId)
    .eq("household_id", householdId);

  if (!itemError) {
    return true;
  }

  await supabase
    .from("file")
    .delete()
    .eq("item_id", itemId)
    .eq("plik_url", finalPath);
  await supabase.storage
    .from(ITEM_PHOTO_BUCKET)
    .move(finalPath, draft.storagePath);

  return false;
}

async function createItemPhotoPreviewUrl(
  supabase: SupabaseClient,
  storagePath: string,
) {
  return supabase.storage
    .from(ITEM_PHOTO_BUCKET)
    .createSignedUrl(storagePath, ITEM_PHOTO_SIGNED_URL_TTL_SECONDS);
}

async function createItemPhotoAnalysisImageUrl(
  supabase: SupabaseClient,
  storagePath: string,
  mimeType: ItemPhotoAllowedMimeType,
) {
  const { data, error } = await createItemPhotoPreviewUrl(supabase, storagePath);

  if (error || !data?.signedUrl) {
    return { ok: false as const, code: "preview_url_failed" as const };
  }

  try {
    const response = await fetch(data.signedUrl, { cache: "no-store" });

    if (!response.ok) {
      return { ok: false as const, code: "preview_url_failed" as const };
    }

    const bytes = Buffer.from(await response.arrayBuffer());

    return {
      ok: true as const,
      imageUrl: `data:${mimeType};base64,${bytes.toString("base64")}`,
    };
  } catch {
    return { ok: false as const, code: "preview_url_failed" as const };
  }
}

export async function createItemPhotoDraftPreviewUrl(
  value: unknown,
): Promise<ItemPhotoPreviewUrlResult> {
  const storagePath = getStringProperty(value, "storagePath");
  const supabase = await createClient();
  const context = await getActiveAdminContext(supabase);

  if (!context.ok) {
    return context;
  }

  if (!isItemPhotoDraftPathForHousehold(storagePath, context.householdId)) {
    return { ok: false, code: "invalid_storage_path" };
  }

  const { data, error } = await createItemPhotoPreviewUrl(supabase, storagePath);

  if (error || !data?.signedUrl) {
    return { ok: false, code: "preview_url_failed" };
  }

  return { ok: true, previewUrl: data.signedUrl };
}

export async function uploadItemPhotoDraft(
  formData: FormData,
): Promise<ItemPhotoDraftUploadResult> {
  const fileValidation = validateItemPhotoFile(formData.get("photo"));

  if (!fileValidation.ok) {
    return fileValidation;
  }

  const supabase = await createClient();
  const context = await getActiveAdminContext(supabase);

  if (!context.ok) {
    return context;
  }

  const { draftId, path } = buildItemPhotoDraftPath({
    filename: fileValidation.file.name,
    householdId: context.householdId,
  });
  const { error: uploadError } = await supabase.storage
    .from(ITEM_PHOTO_BUCKET)
    .upload(path, fileValidation.file, {
      contentType: fileValidation.mimeType,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, code: "upload_failed" };
  }

  const { data, error: previewError } = await createItemPhotoPreviewUrl(
    supabase,
    path,
  );

  if (previewError || !data?.signedUrl) {
    await supabase.storage.from(ITEM_PHOTO_BUCKET).remove([path]);
    return { ok: false, code: "preview_url_failed" };
  }

  return {
    ok: true,
    draftId,
    file: {
      mimeType: fileValidation.mimeType,
      sizeBytes: fileValidation.sizeBytes,
    },
    previewUrl: data.signedUrl,
    storagePath: path,
  };
}

export async function cleanupItemPhotoDraft(
  value: unknown,
): Promise<ItemPhotoDraftCleanupResult> {
  const storagePath = getStringProperty(value, "storagePath");
  const supabase = await createClient();
  const context = await getActiveAdminContext(supabase);

  if (!context.ok) {
    return context;
  }

  if (!isItemPhotoDraftPathForHousehold(storagePath, context.householdId)) {
    return { ok: false, code: "invalid_storage_path" };
  }

  const { error } = await supabase.storage
    .from(ITEM_PHOTO_BUCKET)
    .remove([storagePath]);

  return error ? { ok: false, code: "cleanup_failed" } : { ok: true };
}

export async function analyzeItemPhotoDraft(
  value: unknown,
): Promise<ItemPhotoAnalysisActionResult> {
  const input = getItemPhotoAnalysisInput(value);

  if (!input) {
    return { ok: false, code: "invalid_photo_input" };
  }

  const supabase = await createClient();
  const context = await getActiveAdminContext(supabase);

  if (!context.ok) {
    return context;
  }

  if (!isItemPhotoDraftPathForHousehold(input.storagePath, context.householdId)) {
    return { ok: false, code: "invalid_storage_path" };
  }

  const imageUrl = await createItemPhotoAnalysisImageUrl(
    supabase,
    input.storagePath,
    input.mimeType,
  );

  if (!imageUrl.ok) {
    return imageUrl;
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("category")
    .select("id, nazwa")
    .or(`household_id.is.null,household_id.eq.${context.householdId}`);

  if (categoriesError || !categories) {
    return { ok: false, code: "categories_unavailable" };
  }

  const result = await analyzeItemPhoto({
    ...input,
    imageUrl: imageUrl.imageUrl,
    categories: categories.map((category) => ({
      id: category.id,
      name: category.nazwa,
    })),
    locale: "pl",
  });

  if (!result.ok) {
    return result;
  }

  const categoryIds = new Set(categories.map((category) => category.id));
  const suggestion = categoryIds.has(result.data.categoryId ?? "")
    ? result.data
    : {
        ...result.data,
        categoryId: null,
        categoryConfidence: "none" as const,
        categoryFallbackUsed: true,
      };

  return { ok: true, suggestion };
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
    jednostka: nullableField(formData, "jednostka"),
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
  const submittedPhotoDraft = getItemPhotoDraftForPersistence(formData);
  const photoDraft = submittedPhotoDraft
    ? await validateItemPhotoDraftForPersistence(
        supabase,
        profile.household_id,
        submittedPhotoDraft,
      )
    : null;

  if (submittedPhotoDraft && !photoDraft) {
    redirectWithError("invalid_item_photo");
  }

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
      jednostka: payload.jednostka,
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

  if (photoDraft) {
    const photoPersisted = await persistItemPhoto(supabase, {
      createdById: userId,
      householdId: profile.household_id,
      itemId: item.id,
      draft: photoDraft,
    });

    if (!photoPersisted) {
      await supabase
        .from("item")
        .delete()
        .eq("id", item.id)
        .eq("household_id", profile.household_id);
      redirectWithError("photo_persist_failed");
    }
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
      jednostka: payload.jednostka,
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

export async function deleteItemPermanentlyFromDialog(
  value: unknown,
): Promise<PermanentItemDeletionActionResult> {
  const itemId =
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as { itemId?: unknown }).itemId === "string"
      ? (value as { itemId: string }).itemId.trim()
      : "";

  if (!isValidItemId(itemId)) {
    return { ok: false, code: "invalid_item_id" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_item_permanently", {
    p_item_id: itemId,
  });
  const result = resolvePermanentItemDeletionResult(data, error);

  if (result === "success") {
    revalidatePath(routes.items);
    revalidatePath(routes.dashboard);
  }

  return toPermanentItemDeletionActionResult(result);
}

export async function createQuickCustomCategory(submittedName: string) {
  const result = await createCustomCategoryForActiveAdmin(submittedName);

  if (result.status === "created") {
    revalidatePath(routes.categories);
  }

  return result;
}

export async function copyItem(value: unknown): Promise<CopyActionResult> {
  const parsed = parseCopyItemInput(value);
  if (!parsed.ok) return { ok: false, code: "invalid_copy_input" };

  const supabase = await createClient();
  const profile = await getCopyProfile(supabase);
  if (!profile.ok) return profile;
  if (!canCopyEntity("item", profile.profile.rola)) {
    return { ok: false, code: "copy_not_allowed" };
  }

  const { data, error } = await supabase.rpc("copy_item", {
    p_item_id: parsed.input.itemId,
    p_name: parsed.input.name,
    p_target_storage_location_l3_id: parsed.input.targetStorageId,
  });
  const row = data?.[0];
  if (error || !row?.new_item_id) {
    return { ok: false, code: mapCopyRpcError(error?.message) };
  }

  revalidatePath(routes.items);
  revalidatePath(routes.dashboard);
  return { ok: true, id: row.new_item_id };
}

async function getCopyProfile(supabase: SupabaseClient) {
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { ok: false as const, code: "auth_required" as const };
  }

  const { data: profile, error } = await supabase
    .from("profile")
    .select("rola, status")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile || profile.status !== "aktywny") {
    return { ok: false as const, code: "active_profile_required" as const };
  }

  return { ok: true as const, profile };
}
