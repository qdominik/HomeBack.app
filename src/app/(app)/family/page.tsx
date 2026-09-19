import { PeopleContent, type Invitation, type Person } from "@/components/people/people-content";
import { PageHeader } from "@/components/ui/page-header";
import { getAppContext } from "@/lib/app-context";
import { t } from "@/lib/i18n";
import { areHouseholdInvitationsEnabled } from "@/lib/people/invitations-enabled";

export default async function FamilyPage() {
  const { household, profile, supabase, userId } = await getAppContext();
  const isAdministrator = profile?.rola === "admin" && profile.status === "aktywny";
  const invitationsEnabled = areHouseholdInvitationsEnabled();
  const { data: memberRows, error: membersError } = await supabase.rpc("get_household_members");
  const members: Person[] = (memberRows ?? []).map((member) => ({
    id: member.id,
    name: member.imie,
    avatarUrl: member.avatar_url,
    role: member.rola,
    // The RPC returns peer email only to an administrator; the component never receives a profile table row.
    email: member.email,
    isCurrentUser: member.id === userId,
  }));
  let invitations: Invitation[] = [];
  if (isAdministrator && invitationsEnabled) {
    const { data } = await supabase.from("household_invitation")
      .select("id, email, target_role, status, created_at, expires_at")
      .order("created_at", { ascending: false });
    invitations = (data ?? []).map((invitation) => ({ id: invitation.id, email: invitation.email, role: invitation.target_role, status: invitation.status, createdAt: invitation.created_at, expiresAt: invitation.expires_at }));
  }
  return <div className="space-y-8"><PageHeader description={household?.nazwa} title={t.modules.family.title} /><PeopleContent householdName={household?.nazwa ?? ""} invitations={invitations} invitationsEnabled={invitationsEnabled} isAdministrator={isAdministrator} loadError={Boolean(membersError)} members={members} /></div>;
}
