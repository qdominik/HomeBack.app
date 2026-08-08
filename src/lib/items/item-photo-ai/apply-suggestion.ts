import type { ItemPhotoAnalysisSuggestion } from "./types";

const UNKNOWN_ITEM_NAME_PATTERNS = new Set([
  "nieznany przedmiot",
  "nieznana rzecz",
  "nierozpoznany przedmiot",
  "nierozpoznana rzecz",
  "brak rozpoznania",
  "unknown item",
  "unknown object",
  "unrecognized item",
  "unrecognized object",
]);

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s{2,}/g, " ");
}

export function isItemPhotoUnknownName(name: string) {
  return UNKNOWN_ITEM_NAME_PATTERNS.has(normalizeName(name));
}

export function isItemPhotoWeakSuggestion(
  suggestion: Pick<
    ItemPhotoAnalysisSuggestion,
    "nazwa" | "categoryConfidence"
  >,
) {
  if (suggestion.categoryConfidence === "none") {
    return true;
  }

  if (suggestion.nazwa === null || suggestion.nazwa.trim() === "") {
    return true;
  }

  return isItemPhotoUnknownName(suggestion.nazwa);
}

export function shouldApplyItemPhotoSuggestionName(
  currentName: string,
  suggestionName: string | null,
) {
  if (suggestionName === null || suggestionName.trim() === "") {
    return false;
  }

  if (isItemPhotoUnknownName(suggestionName)) {
    return currentName.trim() === "";
  }

  return true;
}
