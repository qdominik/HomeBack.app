"use server";

import { getAppContext } from "@/lib/app-context";
import { loadSearchSources } from "@/lib/global-search/load-sources";
import { GLOBAL_SEARCH_LIMIT, parseGlobalSearchFilter, searchGlobalSources, type GlobalSearchResponse } from "@/lib/global-search/search";
import { resolveItemIconKey } from "@/lib/icons/item-icon-resolution";
import { buildItemSearchLocationPath, DASHBOARD_ITEM_SEARCH_LIMIT, getItemNameSearchQuery, normalizeItemSearchQuery, normalizeItemSearchText, type DashboardItemSearchResponse } from "@/lib/items/item-search";
import { isItemPhotoFinalPathForHousehold, ITEM_PHOTO_BUCKET, ITEM_PHOTO_SIGNED_URL_TTL_SECONDS } from "@/lib/items/item-photo-storage";

export async function searchGlobalObjects(rawQuery: string, rawFilter: string = "all"): Promise<GlobalSearchResponse> {
  if (typeof rawQuery !== "string") return { kind: "error" };
  const query = normalizeItemSearchQuery(rawQuery);
  if (!normalizeItemSearchText(getItemNameSearchQuery(query))) return { kind: "empty" };
  const filter = parseGlobalSearchFilter(rawFilter);
  try {
    const { profile, household, userId, supabase } = await getAppContext();
    const householdId = profile?.household_id;
    if (!userId || !householdId || household?.id !== householdId || profile.status !== "aktywny") return { kind: "error" };
    const sources = await loadSearchSources(supabase, householdId, query, filter);
    const matches = searchGlobalSources(sources, householdId, query, filter);
    const items = new Map(sources.items.map((item) => [item.id, item]));
    const results = await Promise.all(matches.slice(0, GLOBAL_SEARCH_LIMIT).map(async (result) => {
      if (result.type !== "item") return result;
      const item = items.get(result.id)!;
      let previewUrl: string | null = null;
      if ((profile.rola === "admin" || profile.rola === "domownik") && item.miniatura_url && isItemPhotoFinalPathForHousehold(item.miniatura_url, householdId)) {
        const { data, error } = await supabase.storage.from(ITEM_PHOTO_BUCKET)
          .createSignedUrl(item.miniatura_url, ITEM_PHOTO_SIGNED_URL_TTL_SECONDS);
        previewUrl = error ? null : data?.signedUrl ?? null;
      }
      return { ...result, icon: resolveItemIconKey({ categoryKey: item.category?.key }), previewUrl };
    }));
    return { kind: "success", query, filter, results, total: matches.length };
  } catch {
    return { kind: "error" };
  }
}

// Preserve the existing item-only response contract for other callers.
export async function searchDashboardItems(rawQuery: string): Promise<DashboardItemSearchResponse> {
  const response = await searchGlobalObjects(rawQuery, "item");
  if (response.kind !== "success") return response;
  return {
    kind: "success", query: response.query,
    results: response.results.slice(0, DASHBOARD_ITEM_SEARCH_LIMIT).map((result) => ({
      id: result.id, name: result.name,
      iconKey: resolveItemIconKey({ itemIconKey: result.icon }),
      previewUrl: result.previewUrl ?? null,
      location: buildItemSearchLocationPath({ roomName: result.breadcrumb[0], storageName: result.breadcrumb[1], positionName: result.breadcrumb[2] }),
    })),
  };
}
