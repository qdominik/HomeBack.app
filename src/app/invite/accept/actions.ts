"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import {
  invitationCookieName,
  isInvitationToken,
} from "@/lib/people/invitation-session";
import { areHouseholdInvitationsEnabled } from "@/lib/people/invitations-enabled";
import { createClient } from "@/lib/supabase/server";

export type AcceptInvitationState = { error: string | null };

function acceptanceError(message: string | undefined) {
  if (message?.includes("VERIFIED_EMAIL_REQUIRED")) {
    return "Najpierw potwierdź adres e-mail konta.";
  }
  if (message?.includes("INVITATION_OTHER_HOUSEHOLD")) {
    return "To konto należy już do innego gospodarstwa.";
  }
  if (message?.includes("PROFILE_NAME_REQUIRED")) {
    return "Podaj imię.";
  }
  if (message?.includes("AUTH_REQUIRED")) {
    return "Zaloguj się ponownie, aby przyjąć zaproszenie.";
  }
  if (message?.includes("INVITATION_INVALID")) {
    return "Zaproszenie jest nieważne, wygasło albo zostało już użyte.";
  }
  return "Nie udało się przyjąć zaproszenia. Spróbuj ponownie.";
}

export async function acceptInvitation(
  _previous: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  if (!areHouseholdInvitationsEnabled()) {
    return { error: "Zaproszenia są obecnie wyłączone." };
  }
  const nameValue = formData.get("name");
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  if (!name) return { error: "Podaj imię." };

  const cookieStore = await cookies();
  const token = cookieStore.get(invitationCookieName)?.value;
  if (!isInvitationToken(token)) {
    return { error: "Brakuje ważnego tokenu zaproszenia." };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    return { error: "Zaloguj się ponownie, aby przyjąć zaproszenie." };
  }

  const { error } = await supabase.rpc("accept_household_invitation", {
    p_imie: name,
    p_token: token,
  });
  if (error) return { error: acceptanceError(error.message) };

  cookieStore.set(invitationCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/invite",
    sameSite: "lax",
    secure: process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production",
  });
  revalidatePath(routes.family);
  redirect(`${routes.family}?invitation=accepted`);
}
