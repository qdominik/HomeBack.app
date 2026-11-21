"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { daylight } from "@/lib/ui/daylight";

type State = ReturnType<typeof daylight>;
const ClockContext = createContext<State | null>(null);
const roles = ["background", "surface", "surface-muted", "foreground", "foreground-secondary", "foreground-muted", "placeholder", "control-border", "line", "primary", "primary-hover", "primary-strong", "on-primary", "focus", "success", "warning", "danger", "info"];

export function RhythmClock({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = daylight(now.getHours() + now.getMinutes() / 60, "auto");
      const root = document.documentElement;
      root.dataset.theme = next.theme;
      root.dataset.rhythmPhase = ["dawn", "morning", "noon", "evening", "night"][next.phase];
      for (const name of roles) root.style.removeProperty(`--${name}`);
      for (const [name, value] of Object.entries(next.styles)) root.style.setProperty(name, value);
      setState(next);
    };
    tick();
    const timer = window.setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, []);
  return <ClockContext.Provider value={state}>{children}</ClockContext.Provider>;
}

export function useRhythmClock() { return useContext(ClockContext); }
