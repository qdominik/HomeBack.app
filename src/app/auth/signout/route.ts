import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";
import { getRuntimeConfig } from "@/lib/runtime/environment";

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  return NextResponse.redirect(
    new URL(routes.login, getRuntimeConfig().siteUrl),
    303,
  );
}
