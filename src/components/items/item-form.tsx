"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import {
  ITEM_TYPES,
  type ItemType,
  showsItemQuantity,
} from "@/lib/items/item-form-values";
import type {
  ItemCategoryOption,
  ItemLocationSelectorOptions,
} from "@/lib/items/item-options";
import type { Database } from "@/types/database";
import { ItemLocationField } from "./item-location-field";
import { ItemSubmitButton } from "./item-submit-button";

type Item = Database["public"]["Tables"]["item"]["Row"];

type ItemFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: ItemCategoryOption[];
  item?: Item;
  locationOptions: ItemLocationSelectorOptions;
  selectedPositionId?: string | null;
  submitLabel: string;
};

const typeLabels: Record<ItemType, string> = {
  unikalny: t.modules.items.itemTypes.unique,
  zapas: t.modules.items.itemTypes.stock,
  zestaw: t.modules.items.itemTypes.set,
};

export function ItemForm({
  action,
  categories,
  item,
  locationOptions,
  selectedPositionId,
  submitLabel,
}: ItemFormProps) {
  const [itemType, setItemType] = useState<ItemType>(item?.typ ?? "unikalny");
  const initialQuantity = item?.ilosc ?? 1;

  return (
    <form action={action} className="space-y-3">
      {item ? <input name="item_id" type="hidden" value={item.id} /> : null}
      <label className="block text-sm font-medium">
        {t.modules.items.name}
        <input
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          defaultValue={item?.nazwa}
          name="nazwa"
          required
        />
      </label>
      <label className="block text-sm font-medium">
        {t.modules.items.description}
        <textarea
          className="mt-1 min-h-20 w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-primary"
          defaultValue={item?.opis ?? ""}
          name="opis"
        />
      </label>
      <label className="block text-sm font-medium">
        {t.modules.items.itemType}
        <select
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          name="typ"
          onChange={(event) =>
            setItemType(event.currentTarget.value as ItemType)
          }
          value={itemType}
        >
          {ITEM_TYPES.map((type) => (
            <option key={type} value={type}>
              {typeLabels[type]}
            </option>
          ))}
        </select>
      </label>
      {showsItemQuantity(itemType) ? (
        <label className="block text-sm font-medium">
          {t.modules.items.quantity}
          <input
            className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
            defaultValue={initialQuantity}
            key={itemType}
            min="1"
            name="ilosc"
            required
            step="1"
            type="number"
          />
        </label>
      ) : (
        <input name="ilosc" type="hidden" value="1" />
      )}
      <label className="block text-sm font-medium">
        {t.modules.items.category}
        <select
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          defaultValue={item?.category_id ?? ""}
          name="category_id"
          required
        >
          <option disabled value="">
            {t.modules.items.selectCategory}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <ItemLocationField
        options={locationOptions}
        selectedPositionId={selectedPositionId}
      />
      <ItemSubmitButton
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
        label={submitLabel}
        pendingLabel={t.modules.items.saving}
      />
    </form>
  );
}
