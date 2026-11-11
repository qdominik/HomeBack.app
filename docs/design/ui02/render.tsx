/* eslint-disable @next/next/no-head-element, @next/next/no-css-tags -- Standalone component review, not an application route. */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Button } from "../../../src/components/ui/button";
import { Card } from "../../../src/components/ui/card";
import { Dialog } from "../../../src/components/ui/dialog";
import { Field } from "../../../src/components/ui/field";
import { FormActions } from "../../../src/components/ui/form-actions";
import { Input } from "../../../src/components/ui/input";
import { Select } from "../../../src/components/ui/select";
import { Textarea } from "../../../src/components/ui/textarea";
import { Badge } from "../../../src/components/ui/badge";
import { Alert } from "../../../src/components/ui/alert";
import { LoadingState } from "../../../src/components/ui/loading-state";
import { PageHeader } from "../../../src/components/ui/page-header";
import { renderToStaticMarkup } from "react-dom/server";

export async function renderComponents(output: string, fontClasses: string[]) {
  const html = <html lang="pl" className={fontClasses.join(" ")} data-theme="light"><head>
    <meta charSet="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="robots" content="noindex" /><title>HomeBack · Komponenty i formularze</title>
    <link rel="icon" href="data:," /><link rel="stylesheet" href="application.css" /><link rel="stylesheet" href="components.css" />
  </head><body><main className="components-board">
    <header><p className="components-eyebrow">TEAM A · UI-02 · B — WYRAŹNA ZMIANA</p><PageHeader title="Rzeczy i ich miejsca" description="Czytelne pola, przyciski i okna na każdym ekranie." />
      <p className="components-note">Podgląd komponentów na przykładowych danych. Formularze nie zapisują zmian.</p></header>
    <fieldset className="components-toolbar"><legend className="ui-label">Wygląd podglądu</legend>
      <Button data-tone-choice="morning" variant="secondary" aria-pressed="true">Ciepłe światło</Button><Button data-tone-choice="cool" variant="secondary" aria-pressed="false">Światło dnia</Button><Button data-tone-choice="dark" variant="secondary" aria-pressed="false">Noc</Button>
    </fieldset>
    <div className="components-grid">
      <Card as="section" className="components-panel" aria-labelledby="form-heading"><div className="components-section-heading"><h2 id="form-heading">Dodaj rzecz</h2><Badge>Przykład</Badge></div>
        <form id="example-form" className="components-stack">
          <Field id="example-name" label="Nazwa rzeczy" description="Np. żółta latarka.">{props=><Input {...props} name="nazwa" required defaultValue="Żółta latarka" />}</Field>
          <Field id="example-room" label="Pomieszczenie">{props=><Select {...props} name="room_id" defaultValue="salon"><option value="">Bez lokalizacji</option><option value="salon">Salon</option><option value="kuchnia">Kuchnia</option></Select>}</Field>
          <Field id="example-notes" label="Notatka">{props=><Textarea {...props} name="opis" defaultValue="Zapasowe baterie są w górnej szufladzie." />}</Field>
          <Field id="example-code" label="Kod lokalizacji" description="Pole tylko do odczytu.">{props=><Input {...props} readOnly value="SAL-KOM-SZU1" />}</Field>
          <Field id="example-disabled" label="Mebel" description="Najpierw wybierz pomieszczenie.">{props=><Select {...props} disabled defaultValue=""><option value="">Wybierz mebel</option></Select>}</Field>
          <FormActions><Button type="submit">Sprawdź formularz</Button><Button id="show-field-error" variant="secondary">Pokaż błąd pola</Button></FormActions>
          <p id="form-feedback" role="status" className="components-feedback" />
        </form>
      </Card>
      <div className="components-stack">
        <Card as="section" className="components-panel" aria-labelledby="dialog-heading"><h2 id="dialog-heading">Okna i działania</h2><p className="components-note">Na telefonie arkusz od dołu. Na tablecie i komputerze wyśrodkowane okno.</p>
          <div className="components-stack"><Button data-open="example-dialog" aria-haspopup="dialog" aria-controls="example-dialog">Edytuj rzecz</Button><Button data-open="long-dialog" variant="secondary" aria-haspopup="dialog" aria-controls="long-dialog">Długi formularz</Button><Button data-open="delete-dialog" variant="danger" aria-haspopup="dialog" aria-controls="delete-dialog">Usuń rzecz — podgląd</Button></div>
        </Card>
        <Card as="section" className="components-panel" aria-labelledby="states-heading"><h2 id="states-heading">Stany formularza</h2><div className="components-stack">
          <Alert variant="info">Wybierz pomieszczenie, aby wskazać mebel.</Alert><Alert variant="danger">Nie udało się zapisać. Sprawdź połączenie i spróbuj ponownie.</Alert>
          <LoadingState>Trwa zapis…</LoadingState><Button disabled aria-busy="true">Zapisywanie…</Button>
          <div className="components-badges"><Badge tone="success">Gotowe</Badge><Badge tone="warning">Sprawdź</Badge><Badge tone="danger">Błąd</Badge><Badge tone="info">Informacja</Badge></div>
          <label className="components-choice"><input className="ui-choice" type="checkbox" defaultChecked /><span>Uwzględnij notatkę przy kopiowaniu</span></label>
        </div></Card>
      </div>
    </div>
    <p className="components-note"><a href="index.html">Zaakceptowana kolorystyka w ciągu dnia</a></p>
    <Dialog id="example-dialog" aria-labelledby="edit-title" aria-describedby="edit-description">
      <form className="ui-dialog-body components-stack" id="dialog-form">
        <h2 className="ui-dialog-title" id="edit-title">Edytuj rzecz</h2><p id="edit-description" className="components-note">Żółta latarka · Salon › Komoda</p>
        <Field id="dialog-name" label="Nazwa rzeczy">{props=><Input {...props} name="nazwa" defaultValue="Żółta latarka" required autoFocus />}</Field>
        <Field id="dialog-notes" label="Notatka">{props=><Textarea {...props} name="opis" defaultValue="Zapasowe baterie są obok." />}</Field>
        <p role="status" id="dialog-feedback" className="components-feedback" />
        <FormActions className="ui-dialog-actions"><Button data-close variant="secondary">Anuluj</Button><Button type="submit">Sprawdź formularz</Button></FormActions>
      </form>
    </Dialog>
    <Dialog id="long-dialog" size="wide" aria-labelledby="long-title"><form className="ui-dialog-body components-stack" id="long-form"><h2 className="ui-dialog-title" id="long-title">Szczegóły rzeczy</h2>
      <p className="components-note">Przykładowy długi formularz do sprawdzenia przewijania.</p>
      {Array.from({length:10},(_,i)=><Field key={i} id={`long-field-${i}`} label={`Notatka ${i+1}`}>{props=><Textarea {...props} defaultValue={`Informacje o rzeczy ${i+1}.`} />}</Field>)}
      <FormActions className="ui-dialog-actions"><Button data-close variant="secondary">Zamknij</Button><Button type="submit">Sprawdź formularz</Button></FormActions>
    </form></Dialog>
    <Dialog id="delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-description"><div className="ui-dialog-body components-stack"><h2 className="ui-dialog-title" id="delete-title">Usunąć rzecz?</h2><p id="delete-description">Żółta latarka</p><Alert variant="warning">To podgląd potwierdzenia. Żadna rzecz ani plik nie zostaną usunięte.</Alert><FormActions className="ui-dialog-actions"><Button data-close variant="secondary" autoFocus>Anuluj</Button><Button data-close variant="danger">Zamknij podgląd</Button></FormActions></div></Dialog>
  </main><script type="module" src="components.js" defer /></body></html>;
  await writeFile(join(output,"components.html"),"<!doctype html>"+renderToStaticMarkup(html)+"\n");
}
