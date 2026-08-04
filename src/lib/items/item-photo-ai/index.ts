import { parseItemPhotoAiConfig } from "./config";
import { getItemPhotoAiProvider } from "./provider";
import type { AnalyzeItemPhotoInput } from "./types";

export type {
  AnalyzeItemPhotoInput,
  ItemPhotoAiErrorCode,
  ItemPhotoAiLocale,
  ItemPhotoAiProviderId,
  ItemPhotoAiResult,
  ItemPhotoAnalysisSuggestion,
  ItemPhotoCategoryConfidence,
  ItemPhotoSuggestionItemType,
  ProviderAnalyzeInput,
} from "./types";
export { parseItemPhotoAiConfig, requireGroqAnalysisConfig } from "./config";
export type { ItemPhotoAiConfig } from "./config";
export { buildItemPhotoAnalysisPrompt } from "./prompt";
export { getItemPhotoAiProvider };
export type { ItemPhotoAiProvider } from "./provider";
export { validateItemPhotoAnalysisSuggestion } from "./schema";

export async function analyzeItemPhoto(
  input: AnalyzeItemPhotoInput,
  env = process.env,
) {
  const config = parseItemPhotoAiConfig(env);

  if (!config.ok) {
    return config;
  }

  const provider = getItemPhotoAiProvider(config.data);
  return provider.analyze(input);
}
