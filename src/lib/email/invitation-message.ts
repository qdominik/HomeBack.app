import type { InviteRole } from "../people/people";

const roleLabels: Record<InviteRole, string> = {
  dorosły: "dorosły",
  dziecko: "dziecko",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export type InvitationMessage = {
  html: string;
  subject: string;
  text: string;
};

export function createInvitationAcceptanceUrl(
  appBaseUrl: string,
  token: string,
) {
  const url = new URL("/invite/accept", appBaseUrl);
  url.hash = `token=${encodeURIComponent(token)}`;
  return url.toString();
}

export function renderInvitationMessage(input: {
  appBaseUrl: string;
  expiresAt: string;
  householdName: string;
  inviterName: string;
  role: InviteRole;
  token: string;
}): InvitationMessage {
  const invitationUrl = createInvitationAcceptanceUrl(
    input.appBaseUrl,
    input.token,
  );
  const expiry = new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Warsaw",
  }).format(new Date(input.expiresAt));
  const role = roleLabels[input.role];
  const safeHousehold = escapeHtml(input.householdName);
  const safeInviter = escapeHtml(input.inviterName);
  const safeRole = escapeHtml(role);
  const safeExpiry = escapeHtml(expiry);
  const safeUrl = escapeHtml(invitationUrl);

  return {
    subject: "Zaproszenie do HomeBack",
    text: [
      "HomeBack",
      "",
      `${input.inviterName} zaprasza Cię do gospodarstwa „${input.householdName}” z rolą: ${role}.`,
      "Zaproszenie jest ważne 48 godzin, do:",
      expiry,
      "",
      "Otwórz bezpieczny link, aby zalogować się lub utworzyć konto i przyjąć zaproszenie:",
      invitationUrl,
      "",
      "Jeśli nie oczekujesz tej wiadomości, zignoruj ją. Nie przekazuj linku innej osobie.",
    ].join("\n"),
    html: `<!doctype html><html lang="pl"><body><h1>HomeBack</h1><p><strong>${safeInviter}</strong> zaprasza Cię do gospodarstwa <strong>${safeHousehold}</strong> z rolą: <strong>${safeRole}</strong>.</p><p>Zaproszenie jest ważne 48 godzin, do ${safeExpiry}.</p><p><a href="${safeUrl}">Zaloguj się lub utwórz konto i przyjmij zaproszenie</a></p><p>Jeśli nie oczekujesz tej wiadomości, zignoruj ją. Nie przekazuj linku innej osobie.</p></body></html>`,
  };
}
