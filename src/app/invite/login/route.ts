import { NextResponse, type NextRequest } from "next/server";
import { invitationReturnPath } from "@/lib/auth/return-path";
import { getAppBaseUrl } from "@/lib/email/config";
import { areHouseholdInvitationsEnabled } from "@/lib/people/invitations-enabled";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function loginRedirect(baseUrl: string, error: string, email: string) {
  const url = new URL(routes.login, baseUrl);
  url.searchParams.set("error", error);
  url.searchParams.set("next", invitationReturnPath);
  if (email) url.searchParams.set("email", email);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  if (!areHouseholdInvitationsEnabled()) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  let baseUrl: string;
  try {
    baseUrl = getAppBaseUrl();
  } catch {
    return NextResponse.json({ error: "AUTH_REDIRECT_CONFIGURATION" }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(baseUrl).origin) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return loginRedirect(baseUrl, "missing_fields", "");
  }

  const email = value(formData, "email");
  const password = value(formData, "password");
  if (!email || !password) {
    return loginRedirect(baseUrl, "missing_fields", email);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return loginRedirect(baseUrl, "invalid_credentials", email);
  }

  return NextResponse.redirect(new URL(invitationReturnPath, baseUrl), 303);
}
