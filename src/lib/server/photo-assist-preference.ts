import type { createClient } from "@/lib/supabase/server";
import { nextPhotoAssistCount, photoAssistCount, shouldShowPhotoAssist } from "@/lib/items/photo-assist-preference";

type Client = Awaited<ReturnType<typeof createClient>>;

// This metadata is only a personal UI preference, never an authorization source.
export async function getPhotoAssistVisibility(client: Client, userId: string, householdId: string): Promise<boolean> {
  try {
    const [{ data: auth, error: authError }, { data: items, error: itemsError }] = await Promise.all([
      client.auth.getUser(),
      client.from("item").select("id").eq("household_id", householdId).eq("created_by_id", userId).limit(3),
    ]);
    if (authError || itemsError || auth.user?.id !== userId || !items) return false;
    return shouldShowPhotoAssist(auth.user.user_metadata, items.length);
  } catch {
    return false;
  }
}

export async function recordPhotoAssistCreation(client: Client, userId: string, householdId: string): Promise<void> {
  const { data, error } = await client.auth.getUser();
  if (error || data.user?.id !== userId) return;
  const metadata = data.user.user_metadata;
  if (metadata.photo_assist_dismissed === true || photoAssistCount(metadata.photo_assist_created) >= 3) return;
  const { data: items, error: itemsError } = await client.from("item").select("id")
    .eq("household_id", householdId).eq("created_by_id", userId).limit(3);
  if (itemsError || !items) return;
  const nextCount = nextPhotoAssistCount(metadata, items.length);
  const { error: updateError } = await client.auth.updateUser({ data: { photo_assist_created: nextCount } });
  if (updateError) console.error("Unable to record photo assistance progress");
}
