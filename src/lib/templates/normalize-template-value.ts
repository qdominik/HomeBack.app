export function normalizeTemplateValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0142/g, "l")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function resolveTemplateOrCustomValue(
  templateValue: string,
  customValue: string,
  fallback: string,
) {
  const selectedValue = templateValue.trim();
  const trimmedCustomValue = customValue.trim();

  if (!selectedValue) {
    return trimmedCustomValue || fallback;
  }

  if (
    normalizeTemplateValue(selectedValue) ===
    normalizeTemplateValue(fallback)
  ) {
    return trimmedCustomValue || fallback;
  }

  return selectedValue;
}

export function findTemplateOption(
  value: string,
  options: readonly string[],
) {
  const normalizedValue = normalizeTemplateValue(value);

  if (!normalizedValue) {
    return null;
  }

  return (
    options.find(
      (option) => normalizeTemplateValue(option) === normalizedValue,
    ) ?? null
  );
}

export function shouldApplyInferredTemplate(
  userTouched: boolean,
  hasInitialValue: boolean,
) {
  return !userTouched && !hasInitialValue;
}
