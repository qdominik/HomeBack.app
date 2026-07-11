import type { Database } from "../../types/database";

export const ITEM_TYPES = ["unikalny", "zapas", "zestaw"] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export function parseItemType(value: string): ItemType | null {
  return ITEM_TYPES.includes(value as ItemType) ? (value as ItemType) : null;
}

export function showsItemQuantity(type: ItemType) {
  return type !== "unikalny";
}

export function resolveItemQuantity(
  type: ItemType,
  submittedValue: string,
): number | null {
  if (type === "unikalny") {
    return 1;
  }

  const value = submittedValue.trim() || "1";

  if (!/^[1-9][0-9]*$/.test(value)) {
    return null;
  }

  const quantity = Number(value);

  return Number.isSafeInteger(quantity) ? quantity : null;
}

export type DatabaseItemType = Database["public"]["Enums"]["item_type"];
