import type { ItemPhotoAnalysisSuggestion } from "./types";

const UNKNOWN_ITEM_NAMES = new Set([
  "nieznany przedmiot", "nieznana rzecz", "nierozpoznany przedmiot",
  "nierozpoznana rzecz", "brak rozpoznania", "unknown item", "unknown object",
  "unrecognized item", "unrecognized object",
]);

export function isItemPhotoWeakSuggestion(
  suggestion: Pick<ItemPhotoAnalysisSuggestion, "nazwa" | "categoryConfidence">,
) {
  const name = suggestion.nazwa?.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();
  return !name || UNKNOWN_ITEM_NAMES.has(name) ||
    suggestion.categoryConfidence === "low" ||
    suggestion.categoryConfidence === "none";
}

export function resolveItemPhotoSuggestionName(
  currentName: string,
  suggestion: Pick<ItemPhotoAnalysisSuggestion, "nazwa" | "categoryConfidence">,
  editedDuringAnalysis: boolean,
) {
  if (editedDuringAnalysis || !suggestion.nazwa?.trim()) return currentName;
  if (currentName.trim() && isItemPhotoWeakSuggestion(suggestion)) return currentName;
  return suggestion.nazwa;
}
