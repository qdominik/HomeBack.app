import type {
  ItemPhotoAiProviderId,
  ItemPhotoAiResult,
} from "./types";

export type ItemPhotoAiConfig = {
  provider: ItemPhotoAiProviderId;
  groqApiKey: string | null;
  model: string | null;
};

type ItemPhotoAiEnv = Record<string, string | undefined>;

function cleanOptionalEnvValue(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

export function parseItemPhotoAiConfig(
  env: ItemPhotoAiEnv = process.env,
): ItemPhotoAiResult<ItemPhotoAiConfig> {
  const provider = cleanOptionalEnvValue(env["ITEM_PHOTO_AI_PROVIDER"]) ?? "groq";

  if (provider !== "groq") {
    return { ok: false, code: "unsupported_provider" };
  }

  return {
    ok: true,
    data: {
      provider,
      groqApiKey: cleanOptionalEnvValue(env["GROQ_API_KEY"]),
      model: cleanOptionalEnvValue(env["ITEM_PHOTO_AI_MODEL"]),
    },
  };
}

export function requireGroqAnalysisConfig(
  config: ItemPhotoAiConfig,
): ItemPhotoAiResult<{ apiKey: string; model: string }> {
  if (!config.groqApiKey) {
    return { ok: false, code: "missing_api_key" };
  }

  if (!config.model) {
    return { ok: false, code: "missing_model" };
  }

  return {
    ok: true,
    data: {
      apiKey: config.groqApiKey,
      model: config.model,
    },
  };
}
