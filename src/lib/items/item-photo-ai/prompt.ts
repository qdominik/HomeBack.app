import type { AnalyzeItemPhotoInput } from "./types";

const LOCALE_INSTRUCTIONS = {
  en: "Return user-facing text in English.",
  pl: "Return user-facing text in Polish.",
} as const;

export function buildItemPhotoAnalysisPrompt(input: AnalyzeItemPhotoInput) {
  const categories = input.categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return [
    "Analyze the item photo and return only JSON matching the requested schema.",
    LOCALE_INSTRUCTIONS[input.locale],
    "Suggest values only. The user must approve all changes before anything is saved.",
    "Use categoryId only when it matches one of the provided categories.",
    "If the category is uncertain, set categoryId to null and categoryConfidence to none or low.",
    "Allowed typ values are unikalny, zapas, zestaw, or null.",
    "The JSON object must contain exactly: nazwa, opis, categoryId, categoryConfidence, categoryFallbackUsed, typ, ilosc, jednostka, userMessage.",
    `Categories: ${JSON.stringify(categories)}`,
  ].join("\n");
}
