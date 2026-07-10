import { normalizeTemplateValue } from "./normalize-template-value";

type TemplateAliases = Partial<Record<string, readonly string[]>>;

function containsTemplateValue(source: string, candidate: string) {
  const normalizedCandidate = normalizeTemplateValue(candidate);

  if (!normalizedCandidate) {
    return false;
  }

  return ` ${source} `.includes(` ${normalizedCandidate} `);
}

export function inferTemplateOption(
  value: string,
  templateOptions: readonly string[],
  customOption: string,
  aliases: TemplateAliases = {},
) {
  const normalizedValue = normalizeTemplateValue(value);

  if (!normalizedValue) {
    return null;
  }

  const sortedOptions = [...templateOptions]
    .filter(
      (option) =>
        normalizeTemplateValue(option) !== normalizeTemplateValue(customOption),
    )
    .sort(
      (left, right) =>
        normalizeTemplateValue(right).length -
        normalizeTemplateValue(left).length,
    );

  return (
    sortedOptions.find((option) => {
      const candidates = [option, ...(aliases[option] ?? [])];

      return candidates.some((candidate) =>
        containsTemplateValue(normalizedValue, candidate),
      );
    }) ?? null
  );
}
