import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";
import { getConfiguredSiteUrl } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const supabase = await createClient();

  let error: Error | null = null;

  if (tokenHash && type) {
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

  if (error) {
    const { data: claimsData } = await supabase.auth.getClaims();

    if (claimsData?.claims?.sub) {
      error = null;
    }
  }

  const redirectUrl = getConfiguredSiteUrl();

  if (!redirectUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL is not configured." },
      { status: 500 },
    );
  }

  if (error) {
    redirectUrl.pathname = routes.login;
    redirectUrl.searchParams.set("error", "confirmation_failed");
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.pathname = routes.register;
  redirectUrl.searchParams.set("step", "household");
  return NextResponse.redirect(redirectUrl);
}
