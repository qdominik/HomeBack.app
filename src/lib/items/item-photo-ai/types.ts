import type { ItemPhotoAllowedMimeType } from "../item-photo-storage";

export type ItemPhotoAiProviderId = "groq";
export type ItemPhotoAiLocale = "pl" | "en";
export type ItemPhotoCategoryConfidence = "high" | "medium" | "low" | "none";
export type ItemPhotoSuggestionItemType = "unikalny" | "zapas" | "zestaw";

export type ItemPhotoAnalysisSuggestion = {
  nazwa: string | null;
  opis: string | null;
  categoryId: string | null;
  categoryConfidence: ItemPhotoCategoryConfidence;
  categoryFallbackUsed: boolean;
  typ: ItemPhotoSuggestionItemType | null;
  ilosc: number | null;
  jednostka: string | null;
  userMessage: string | null;
};

export type AnalyzeItemPhotoInput = {
  /** Server-only, short-lived URL created after Storage authorization. */
  imageUrl: string;
  storagePath: string;
  mimeType: ItemPhotoAllowedMimeType;
  sizeBytes: number;
  categories: Array<{ id: string; name: string }>;
  locale: ItemPhotoAiLocale;
};

export type ItemPhotoAiErrorCode =
  | "invalid_model_response"
  | "missing_api_key"
  | "missing_model"
  | "provider_timeout"
  | "provider_request_failed"
  | "provider_not_implemented"
  | "unsupported_provider";

export type ItemPhotoAiResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ItemPhotoAiErrorCode };

export type ProviderAnalyzeInput = AnalyzeItemPhotoInput;
