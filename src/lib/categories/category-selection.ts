import { normalizeTemplateValue } from "../templates/normalize-template-value";

export const SYSTEM_OTHER_CATEGORY_KEY = "other";

export type CategorySelectionSource = {
  czy_systemowa: boolean;
  household_id: string | null;
  id: string;
  key?: string | null;
  nazwa: string;
};

export type ItemCategorySelectionOption = {
  id: string;
  isSystem: boolean;
  label: string;
};

export function getItemCategoryOptions(
  categories: CategorySelectionSource[],
  householdId: string | null | undefined,
): ItemCategorySelectionOption[] {
  return categories
    .filter(
      (category) =>
        (category.czy_systemowa && category.household_id === null) ||
        (!category.czy_systemowa && category.household_id === householdId),
    )
    .sort((left, right) => {
      if (left.czy_systemowa !== right.czy_systemowa) {
        return left.czy_systemowa ? -1 : 1;
      }

      const leftIsOther =
        left.czy_systemowa && left.key === SYSTEM_OTHER_CATEGORY_KEY;
      const rightIsOther =
        right.czy_systemowa && right.key === SYSTEM_OTHER_CATEGORY_KEY;

      return Number(leftIsOther) - Number(rightIsOther);
    })
    .map((category) => ({
      id: category.id,
      isSystem: category.czy_systemowa,
      label: category.nazwa,
    }));
}

export function getDefaultItemCategoryId(
  categories: CategorySelectionSource[],
) {
  return (
    categories.find(
      (category) =>
        category.czy_systemowa &&
        category.household_id === null &&
        category.key === SYSTEM_OTHER_CATEGORY_KEY,
    )?.id ?? null
  );
}

export function resolveInitialItemCategoryId(
  itemCategoryId: string | null | undefined,
  defaultCategoryId: string | null | undefined,
) {
  return itemCategoryId ?? defaultCategoryId ?? "";
}

export function findMatchingCategory(
  categories: CategorySelectionSource[],
  submittedName: string,
) {
  const normalizedName = normalizeTemplateValue(submittedName);

  if (!normalizedName) {
    return null;
  }

  return (
    categories.find(
      (category) =>
        normalizeTemplateValue(category.nazwa) === normalizedName,
    ) ?? null
  );
}
