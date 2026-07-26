"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

function isLocalDevEnvironment(): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const isLocal = siteUrl.includes("127.0.0.1") || siteUrl.includes("localhost");
  return process.env.NODE_ENV !== "production" && isLocal;
}

function redirectWithStatus(status: string): never {
  redirect(`${routes.settings}?tab=test-data&status=${encodeURIComponent(status)}`);
}

function redirectWithError(error: string): never {
  redirect(`${routes.settings}?tab=test-data&error=${encodeURIComponent(error)}`);
}

export async function generateTestData(formData: FormData) {
  const datasetType = formData.get("dataset_type");

  if (typeof datasetType !== "string" || !datasetType) {
    redirectWithError("invalid_dataset");
  }

  if (!["small", "medium", "deletion_test"].includes(datasetType)) {
    redirectWithError("invalid_dataset");
  }

  if (!isLocalDevEnvironment()) {
    redirectWithError("production_only");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirectWithError("admin_required");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("rola, household_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    redirectWithError("admin_required");
  }

  if (profile.rola !== "admin") {
    redirectWithError("admin_required");
  }

  const { data, error } = await supabase.rpc("generate_test_data", {
    p_dataset_type: datasetType,
  });

  if (error || !data) {
    redirectWithError("action_failed");
  }

  const result = data as Record<string, unknown>;

  if (result?.status !== "success") {
    redirectWithError("action_failed");
  }

  revalidatePath(routes.settings);
  redirectWithStatus("test_data_generated");
}
