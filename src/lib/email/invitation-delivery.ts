import type { InvitationEmailConfig } from "./config";
import { renderInvitationMessage } from "./invitation-message";
import {
  EmailDeliveryError,
  type EmailFailureClass,
  type EmailTransport,
} from "./transport";
import type { InviteRole } from "../people/people";

export class InvitationDispatchError extends Error {
  constructor(
    readonly failureClass: EmailFailureClass,
    readonly critical: boolean,
  ) {
    super(
      critical
        ? "Invitation delivery and compensation failed"
        : "Invitation delivery failed and was compensated",
    );
    this.name = "InvitationDispatchError";
  }
}

export async function deliverIssuedInvitation(input: {
  compensate: (failureClass: EmailFailureClass) => Promise<void>;
  config: InvitationEmailConfig;
  email: string;
  expiresAt: string;
  householdName: string;
  inviterName: string;
  role: InviteRole;
  token: string;
  transport: EmailTransport;
}) {
  const message = renderInvitationMessage({
    appBaseUrl: input.config.appBaseUrl,
    expiresAt: input.expiresAt,
    householdName: input.householdName,
    inviterName: input.inviterName,
    role: input.role,
    token: input.token,
  });

  try {
    return await input.transport.send({
      from: input.config.from,
      message,
      to: input.email,
    });
  } catch (error) {
    const failureClass =
      error instanceof EmailDeliveryError ? error.failureClass : "transport";
    try {
      await input.compensate(failureClass);
    } catch {
      throw new InvitationDispatchError(failureClass, true);
    }
    throw new InvitationDispatchError(failureClass, false);
  }
}
