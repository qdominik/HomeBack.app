import { normalizeInvitationEmail } from "../people/people";

export const invitationSender = "HomeBack <noreply@homeback.app>";

export type InvitationEmailTransportMode = "smtp" | "mailpit";

export type SmtpConfig = {
  host: string;
  password: string;
  port: number;
  secure: boolean;
  user: string;
};

export type InvitationEmailConfig = {
  allowlist: ReadonlySet<string>;
  appBaseUrl: string;
  environment: "local" | "preview";
  from: string;
  smtp: SmtpConfig | null;
  transport: InvitationEmailTransportMode;
};

export class InvitationEmailConfigError extends Error {
  readonly code:
    | "invalid_config"
    | "production_disabled"
    | "recipient_not_allowed";

  constructor(
    code: InvitationEmailConfigError["code"],
    message: string,
  ) {
    super(message);
    this.name = "InvitationEmailConfigError";
    this.code = code;
  }
}

function required(
  env: Record<string, string | undefined>,
  key: string,
): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new InvitationEmailConfigError(
      "invalid_config",
      `Missing server configuration: ${key}`,
    );
  }
  return value;
}

export function getAppBaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const raw = required(env, "APP_BASE_URL");
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw new InvitationEmailConfigError(
      "invalid_config",
      "APP_BASE_URL must be an absolute URL",
    );
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new InvitationEmailConfigError(
      "invalid_config",
      "APP_BASE_URL must contain only an http(s) origin",
    );
  }

  const isLocal = ["127.0.0.1", "localhost"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocal) {
    throw new InvitationEmailConfigError(
      "invalid_config",
      "APP_BASE_URL must use HTTPS outside local development",
    );
  }

  return url.origin;
}

function parseAllowlist(value: string | undefined) {
  const entries = new Set<string>();
  for (const candidate of value?.split(",") ?? []) {
    const email = normalizeInvitationEmail(candidate);
    if (!email) {
      throw new InvitationEmailConfigError(
        "invalid_config",
        "INVITATION_EMAIL_ALLOWLIST contains an invalid address",
      );
    }
    entries.add(email);
  }
  return entries;
}

function parsePort(value: string) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new InvitationEmailConfigError(
      "invalid_config",
      "SMTP_PORT must be an integer between 1 and 65535",
    );
  }
  return port;
}

function parseSecure(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new InvitationEmailConfigError(
    "invalid_config",
    "SMTP_SECURE must be true or false",
  );
}

export function getInvitationEmailConfig(
  env: Record<string, string | undefined> = process.env,
): InvitationEmailConfig {
  const appBaseUrl = getAppBaseUrl(env);
  const appHost = new URL(appBaseUrl).hostname;
  if (env.VERCEL_ENV === "production" || appHost === "my.homeback.app") {
    throw new InvitationEmailConfigError(
      "production_disabled",
      "Invitation delivery is disabled in Production",
    );
  }

  const environment = env.VERCEL_ENV === "preview" ? "preview" : "local";
  const transport = (env.INVITATION_EMAIL_TRANSPORT ?? "smtp") as
    InvitationEmailTransportMode;
  const allowlist = parseAllowlist(env.INVITATION_EMAIL_ALLOWLIST);

  if (transport === "mailpit") {
    if (env.VERCEL_ENV || env.E2E_SMTP_MOCK !== "true") {
      throw new InvitationEmailConfigError(
        "invalid_config",
        "Mailpit transport is limited to an explicit local E2E environment",
      );
    }
    return {
      allowlist,
      appBaseUrl,
      environment,
      from: invitationSender,
      smtp: null,
      transport,
    };
  }

  if (transport !== "smtp") {
    throw new InvitationEmailConfigError(
      "invalid_config",
      "INVITATION_EMAIL_TRANSPORT must be smtp or mailpit",
    );
  }

  const from = required(env, "SMTP_FROM");
  if (from !== invitationSender) {
    throw new InvitationEmailConfigError(
      "invalid_config",
      `SMTP_FROM must be ${invitationSender}`,
    );
  }

  if (environment === "preview" && allowlist.size === 0) {
    throw new InvitationEmailConfigError(
      "invalid_config",
      "Preview SMTP requires INVITATION_EMAIL_ALLOWLIST",
    );
  }

  return {
    allowlist,
    appBaseUrl,
    environment,
    from,
    smtp: {
      host: required(env, "SMTP_HOST"),
      password: required(env, "SMTP_PASSWORD"),
      port: parsePort(required(env, "SMTP_PORT")),
      secure: parseSecure(required(env, "SMTP_SECURE")),
      user: required(env, "SMTP_USER"),
    },
    transport,
  };
}

export function assertInvitationRecipientAllowed(
  config: InvitationEmailConfig,
  email: string,
) {
  if (
    config.environment === "preview" &&
    config.transport === "smtp" &&
    !config.allowlist.has(email)
  ) {
    throw new InvitationEmailConfigError(
      "recipient_not_allowed",
      "Recipient is not on the Preview invitation allowlist",
    );
  }
}
