"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCustomCategoryForActiveAdmin } from "@/lib/categories/create-custom-category";
import { normalizeCustomCategoryIconKey } from "@/lib/categories/custom-category-icon";
import { isAllowedStoredEntityIcon } from "@/lib/icons/phosphor-icon-server-validation";
import { CUSTOM_TEMPLATE_VALUE } from "@/lib/home/home-template-options";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeTemplateValue,
  resolveTemplateOrCustomValue,
} from "@/lib/templates/normalize-template-value";
import type { Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProfileRole = Database["public"]["Enums"]["profile_role"];
type CategoryRow = Database["public"]["Tables"]["category"]["Row"];

function field(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(error: string): never {
  redirect(`${routes.categories}?error=${encodeURIComponent(error)}`);
}

function redirectWithStatus(status: string): never {
  redirect(`${routes.categories}?status=${encodeURIComponent(status)}`);
}

function parseCategoryName(formData: FormData) {
  const templateValue = field(formData, "nazwa_template");
  const customValue = field(formData, "nazwa_custom");

  if (templateValue || customValue) {
    return resolveTemplateOrCustomValue(
      templateValue,
      customValue,
      CUSTOM_TEMPLATE_VALUE,
    );
  }

  return field(formData, "nazwa") || CUSTOM_TEMPLATE_VALUE;
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

async function visibleCategoriesByName(
  supabase: SupabaseClient,
  name: string,
  excludedCategoryId?: string,
) {
  const { data, error } = await supabase
    .from("category")
    .select("id, household_id, nazwa, czy_systemowa");

  if (error) {
    redirectWithError("action_failed");
  }

  const normalizedName = normalizeTemplateValue(name);

  return (data ?? []).filter(
    (category) =>
      category.id !== excludedCategoryId &&
      normalizeTemplateValue(category.nazwa) === normalizedName,
  );
}

function redirectOnDuplicate(categories: Pick<CategoryRow, "czy_systemowa">[]) {
  if (categories.some((category) => category.czy_systemowa)) {
    redirectWithStatus("category_available");
  }

  if (categories.length > 0) {
    redirectWithStatus("category_exists");
  }
}

export async function createCustomCategory(formData: FormData) {
  const result = await createCustomCategoryForActiveAdmin(
    parseCategoryName(formData),
    field(formData, "ikona"),
  );

  if (result.status === "created") {
    revalidatePath(routes.categories);
    redirectWithStatus("category_created");
  }

  if (result.status === "existing") {
    redirectWithStatus(
      result.category.isSystem ? "category_available" : "category_exists",
    );
  }

  if (result.status === "missing_fields") {
    redirectWithError("missing_fields");
  }

  if (result.status === "admin_required") {
    redirectWithError("admin_required");
  }

  if (result.status === "session_expired") {
    redirect(`${routes.login}?error=session_expired`);
  }

  if (result.status === "household_required") {
    redirect(`${routes.register}?step=household`);
  }

  redirectWithError("action_failed");
}

export async function updateCustomCategory(formData: FormData) {
  const categoryId = field(formData, "category_id");
  const nazwa = parseCategoryName(formData);
  const submittedIcon = field(formData, "ikona");
  const ikona = isAllowedStoredEntityIcon(submittedIcon)
    ? submittedIcon
    : normalizeCustomCategoryIconKey(submittedIcon);

  if (!categoryId || !nazwa) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const duplicates = await visibleCategoriesByName(supabase, nazwa, categoryId);
  redirectOnDuplicate(duplicates);

  const { data, error } = await supabase
    .from("category")
    .update({ ikona, nazwa })
    .eq("id", categoryId)
    .eq("household_id", profile.household_id)
    .eq("czy_systemowa", false)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isUniqueViolation(error)) {
      redirectWithStatus("category_exists");
    }

    redirectWithError("action_failed");
  }

  if (!data) {
    redirectWithError("action_failed");
  }

  revalidatePath(routes.categories);
  redirectWithStatus("category_updated");
}

export async function deleteCustomCategory(formData: FormData) {
  const categoryId = field(formData, "category_id");

  if (!categoryId) {
    redirectWithError("missing_fields");
  }

  const supabase = await createClient();
  const profile = await getActiveProfile(supabase);
  requireAdmin(profile.rola);

  const { count, error: countError } = await supabase
    .from("item")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (countError) {
    redirectWithError("action_failed");
  }

  if ((count ?? 0) > 0) {
    redirectWithError("category_in_use");
  }

  const { data, error } = await supabase
    .from("category")
    .delete()
    .eq("id", categoryId)
    .eq("household_id", profile.household_id)
    .eq("czy_systemowa", false)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirectWithError("action_failed");
  }

  revalidatePath(routes.categories);
  redirectWithStatus("category_deleted");
}
