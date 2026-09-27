import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  // Stay on the current app origin, including Preview aliases and local ports.
  return new NextResponse(null, { status: 303, headers: { Location: routes.login } });
}
