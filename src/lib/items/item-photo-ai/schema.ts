import type {
  ItemPhotoAnalysisSuggestion,
  ItemPhotoAiResult,
  ItemPhotoCategoryConfidence,
  ItemPhotoSuggestionItemType,
} from "./types";

const CATEGORY_CONFIDENCE_VALUES = new Set<ItemPhotoCategoryConfidence>([
  "high",
  "medium",
  "low",
  "none",
]);

const ITEM_TYPE_VALUES = new Set<ItemPhotoSuggestionItemType>([
  "unikalny",
  "zapas",
  "zestaw",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNullableNumber(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function isCategoryConfidence(
  value: unknown,
): value is ItemPhotoCategoryConfidence {
  return (
    typeof value === "string" &&
    CATEGORY_CONFIDENCE_VALUES.has(value as ItemPhotoCategoryConfidence)
  );
}

function isNullableItemType(
  value: unknown,
): value is ItemPhotoSuggestionItemType | null {
  return (
    value === null ||
    (typeof value === "string" &&
      ITEM_TYPE_VALUES.has(value as ItemPhotoSuggestionItemType))
  );
}

export function validateItemPhotoAnalysisSuggestion(
  value: unknown,
): ItemPhotoAiResult<ItemPhotoAnalysisSuggestion> {
  if (!isRecord(value)) {
    return { ok: false, code: "invalid_model_response" };
  }

  if (
    !isNullableString(value.nazwa) ||
    !isNullableString(value.opis) ||
    !isNullableString(value.categoryId) ||
    !isCategoryConfidence(value.categoryConfidence) ||
    typeof value.categoryFallbackUsed !== "boolean" ||
    !isNullableItemType(value.typ) ||
    !isNullableNumber(value.ilosc) ||
    !isNullableString(value.jednostka) ||
    !isNullableString(value.userMessage)
  ) {
    return { ok: false, code: "invalid_model_response" };
  }

  return {
    ok: true,
    data: {
      nazwa: value.nazwa,
      opis: value.opis,
      categoryId: value.categoryId,
      categoryConfidence: value.categoryConfidence,
      categoryFallbackUsed: value.categoryFallbackUsed,
      typ: value.typ,
      ilosc: value.ilosc,
      jednostka: value.jednostka,
      userMessage: value.userMessage,
    },
  };
}
