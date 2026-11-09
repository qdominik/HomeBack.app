/* eslint-disable @next/next/no-head-element, @next/next/no-css-tags -- Standalone review document, not a Next route. */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CSSProperties } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PageHeader } from "../../../../src/components/ui/page-header";
import { Card } from "../../../../src/components/ui/card";
import { Button } from "../../../../src/components/ui/button";
import { Input } from "../../../../src/components/ui/input";
import { uiTokens } from "../../../../src/lib/ui/tokens";
import { nightHour, temperaturePalettes, temperaturePhases, temperaturePresets } from "./temperature-palettes";

export async function renderTemperatureOptions(output: string, fontClasses: string[]) {
  const document = <html lang="pl" className={fontClasses.join(" ")}><head>
    <meta charSet="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="robots" content="noindex" /><title>HomeBack · Temperatura bieli w ciągu dnia</title>
    <link rel="icon" href="data:," /><link rel="stylesheet" href="application.css" />
    <link rel="stylesheet" href="temperature-options.css" />
  </head><body><main className="temperature-board">
    <header className="temperature-intro"><p className={uiTokens.metadata}>TEAM A · WYBRANO B · WYRAŹNA ZMIANA</p>
      <PageHeader title="Kolory w ciągu dnia" description="Ciepła biel rano, neutralna w południe i ponownie ciepła wieczorem." />
      <p>Wybrany zakres B: ciepły krem rano i wieczorem, neutralna biel w południe. A i C pozostają do porównania.</p>
    </header>
    <section className="temperature-controls" aria-label="Sterowanie podglądem">
      <div className="temperature-time"><label htmlFor="preview-hour">Godzina podglądu</label><output id="preview-time" htmlFor="preview-hour">13:00</output></div>
      <input id="preview-hour" type="range" min="0" max="23.75" step="0.25" defaultValue="13" />
      <div className="temperature-presets">{temperaturePresets.map(phase=><button type="button" key={phase.label} data-hour={phase.hour} aria-pressed={phase.hour===13}>{phase.label}</button>)}</div>
      <p id="preview-phase">Południe · najjaśniejsza, najbardziej neutralna biel</p>
    </section>
    <div className="temperature-grid">{temperaturePalettes.map(palette=><section key={palette.id} className="temperature-option" data-selected={palette.selected} aria-labelledby={`${palette.id}-heading`}>
      <header><div className="temperature-option-title"><h2 id={`${palette.id}-heading`} className={uiTokens.sectionTitle}>{palette.name}</h2>{palette.selected&&<span className="temperature-selected">Wybrany</span>}</div><p>{palette.description}</p></header>
      <ol className="temperature-cycle" aria-label={`Pełny cykl: ${palette.name}`}>{temperaturePhases.map((phase,i)=><li key={phase.label}>
        <div className="temperature-swatch" style={{"--swatch-background":palette.backgrounds[i],"--swatch-surface":palette.surfaces[i]} as CSSProperties}><span /></div>
        <span>{phase.label}</span><small>{palette.kelvin[i]} K</small>
      </li>)}</ol>
      <div data-preview={palette.id} data-theme="light" className="temperature-preview" style={{"--background":palette.backgrounds[2],"--surface":palette.surfaces[2],"--surface-muted":palette.muted[2]} as CSSProperties}>
        <div className="temperature-current"><span data-current-phase>Południe</span><span data-current-k>{palette.kelvin[2]} K</span></div>
        <Card className="temperature-item"><p data-contrast="body">Żółta latarka</p><p data-contrast="muted" className={uiTokens.metadata}>Salon › Komoda › Górna szuflada</p><p data-contrast="note" className={uiTokens.metadata}>Zapasowe baterie są obok.</p></Card>
        <div className="temperature-actions"><Button data-contrast="primary">Dodaj rzecz</Button><Button variant="secondary" data-contrast="secondary">Zobacz rzeczy</Button></div>
        <label htmlFor={`${palette.id}-name`} data-contrast="label">Nazwa rzeczy</label><Input id={`${palette.id}-name`} defaultValue="Żółta latarka" data-contrast="input" />
      </div>
    </section>)}</div>
    <footer className="temperature-foot"><p>Od 18:00 powierzchnie stopniowo ciemnieją. Pełna noc zaczyna się o 22:30 i zachowuje zaakceptowany ciemny motyw. Tekst i przyciski dostosowują kontrast do tła.</p><p>Wartości K są orientacyjnym indeksem projektu, nie pomiarem ekranu. Dane przykładowe; przyciski nie zapisują zmian.</p><a href="foundation.html">Wcześniejsze porównanie komponentów</a></footer>
  </main><script id="temperature-data" type="application/json" dangerouslySetInnerHTML={{__html:JSON.stringify({palettes:temperaturePalettes,phases:temperaturePhases,nightHour})}} /><script type="module" src="temperature-options.js" defer /></body></html>;
  const html="<!doctype html>"+renderToStaticMarkup(document)+"\n";
  await writeFile(join(output,"index.html"),html);
  await writeFile(join(output,"temperature.html"),html);
}
