export type AppEnvironment = "local" | "preview" | "production";

export type RuntimeEnv = Record<string, string | undefined>;

export type RuntimeConfig = {
  environment: AppEnvironment;
  siteUrl: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  devOrigin?: string;
};

type ValidationResult =
  | { ok: true; config: RuntimeConfig }
  | { ok: false; errors: string[] };

const PLACEHOLDER_VALUES = new Set([
  "",
  "change-me",
  "changeme",
  "example",
  "replace-me",
  "your-value",
]);

function read(env: RuntimeEnv, name: string) {
  return env[name]?.trim() ?? "";
}

function isPlaceholder(value: string) {
  const normalized = value.toLowerCase();
  return (
    PLACEHOLDER_VALUES.has(normalized) ||
    normalized.includes("<your-") ||
    normalized.includes("<supabase_") ||
    normalized.includes("placeholder")
  );
}

function parseHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function isValidPublicKey(value: string) {
  if (isPlaceholder(value)) return false;
  if (value.startsWith("sb_")) return value.length > 10;
  return value.split(".").length === 3 && value.length > 40;
}

function projectRefFromUrl(url: URL | null) {
  return url?.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/)?.[1] ?? null;
}

function projectRefFromJwt(value: string) {
  const parts = value.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded)) as { iss?: unknown };
    return typeof payload.iss === "string"
      ? payload.iss.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\//)?.[1] ?? null
      : null;
  } catch {
    return null;
  }
}

export function detectAppEnvironment(env: RuntimeEnv = process.env) {
  if (env.VERCEL_ENV === "production") return "production" as const;
  if (env.VERCEL_ENV === "preview") return "preview" as const;
  return "local" as const;
}

export function validateRuntimeEnvironment(
  env: RuntimeEnv = process.env,
): ValidationResult {
  const environment = detectAppEnvironment(env);
  const siteUrlValue = read(env, "NEXT_PUBLIC_SITE_URL");
  const supabaseUrlValue = read(env, "NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = read(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const publishableKey = read(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const devOriginValue = read(env, "NEXT_PUBLIC_DEV_ORIGIN");
  const errors: string[] = [];

  if (!siteUrlValue || isPlaceholder(siteUrlValue)) {
    errors.push("NEXT_PUBLIC_SITE_URL is required");
  }

  const siteUrl = parseHttpUrl(siteUrlValue);
  if (siteUrlValue && !siteUrl) {
    errors.push("NEXT_PUBLIC_SITE_URL must be an absolute http(s) URL");
  }

  if (!supabaseUrlValue || isPlaceholder(supabaseUrlValue)) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is required");
  }

  const supabaseUrl = parseHttpUrl(supabaseUrlValue);
  if (supabaseUrlValue && !supabaseUrl) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must be an absolute http(s) URL");
  }

  if (anonKey && publishableKey && anonKey !== publishableKey) {
    errors.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must match when both are set",
    );
  }

  const selectedKey = publishableKey || anonKey;
  if (!selectedKey) {
    errors.push(
      "one of NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required",
    );
  } else if (!isValidPublicKey(selectedKey)) {
    errors.push("Supabase public key is empty, a placeholder, or malformed");
  }

  const urlProjectRef = projectRefFromUrl(supabaseUrl);
  const keyProjectRef = projectRefFromJwt(selectedKey);
  if (urlProjectRef && keyProjectRef && urlProjectRef !== keyProjectRef) {
    errors.push("Supabase URL and public key belong to different projects");
  }

  if (environment === "local") {
    if (!devOriginValue || isPlaceholder(devOriginValue)) {
      errors.push("NEXT_PUBLIC_DEV_ORIGIN is required for Local");
    } else if (!parseHttpUrl(devOriginValue)) {
      errors.push("NEXT_PUBLIC_DEV_ORIGIN must be an absolute http(s) URL");
    }
  }

  if (environment === "production" && siteUrl?.origin !== "https://my.homeback.app") {
    errors.push("Production NEXT_PUBLIC_SITE_URL must be https://my.homeback.app");
  }

  if (
    environment === "preview" &&
    (!siteUrl || siteUrl.origin === "https://my.homeback.app" || siteUrl.hostname === "localhost")
  ) {
    errors.push("Preview NEXT_PUBLIC_SITE_URL must be a dedicated non-production URL");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    config: {
      environment,
      siteUrl: siteUrlValue,
      supabaseUrl: supabaseUrlValue,
      supabasePublishableKey: selectedKey,
      ...(devOriginValue ? { devOrigin: devOriginValue } : {}),
    },
  };
}

export function getRuntimeConfig(env: RuntimeEnv = process.env): RuntimeConfig {
  const result = validateRuntimeEnvironment(env);

  if (!result.ok) {
    throw new Error(`Invalid HomeBack environment configuration: ${result.errors.join("; ")}`);
  }

  return result.config;
}
