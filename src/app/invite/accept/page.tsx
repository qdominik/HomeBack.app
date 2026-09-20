import Link from "next/link";
import { cookies } from "next/headers";
import { AppHeader } from "@/components/app-shell";
import { BrandLogo } from "@/components/brand-logo";
import { InvitationAcceptForm } from "@/components/people/invitation-accept-form";
import { InvitationTokenCapture } from "@/components/people/invitation-token-capture";
import { InvitationCookieCleanup } from "@/components/people/invitation-cookie-cleanup";
import { invitationReturnPath } from "@/lib/auth/return-path";
import {
  invitationCookieName,
  isInvitationToken,
} from "@/lib/people/invitation-session";
import { areHouseholdInvitationsEnabled } from "@/lib/people/invitations-enabled";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  dorosły: "Dorosły",
  dziecko: "Dziecko",
};

function authLink(path: string, email: string | null) {
  const params = new URLSearchParams({ next: invitationReturnPath });
  if (email) params.set("email", email);
  return `${path}?${params.toString()}`;
}

function StateMessage({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="text-center" role="status">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

export default async function InvitationAcceptPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(invitationCookieName)?.value;

  let content;
  let authenticated = false;
  if (!areHouseholdInvitationsEnabled()) {
    content = (
      <StateMessage
        description="Administrator systemu nie włączył jeszcze tego przepływu."
        title="Zaproszenia są obecnie wyłączone"
      />
    );
  } else if (!isInvitationToken(token)) {
    content = <InvitationTokenCapture />;
  } else {
    const supabase = await createClient();
    const [{ data: claimsData }, { data, error }] = await Promise.all([
      supabase.auth.getClaims(),
      supabase.rpc("inspect_household_invitation", { p_token: token }),
    ]);
    authenticated = Boolean(claimsData?.claims?.sub);
    const inspection = data?.[0];

    if (error || !inspection) {
      content = (
        <StateMessage
          description="Spróbuj ponownie później. Token zaproszenia nie został ujawniony ani zapisany w przeglądarce."
          title="Nie udało się sprawdzić zaproszenia"
        />
      );
    } else if (inspection.state === "login_required") {
      content = (
        <div className="text-center">
          <StateMessage
            description={`Zaproszenie jest przypisane do ${inspection.invitation_email}. Zaloguj się na to konto, aby kontynuować.`}
            title="Wymagane logowanie"
          />
          <Link className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white" href={authLink(routes.login, inspection.invitation_email)}>
            Zaloguj się
          </Link>
        </div>
      );
    } else if (inspection.state === "registration_required") {
      content = (
        <div className="text-center">
          <StateMessage
            description={`Utwórz konto dla ${inspection.invitation_email}, potwierdź adres e-mail i wróć do zaproszenia.`}
            title="Utwórz konto HomeBack"
          />
          <Link className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white" href={authLink(routes.register, inspection.invitation_email)}>
            Zarejestruj się
          </Link>
        </div>
      );
    } else if (inspection.state === "ready" || inspection.state === "already_member") {
      const displayRole = inspection.state === "already_member"
        ? inspection.member_role
        : inspection.target_role;
      content = (
        <div>
          <h1 className="text-2xl font-semibold">Gotowe do przyjęcia</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Gospodarstwo: <strong className="text-foreground">{inspection.household_name}</strong><br />
            Rola: <strong className="text-foreground">{displayRole ? roleLabels[displayRole] : "Członek"}</strong>
          </p>
          {inspection.state === "already_member" ? (
            <p className="mt-3 rounded-md border border-line bg-surface-muted p-3 text-sm">
              Należysz już do tego gospodarstwa. Potwierdzenie nie utworzy duplikatu ani nie zmieni Twojej roli.
            </p>
          ) : null}
          <InvitationAcceptForm
            buttonLabel={inspection.state === "already_member" ? "Potwierdź członkostwo" : "Przyjmij zaproszenie"}
            suggestedName={inspection.suggested_name ?? ""}
          />
        </div>
      );
    } else {
      const messages: Record<string, [string, string]> = {
        awaiting_verification: ["Oczekiwanie na weryfikację", "Potwierdź adres e-mail przez wiadomość rejestracyjną, a następnie otwórz ponownie zaproszenie."],
        expired: ["Zaproszenie wygasło", "Poproś administratora gospodarstwa o wysłanie nowego zaproszenia."],
        invalid: ["Nieprawidłowe zaproszenie", "Link jest niepełny albo nie istnieje. Poproś administratora o nowe zaproszenie."],
        other_household: ["Konto należy do innego gospodarstwa", "W wersji MVP jedno konto może należeć tylko do jednego gospodarstwa."],
        revoked: ["Zaproszenie zostało odwołane", "Poproś administratora o nowe zaproszenie, jeśli nadal chcesz dołączyć."],
        used: ["Zaproszenie zostało już użyte", "Ten jednorazowy link nie może zostać użyty ponownie."],
        wrong_email: ["Niewłaściwe konto", `Zalogowane konto nie odpowiada adresowi ${inspection.invitation_email}. Wyloguj się i użyj właściwego konta.`],
      };
      const [title, description] = messages[inspection.state] ?? ["Błąd techniczny", "Nie udało się kontynuować przyjmowania zaproszenia."];
      content = (
        <div>
          {[
            "expired",
            "invalid",
            "revoked",
            "used",
          ].includes(inspection.state) ? <InvitationCookieCleanup /> : null}
          <StateMessage description={description} title={title} />
          {authenticated && ["wrong_email", "other_household"].includes(inspection.state) ? (
            <form action="/auth/signout" className="mt-5 text-center" method="post">
              <button className="h-11 rounded-md border border-line px-5 text-sm font-semibold" type="submit">Wyloguj się</button>
            </form>
          ) : null}
        </div>
      );
    }
  }

  return (
    <>
      <AppHeader authenticated={authenticated} />
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
        <section className="w-full max-w-md rounded-md border border-line bg-surface p-6">
          <div className="mb-4 flex justify-center">
            <BrandLogo className="w-44 sm:w-52" priority variant="vertical" />
          </div>
          {content}
        </section>
      </main>
    </>
  );
}
