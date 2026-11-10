/* Documentation only: render production components with the compiled application CSS. */
/* eslint-disable @next/next/no-head-element, @next/next/no-css-tags -- Standalone HTML documentation, not a Next page. */
import { readFile, readdir, mkdir, writeFile, copyFile } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { PageHeader } from "../../../../src/components/ui/page-header";
import { SectionHeader } from "../../../../src/components/ui/section-header";
import { Card } from "../../../../src/components/ui/card";
import { Button } from "../../../../src/components/ui/button";
import { Field } from "../../../../src/components/ui/field";
import { Input } from "../../../../src/components/ui/input";
import { Select } from "../../../../src/components/ui/select";
import { Badge } from "../../../../src/components/ui/badge";
import { StatCard } from "../../../../src/components/ui/stat-card";
import { uiTokens } from "../../../../src/lib/ui/tokens";
import { renderTemperatureOptions } from "./render-temperature";
import { renderComponents } from "../../ui02/render";

const root = process.cwd();
const output = join(root, "docs/design/ui01/reference");

function Panel({ id, title, tone, theme }: { id: string; title: string; tone?: string; theme: string }) {
  return <section className="ui01-panel" data-theme={theme} data-tone={tone} aria-label={title}>
    <div className="ui01-stack">
      <SectionHeader description="Te same komponenty i dane w każdej palecie.">{title}</SectionHeader>
      <Card className="ui01-card">
        <p data-contrast="body">Żółta latarka</p>
        <p className={uiTokens.metadata} data-contrast="muted">Salon › Komoda › Górna szuflada</p>
        <p className={uiTokens.metadata} data-contrast="note">Zapasowe baterie są w tej samej szufladzie.</p>
      </Card>
      <div className="ui01-actions">
        <Button data-contrast="primary">Dodaj rzecz</Button>
        <Button variant="secondary" data-contrast="secondary">Zobacz rzeczy</Button>
        <Button variant="danger" data-contrast="danger">Usuń rzecz</Button>
      </div>
      <Field id={`${id}-name`} label="Nazwa rzeczy" description="Polskie znaki: ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ">
        {props => <Input {...props} defaultValue="Żółta latarka" data-contrast="input" />}
      </Field>
      <Field id={`${id}-place`} label="Pomieszczenie">
        {props => <Select {...props} defaultValue="salon"><option value="">Bez lokalizacji</option><option value="salon">Salon</option></Select>}
      </Field>
      <Field id={`${id}-error`} label="Miejsce" error="Sprawdź wybrane miejsce.">
        {props => <Input {...props} placeholder="Wybierz lokalizację" data-contrast="placeholder" />}
      </Field>
      <Field id={`${id}-disabled`} label="Pole niedostępne">
        {props => <Input {...props} defaultValue="Pościel zimowa" disabled />}
      </Field>
      <div className="ui01-badges">
        <Badge tone="success" data-contrast="success-badge">Gotowe</Badge>
        <Badge tone="warning" data-contrast="warning-badge">Uwaga</Badge>
        <Badge tone="danger" data-contrast="danger-badge">Błąd</Badge>
        <Badge tone="info" data-contrast="info-badge">Informacja</Badge>
      </div>
      <StatCard label="Rzeczy w domu" value={128} />
    </div>
  </section>;
}

async function cssFiles(folder: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) result.push(...await cssFiles(path));
    else if (entry.name.endsWith(".css")) result.push(path);
  }
  return result;
}

async function main() {
  await mkdir(join(output, "assets"), { recursive: true });
  const files = await cssFiles(join(root, ".next/static"));
  if (!files.length) throw new Error("Run the application build before rendering UI01.");
  let css = (await Promise.all(files.sort().map(file => readFile(file, "utf8")))).join("\n");
  const variables = [...css.matchAll(/\.([\w-]+)\s*\{[^{}]*--font-(?:inter|fraunces)\s*:/g)].map(match => match[1]);
  if (new Set(variables).size !== 2) throw new Error("Expected both next/font variable classes in the compiled CSS.");
  const assets = new Set<string>();
  css = css.replace(/url\(([^)]*\.woff2[^)]*)\)/g, (_all, raw: string) => {
    const name = basename(raw.replace(/["']/g, "").split("?")[0]);
    assets.add(name);
    return `url("assets/${name}")`;
  });
  for (const file of assets) await copyFile(join(root, ".next/static/media", file), join(output, "assets", file));
  for (const file of ["INTER-OFL.txt", "FRAUNCES-OFL.txt"]) await copyFile(join(root, "src/assets/fonts", file), join(output, "assets", file));
  await writeFile(join(output, "application.css"), css);
  const document = <html lang="pl" className={variables.join(" ")}><head>
    <meta charSet="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="robots" content="noindex" /><title>HomeBack · Etap 1 — fundament</title>
    <link rel="icon" href="data:," /><link rel="stylesheet" href="application.css" /><link rel="stylesheet" href="reference.css" />
  </head><body><header className="ui01-hero"><p className={uiTokens.metadata}>TEAM A · UI-01 · 30.10.2026</p>
    <PageHeader title="Rzeczy i ich miejsca" description="Trzy warianty kolorów, pola i przyciski aplikacji." />
    <p className="ui01-note">Komponenty na aktualnych tokenach wybranego wariantu B. <a href="index.html">Zobacz temperaturę bieli w ciągu dnia.</a></p>
  </header><main className="ui01-grid">
    <Panel id="warm" title="Ciepłe światło" theme="light" />
    <Panel id="cool" title="Światło dnia" theme="light" tone="cool" />
    <Panel id="dark" title="Wieczorny spokój" theme="dark" />
  </main></body></html>;
  await writeFile(join(output, "foundation.html"), "<!doctype html>" + renderToStaticMarkup(document) + "\n");
  await renderTemperatureOptions(output, variables);
  await renderComponents(output, variables);
  await writeFile(join(output, "build-info.json"), JSON.stringify({ cssFiles: files.map(file => file.slice(root.length + 1)), fontClasses: variables, fontAssets: [...assets], source: "Production components + compiled Next CSS; no application API" }, null, 2) + "\n");
  console.log(JSON.stringify({ output: resolve(output), cssFiles: files.length, fonts: assets.size }));
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
