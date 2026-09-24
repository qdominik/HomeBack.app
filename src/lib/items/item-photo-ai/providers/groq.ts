import { requireGroqAnalysisConfig, type ItemPhotoAiConfig } from "../config";
import type { ItemPhotoAiProvider } from "../provider";
import { buildItemPhotoAnalysisPrompt } from "../prompt";
import { validateItemPhotoAnalysisSuggestion } from "../schema";
import {
  createItemPhotoAnalysisRequestId,
  logItemPhotoAnalysisDiagnostic,
  type ItemPhotoAnalysisDiagnosticLogger,
  type ItemPhotoAnalysisErrorClassification,
} from "../diagnostics";

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
const TRANSIENT_RETRY_DELAY_MS = 250;

type GroqProviderDependencies = {
  logDiagnostic?: ItemPhotoAnalysisDiagnosticLogger;
  sleep?: (ms: number) => Promise<void>;
};

function createGroqRequestBody(
  input: Parameters<ItemPhotoAiProvider["analyze"]>[0],
  model: string,
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
    response_format: { type: "json_object" },
    temperature: 0,
  };
}

function getProviderError(status: number) {
  switch (status) {
    case 400:
    case 422:
      return {
        code: "provider_invalid_request" as const,
        classification: "provider_invalid_request" as const,
      };
    case 401:
      return {
        code: "provider_unauthorized" as const,
        classification: "provider_unauthorized" as const,
      };
    case 403:
      return {
        code: "provider_forbidden" as const,
        classification: "provider_forbidden" as const,
      };
    case 404:
      return {
        code: "provider_model_not_found" as const,
        classification: "provider_model_not_found" as const,
      };
    case 413:
      return {
        code: "image_too_large" as const,
        classification: "image_too_large" as const,
      };
    case 429:
      return {
        code: "provider_rate_limited" as const,
        classification: "provider_rate_limited" as const,
      };
    default:
      return status >= 500
        ? {
            code: "provider_server_error" as const,
            classification: "provider_server_error" as const,
          }
        : {
            code: "provider_request_failed" as const,
            classification: "unknown_provider_error" as const,
          };
  }
}

function shouldRetry(status: number) {
  return status === 429 || status >= 500;
}

function getExceptionName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

function getExceptionError(error: unknown) {
  const exceptionName = getExceptionName(error);
  const isTimeout = exceptionName === "AbortError" || exceptionName === "TimeoutError";

  return {
    code: isTimeout ? ("provider_timeout" as const) : ("provider_request_failed" as const),
    classification: isTimeout
      ? ("provider_timeout" as const)
      : ("unknown_provider_error" as const),
    exceptionName,
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
  dependencies: GroqProviderDependencies = {},
): ItemPhotoAiProvider {
  const logDiagnostic = dependencies.logDiagnostic ?? logItemPhotoAnalysisDiagnostic;
  const sleep = dependencies.sleep ?? ((ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  return {
    id: "groq",
    async analyze(input) {
      const requestId = input.requestId ?? createItemPhotoAnalysisRequestId();
      const startedAt = Date.now();
      const ready = requireGroqAnalysisConfig(config);

      if (!ready.ok) {
        logDiagnostic({
          requestId,
          stage: "config_validation",
          provider: "groq",
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          durationMs: Date.now() - startedAt,
          classification: "configuration_missing",
          retry: false,
        });
        return ready;
      }

      logDiagnostic({
        requestId,
        stage: "config_validation",
        provider: "groq",
        model: ready.data.model,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        durationMs: Date.now() - startedAt,
        retry: false,
      });

      let response: Response | null = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const retry = attempt > 0;
        const requestStartedAt = Date.now();
        logDiagnostic({
          requestId,
          stage: "provider_request",
          provider: "groq",
          model: ready.data.model,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          retry,
        });

        try {
          response = await fetchImplementation(GROQ_CHAT_COMPLETIONS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ready.data.apiKey}`,
            "Content-Type": "application/json",
          },
            body: JSON.stringify(createGroqRequestBody(input, ready.data.model)),
          });
        } catch (error) {
          const failure = getExceptionError(error);
          logDiagnostic({
            requestId,
            stage: "provider_response",
            provider: "groq",
            model: ready.data.model,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            durationMs: Date.now() - requestStartedAt,
            classification: failure.classification,
            exceptionName: failure.exceptionName,
            retry,
          });

          if (!retry) {
            await sleep(TRANSIENT_RETRY_DELAY_MS);
            continue;
          }

          return { ok: false, code: failure.code };
        }

        const failure = response.ok ? null : getProviderError(response.status);
        logDiagnostic({
          requestId,
          stage: "provider_response",
          provider: "groq",
          model: ready.data.model,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          durationMs: Date.now() - requestStartedAt,
          httpStatus: response.status,
          responseContentType: response.headers.get("content-type"),
          classification: failure?.classification,
          retry,
        });

        if (response.ok || !shouldRetry(response.status) || retry) {
          break;
        }

        await sleep(TRANSIENT_RETRY_DELAY_MS);
      }

      if (!response?.ok) {
        return { ok: false, code: getProviderError(response?.status ?? 0).code };
      }

      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        logDiagnostic({
          requestId,
          stage: "response_parse",
          provider: "groq",
          model: ready.data.model,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          classification: "response_not_json",
          retry: false,
        });
        return { ok: false, code: "response_not_json" };
      }

      const content = getGroqResponseContent(payload);

      if (!content) {
        logDiagnostic({
          requestId,
          stage: "response_parse",
          provider: "groq",
          model: ready.data.model,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          classification: "response_schema_invalid",
          retry: false,
        });
        return { ok: false, code: "response_schema_invalid" };
      }

      try {
        const parsed = JSON.parse(content);
        const result = validateItemPhotoAnalysisSuggestion(parsed);

        if (!result.ok) {
          logDiagnostic({
            requestId,
            stage: "schema_validation",
            provider: "groq",
            model: ready.data.model,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            classification: "response_schema_invalid",
            retry: false,
          });
          return { ok: false, code: "response_schema_invalid" };
        }

        logDiagnostic({
          requestId,
          stage: "schema_validation",
          provider: "groq",
          model: ready.data.model,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          retry: false,
        });
        return result;
      } catch {
        logDiagnostic({
          requestId,
          stage: "response_parse",
          provider: "groq",
          model: ready.data.model,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          classification: "response_not_json",
          retry: false,
        });
        return { ok: false, code: "response_not_json" };
      }

    },
  };
}
