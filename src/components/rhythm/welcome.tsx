"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { t } from "@/lib/i18n";
import { AmbientScene } from "./scene";
import { useRhythmClock } from "./clock";

export function RhythmWelcome({ count }: { count: { kind: "error" } | { kind: "success"; data: number } }) {
  const state = useRhythmClock();
  const phase = state?.phase ?? 1;
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scene.current;
    if (!node) return;
    let visible = false;
    const update = () => { node.dataset.running = String(visible && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  return (
    <section className="rhythm-welcome" aria-label={t.dashboard.rhythmTitle}>
      <AmbientScene sceneRef={scene} />
      <div className="rhythm-caption">
        <h2 className="font-display text-section-title">{t.dashboard.rhythmTitle}</h2>
        {state && <p className="mt-2 text-sm text-muted">{[t.dashboard.rhythmDawn, t.dashboard.rhythmMorning, t.dashboard.rhythmDay, t.dashboard.rhythmEvening, t.dashboard.rhythmNight][phase]}</p>}
        <p className="mt-3">{count.kind === "success" ? <Link className="underline" href="/items?view=unlocated">{t.dashboard.unlocatedItems}: {count.data}</Link> : t.dashboard.widgetReadError}</p>
      </div>
    </section>
  );
}
