import { normalizeTemplateValue } from "../templates/normalize-template-value";

export type CategorySelectionSource = {
  czy_systemowa: boolean;
  household_id: string | null;
  id: string;
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
    .map((category) => ({
      id: category.id,
      isSystem: category.czy_systemowa,
      label: category.nazwa,
    }));
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
