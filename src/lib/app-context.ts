import { cache } from "react";
import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

type Profile = Pick<
  Database["public"]["Tables"]["profile"]["Row"],
  "household_id" | "imie" | "rola" | "status"
>;

type Household = Pick<
  Database["public"]["Tables"]["household"]["Row"],
  "id" | "nazwa"
>;

export type AppContext = {
  household: Household | null;
  profile: Profile | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string | null;
};

// React cache scopes this result to the current server render.
export const getAppContext = cache(async (): Promise<AppContext> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;

  if (!userId) {
    return { household: null, profile: null, supabase, userId: null };
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("household_id, imie, rola, status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return { household: null, profile: null, supabase, userId };
  }

  const { data: household } = await supabase
    .from("household")
    .select("id, nazwa")
    .eq("id", profile.household_id)
    .maybeSingle();

  return { household, profile, supabase, userId };
});
