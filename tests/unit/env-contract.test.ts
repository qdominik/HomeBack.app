import assert from "node:assert/strict";
import test from "node:test";
import {
  detectAppEnvironment,
  validateRuntimeEnvironment,
} from "../../src/lib/runtime/environment";

const base = {
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_DEV_ORIGIN: "http://127.0.0.1:3000",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test-key",
};

test("environment detection separates local, preview, and production", () => {
  assert.equal(detectAppEnvironment({}), "local");
  assert.equal(detectAppEnvironment({ VERCEL_ENV: "preview" }), "preview");
  assert.equal(detectAppEnvironment({ VERCEL_ENV: "production" }), "production");
});

test("partial Supabase configuration is rejected without exposing values", () => {
  const result = validateRuntimeEnvironment({
    NEXT_PUBLIC_SITE_URL: base.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_DEV_ORIGIN: base.NEXT_PUBLIC_DEV_ORIGIN,
    NEXT_PUBLIC_SUPABASE_URL: base.NEXT_PUBLIC_SUPABASE_URL,
  });

  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.errors.join(" "), /required/);
});

test("legacy and canonical public keys cannot silently diverge", () => {
  const result = validateRuntimeEnvironment({
    ...base,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_different-key",
  });

  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.errors.join(" "), /must match/);
});

test("production and preview site URLs are explicit", () => {
  const production = validateRuntimeEnvironment({
    ...base,
    VERCEL_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://my.homeback.app",
    NEXT_PUBLIC_DEV_ORIGIN: "",
  });
  const preview = validateRuntimeEnvironment({
    ...base,
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_SITE_URL: "https://preview.homeback.app",
    NEXT_PUBLIC_DEV_ORIGIN: "",
  });

  assert.equal(production.ok, true);
  assert.equal(preview.ok, true);
});

test("preview cannot use the production site URL", () => {
  const result = validateRuntimeEnvironment({
    ...base,
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_SITE_URL: "https://my.homeback.app",
    NEXT_PUBLIC_DEV_ORIGIN: "",
  });

  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.errors.join(" "), /Preview NEXT_PUBLIC_SITE_URL/);
});

test("JWT anon keys with a project ref must match the Supabase URL", () => {
  const encode = (value: string) => Buffer.from(value).toString("base64url");
  const mismatchedJwt = [
    encode(JSON.stringify({ alg: "HS256" })),
    encode(JSON.stringify({ iss: "https://project-b.supabase.co/auth/v1" })),
    "signature-with-enough-length-for-shape-check",
  ].join(".");
  const result = validateRuntimeEnvironment({
    ...base,
    NEXT_PUBLIC_SUPABASE_URL: "https://project-a.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: mismatchedJwt,
  });

  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.errors.join(" "), /different projects/);
});
