"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";
import type { Database } from "@/types/database";

const householdTypes: Database["public"]["Enums"]["household_type"][] = [
  "dom",
  "mieszkanie",
  "garaż",
];

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function redirectWithError(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

export async function login(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");

  if (!email || !password) {
    redirectWithError(routes.login, "missing_fields");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithError(routes.login, "invalid_credentials");
  }

  redirect(routes.dashboard);
}

export async function register(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const name = value(formData, "name");

  if (!email || !password || !name) {
    redirectWithError(routes.register, "missing_fields");
  }

  if (password.length < 8) {
    redirectWithError(routes.register, "password_too_short");
  }

  const requestHeaders = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    requestHeaders.get("origin") ??
    "http://127.0.0.1:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { imie: name },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    redirectWithError(routes.register, "signup_failed");
  }

  redirect(`${routes.register}?status=check_email`);
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
