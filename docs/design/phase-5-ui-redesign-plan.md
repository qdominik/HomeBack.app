# Plan Etapu 5 — system wizualny i redesign UI (AppShell, Dashboard, Ustawienia)

- Właściciel: Zespół B — Design/UI
- Data: 2026-08-23
- Branch: `design/app-visual-system-audit`
- Bazowy commit: `903ad5f` (main, po fazach 1–4b)
- Status: **PLAN DO REVIEW** — brak zmian w produkcyjnych komponentach UI; dokument tylko do zatwierdzenia.

Powiązane dokumenty:

- `docs/audits/accessibility-responsive-audit.md` (Zespół C, ustalenia A11–A15, R01),
- `docs/decisions/phase-2-design-system-dashboard-foundation.md`,
- `docs/decisions/phase-4b-dashboard-module-runtime-registry.md`,
- `docs/product/homebase-product-spec.md`.

---

## 1. Stan obecny

### Stack i architektura UI

- Next.js 16 + React 19, Tailwind CSS v4 z konfiguracją CSS-first (`@import "tailwindcss"` + `@theme inline` w `src/app/globals.css`). Brak pliku `tailwind.config.*`.
- Ikony: Phosphor Icons (`@phosphor-icons/react`), rejestr `EntityIcon`.
- Tłumaczenia: lokalny słownik `src/lib/i18n` (aktywny `pl`, nieaktywny `en`). Bez biblioteki i18n.
- Brak ładowania fontu webowego (`next/font` nieużywany) — deklaracja `Inter` w `body` praktycznie zawsze spada do fallbacku systemowego.

### Istniejące tokeny (`src/app/globals.css`)

Kolory semantyczne już istnieją: `background #f5f5f5`, `foreground #333333`, `surface #ffffff`, `surface-muted #f5f5f5`, `line #cccccc`, `primary #1b6f4d`, `primary-hover/strong #0d5f47`, `muted #666666`, `placeholder #999999`, statusy `success/warning/danger/info` (paleta typu Flat UI), `focus`, `disabled-opacity 0.5`, `radius 0.5rem`, `shadow-card`, `content-max-width 80rem`.

Pomocniki: `src/lib/ui/tokens.ts` (`cardContent`, `mutedText`, `focusRing`) oraz klasy formularzy `.ui-control/.ui-label/.ui-field-help` w CSS.

### Komponenty współdzielone

- `ui/button.tsx` — `Button` + `buttonClassName()` (warianty primary/secondary/ghost/danger).
- `ui/card.tsx` — `Card` (border + shadow-card).
- `ui/badge.tsx` — `Badge` (rounded-control, min-h-7).
- `components/status-badge.tsx` — osobny badge „Wkrótce” (rounded-full, kropka, ton warning).
- `ui/alert.tsx` — `Alert` (info/success/warning/danger, role alert/status, bez ikony i slotu tytułu).
- `ui/page-header.tsx` — H1 `text-[2rem] sm:text-[2.5rem]`; `ui/section-header.tsx` — H2 `text-2xl`; `module-page.tsx` — H1 `text-2xl`; `ui/stat-card.tsx`.
- `app-shell.tsx` — header (logo, użytkownik/domownicy·rola, wyloguj) + poziomo przewijana nawigacja 7 pozycji; moduły `soon` jako `aria-disabled` przyciski z badge.
- Dashboard: `page.tsx` + `dashboard-module-card.tsx` + runtime registry `dashboard/module-runtime.tsx` (`SoonModuleBody` jako dashed box wewnątrz karty); empty state „wszystkie moduły ukryte”.
- Ustawienia: zakładki jako linki-pill (aktywna = pełne primary), sekcje household/account/export to boxy zawierające tylko tytuł; personalizacja z własnym togglem na bazie checkboxa (`appearance-none`, tor h-6 w-10); Alerty sukcesu/błędu sterowane parametrami URL.

---

## 2. Problemy UI (audyt)

Oznaczenia priorytetów: P0 — blokuje jakościowy redesign lub jest defektem a11y; P1 — widoczny problem spójności; P2 — szlif.

### Typografia

