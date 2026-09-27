import type { ItemPhotoAllowedMimeType } from "../item-photo-storage";

export type ItemPhotoAnalysisDiagnosticStage =
  | "config_validation"
  | "signed_url_fetch"
  | "image_validation"
  | "image_encoding"
  | "provider_request"
  | "provider_response"
  | "response_parse"
  | "schema_validation"
  | "form_mapping";

export type ItemPhotoAnalysisErrorClassification =
  | "configuration_missing"
  | "storage_fetch_failed"
  | "unsupported_mime"
  | "image_too_large"
  | "provider_unauthorized"
  | "provider_forbidden"
  | "provider_model_not_found"
  | "provider_invalid_request"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_server_error"
  | "response_not_json"
  | "response_schema_invalid"
  | "unknown_provider_error";

export type ItemPhotoAnalysisDiagnosticEvent = {
  requestId: string;
  stage: ItemPhotoAnalysisDiagnosticStage;
  provider: "groq";
  model?: string;
  mimeType?: ItemPhotoAllowedMimeType;
  sizeBytes?: number;
  durationMs?: number;
  httpStatus?: number;
  responseContentType?: string | null;
  classification?: ItemPhotoAnalysisErrorClassification;
  exceptionName?: string;
  retry?: boolean;
};

export type ItemPhotoAnalysisDiagnosticLogger = (
  event: ItemPhotoAnalysisDiagnosticEvent,
) => void;

export function createItemPhotoAnalysisRequestId() {
  return crypto.randomUUID();
}

/**
 * Keep the log schema deliberately allow-listed. Never add request payloads,
 * URLs, prompts, image data, credentials, or provider response bodies here.
 */
export const logItemPhotoAnalysisDiagnostic: ItemPhotoAnalysisDiagnosticLogger = (
  event,
) => {
  console.info("item_photo_analysis_diagnostic", event);
};
