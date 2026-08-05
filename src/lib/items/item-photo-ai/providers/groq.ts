import { requireGroqAnalysisConfig, type ItemPhotoAiConfig } from "../config";
import type { ItemPhotoAiProvider } from "../provider";
import { buildItemPhotoAnalysisPrompt } from "../prompt";
import { validateItemPhotoAnalysisSuggestion } from "../schema";

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";

function createGroqRequestBody(
  input: Parameters<ItemPhotoAiProvider["analyze"]>[0],
  model: string,
  useJsonResponseFormat: boolean,
) {
  return {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildItemPhotoAnalysisPrompt(input) },
          {
            type: "image_url",
            image_url: { url: input.imageUrl },
          },
        ],
      },
    ],
    ...(useJsonResponseFormat
      ? { response_format: { type: "json_object" } }
      : {}),
    temperature: 0,
  };
}

function getGroqResponseContent(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const content = (value as GroqChatCompletionResponse).choices?.[0]?.message
    ?.content;

  return typeof content === "string" ? content : null;
}

export function createGroqItemPhotoAiProvider(
  config: ItemPhotoAiConfig,
  fetchImplementation: typeof fetch = fetch,
): ItemPhotoAiProvider {
  return {
    id: "groq",
    async analyze(input) {
      const ready = requireGroqAnalysisConfig(config);

      if (!ready.ok) {
        return ready;
      }

      let response: Response;

      try {
        response = await fetchImplementation(GROQ_CHAT_COMPLETIONS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ready.data.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createGroqRequestBody(input, ready.data.model, true)),
        });

        if (response.status === 400 || response.status === 422) {
          response = await fetchImplementation(GROQ_CHAT_COMPLETIONS_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ready.data.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              createGroqRequestBody(input, ready.data.model, false),
            ),
          });
        }
      } catch {
        return { ok: false, code: "provider_request_failed" };
      }

      if (!response.ok) {
        return { ok: false, code: "provider_request_failed" };
      }

      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        return { ok: false, code: "invalid_model_response" };
      }

      const content = getGroqResponseContent(payload);

      if (!content) {
        return { ok: false, code: "invalid_model_response" };
      }

      try {
        return validateItemPhotoAnalysisSuggestion(JSON.parse(content));
      } catch {
        return { ok: false, code: "invalid_model_response" };
      }

    },
  };
}
