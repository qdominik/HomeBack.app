export const invitationReturnPath = "/invite/accept";

export function safeAuthReturnPath(value: unknown): string | null {
  return value === invitationReturnPath ? invitationReturnPath : null;
}
