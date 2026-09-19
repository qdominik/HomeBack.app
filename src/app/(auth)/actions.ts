"use server";

import { redirect } from "next/navigation";
import { safeAuthReturnPath } from "@/lib/auth/return-path";
import { getAppBaseUrl, InvitationEmailConfigError } from "@/lib/email/config";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";
import type { Database } from "@/types/database";
import { classifySignupResult } from "@/lib/auth/classify-signup-result";

const householdTypes: Database["public"]["Enums"]["household_type"][] = [
  "dom",
  "mieszkanie",
  "garaż",
];

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function redirectWithError(
  path: string,
  error: string,
  fields: { email?: string; next?: string | null } = {},
): never {
  const params = new URLSearchParams({ error });
  if (fields.email) params.set("email", fields.email);
  if (fields.next) params.set("next", fields.next);
  redirect(`${path}?${params.toString()}`);
}

export async function login(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = safeAuthReturnPath(value(formData, "next"));

  if (!email || !password) {
    redirectWithError(routes.login, "missing_fields", { email, next });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithError(routes.login, "invalid_credentials", { email, next });
  }

  redirect(next ?? routes.dashboard);
}

export async function register(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const name = value(formData, "name");
  const next = safeAuthReturnPath(value(formData, "next"));

  if (!email || !password || !name) {
    redirectWithError(routes.register, "missing_fields", { email, next });
  }

  if (password.length < 8) {
    redirectWithError(routes.register, "password_too_short", { email, next });
  }

  let origin: string;
  try {
    origin = getAppBaseUrl();
  } catch (error) {
    if (error instanceof InvitationEmailConfigError) {
      redirectWithError(routes.register, "signup_configuration", { email, next });
    }
    throw error;
  }
  const confirmationUrl = new URL("/auth/confirm", origin);
  if (next) confirmationUrl.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { imie: name },
      emailRedirectTo: confirmationUrl.toString(),
    },
  });

  const signupResult = classifySignupResult({ data, error });
  if (signupResult === "existing_user") {
    redirectWithError(routes.register, "email_already_registered", { email, next });
  }

  if (signupResult === "signup_error") {
    redirectWithError(routes.register, "signup_failed", { email, next });
  }

  const params = new URLSearchParams({ email, status: "check_email" });
  if (next) params.set("next", next);
  redirect(`${routes.register}?${params.toString()}`);
}

export async function createHousehold(formData: FormData) {
  const name = value(formData, "name");
  const householdName = value(formData, "household_name");
  const householdType = value(
    formData,
    "household_type",
  ) as Database["public"]["Enums"]["household_type"];

  if (!name || !householdName || !householdTypes.includes(householdType)) {
    redirectWithError(routes.register, "missing_fields");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    redirectWithError(routes.login, "session_expired");
  }

  const { error } = await supabase.rpc("create_household_with_admin", {
    p_imie: name,
    p_nazwa: householdName,
    p_typ: householdType,
  });

  if (error) {
    redirectWithError(routes.register, "household_failed");
  }

  redirect(routes.dashboard);
}
