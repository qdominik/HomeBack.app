import type { Database } from "../../types/database";

export const ITEM_VIEW_VALUES = ["all", "unlocated", "archived"] as const;

export type ItemView = (typeof ITEM_VIEW_VALUES)[number];
export type ItemViewSearchParams = Record<string, string | string[] | undefined>;

type ItemViewFilterItem = {
  id: string;
  status: Database["public"]["Enums"]["item_status"];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseItemView(params: ItemViewSearchParams): ItemView {
  const candidate = firstValue(params.view)?.trim().toLowerCase();

  return ITEM_VIEW_VALUES.includes(candidate as ItemView)
    ? (candidate as ItemView)
    : "all";
}

export function filterItemsForView<TItem extends ItemViewFilterItem>(
  items: readonly TItem[],
  primaryLocationByItemId: ReadonlyMap<string, string>,
  view: ItemView,
) {
  if (view === "archived") {
    return items.filter((item) => item.status === "archiwalne");
  }

  const activeItems = items.filter((item) => item.status !== "archiwalne");

  if (view === "unlocated") {
    return activeItems.filter((item) => !primaryLocationByItemId.has(item.id));
  }

  return activeItems;
}