1. **P1** — Brak realnego fontu marki: `Inter` zadeklarowany, ale nigdzie nie ładowany. Produkt renderuje się na foncie systemowym, różnie per platforma.
2. **P1** — Dwa konkurujące rozmiary H1: `PageHeader` (2rem→2.5rem, bold) vs `ModulePage` (text-2xl). Dashboard wygląda „marketingowo”, Ustawienia narzędziowo — na tej samej aplikacji.
3. **P1** — Hierarchia nagłówków nieregularna: `SectionHeader` H2 = 2xl, karta modułu H2 = base, boxy ustawień H2 = base bez opisu. Skok 32px → 16px.
4. **P2** — Wartości arbitralne (`text-[2rem]`, `leading-tight`) zamiast skali typograficznej; brak tabular-nums dla liczb (statystyki).

### Kolory

5. **P1** — `surface-muted` identyczne z `background` (#f5f5f5): tło strony i „wytłumaczona” powierzchnia się nie różnią; karty na szarym tle mają mało separacji.
6. **P1** — Paleta statusów (Flat UI: `#27ae60/#f39c12/#e74c3c/#3498db`) nie jest skoordynowana z zielonym primary ani z neutralnymi szarościami — wygląda „z pudełka”.
7. **P2** — `line #cccccc` dość ciemny i chłodny; obramowania dominują nad cieniami, UI robi się „kratowane”.
8. **P2** — Twardy `text-white` na primary zamiast tokena `on-primary`; alfa-tonowania niespójne między komponentami (warning/10 w StatusBadge i Alert vs warning/15 w Badge).

### Spacing i layout

9. **P1** — Kontener 80rem przy siatce dashboardu 2-kolumnowej daje karty ~600+ px szerokości — treść modułów ginie w przestrzeni; brak ograniczenia szerokości treści narzędziowej.
10. **P1** — Rhythm pionowy ad hoc: main py-8/py-10, dashboard space-y-8, settings space-y-6, paddingi kart p-4/p-5/p-6 i px-4 py-3.5 obok siebie.
11. **P2** — Nagłówek AppShell zajmuje dużo pionu (logo w-52/w-64 + user + nawigacja) zwłaszcza na mobile.

### AppShell / nawigacja

12. **P1** — Aktywna pozycja nav podwójnie oznaczona (pełne primary + biała kreska `after:` wewnątrz pill-a) — wizualny szum, wygląda niedopracowanie.
13. **P2** — Nawigacja mobilna to poziomy scroll bez wskazówki przewijania (brak fade/krawędzi); brak dolnej strefy dotyku.
14. **P0/P1** — Focus: globalny `:focus-visible` (3px outline, reguła unlayered) współistnieje z rozproszonymi `focus-visible:ring-*`. Tam gdzie oba się nakładają (np. disabled nav item: outline + ring-primary) powstaje podwójny wskaźnik; a tam gdzie ktoś doda kolejną klasę `outline-none`, wskaźnik znika — patrz A11 w audycie Zespołu C. System focusu jest jeden-za-dwa i trzyma się kaskadowo „przez przypadek”.

### Dashboard

15. **P1** — Karta modułu `soon`: podwójne ramki (border karty + dashed box `SoonModuleBody`) i dwa komunikaty o niedostępności (badge w nagłówku + dashed box) — wizualnie zaśmiecone.
16. **P2** — Greeting fallback do `t.app.tagline` wkleja slogan marketingowy jako opis strony w narzędziu.
17. **P2** — Wszystkie moduły równą wagą w stałej siatce 2-col od md; brakuje planu na moduły szerokie/wąskie (spans), gdy pojawią się realne treści.

### Ustawienia

18. **P1** — Zakładki wyglądają jak przyciski (pełne primary po aktywacji) — myląca affordancja; to jedyny miejsce z takim wzorcem.
19. **P1** — Sekcje household/account/export to martwe boxy z samym tytułem — brak EmptyState z opisem i akcją.
20. **P2** — Toggle personalizacji: brak `role="switch"`, ring `primary/40` niespójny z resztą systemu focusu; wysokość toru 24px przy standardzie dotyku 44px ratowana tylko przez duży label.

### Karty modułów i badge „Wkrótce”

21. **P1** — Dwa języki badge: `StatusBadge` (pill, rounded-full, kropka) vs `Badge` (rounded-control) — różny radius, wysokość i budowa.
22. **P2** — Disabled ma dwie miary: globalne opacity 0.5 dla kontrolek vs opacity-75 dla nav `soon`.

### Mobile 390×844

23. **P1** — Header wielowierszowy + przewijana nav zabierają ~180–200px wysokości; treść startuje nisko. Touch targets nav są OK (min-h-11), ale logo/user/wyloguj nie tworzą spójnej kompozycji mobilnej.
24. **P2** — Siatka dashboardu 1-kol na mobile jest poprawna, ale karta `soon` z dashed boxem generuje dużo pionowego szumu na małym ekranie.

### Stany empty/loading/error/disabled

25. **P1** — Loading praktycznie nie istnieje jako wzorzec (brak skeleton/spinner poza zamianą labelki przycisku na „Zapisywanie…”).
26. **P1** — EmptyState tylko na Dashboardzie; Ustawienia i inne moduły go nie mają (patrz A12/A15 — komunikaty bez live region w części aplikacji, właściciel: Zespół A).

### Spójność PL/EN

27. **P1** — Terminologia: `t.dashboard.addItem` = „Dodaj przedmiot”, a moduł items używa „Dodaj rzecz” — dwa określenia tej samej rzeczy w jednej aplikacji (skorelowane z pracą terminologiczną m4n-1/m4n-2).
28. **P2** — Hardcoded polski `aria-label="Zakładki ustawień"` w `settings/page.tsx` omija słownik; statyczny „Dzień dobry” niezależny od pory dnia.
29. **P2** — Słownik `en` utrzymywany ręcznie obok `pl` — ryzyko dryfu przy redakcji tekstów.

### Dostępność klawiatura/focus

30. **P0** — Konsolidacja focusu (pkt 14) plus brak skip-linku (A14) i placeholder `#999999` ≈ 2.85:1 (A13) — do rozwiązania wspólnie z systemem tokenów; skip-link i live regiony pozostają we współpracy z Zespołem A (właściciel a11y fixów wg audytu C), ale design system definiuje wzorce.

---

## 3. Kierunek wizualny

**Hasło kierunkowe:** „Spokojne narzędzie domowe” — czytelne, ciepłe neutralne tło, jedna akcentowa zieleń, miękkie ale precyzyjne detale. Produkt, nie prototyp; narzędzie, nie landing page.

Konkretnie:

- **Baza**: lekko ciepłe off-white tło (#fafaf8 rodzina), czyste białe karty, granice 1px w jasnym neutralnym (#e5e5e0–#e8e8e4 rodzina), cień subtelny i drugorzędny wobec granic.
- **Primary**: zachowana tożsamość zieleni (rodzina obecnej #1b6f4d), rozbudowana do pełnej skali 50–900; hover ciemniejszy, soft-tint dla tł. Akcent używany oszczędnie: akcje główne, aktywna nawigacja, ikony modułów.
- **Statusy**: przebudowane w rodzinie z primary (wspólna saturacja/jasność): success — spokojna zieleń, error — ceglasta czerwień, warning — miodowa ambra, info — grafitowo-błękitna; każde z parą base + soft.
- **„Wkrótce”**: zejście z pomarańczu warning w stronę neutralno-informacyjnego tonu (soft graphite/info) — status informacyjny, nie ostrzeżenie.
- **Radius umiarkowany**: kontrolki 0.5rem (bez zmian), karty 0.75rem, pill tylko dla badge/toggle/dot.
- **Zero agresywnych gradientów**, zero hero marketingowego w aplikacji; powitanie skromne (imię + jedno zdanie), fallback neutralny zamiast taglinu.
- **Typografia**: prawdziwy Inter przez `next/font/google` (self-host przez Next), skala zamknięta: 12/14/16/18/20/24/30; H1 stron jednolity 24–30px semi-bold — narzędziowy, nie billboard.
- **Ruch**: 120–160ms ease-out na kolory/cienie; respektowanie `prefers-reduced-motion` (już globalnie obecne).

## 4. Design principles

1. **Narzędzie przed dekoracją** — każdy piksel chromu musi uzasadniać swój koszt; treść modułów jest bohaterem.
2. **Jeden sposób na rzecz** — jeden badge, jeden toggle, jeden focus ring, jedna skala H1; duplikaty usuwamy.
3. **Granica > cień** — separację robi border i tło; cień tylko dla elementów „nad” (popover, modal, drag).
4. **Semantyka przed wartością** — komponenty używają tokenów semantycznych; hex-y żyją tylko w `globals.css`.
5. **Dotyk i klawiatura równe** — target ≥44px, widoczny focus wszędzie, stany hover nie przenoszą informacji dostępnych tylko z myszy.
6. **PL-first, dictionary-only** — żaden string UI poza słownikiem; nazwy produktowe spójne (jedno określenie na rzecz/przedmiot).
7. **Ewolucja, nie rewolucja** — etapami po warstwach: tokeny → chrome (AppShell) → Dashboard → Ustawienia → reszta; żadnego big-bang PR.
8. **Dane są nietykalne** — design nie zmienia modelu, RLS, registry semantyki ani server actions.

## 5. Tokeny do wprowadzenia (Etap 5.1)

Definicja: `src/app/globals.css` (`:root` + `@theme inline`) + rozszerzone helpery w `src/lib/ui/tokens.ts`. Zero nowych zależności.

### 5.1 Kolory (semantic)

| Token | Rola | Kierunek wartości |
| --- | --- | --- |
| `--background` | tło aplikacji | ciepły off-white (np. #fafaf8) |
| `--surface` | karty, navbar | #ffffff |
| `--surface-muted` | wypełnienia, readonly, hover | nowy, jaśniejszy niż background (np. #f2f2ef) |
| `--line` / `--line-strong` | granice | jaśniejsze, ciepłe neutralne |
| `--foreground` / `--foreground-muted` / `--foreground-subtle` | tekst | grafity z ciepłem; subtle zastępuje placeholder #999 (kontrast ≥4.5:1 tam, gdzie to tekst) |
| `--on-primary` | tekst na primary | zastępuje twarde `text-white` |
| `--primary` + skala 50–900 | akcent | rodzina #1b6f4d; `hover`/`strong` mapują się na skalę |
| `--primary-soft` | tint tł. (ghost, active bg) | primary @ 8–12% |
| `--success/-warning/-danger/-info` + `-soft` | statusy | nowa, skoordynowana rodzina |
| `--focus` | focus ring | primary; ring przez token, nie ad-hoc mixy |

### 5.2 Typografia

- Font: `Inter` via `next/font/google`, zmienna CSS `--font-sans` podpięta do body i `@theme`.
- Skala ról (Tailwind theme): `caption 12px`, `body-sm 14px`, `body 16px`, `lead 18px`, `title 20px`, `h2 24px`, `h1 30px` — z parowanymi leading/trackingiem.
- Reguły: H1 strony = `h1` token (wszystkie strony jednakowo); H2 sekcji = `h2`; tytuł karty = `title`; liczby = `tabular-nums`.

### 5.3 Spacing

- Siatka 4px bez zmian (Tailwind default); standaryzacja zastosowań: strona `py-8`, sekcja gap `space-y-6`, karta `p-5 sm:p-6` (token `cardContent` pozostaje), lista row `px-4 py-3`, pole gap `gap-3`.
- Kontener: globalny `max-w-content` zostaje dla szerokich modułów, ale Dashboard/Ustawienia dostają wrapper treści `max-w-[72rem]` (do decyzji na review; opcja B: grid 12-col ze spanami modułów).

### 5.4 Radius / shadow / border / focus

- `--radius-sm 0.375rem`, `--radius-control 0.5rem` (obecny), `--radius-card 0.75rem`, `radius-full` dla pill/dot/toggle.
- `shadow-xs` (domyślny dla kart — bardzo subtelny, 2-warstwowy), `shadow-md` (popover/hover), `shadow-lg` (modal). Obecny `shadow-card` mapowany na `shadow-xs` w trakcie migracji.
- Focus: jeden wzorzec `--focus-ring` (box-shadow 3px primary @ ~35%) eksponowany jako klasa `.focus-ring` / helper `focusRing` w `tokens.ts`; globalny `:focus-visible` uproszczony do tego samego tokena; usuwamy mieszanie `ring-*` z outline.

### 5.5 Status tones

| Ton | Zastosowanie | Para kolorów |
| --- | --- | --- |
| `soon` | badge/nav/karty soon | info/neutral soft + subtle text (rezygnacja z pomarańczu) |
| `available` | normalne moduły | brak wyróżnienia (default) |
| `disabled` | kontrolki i nav nieaktywne | muted + `--disabled-opacity` (jedna wartość) |
| `success` | alerty/badge sukcesu | nowa zieleń + soft |
| `error` | alerty/błędy walidacji | nowa czerwień + soft |

## 6. Komponenty do ujednolicenia

| Komponent | Stan dziś | Docelowo (API szkic) | Pliki |
| --- | --- | --- | --- |
| Button | `buttonClassName` 4 warianty, brak rozmiarów/loading | + size sm/md, `loading`, `iconStart/iconEnd`, spójny focusRing | `ui/button.tsx` |
| Card | border+shadow, brak sekcji | radius-card, warianty: default / interactive; opcjonalne CardHeader z akcją | `ui/card.tsx` |
| Badge | dwa systemy (ui/Badge + StatusBadge) | jeden `Badge` tone-based (neutral/primary/success/warning/danger/info/**soon**), pill shape, opcjonalny dot | `ui/badge.tsx`, `status-badge.tsx` (delegetuje) |
| Toggle/Switch | custom checkbox w personalization | `Switch` role="switch", sizes, disabled, focusRing; form-compatible (checkbox value) | nowy `ui/switch.tsx` |
| SectionHeader | H2 2xl + description | poziomy title/h2, action slot, opcjonalna meta | `ui/section-header.tsx` |
| PageHeader | H1 2rem+ | H1 = token h1 (30px), opis max-w, action; używany też przez ModulePage (fuzja) | `ui/page-header.tsx`, `module-page.tsx` |
| EmptyState | improwizowany na Dashboardzie | `EmptyState{icon,title,description,action}` — dashboard, ustawienia, przyszłe moduły | nowy `ui/empty-state.tsx` |
| Alert | 4 warianty, bez ikony/tytułu | + ikona per wariant, slot title, focusRing-neutralny, zachowane role alert/status | `ui/alert.tsx` |
| NavigationItem | inline w AppShell i Settings tabs | wspólny `NavItem{href,label,icon,badge?,active,disabled?}` dla top-nav i tabs | nowy `ui/nav-item.tsx` |
| ModuleCard | DashboardModuleCard | header (ikona+tytuł+badge), body slot, wariant soon bez podwójnej ramki (jeden komunikat) | `dashboard-module-card.tsx`, ` SoonModuleBody` |

Bez zmian semantycznych runtime registry: `DashboardModuleCard` nadal dostaje `definition` + `Render` jak dotychczas.

## 7. Etapowanie implementacji

### Etap 5.1 — Fundament: tokeny i komponenty bazowe (bez zmiany layoutów)

- Zakres: nowe tokeny kolorów/typografii/radius/shadow/focus w `globals.css`; Inter przez `next/font`; rozszerzenie `src/lib/ui/tokens.ts`; komponenty Button/Badge/Card/Alert/Switch/EmptyState/SectionHeader w wersji docelowej; konsolidacja focus ring.
- Ograniczenie: istniejące ekrany dalej działają na starych klasach tam, gdzie to bezpieczne; wymiana kluczowych tokenów (background/surface-muted/line/statusy) może delikatnie odświeżyć kolory globalnie — akceptowalne, bo to tokeny.
- Warunek wejścia 5.2: lint/build/test logic zielone; manualny smoke wszystkich tras; kontrasty AA dla tekstu potwierdzone.

### Etap 5.2 — AppShell i nawigacja

- Zakres: AppShell na nowych tokenach; uproszczenie aktywnego stanu nav (jeden wskaźnik); NavItem wspólny; skip-link (koordynacja z A); mobile: kompaktowy header + widoczna affine przewijania lub dolna sticky nawigacja (decyzja na prototypie 390px); disabled `soon` z jednym wzorcem aria-disabled + sr-only opis.
- Wyjście: tab-through bez pułapek, jeden wizualny focus na całej stronie, 390×844 bez overflow i bez schowanej nawigacji.

### Etap 5.3 — Dashboard

- Zakres: PageHeader narzędziowy (H1 token, neutralny fallback greetingu); siatka/wraper szerokości; ModuleCard (header/body, wariant soon z jednym komunikatem, bez podwójnych ramek); EmptyState dla „wszystkich ukrytych”; statusy `soon` na nowych tonach.
- Wyjście: wizualna hierarchia kart czytelna przy 1 i 2 kolumnach; brak zmian w danych/personalizacji (te same zapytania, ten sam registry).

### Etap 5.4 — Ustawienia

- Zakres: tabs → wzorzec segmentowy na NavItem (semantyka linków zachowana, URL-driven bez zmian); Switch w personalizacji; Alert z ikonami dla sukcesu/błędu; EmptyState dla household/account/export; wszystkie stringi przez słownik (usunięcie hardcoded aria-label).
- Wyjście: spójny język komponentów z Dashboardem; formularz personalizacji działa identycznie (server action bez zmian).

### Etap 5.5 — Pozostałe ekrany (etapami per moduł)

- Zakres: items, home, family, documents, categories, auth — migracja na tokeny/komponenty, strona po stronie, każdy w osobnym PR-czku; najpierw ekrany o największym ruchu.
- Zasada: żaden PR nie miesza starego i nowego stylu kart na jednej trasie po jego zakończeniu.

## 8. Kryteria akceptacji (globalne)

1. Wszystkie kolory UI pochodzą z tokenów semantycznych; wyszukiwanie hex w `src/components` i `src/app` poza `globals.css` zwraca pusto (poza ew. udokumentowanymi wyjątkami).
2. Jeden fokus-ring w całej aplikacji; Tab pokazuje dokładnie jeden widoczny wskaźnik na elemencie; brak `focus-visible:outline-none` bez zamiennika.
3. Teksty AA (≥4.5:1 body, ≥3:1 large); placeholder nie jest jaśniejszy niż próg AA dla danego pola (cel ≥4.5:1 lub jawna akceptacja ownera).
4. Jeden komponent Badge/Toggle/Button w użyciu; StatusBadge deleguje do Badge.
5. H1 wszystkich stron tej samej skali; hierarchy H1→H2→H3 monotoniczna.
6. Mobile 390×844: brak poziomego scrolla, nav osiągalna kciukiem lub jawnie zaakceptowany pattern scroll, touch targets ≥44px.
7. PL: zero hardcoded stringów UI poza `src/lib/i18n`; jedna nazwa dla „rzecz/przedmiot” po decyzji terminologicznej.
8. Po każdym etapie: `npm run lint`, `npm run test:logic`, `npm run build` zielone; E2E bez regresji selektorów (synchronizacja z Zespołem testów E2E przy zmianach klas/struktur DOM).
9. Żadna zmiana: modelu danych, migracji, RLS, auth, server actions, semantyki runtime registry, item-photo, icon search.

## 9. Czego nie robimy

- Dark mode (odnotowany jako przyszły etap; tokeny projektujemy tak, by był tani później).
- Bibliotek komponentów (shadcn/radix/cva itp.) i nowych dependencji UI.
- Biblioteki i18n oraz automatycznego tłumaczenia danych użytkownika.
- Marketingowych elementów (hero, gradienty, ilustracje stockowe) wewnątrz aplikacji.
- Redesignu całej aplikacji w jednym PR; zmian funkcjonalnych pod pretekstem wizualnych.
- Zmian w `landing-v201` (poza repo aplikacji) i w strukturze routingu.
- Usuwania/ukrywania modułów `soon`, zmian ich konfiguracji lub domyślnej widoczności.

## 10. Ryzyka i mitigacje

| Ryzyko | Wpływ | Mitigacja |
| --- | --- | --- |
| Kaskada CSS: globalne reguły unlayered w globals.css nadpisują utilities Tailwinda — refaktor focusu/typografii może odwrócić zachowania | P1 | Przenosić reguły globalne do `@layer base` świadomie, krok po kroku, z build+smoke po każdym kroku; nie mieszać ring+outline |
| Zmiana klas/DOM psuje selektory Playwright (E2E) | P1 | Sync z zespołem E2E przed 5.2/5.3; preferencja data-testid przy przebudowie AppShell i tabs |
| Wprowadzenie `next/font` wpływa na build/self-host | P2 | Weryfikacja build i preview; fallback stack bez Inter pozostaje w tokenach |
| Dotknięcie `status-badge`/`SoonModuleBody` ociera się o registry (własność A) | P1 | Zmieniamy wyłącznie prezentację; API props i definicje bez zmian; diff review przez ownera A |
| Terminologia „rzecz/przedmiot” wymaga decyzji produktowej | P2 | Zamrozić decyzję przed 5.3; tymczasowo nie ruszać labeli akcji, najpierw spójność wizualna |
| Rozjazd pl/en przy redakcji tekstów | P2 | Przy każdej zmianie stringa aktualizować oba słowniki (nawet jeśli en nieaktywny) |
| Scope creep do pełnego redesignu | P1 | Twarde gate'y etapów; każdy etap = osobny branch/PR i osobna akceptacja ownera |
| Nowa paleta statusów zmienia czytane dziś znaczenia (warning→info dla soon) | P2 | Przedstawić mockup ownerowi przed 5.1; zachować możliwość łatwego odwrotu (to tylko tokeny) |

---

## Podsumowanie dla review

Decyzje oczekiwane od ownera przed startem 5.1:

1. Akceptacja kierunku palety (ciepłe neutrale + nowa rodzina statusów; `soon` schodzi z pomarańczu).
2. Decyzja fontu: Inter przez `next/font` — tak/nie.
3. Decyzja szerokości treści Dashboard/Ustawienia (wrapper 72rem vs grid spans).
4. Decyzja mobile nav: kompaktowy header + scroll-affordance vs dolna sticky nawigacja.
5. Terminologia „rzecz vs przedmiot” (może zostać odłożona do 5.3).
