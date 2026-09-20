import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";
import { safeAuthReturnPath } from "@/lib/auth/return-path";
import { getAppBaseUrl } from "@/lib/email/config";
import { getConfirmationError } from "@/lib/auth/confirmation-error";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const next = safeAuthReturnPath(request.nextUrl.searchParams.get("next"));
  const callbackError = getConfirmationError(request.nextUrl.searchParams);
  const supabase = await createClient();

  let error: Error | null = null;

  if (callbackError) {
    error = new Error(callbackError);
  } else if (tokenHash && type) {
    const otpType = type === "email" ? "signup" : type;
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    error = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else {
    error = new Error("Missing confirmation token");
  }

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(getAppBaseUrl());
  } catch {
    return NextResponse.json({ error: "AUTH_REDIRECT_CONFIGURATION" }, { status: 503 });
  }

  if (error) {
    redirectUrl.pathname = routes.login;
    redirectUrl.searchParams.set("error", error?.message === "confirmation_expired" ? "confirmation_expired" : "confirmation_failed");
    if (next) redirectUrl.searchParams.set("next", next);
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.pathname = next ?? routes.register;
  if (!next) redirectUrl.searchParams.set("step", "household");
  return NextResponse.redirect(redirectUrl);
}
