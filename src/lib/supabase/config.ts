import { getRuntimeConfig } from "@/lib/runtime/environment";

export function getSupabaseConfig() {
  const config = getRuntimeConfig();

  return {
    publishableKey: config.supabasePublishableKey,
    url: config.supabaseUrl,
  };
}

