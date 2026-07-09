import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.url;
  return NextResponse.redirect(new URL(routes.login, siteUrl), 303);
}
