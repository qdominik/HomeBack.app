import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { normalizeCustomCategoryIconKey } from "./custom-category-icon";
import { findMatchingCategory } from "./category-selection";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProfileRole = Database["public"]["Enums"]["profile_role"];

export type CreatedCategory = {
  id: string;
  isSystem: boolean;
  label: string;
};

export type CreateCustomCategoryResult =
  | {
      category: CreatedCategory;
      status: "created" | "existing";
    }
  | {
      status:
        | "action_failed"
        | "admin_required"
        | "household_required"
        | "missing_fields"
        | "session_expired";
    };

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

function toCreatedCategory(category: {
  czy_systemowa: boolean;
  id: string;
  nazwa: string;
}): CreatedCategory {
  return {
    id: category.id,
    isSystem: category.czy_systemowa,
    label: category.nazwa,
  };
}

async function getActiveProfile(supabase: SupabaseClient) {
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { profile: null, status: "session_expired" as const };
  }

  const { data: profile, error } = await supabase
    .from("profile")
    .select("household_id, rola")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return { profile: null, status: "household_required" as const };
  }

  return { profile, status: null };
}

async function visibleCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("category")
    .select("id, household_id, nazwa, czy_systemowa");

  return { categories: data ?? [], error };
}

export async function createCustomCategoryForActiveAdmin(
  submittedName: string,
  submittedIconKey?: unknown,
): Promise<CreateCustomCategoryResult> {
  const nazwa = submittedName.trim();
  const ikona = normalizeCustomCategoryIconKey(submittedIconKey);

  if (!nazwa) {
    return { status: "missing_fields" };
  }

  const supabase = await createClient();
  const profileResult = await getActiveProfile(supabase);

  if (!profileResult.profile) {
    return { status: profileResult.status ?? "action_failed" };
  }

  if ((profileResult.profile.rola as ProfileRole) !== "admin") {
    return { status: "admin_required" };
  }

  const initialCategories = await visibleCategories(supabase);

  if (initialCategories.error) {
    return { status: "action_failed" };
  }

  const existingCategory = findMatchingCategory(
    initialCategories.categories,
    nazwa,
  );

  if (existingCategory) {
    return {
      category: toCreatedCategory(existingCategory),
      status: "existing",
    };
  }

  const { data: createdCategory, error: insertError } = await supabase
    .from("category")
    .insert({
      czy_systemowa: false,
      household_id: profileResult.profile.household_id,
      ikona,
      key: null,
      nazwa,
      widoczna_dla_dzieci: true,
    })
    .select("id, nazwa, czy_systemowa")
    .maybeSingle();

  if (!insertError && createdCategory) {
    return {
      category: toCreatedCategory(createdCategory),
      status: "created",
    };
  }

  if (!isUniqueViolation(insertError)) {
    return { status: "action_failed" };
  }

  const categoriesAfterConflict = await visibleCategories(supabase);

  if (categoriesAfterConflict.error) {
    return { status: "action_failed" };
  }

  const conflictedCategory = findMatchingCategory(
    categoriesAfterConflict.categories,
    nazwa,
  );

  return conflictedCategory
    ? {
        category: toCreatedCategory(conflictedCategory),
        status: "existing",
      }
    : { status: "action_failed" };
}
