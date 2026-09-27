"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClassName } from "@/components/ui/button";
import { prepareInvitation, renewInvitation, revokeInvitation, type InvitationActionResult } from "@/app/(app)/family/actions";
import { invitationStatus, type InviteRole } from "@/lib/people/people";

export type Person = { id: string; name: string; avatarUrl: string | null; role: string; email: string | null; isCurrentUser: boolean };
export type Invitation = { id: string; email: string; role: InviteRole; status: string; createdAt: string; expiresAt: string };

const roleLabels: Record<string, string> = { admin: "Administrator", dorosły: "Dorosły", dziecko: "Dziecko", "gość": "Gość" };
const errorLabels: Record<string, string> = {
  already_pending: "Dla tego adresu istnieje już aktywne zaproszenie.",
  email_auth: "Serwer pocztowy odrzucił dane logowania. Zaproszenie nie zostało wysłane.",
  email_compensation_failed: "Wysyłka i bezpieczne odwołanie zaproszenia nie powiodły się. Skontaktuj się z administratorem technicznym.",
  email_configuration: "Wysyłka zaproszeń nie jest jeszcze skonfigurowana w tym środowisku.",
  email_rate_limit: "Serwer pocztowy czasowo ograniczył wysyłkę. Zaproszenie zostało odwołane.",
  email_rejected: "Serwer pocztowy odrzucił wiadomość. Zaproszenie zostało odwołane.",
  email_timeout: "Serwer pocztowy nie odpowiedział na czas. Zaproszenie zostało odwołane.",
  email_transport: "Nie udało się przekazać wiadomości do serwera pocztowego. Zaproszenie zostało odwołane.",
  invalid_email: "Podaj poprawny adres e-mail.",
  invalid_role: "Wybierz rolę Dorosły lub Dziecko.",
  not_allowed: "Nie masz uprawnień do tej operacji.",
  not_pending: "To zaproszenie nie jest już oczekujące.",
  rate_limited: "Wysłano zbyt wiele zaproszeń. Spróbuj ponownie później.",
  recipient_not_allowed: "Ten adres nie znajduje się na liście dozwolonych odbiorców Preview.",
  technical: "Nie udało się wykonać operacji. Spróbuj ponownie.",
};

function formatDate(value: string) { return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export function PeopleContent({ householdName, members, invitations, invitationsEnabled, isAdministrator, loadError }: { householdName: string; members: Person[]; invitations: Invitation[]; invitationsEnabled: boolean; isAdministrator: boolean; loadError: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("dorosły");
  const [revocationConfirmationId, setRevocationConfirmationId] = useState<string | null>(null);
  const act = (operation: () => Promise<InvitationActionResult>) => startTransition(async () => {
    const result = await operation();
    setMessage(result.ok ? (result.message === "sent" || result.message === "resent" ? `Zaproszenie zostało przekazane do wysyłki na adres ${result.email}.` : "Zaproszenie zostało odwołane.") : errorLabels[result.error]);
    if (result.ok) { setEmail(""); setRevocationConfirmationId(null); router.refresh(); }
  });
  return <div className="space-y-8">
    <section aria-labelledby="members-heading"><div className="mb-4"><p className="text-sm text-muted">Gospodarstwo: {householdName}</p><h2 className="text-xl font-bold" id="members-heading">Członkowie</h2></div>
      {loadError ? <p className="rounded-control border border-danger/30 bg-danger/10 p-4 text-sm">Nie udało się pobrać listy osób.</p> : members.length === 0 ? <p className="rounded-control border border-dashed border-line p-6 text-muted">Brak członków do wyświetlenia.</p> : <ul className="grid gap-3 sm:grid-cols-2">{members.map(member => <li className="flex items-center gap-3 rounded-control border border-line bg-surface p-4" key={member.id}><span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{member.name.slice(0, 1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate font-semibold">{member.name} {member.isCurrentUser ? <span className="text-sm font-normal text-muted">(Ty)</span> : null}</span><span className="text-sm text-muted">{roleLabels[member.role] ?? member.role}</span></span></li>)}</ul>}
    </section>
    {isAdministrator && invitationsEnabled ? <section aria-labelledby="invite-heading" className="space-y-5 rounded-control border border-line bg-surface p-4 sm:p-6"><div><h2 className="text-xl font-bold" id="invite-heading">Zaproszenia</h2><p className="mt-1 text-sm leading-6 text-muted">Zaproszenie jest ważne 48 godzin. Przyjęcie wiadomości przez serwer pocztowy nie oznacza jeszcze doręczenia do skrzynki odbiorcy.</p></div>
      <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]" onSubmit={event => { event.preventDefault(); act(() => prepareInvitation(email, role)); }}><label className="grid gap-1 text-sm font-semibold">Adres e-mail<input className="min-h-11 rounded-control border border-line bg-surface px-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={pending} onChange={event => setEmail(event.target.value)} required type="email" value={email} /></label><label className="grid gap-1 text-sm font-semibold">Rola<select className="min-h-11 rounded-control border border-line bg-surface px-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={pending} onChange={event => setRole(event.target.value as InviteRole)} value={role}><option value="dorosły">Dorosły</option><option value="dziecko">Dziecko</option></select></label><button className={`${buttonClassName({ variant: "primary" })} self-end`} disabled={pending} type="submit">{pending ? "Wysyłanie…" : "Wyślij zaproszenie"}</button></form>
      <div aria-live="polite" className="min-h-6 text-sm text-muted">{message}</div>
      <div><h3 className="font-semibold">Historia zaproszeń</h3>{invitations.length === 0 ? <p className="mt-2 text-sm text-muted">Brak zaproszeń.</p> : <ul className="mt-3 grid gap-3">{invitations.map(invitation => { const status = invitationStatus(invitation.status, invitation.expiresAt); const canAct = status === "pending"; const confirmingRevocation = revocationConfirmationId === invitation.id; return <li className="rounded-control border border-line p-4" key={invitation.id}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{invitation.email}</p><p className="text-sm text-muted">{roleLabels[invitation.role]} · utworzono {formatDate(invitation.createdAt)} · ważne do {formatDate(invitation.expiresAt)}</p><p className="mt-1 text-sm">{status === "pending" ? "Oczekuje" : status === "expired" ? "Wygasło" : status === "accepted" ? "Przyjęte" : "Odwołane"}</p></div>{canAct ? <div className="flex gap-2">{confirmingRevocation ? <><button className={buttonClassName({ variant: "secondary" })} disabled={pending} onClick={() => setRevocationConfirmationId(null)} type="button">Anuluj</button><button className={buttonClassName({ variant: "danger" })} disabled={pending} onClick={() => act(() => revokeInvitation(invitation.id))} type="button">{pending ? "Przetwarzanie…" : "Potwierdź odwołanie"}</button></> : <><button className={buttonClassName({ variant: "secondary" })} disabled={pending} onClick={() => setRevocationConfirmationId(invitation.id)} type="button">Odwołaj</button><button className={buttonClassName({ variant: "secondary" })} disabled={pending} onClick={() => { if (window.confirm("Czy wysłać nowe zaproszenie i odwołać poprzednie?")) act(() => renewInvitation(invitation.id)); }} type="button">Wyślij ponownie</button></>}</div> : null}</div></li>; })}</ul>}</div>
    </section> : null}
  </div>;
}
