export type InviteRole = "dorosły" | "dziecko";

export function normalizeInvitationEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function invitationStatus(status: string, expiresAt: string, now = Date.now()) {
  if (status === "pending" && new Date(expiresAt).getTime() <= now) return "expired";
  return status;
}

export function isInviteRole(value: unknown): value is InviteRole {
  return value === "dorosły" || value === "dziecko";
}
