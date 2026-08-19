import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";
import { getConfiguredSiteUrl } from "@/lib/site-url";

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  const siteUrl = getConfiguredSiteUrl();

  if (!siteUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL is not configured." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(new URL(routes.login, siteUrl), 303);
}
