import assert from "node:assert/strict";
import test from "node:test";
import { classifySignupResult } from "../../src/lib/auth/classify-signup-result";

const confirmedIdentity = [{ identity_id: "identity-1" }];

test("new user with no session is a valid confirmation-required signup", () => {
  assert.equal(
    classifySignupResult({
      data: { user: { identities: confirmedIdentity }, session: null },
      error: null,
    }),
    "new_user_confirmation_required",
  );
});

test("user_already_exists is classified as an existing user", () => {
  assert.equal(
    classifySignupResult({
      data: null,
      error: { code: "user_already_exists", message: "already exists" },
    }),
    "existing_user",
  );
});

test("the controlled Supabase text fallback identifies an existing user", () => {
  assert.equal(
    classifySignupResult({
      data: null,
      error: { message: "User already registered" },
    }),
    "existing_user",
  );
});

test("a masked user with empty identities is an existing user", () => {
  assert.equal(
    classifySignupResult({
      data: { user: { identities: [] }, session: null },
      error: null,
    }),
    "existing_user",
  );
});

test("ordinary Supabase errors remain signup errors", () => {
  assert.equal(
    classifySignupResult({
      data: null,
      error: { code: "over_email_send_rate_limit", message: "rate limited" },
    }),
    "signup_error",
  );
});

test("missing user without an error is a safe signup error", () => {
  assert.equal(
    classifySignupResult({ data: { user: null, session: null }, error: null }),
    "signup_error",
  );
});

test("session null alone does not identify an existing user", () => {
  assert.equal(
    classifySignupResult({
      data: { user: { identities: confirmedIdentity }, session: null },
      error: null,
    }),
    "new_user_confirmation_required",
  );
});

test("a session-bearing signup is a successful signup", () => {
  assert.equal(
    classifySignupResult({
      data: {
        user: { identities: confirmedIdentity },
        session: { access_token: "token" },
      },
      error: null,
    }),
    "new_user_confirmation_required",
  );
});
