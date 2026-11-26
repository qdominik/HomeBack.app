"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { AmbientScene, WeatherCaption, useAppearance } from "./appearance";

export function RhythmWelcome({ count }: { count: { kind: "error" } | { kind: "success"; data: number } }) {
  const { phase } = useAppearance();
  return (
    <section className="rhythm-welcome" aria-label={t.dashboard.rhythmTitle}>
      <AmbientScene />
      <div className="rhythm-caption">
        <h2 className="font-display text-section-title">{t.dashboard.rhythmTitle}</h2>
        <p className="mt-2 text-sm text-muted">{[t.dashboard.rhythmDawn, t.dashboard.rhythmMorning, t.dashboard.rhythmDay, t.dashboard.rhythmEvening, t.dashboard.rhythmNight][phase]}</p><WeatherCaption showAttribution={false} />
        <p className="mt-3">{count.kind === "success" ? <Link className="underline" href="/items?view=unlocated">{t.dashboard.unlocatedItems}: {count.data}</Link> : t.dashboard.widgetReadError}</p>
      </div>
    </section>
  );
}
