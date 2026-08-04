import { requireGroqAnalysisConfig, type ItemPhotoAiConfig } from "../config";
import type { ItemPhotoAiProvider } from "../provider";

export function createGroqItemPhotoAiProvider(
  config: ItemPhotoAiConfig,
): ItemPhotoAiProvider {
  return {
    id: "groq",
    async analyze(input) {
      const ready = requireGroqAnalysisConfig(config);

      if (!ready.ok) {
        return ready;
      }

      void input;
      void ready.data;

      return { ok: false, code: "provider_not_implemented" };
    },
  };
}
