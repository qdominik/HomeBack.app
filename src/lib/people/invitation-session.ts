export const invitationCookieName = "homeback_invitation";
export const invitationCookieMaxAge = 48 * 60 * 60;

export function isInvitationToken(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}
