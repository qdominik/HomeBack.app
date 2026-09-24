"use server";

import { revalidatePath } from "next/cache";
import {
  assertInvitationRecipientAllowed,
  getInvitationEmailConfig,
  InvitationEmailConfigError,
} from "@/lib/email/config";
import {
  deliverIssuedInvitation,
  InvitationDispatchError,
} from "@/lib/email/invitation-delivery";
import { createEmailTransport } from "@/lib/email/transport";
import { getAppContext } from "@/lib/app-context";
import {
  isInviteRole,
  normalizeInvitationEmail,
  type InviteRole,
} from "@/lib/people/people";
import { areHouseholdInvitationsEnabled } from "@/lib/people/invitations-enabled";
import { routes } from "@/lib/routes";

export type InvitationActionResult =
  | { ok: true; email?: string; message: "sent" | "revoked" | "resent" }
  | { ok: false; error: string };

function mapError(message: string | undefined) {
  if (message?.includes("INVITATION_ALREADY_PENDING")) return "already_pending";
  if (message?.includes("INVITATION_EMAIL_INVALID")) return "invalid_email";
  if (message?.includes("ADMIN_REQUIRED") || message?.includes("INVITATION_NOT_FOUND")) return "not_allowed";
  if (message?.includes("INVITATION_NOT_PENDING")) return "not_pending";
  if (message?.includes("INVITATION_RATE_LIMITED")) return "rate_limited";
  return "technical";
}

function mapConfigError(error: InvitationEmailConfigError) {
  if (error.code === "recipient_not_allowed") return "recipient_not_allowed";
  if (error.code === "production_disabled") return "not_allowed";
  return "email_configuration";
}

function mapDeliveryError(error: InvitationDispatchError) {
  if (error.critical) return "email_compensation_failed";
  if (error.failureClass === "auth") return "email_auth";
  if (error.failureClass === "rate_limit") return "email_rate_limit";
  if (error.failureClass === "timeout") return "email_timeout";
  if (error.failureClass === "rejected") return "email_rejected";
  return "email_transport";
}

async function administratorContext() {
  const context = await getAppContext();
  if (!context.userId || !context.profile || context.profile.status !== "aktywny" || context.profile.rola !== "admin") return null;
  return context;
}

export async function prepareInvitation(emailValue: string, roleValue: string): Promise<InvitationActionResult> {
  if (!areHouseholdInvitationsEnabled()) return { ok: false, error: "not_allowed" };
  const email = normalizeInvitationEmail(emailValue);
  if (!email) return { ok: false, error: "invalid_email" };
  if (!isInviteRole(roleValue)) return { ok: false, error: "invalid_role" };
  let emailConfig;
  try {
    emailConfig = getInvitationEmailConfig();
    assertInvitationRecipientAllowed(emailConfig, email);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof InvitationEmailConfigError
          ? mapConfigError(error)
          : "email_configuration",
    };
  }
  const context = await administratorContext();
  if (!context) return { ok: false, error: "not_allowed" };
  const inviterName = context.profile?.imie;
  if (!inviterName) return { ok: false, error: "not_allowed" };
  const { data, error } = await context.supabase.rpc("create_household_invitation", {
    p_email: email,
    p_target_role: roleValue,
  });
  if (error) return { ok: false, error: mapError(error.message) };
  const issued = data?.[0];
  if (!issued || !context.household) return { ok: false, error: "technical" };

  try {
    await deliverIssuedInvitation({
      compensate: async (failureClass) => {
        const { error: compensationError } = await context.supabase.rpc(
          "compensate_household_invitation_delivery_failure",
          {
            p_failure_class: failureClass,
            p_invitation_id: issued.invitation_id,
          },
        );
        if (compensationError) throw new Error("compensation_failed");
      },
      config: emailConfig,
      email,
      expiresAt: issued.expires_at,
      householdName: context.household.nazwa,
      inviterName,
      role: roleValue,
      token: issued.token,
      transport: createEmailTransport(emailConfig),
    });
  } catch (deliveryError) {
    if (deliveryError instanceof InvitationDispatchError) {
      if (deliveryError.critical) {
        console.error("invitation_delivery_compensation_failed", {
          failureClass: deliveryError.failureClass,
          invitationId: issued.invitation_id,
          stage: "create",
        });
      }
      return { ok: false, error: mapDeliveryError(deliveryError) };
    }
    return { ok: false, error: "email_transport" };
  }
  revalidatePath(routes.family);
  return { ok: true, email, message: "sent" };
}

export async function revokeInvitation(invitationId: string): Promise<InvitationActionResult> {
  if (!areHouseholdInvitationsEnabled()) return { ok: false, error: "not_allowed" };
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(invitationId)) return { ok: false, error: "technical" };
  const context = await administratorContext();
  if (!context) return { ok: false, error: "not_allowed" };
  const { error } = await context.supabase.rpc("revoke_household_invitation", { p_invitation_id: invitationId });
  if (error) return { ok: false, error: mapError(error.message) };
  revalidatePath(routes.family);
  return { ok: true, message: "revoked" };
}

export async function renewInvitation(invitationId: string): Promise<InvitationActionResult> {
  if (!areHouseholdInvitationsEnabled()) return { ok: false, error: "not_allowed" };
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(invitationId)) return { ok: false, error: "technical" };
  const context = await administratorContext();
  if (!context) return { ok: false, error: "not_allowed" };
  const inviterName = context.profile?.imie;
  if (!inviterName) return { ok: false, error: "not_allowed" };
  const { data: invitation } = await context.supabase
    .from("household_invitation")
    .select("email, target_role")
    .eq("id", invitationId)
    .maybeSingle();
  if (!invitation || !context.household) return { ok: false, error: "not_allowed" };

  let emailConfig;
  try {
    emailConfig = getInvitationEmailConfig();
    assertInvitationRecipientAllowed(emailConfig, invitation.email);
  } catch (configError) {
    return {
      ok: false,
      error:
        configError instanceof InvitationEmailConfigError
          ? mapConfigError(configError)
          : "email_configuration",
    };
  }

  const { data, error } = await context.supabase.rpc("renew_household_invitation", {
    p_invitation_id: invitationId,
  });
  if (error) return { ok: false, error: mapError(error.message) };
  const issued = data?.[0];
  if (!issued) return { ok: false, error: "technical" };

  try {
    await deliverIssuedInvitation({
      compensate: async (failureClass) => {
        const { error: compensationError } = await context.supabase.rpc(
          "compensate_household_invitation_delivery_failure",
          {
            p_failure_class: failureClass,
            p_invitation_id: issued.invitation_id,
          },
        );
        if (compensationError) throw new Error("compensation_failed");
      },
      config: emailConfig,
      email: invitation.email,
      expiresAt: issued.expires_at,
      householdName: context.household.nazwa,
      inviterName,
      role: invitation.target_role as InviteRole,
      token: issued.token,
      transport: createEmailTransport(emailConfig),
    });
  } catch (deliveryError) {
    if (deliveryError instanceof InvitationDispatchError) {
      if (deliveryError.critical) {
        console.error("invitation_delivery_compensation_failed", {
          failureClass: deliveryError.failureClass,
          invitationId: issued.invitation_id,
          stage: "renew",
        });
      }
      return { ok: false, error: mapDeliveryError(deliveryError) };
    }
    return { ok: false, error: "email_transport" };
  }
  revalidatePath(routes.family);
  return { ok: true, email: invitation.email, message: "resent" };
}
