const invitationTokenParam = "token";

type BrowserLocation = {
  hash: string;
  pathname: string;
};
type BrowserHistory = {
  replaceState(data: unknown, unused: string, url?: string | URL | null): void;
};

export function consumeInvitationTokenFromUrlFragment(
  location: BrowserLocation,
  history: BrowserHistory,
) {
  const params = new URLSearchParams(location.hash.slice(1));
  const token = params.get(invitationTokenParam);
  if (location.hash) {
    history.replaceState(null, "", location.pathname);
  }
  return token;
}

export function discardInvitationTokenUrlFragment(
  location: BrowserLocation,
  history: BrowserHistory,
) {
  if (!location.hash) return;
  const params = new URLSearchParams(location.hash.slice(1));
  if (!params.has(invitationTokenParam)) return;
  history.replaceState(null, "", location.pathname);
}
