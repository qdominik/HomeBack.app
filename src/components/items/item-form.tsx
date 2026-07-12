"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createQuickCustomCategory } from "@/app/(app)/items/actions";
import { t } from "@/lib/i18n";
import {
  ITEM_TYPES,
  type ItemType,
  showsItemQuantity,
} from "@/lib/items/item-form-values";
import {
  getItemLocationFieldKey,
  getItemLocationFieldProps,
  type ItemCategoryOption,
  type ItemLocationSelectorOptions,
} from "@/lib/items/item-options";
import { routes } from "@/lib/routes";
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

const ANOTHER_CATEGORY_VALUE = "__another_category__";

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
  const [availableCategories, setAvailableCategories] = useState(categories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    item?.category_id ?? "",
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [quickCategoryFeedback, setQuickCategoryFeedback] = useState<
    string | null
  >(null);
  const [isQuickCategoryPending, startQuickCategoryTransition] =
    useTransition();
  const initialQuantity = item?.ilosc ?? 1;
  const locationFieldProps = getItemLocationFieldProps(
    locationOptions,
    selectedPositionId,
  );
  const locationFieldKey = getItemLocationFieldKey(
    item?.id,
    selectedPositionId,
  );
  const systemCategories = availableCategories.filter(
    (category) => category.isSystem,
  );
  const customCategories = availableCategories.filter(
    (category) => !category.isSystem,
  );
  const isAnotherCategorySelected =
    selectedCategoryId === ANOTHER_CATEGORY_VALUE;

  function selectCategory(value: string) {
    setSelectedCategoryId(value);
    setQuickCategoryFeedback(null);

    if (value !== ANOTHER_CATEGORY_VALUE) {
      setNewCategoryName("");
    }
  }

  function createQuickCategory() {
    const submittedName = newCategoryName.trim();

    if (!submittedName) {
      setQuickCategoryFeedback(t.modules.items.quickCategoryMissing);
      return;
    }

    startQuickCategoryTransition(async () => {
      const result = await createQuickCustomCategory(submittedName);

      if (result.status === "created" || result.status === "existing") {
        setAvailableCategories((currentCategories) =>
          currentCategories.some(
            (category) => category.id === result.category.id,
          )
            ? currentCategories
            : [
                ...currentCategories,
                {
                  id: result.category.id,
                  isSystem: result.category.isSystem,
                  label: result.category.label,
                },
              ],
        );
        setSelectedCategoryId(result.category.id);
        setNewCategoryName("");
        setQuickCategoryFeedback(
          result.status === "created"
            ? t.modules.items.categoryCreatedAndSelected
            : t.modules.items.categoryAlreadyExists,
        );
        return;
      }

      if (result.status === "missing_fields") {
        setQuickCategoryFeedback(t.modules.items.quickCategoryMissing);
        return;
      }

      if (result.status === "admin_required") {
        setQuickCategoryFeedback(t.modules.items.errors.adminRequired);
        return;
      }

      setQuickCategoryFeedback(t.modules.items.errors.actionFailed);
    });
  }

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
          name="category_id"
          onChange={(event) => selectCategory(event.currentTarget.value)}
          required
          value={selectedCategoryId}
        >
          <option disabled value="">
            {t.modules.items.selectCategory}
          </option>
          <optgroup label={t.modules.items.systemCategories}>
            {systemCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </optgroup>
          <optgroup label={t.modules.items.customCategories}>
            {customCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </optgroup>
          <option value={ANOTHER_CATEGORY_VALUE}>
            {t.modules.items.anotherCategory}
          </option>
        </select>
      </label>
      {isAnotherCategorySelected ? (
        <div className="space-y-2 rounded-md border border-line bg-surface-muted p-3">
          <label className="block text-sm font-medium">
            {t.modules.items.newCategoryName}
            <input
              className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
              onChange={(event) => setNewCategoryName(event.currentTarget.value)}
              value={newCategoryName}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isQuickCategoryPending}
              onClick={createQuickCategory}
              type="button"
            >
              {isQuickCategoryPending
                ? t.modules.items.saving
                : t.modules.items.addQuickCategory}
            </button>
            <Link
              className="text-sm font-semibold text-primary-strong hover:text-primary"
              href={routes.categories}
            >
              {t.modules.items.manageCategories}
            </Link>
          </div>
          {quickCategoryFeedback ? (
            <p className="text-sm text-muted">{quickCategoryFeedback}</p>
          ) : null}
        </div>
      ) : null}
      <ItemLocationField key={locationFieldKey} {...locationFieldProps} />
      <ItemSubmitButton
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isAnotherCategorySelected || isQuickCategoryPending}
        label={submitLabel}
        pendingLabel={t.modules.items.saving}
      />
    </form>
  );
}
