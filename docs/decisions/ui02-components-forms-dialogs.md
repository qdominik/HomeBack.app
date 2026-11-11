# UI-02 — wspólne komponenty, formularze i dialogi

31.10.2026 · Team A · feature/ui02-components-forms-dialogs-20261031.

## Audyt przed zmianą

Baza: zaakceptowany UI-01, commit 46a859b. W 11 plikach istnieje 11 natywnych dialogów z czterema wariantami obudowy: kopiowanie/usuwanie, dodawanie rzeczy, wyszukiwanie i katalog ikon. Wysokości i przewijanie części z nich opierają się na 100vh zamiast dostępnego viewportu. Powielone akcje mobilne używają odwróconego kierunku kolumny. Button usuwa focus-visible:outline, mimo wspólnej reguły fokusu w globals.css.

W TSX są 4 textarea oraz 80 input/select w 27 plikach, w tym pola ukryte, radio, checkbox i upload. 24 widoczne kontrolki mają powielone stare style (23 input/select oraz textarea rzeczy); pozostałe formularze przeważnie używają ui-control. Input/Select/Field/Label/ControlGroup/FormActions istnieją; brakuje prymitywu Textarea oraz wspólnej obudowy Dialog. Brak surowych kolorów hex w TSX. Tokeny i typografia są już wprowadzone w UI-01.

## Zakres wykonawczy

1. Wspólny Dialog oparty o natywny dialog i przekazany ref, bez własnego stanu. Jedna instancja: arkusz przy dolnej krawędzi telefonu, wyśrodkowane okno od 640 px. Rozmiary i wygląd korzystają z tokenów UI-01. Zachować showModal, onCancel, onClose, kontrolę pending oraz obecny powrót fokusu.
2. Wspólne style treści, tytułu i akcji dialogu; przewijanie w dostępnym dvh. Akcje mają ten sam porządek w DOM i na ekranie. Katalog ikon zachowuje własny przewijany obszar i stałą wysokość.
3. Ujednolicić widoczne kontrolki formularzy przez Input/Select/Textarea i istniejące ui-control. Zachować names, wartości, zależności lokalizacji, required, autoComplete, ref oraz obsługę zdarzeń. Ukryte pola, upload i wybory radio/checkbox zachowują semantykę natywną.
4. Ujednolicić przyciski przez istniejący Button/buttonClassName, naprawić widoczny fokus i minimum 44 px. Bez zmiany zasad zapisu, anulowania, usuwania, uploadu i uprawnień.
5. Przygotować lokalny interaktywny podgląd prawdziwych komponentów: formularz, błąd, pending, dialog, jasna/ciemna paleta oraz telefon/tablet/komputer. Dane syntetyczne, bez API i operacji gospodarstwa.

Nie zmieniać palety B, nawigacji, tras, danych, RLS, zależności ani automatyki czasu i pogody. Powłoka i nawigacja należą do UI-03; użycie Dialog w wyszukiwaniu zmienia wyłącznie obudowę istniejącego okna.

## Weryfikacja

Build Webpack, TypeScript, lint, istniejące testy logiki i kontraktów. Dodatkowe testy tylko dla nowych kontraktów natywnego dialogu i textarea. W przeglądarce: fokus/Tab/Escape/powrót do wyzwalacza, natywna walidacja, zachowanie wpisanych danych po zmianie szerokości, przewijanie długiego okna i dostępność akcji, kontrast. Ograniczenie lokalnego Turbopack z UI-01 nadal wymaga standardowego Linux CI przed integracją.
