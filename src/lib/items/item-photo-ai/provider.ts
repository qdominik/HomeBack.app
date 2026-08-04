import type { ItemPhotoAiConfig } from "./config";
import { createGroqItemPhotoAiProvider } from "./providers/groq";
import type {
  ItemPhotoAnalysisSuggestion,
  ItemPhotoAiProviderId,
  ItemPhotoAiResult,
  ProviderAnalyzeInput,
} from "./types";

export type ItemPhotoAiProvider = {
  id: ItemPhotoAiProviderId;
  analyze(
    input: ProviderAnalyzeInput,
  ): Promise<ItemPhotoAiResult<ItemPhotoAnalysisSuggestion>>;
};

export function getItemPhotoAiProvider(
  config: ItemPhotoAiConfig,
): ItemPhotoAiProvider {
  return createGroqItemPhotoAiProvider(config);
}
