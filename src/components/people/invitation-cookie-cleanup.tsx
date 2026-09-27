"use client";

import { useEffect } from "react";

export function InvitationCookieCleanup() {
  useEffect(() => {
    void fetch("/invite/session", { method: "DELETE", credentials: "same-origin" });
  }, []);
  return null;
}
