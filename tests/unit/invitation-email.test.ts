import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { safeAuthReturnPath } from "../../src/lib/auth/return-path";
import {
  assertInvitationRecipientAllowed,
  getAppBaseUrl,
  getInvitationEmailConfig,
  invitationSender,
  InvitationEmailConfigError,
  type InvitationEmailConfig,
} from "../../src/lib/email/config";
import {
  deliverIssuedInvitation,
  InvitationDispatchError,
} from "../../src/lib/email/invitation-delivery";
import {
  createInvitationAcceptanceUrl,
  renderInvitationMessage,
} from "../../src/lib/email/invitation-message";
import {
  classifySmtpError,
  EmailDeliveryError,
  type EmailTransport,
} from "../../src/lib/email/transport";
import { isInvitationToken } from "../../src/lib/people/invitation-session";

const smtpEnv = {
  APP_BASE_URL: "https://preview.homeback.app",
  INVITATION_EMAIL_ALLOWLIST: "allowed@example.com",
  INVITATION_EMAIL_TRANSPORT: "smtp",
  SMTP_FROM: invitationSender,
  SMTP_HOST: "mail.example.com",
  SMTP_PASSWORD: "secret",
  SMTP_PORT: "465",
  SMTP_SECURE: "true",
  SMTP_USER: "noreply@example.com",
  VERCEL_ENV: "preview",
};

const dispatchConfig: InvitationEmailConfig = {
  allowlist: new Set(),
  appBaseUrl: "https://preview.homeback.app",
  environment: "preview",
  from: invitationSender,
  smtp: null,
  transport: "mailpit",
};

const dispatchInput = {
  config: dispatchConfig,
  email: "allowed@example.com",
  expiresAt: "2026-09-21T10:00:00.000Z",
  householdName: "Dom",
  inviterName: "Ada",
  role: "dorosły" as const,
  token: "a".repeat(64),
};

test("APP_BASE_URL accepts an explicit safe origin only", () => {
  assert.equal(getAppBaseUrl({ APP_BASE_URL: "https://preview.example.com" }), "https://preview.example.com");
  assert.equal(getAppBaseUrl({ APP_BASE_URL: "http://localhost:3000" }), "http://localhost:3000");
  assert.throws(() => getAppBaseUrl({ APP_BASE_URL: "http://preview.example.com" }), InvitationEmailConfigError);
  assert.throws(() => getAppBaseUrl({ APP_BASE_URL: "https://preview.example.com/path" }), InvitationEmailConfigError);
});

test("Preview SMTP uses the fixed sender and recipient allowlist", () => {
  const config = getInvitationEmailConfig(smtpEnv);
  assert.equal(config.from, invitationSender);
  assert.equal(config.smtp?.secure, true);
  assert.doesNotThrow(() => assertInvitationRecipientAllowed(config, "allowed@example.com"));
  assert.throws(
    () => assertInvitationRecipientAllowed(config, "other@example.com"),
    (error: unknown) => error instanceof InvitationEmailConfigError && error.code === "recipient_not_allowed",
  );
});

test("application invitation delivery is blocked in Production", () => {
  assert.throws(
    () => getInvitationEmailConfig({ ...smtpEnv, APP_BASE_URL: "https://my.homeback.app", VERCEL_ENV: "production" }),
    (error: unknown) => error instanceof InvitationEmailConfigError && error.code === "production_disabled",
  );
});

test("Mailpit transport requires the explicit local E2E gate", () => {
  assert.equal(
    getInvitationEmailConfig({
      APP_BASE_URL: "http://127.0.0.1:3000",
      E2E_SMTP_MOCK: "true",
      INVITATION_EMAIL_TRANSPORT: "mailpit",
    }).transport,
    "mailpit",
  );
  assert.throws(
    () => getInvitationEmailConfig({ APP_BASE_URL: "http://127.0.0.1:3000", INVITATION_EMAIL_TRANSPORT: "mailpit" }),
    InvitationEmailConfigError,
  );
});

