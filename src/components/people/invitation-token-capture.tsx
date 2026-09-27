"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  consumeInvitationTokenFromUrlFragment,
  discardInvitationTokenUrlFragment,
} from "@/lib/people/invitation-url-fragment";

export function InvitationUrlFragmentCleanup() {
  useEffect(() => {
    discardInvitationTokenUrlFragment(window.location, window.history);
  }, []);

  return null;
}

export function InvitationTokenCapture() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const token = consumeInvitationTokenFromUrlFragment(
      window.location,
      window.history,
    );

    if (!token) {
      void Promise.resolve().then(() => setFailed(true));
      return;
    }

    void fetch("/invite/session", {
      body: JSON.stringify({ token }),
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).then((response) => {
      if (!response.ok) {
        setFailed(true);
        return;
      }
      router.replace("/invite/accept");
      router.refresh();
    }).catch(() => setFailed(true));
  }, [router]);

  return (
    <div aria-live="polite" className="text-center">
      <h1 className="text-2xl font-semibold">
        {failed ? "Nieprawidłowy link zaproszenia" : "Sprawdzanie zaproszenia…"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        {failed
          ? "Otwórz pełny link z wiadomości e-mail albo poproś administratora o nowe zaproszenie."
          : "Bezpiecznie przygotowujemy dalszy krok."}
      </p>
    </div>
  );
}
