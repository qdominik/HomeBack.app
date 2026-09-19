export function areHouseholdInvitationsEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  return env.HOUSEHOLD_INVITATIONS_ENABLED === "true";
}