test("invitation token stays in the URL fragment and HTML content is escaped", () => {
  const token = "b".repeat(64);
  const url = createInvitationAcceptanceUrl("https://preview.homeback.app", token);
  assert.equal(url, `https://preview.homeback.app/invite/accept#token=${token}`);
  assert.equal(new URL(url).search, "");

  const message = renderInvitationMessage({
    appBaseUrl: "https://preview.homeback.app",
    expiresAt: "2026-09-21T10:00:00.000Z",
    householdName: "<Dom>",
    inviterName: "Ada & Jan",
    role: "dziecko",
    token,
  });
  assert.match(message.html, /&lt;Dom&gt;/);
  assert.match(message.html, /Ada &amp; Jan/);
  assert.doesNotMatch(message.html, /<Dom>/);
  assert.match(message.text, /48 godzin/);
});

test("SMTP failures are reduced to stable non-sensitive classes", () => {
  assert.equal(classifySmtpError({ code: "EAUTH", responseCode: 535 }), "auth");
  assert.equal(classifySmtpError({ code: "ETIMEDOUT" }), "timeout");
  assert.equal(classifySmtpError({ responseCode: 452 }), "rate_limit");
  assert.equal(classifySmtpError({ responseCode: 550 }), "rejected");
  assert.equal(classifySmtpError(new Error("contains provider details")), "transport");
});

test("SMTP acceptance does not trigger compensation", async () => {
  let compensationCalls = 0;
  const transport: EmailTransport = {
    async send() {
      return { status: "accepted_by_smtp" };
    },
  };

  assert.deepEqual(
    await deliverIssuedInvitation({
      ...dispatchInput,
      compensate: async () => {
        compensationCalls += 1;
      },
      transport,
    }),
    { status: "accepted_by_smtp" },
  );
  assert.equal(compensationCalls, 0);
});

test("failed delivery is compensated and exposes no provider message", async () => {
  const compensated: string[] = [];
  const transport: EmailTransport = {
    async send() {
      throw new EmailDeliveryError("rejected");
    },
  };

  await assert.rejects(
    deliverIssuedInvitation({
      ...dispatchInput,
      compensate: async (failureClass) => {
        compensated.push(failureClass);
      },
      transport,
    }),
    (error: unknown) =>
      error instanceof InvitationDispatchError &&
      error.failureClass === "rejected" &&
      error.critical === false &&
      !error.message.includes(dispatchInput.email) &&
      !error.message.includes(dispatchInput.token),
  );
  assert.deepEqual(compensated, ["rejected"]);
});

test("compensation failure is marked critical without leaking message content", async () => {
  const transport: EmailTransport = {
    async send() {
      throw new Error("smtp response and recipient details");
    },
  };

  await assert.rejects(
    deliverIssuedInvitation({
      ...dispatchInput,
      compensate: async () => {
        throw new Error("database details");
      },
      transport,
    }),
    (error: unknown) =>
      error instanceof InvitationDispatchError &&
      error.failureClass === "transport" &&
      error.critical === true &&
      !error.message.includes(dispatchInput.email) &&
      !error.message.includes(dispatchInput.token),
  );
});

test("auth return paths and invitation tokens reject open redirects and malformed secrets", () => {
  assert.equal(safeAuthReturnPath("/invite/accept"), "/invite/accept");
  assert.equal(safeAuthReturnPath("https://evil.example"), null);
  assert.equal(safeAuthReturnPath("//evil.example"), null);
  assert.equal(isInvitationToken("c".repeat(64)), true);
  assert.equal(isInvitationToken("C".repeat(64)), false);
  assert.equal(isInvitationToken("c".repeat(63)), false);
});

test("critical diagnostic logs contain identifiers and classifications only", () => {
  const source = readFileSync("src/app/(app)/family/actions.ts", "utf8");
  const logs = [...source.matchAll(/console\.error\("invitation_delivery_compensation_failed", \{([\s\S]*?)\}\);/g)];
  assert.equal(logs.length, 2);
  for (const [, fields] of logs) {
    assert.match(fields, /failureClass:/);
    assert.match(fields, /invitationId:/);
    assert.match(fields, /stage:/);
    assert.doesNotMatch(fields, /email|password|token|message/i);
  }
});
