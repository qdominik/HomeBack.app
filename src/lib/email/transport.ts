import nodemailer, { type SentMessageInfo, type Transporter } from "nodemailer";
import type { InvitationEmailConfig } from "./config";
import type { InvitationMessage } from "./invitation-message";

export type EmailFailureClass =
  | "auth"
  | "rate_limit"
  | "rejected"
  | "timeout"
  | "transport";

export class EmailDeliveryError extends Error {
  readonly failureClass: EmailFailureClass;

  constructor(failureClass: EmailFailureClass) {
    super(`SMTP delivery failed: ${failureClass}`);
    this.name = "EmailDeliveryError";
    this.failureClass = failureClass;
  }
}

export type AcceptedEmail = {
  status: "accepted_by_smtp";
};

export interface EmailTransport {
  send(input: {
    from: string;
    message: InvitationMessage;
    to: string;
  }): Promise<AcceptedEmail>;
}

type SmtpErrorLike = {
  code?: unknown;
  command?: unknown;
  responseCode?: unknown;
};

export function classifySmtpError(error: unknown): EmailFailureClass {
  const candidate = (error ?? {}) as SmtpErrorLike;
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const responseCode =
    typeof candidate.responseCode === "number" ? candidate.responseCode : 0;

  if (code === "EAUTH" || responseCode === 530 || responseCode === 535) {
    return "auth";
  }
  if (["ETIMEDOUT", "ESOCKET", "ECONNECTION"].includes(code)) {
    return "timeout";
  }
  if (responseCode === 421 || responseCode === 452) return "rate_limit";
  if (responseCode >= 500 && responseCode < 600) return "rejected";
  return "transport";
}

function acceptedAddresses(info: SentMessageInfo) {
  const accepted = Array.isArray(info.accepted) ? info.accepted : [];
  return accepted.map((entry: unknown) =>
    typeof entry === "string" ? entry.toLowerCase() : "",
  );
}

class NodemailerEmailTransport implements EmailTransport {
  constructor(private readonly transporter: Transporter) {}

  async send(input: {
    from: string;
    message: InvitationMessage;
    to: string;
  }): Promise<AcceptedEmail> {
    try {
      const info = await this.transporter.sendMail({
        disableFileAccess: true,
        disableUrlAccess: true,
        from: input.from,
        html: input.message.html,
        subject: input.message.subject,
        text: input.message.text,
        to: input.to,
      });

      if (!acceptedAddresses(info).includes(input.to.toLowerCase())) {
        throw new EmailDeliveryError("rejected");
      }
      return { status: "accepted_by_smtp" };
    } catch (error) {
      if (error instanceof EmailDeliveryError) throw error;
      throw new EmailDeliveryError(classifySmtpError(error));
    }
  }
}

export function createEmailTransport(
  config: InvitationEmailConfig,
): EmailTransport {
  if (config.transport === "mailpit") {
    return new NodemailerEmailTransport(
      nodemailer.createTransport({
        connectionTimeout: 5_000,
        debug: false,
        host: "127.0.0.1",
        logger: false,
        port: 54_325,
        secure: false,
        socketTimeout: 10_000,
      }),
    );
  }

  if (!config.smtp) throw new EmailDeliveryError("transport");
  return new NodemailerEmailTransport(
    nodemailer.createTransport({
      auth: {
        pass: config.smtp.password,
        user: config.smtp.user,
      },
      connectionTimeout: 10_000,
      debug: false,
      greetingTimeout: 10_000,
      host: config.smtp.host,
      logger: false,
      port: config.smtp.port,
      requireTLS: !config.smtp.secure,
      secure: config.smtp.secure,
      socketTimeout: 15_000,
      tls: {
        rejectUnauthorized: true,
        servername: config.smtp.host,
      },
    }),
  );
}
