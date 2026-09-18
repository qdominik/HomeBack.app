"use server";

import { revalidatePath } from "next/cache";
import { getAppContext } from "@/lib/app-context";
import { isInviteRole, normalizeInvitationEmail } from "@/lib/people/people";
import { routes } from "@/lib/routes";

export type InvitationActionResult = { ok: true; message: "prepared" | "revoked" | "renewed" } | { ok: false; error: string };

function mapError(message: string | undefined) {
  if (message?.includes("INVITATION_ALREADY_PENDING")) return "already_pending";
  if (message?.includes("INVITATION_EMAIL_INVALID")) return "invalid_email";
  if (message?.includes("ADMIN_REQUIRED") || message?.includes("INVITATION_NOT_FOUND")) return "not_allowed";
  if (message?.includes("INVITATION_NOT_PENDING")) return "not_pending";
  return "technical";
}

async function administratorContext() {
  const context = await getAppContext();
  if (!context.userId || !context.profile || context.profile.status !== "aktywny" || context.profile.rola !== "admin") return null;
  return context;
}

export async function prepareInvitation(emailValue: string, roleValue: string): Promise<InvitationActionResult> {
  const email = normalizeInvitationEmail(emailValue);
  if (!email) return { ok: false, error: "invalid_email" };
  if (!isInviteRole(roleValue)) return { ok: false, error: "invalid_role" };
  const context = await administratorContext();
  if (!context) return { ok: false, error: "not_allowed" };
  const { error } = await context.supabase.rpc("create_household_invitation", { p_email: email, p_target_role: roleValue });
  // The RPC returns a raw token for the later email delivery layer. Never return it to the client.
  if (error) return { ok: false, error: mapError(error.message) };
  revalidatePath(routes.family);
  return { ok: true, message: "prepared" };
}

export async function revokeInvitation(invitationId: string): Promise<InvitationActionResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(invitationId)) return { ok: false, error: "technical" };
  const context = await administratorContext();
  if (!context) return { ok: false, error: "not_allowed" };
  const { error } = await context.supabase.rpc("revoke_household_invitation", { p_invitation_id: invitationId });
  if (error) return { ok: false, error: mapError(error.message) };
  revalidatePath(routes.family);
  return { ok: true, message: "revoked" };
}

export async function renewInvitation(invitationId: string): Promise<InvitationActionResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(invitationId)) return { ok: false, error: "technical" };
  const context = await administratorContext();
  if (!context) return { ok: false, error: "not_allowed" };
  const { error } = await context.supabase.rpc("renew_household_invitation", { p_invitation_id: invitationId });
  if (error) return { ok: false, error: mapError(error.message) };
  revalidatePath(routes.family);
  return { ok: true, message: "renewed" };
}
