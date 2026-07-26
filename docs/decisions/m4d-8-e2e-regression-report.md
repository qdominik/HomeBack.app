# M4D.8 â€” raport regresji E2E cyklu usuwania lokalizacji

Data wykonania: 2026-07-26
ZespĂłĹ‚: Team B
Werdykt: **E2E PASS WITH 2 EXPLICIT SKIPS**

## Stan finalny po poprawce Team A

Retest wykonano po synchronizacji z `origin/main` po merge PR #9 (`ff6d21791a153bf5a9a5825c1865042b1f3bbeba`).

Regresja `M4D8-E2E-01` zostaĹ‚a naprawiona przez Team A i zweryfikowana peĹ‚nym retestem Team B.

### Wynik koĹ„cowy

```text
E2E M4D.8:       13 PASS / 2 SKIP / 0 FAIL
PeĹ‚ny E2E z auth: 13 PASS / 2 SKIP / 0 FAIL
Czas pelnego E2E: 50,4 s
Flaky:            0
```

Mutacje DELETE, DETACH i MOVE, liczniki zaleĹĽnoĹ›ci, trwaĹ‚oĹ›Ä‡ po odĹ›wieĹĽeniu, izolacja gospodarstw oraz alerty sukcesu dla Pomieszczenia, Mebla i Schowka: **PASS**.

Dwa jawne `SKIP` dotyczÄ… rĂłl:

- Domownik;
- Dziecko.

Powodem jest brak zatwierdzonego legalnego fixture browserowego, ktĂłre tworzyĹ‚oby te role bez service role lub obejĹ›cia RLS.

## 1. Zakres i baza

- Zdalna baza po `git fetch origin`: `origin/main` = `ff6d21791a153bf5a9a5825c1865042b1f3bbeba`.
- Worktree: `C:\Users\qdomi\Desktop\HomeBack.worktrees\team-b-e2e`.
- GaĹ‚Ä…Ĺş wejĹ›ciowa worktree: `test/e2e-regression-foundation` (`fb2323...`); nie miaĹ‚a unikalnej rĂłĹĽnicy wzglÄ™dem aktualnego `origin/main`.
- GaĹ‚Ä…Ĺş robocza: `test/m4d8-e2e-regression`, utworzona bezpoĹ›rednio z aktualnego `origin/main`.
- Zmiany sÄ… przeznaczone do osobnego commita Team B; nie wykonano push, PR, merge ani tag przez Team B.
- Team B nie zmieniĹ‚ kodu domenowego, server actions, RPC, migracji, RLS, typĂłw bazy ani dialogĂłw aplikacji.

Przeczytane ĹşrĂłdĹ‚a kontraktu obejmowaĹ‚y specyfikacjÄ™ produktu, plan cyklu lokalizacji, decyzje M4D.2â€“M4D.7, istniejÄ…cÄ… dokumentacjÄ™ runnera E2E, testy pgTAP i testy logiczne cyklu usuwania oraz aktualne implementacje formularzy, kart i dialogĂłw.

## 2. Runner i Ĺ›rodowisko

- Runner: Playwright, projekt `chromium`, jeden worker.
- Konfiguracja uruchamia prawdziwÄ… aplikacjÄ™ Next.js i uĹĽywa prawdziwego przepĹ‚ywu rejestracji, potwierdzenia wiadomoĹ›ci w Mailpit, logowania i tworzenia gospodarstwa.
- Bazowy adres testĂłw: `http://127.0.0.1:3108`.
- RÄ™czny preflight aplikacji:
  - launcher PID: `30032`;
  - listener Next.js PID: `31576`;
  - listener zweryfikowany na porcie `3108`;
  - procesy zatrzymano po zakoĹ„czeniu prac, port zostaĹ‚ zwolniony.
- PeĹ‚ne przebiegi uĹĽywaĹ‚y serwera `webServer` zarzÄ…dzanego przez Playwright.
- Lokalne usĹ‚ugi Supabase wymagane przez test byĹ‚y dostÄ™pne; Auth i Mailpit odpowiadaĹ‚y HTTP 200.
- `supabase status` zgĹ‚aszaĹ‚ zatrzymane usĹ‚ugi niekrytyczne dla tego przebiegu: `imgproxy`, `edge_runtime`, `pooler`. Nie uruchamiano, nie zatrzymywano ani nie resetowano Supabase lub Dockera.
- OstrzeĹĽenie Node o konflikcie `NO_COLOR`/`FORCE_COLOR` nie wpĹ‚ywaĹ‚o na testy.

Polecenia:

```powershell
$env:E2E_PORT='3108'
npx.cmd playwright test tests/e2e/m4d8-location-lifecycle.spec.ts --workers=1
npm.cmd run test:e2e
npm.cmd run test:logic
npm.cmd run lint
npm.cmd run build
git diff --check
```

## 3. Przygotowanie danych

KaĹĽdy scenariusz mutujÄ…cy:

1. rejestrowaĹ‚ nowego uĹĽytkownika przez UI;
2. potwierdzaĹ‚ adres przez Mailpit;
3. tworzyĹ‚ odrÄ™bne gospodarstwo przez UI;
4. uruchamiaĹ‚ zatwierdzony generator `deletion_test` w Ustawieniach;
5. uĹĽywaĹ‚ unikalnego sufiksu danych, dziÄ™ki czemu selektory i gospodarstwa nie kolidowaĹ‚y.

Generator dziaĹ‚a w kontekĹ›cie zalogowanego uĹĽytkownika i bieĹĽÄ…cego `household_id` (`security invoker`/RLS). Testy nie uĹĽywajÄ… service role, bezpoĹ›redniego SQL ani wspĂłĹ‚dzielonego globalnego gospodarstwa. Scenariusz izolacji tworzy dwa niezaleĹĽne konta i dwa gospodarstwa.

Dodatkowo UI tworzyĹ‚o:

- puste Pomieszczenie;
- pusty Mebel bez SchowkĂłw;
- dodatkowy Schowek jako zmieniony cel MOVE.

## 4. Macierz pokrycia przed poprawkÄ… (historyczna)

PoniĹĽsza macierz dokumentuje stan, ktĂłry wykryĹ‚ `M4D8-E2E-01`. ObowiÄ…zujÄ…cy wynik po poprawce znajduje siÄ™ w sekcji â€žStan finalny po poprawce Team Aâ€ť; wszystkie pozycje `FAIL-01` dotyczÄ…ce alertĂłw sukcesu majÄ… w retestcie wynik `PASS`.

Legenda:

- `PASS` â€” zachowanie i trwaĹ‚oĹ›Ä‡ danych potwierdzone;
- `FAIL-01` â€” operacja danych poprawna, lecz brak wymaganego komunikatu sukcesu;
- `SKIP-FIXTURE` â€” brak zatwierdzonej Ĺ›cieĹĽki utworzenia roli w bieĹĽÄ…cym MVP; test jawnie pominiÄ™ty, bez pozornego zaliczenia.

| Encja / obszar | DELETE | DETACH | MOVE | Anuluj / Escape / retry / loading | Dane po refreshu | Wynik |
|---|---|---|---|---|---|---|
| Pomieszczenie puste | mutacja `PASS`, feedback `FAIL-01` | â€” | â€” | cancel, Escape, focus return i retry `PASS` | `PASS` | `FAIL-01` |
| Pomieszczenie z pustym poddrzewem | mutacja i liczniki `PASS`, feedback `FAIL-01` | â€” | â€” | cancel i retry `PASS` | `PASS` | `FAIL-01` |
| Pomieszczenie z Rzeczami | â€” | dane `PASS`, feedback `FAIL-01` | dane i zmiana celu `PASS`, feedback `FAIL-01` | wykluczenie wĹ‚asnego poddrzewa `PASS` | `PASS` | `FAIL-01` |
| Mebel pusty bez SchowkĂłw | mutacja `PASS`, feedback `FAIL-01` | â€” | â€” | cancel i retry `PASS` | stan UI `PASS` | `FAIL-01` |
| Mebel z pustymi Schowkami | mutacja i liczniki `PASS`, feedback `FAIL-01` | â€” | â€” | finalne potwierdzenie `PASS` | stan UI `PASS` | `FAIL-01` |
| Mebel z Rzeczami | â€” | dane `PASS`, feedback `FAIL-01` | dane i zmiana celu `PASS`, feedback `FAIL-01` | bĹ‚Ä…d sesji, retry i blokada submit podczas loading `PASS` | `PASS` | `FAIL-01` |
| Schowek pusty | mutacja `PASS`, feedback `FAIL-01` | â€” | â€” | cancel i retry `PASS` | `PASS` | `FAIL-01` |
| Schowek z Rzeczami | â€” | dane `PASS`, feedback `FAIL-01` | dane i zmiana celu `PASS`, feedback `FAIL-01` | wykluczenie ĹşrĂłdĹ‚a `PASS` | `PASS` | `FAIL-01` |
| Aktywne i archiwalne Rzeczy | â€” | rekordy zachowane, przypisania odpiÄ™te `PASS` | gĹ‚Ăłwne lokalizacje przeniesione, pozostaĹ‚e przypisania odpiÄ™te `PASS` | widoki aktywne/archiwalne/Bez lokalizacji `PASS` | `PASS` | `PASS` |
| Izolacja gospodarstw | brak danych obcego gospodarstwa `PASS` | â€” | obce cele niewidoczne `PASS` | ponowne logowanie do pierwszego gospodarstwa `PASS` | `PASS` | `PASS` |
| ResponsywnoĹ›Ä‡ i podstawowa dostÄ™pnoĹ›Ä‡ | dialog w 375, 768 i 1280 px `PASS` | â€” | â€” | brak overflow, focus, Escape i powrĂłt focusu `PASS` | â€” | `PASS` |
| Administrator | wszystkie wykonywalne operacje uruchomione | `PASS` funkcjonalnie | `PASS` funkcjonalnie | `PASS` | `PASS` | feedback `FAIL-01` |
| Domownik | â€” | â€” | â€” | brak legalnego browser fixture | â€” | `SKIP-FIXTURE` |
| Dziecko | â€” | â€” | â€” | brak legalnego browser fixture | â€” | `SKIP-FIXTURE` |

W aktualnym modelu struktury najniĹĽszy poziom L3 jest nazwany **Schowek**. Raport nie wprowadza dodatkowej encji â€žPozycjaâ€ť poniĹĽej Schowka.

## 5. Scenariusze automatyczne

Plik M4D.8 zawiera 14 testĂłw:

1. administrator usuwa puste Pomieszczenie po cancel, Escape i ponowieniu;
2. usuwa Pomieszczenie z pustym Meblem i Schowkiem;
3. DETACH Pomieszczenia, aktywne i archiwalne Rzeczy trafiajÄ… do â€žBez lokalizacjiâ€ť;
4. MOVE Pomieszczenia do zmienionego zewnÄ™trznego Schowka, wĹ‚asne poddrzewo jest wykluczone;
5. DELETE pustego Mebla bez SchowkĂłw oraz Mebla z pustym Schowkiem;
6. bĹ‚Ä…d pobrania kontekstu Mebla po wygaĹ›niÄ™ciu sesji, ponowne logowanie, retry i DETACH;
7. MOVE Mebla, zmiana celu, wykluczenie poddrzewa i blokada ponownego submit podczas loading;
8. DELETE pustego Schowka po cancel i retry;
9. DETACH Schowka z zachowaniem nadrzÄ™dnego Mebla i rekordĂłw Rzeczy;
10. MOVE Schowka do innego Pomieszczenia i trwaĹ‚oĹ›Ä‡ po refreshu;
11. izolacja danych i celĂłw MOVE miÄ™dzy dwoma gospodarstwami;
12. dialog przy szerokoĹ›ciach 375, 768 i 1280 px, focus, Escape i brak poziomego overflow;
13. jawny skip roli Domownik;
14. jawny skip roli Dziecko.

IstniejÄ…cy test rejestracji/auth pozostaje czÄ™Ĺ›ciÄ… peĹ‚nego runnera.

## 6. Wyniki przed poprawkÄ… Team A (historyczne)

### Docelowy zestaw M4D.8

```text
10 failed
2 passed
2 skipped
czas: 3.0 min
```

Dwa testy niezaleĹĽne od koĹ„cowego statusu operacji przeszĹ‚y: izolacja gospodarstw oraz responsywnoĹ›Ä‡/podstawowa dostÄ™pnoĹ›Ä‡. Wszystkie dziesiÄ™Ä‡ testĂłw wykonujÄ…cych skutecznÄ… operacjÄ™ usuniÄ™cia koĹ„czy siÄ™ wyĹ‚Ä…cznie na miÄ™kkiej asercji komunikatu sukcesu. Dalsze asercje w tych testach potwierdziĹ‚y poprawny stan danych.

### PeĹ‚ny runner E2E

```text
10 failed
3 passed
2 skipped
czas: 3.0 min
```

Dodatkowy zaliczony test to istniejÄ…ca regresja rejestracji, Mailpit, gospodarstwa, logowania i ochrony tras.

### PozostaĹ‚e bramki

| Bramka | Wynik |
|---|---|
| `npm.cmd run test:logic` | `PASS`: 152/152 |
| `npm.cmd run lint` | `PASS`: 0 bĹ‚Ä™dĂłw i ostrzeĹĽeĹ„ |
| `npm.cmd run build` | `PASS`: Next.js 16.2.10, kompilacja i TypeScript zakoĹ„czone poprawnie, 17 tras wygenerowanych |
| `git diff --check` | `PASS` |

TakĹĽe przed poprawkÄ… nie zaobserwowano flaky testĂłw. Docelowy i peĹ‚ny przebieg daĹ‚y ten sam deterministyczny wzorzec. WstÄ™pne korekty selektorĂłw harnessu nie zostaĹ‚y sklasyfikowane jako bĹ‚Ä™dy produktu.

## 7. Regresja M4D8-E2E-01 â€” FIXED

Status finalny: **naprawiona przez Team A; 13 PASS / 2 SKIP / 0 FAIL w peĹ‚nym retestcie Team B**.

**Priorytet:** P2
**Charakter:** systemowy brak widocznego feedbacku po skutecznym usuniÄ™ciu lokalizacji
**Encje:** Pomieszczenie, Mebel, Schowek
**Warianty:** DELETE, DETACH, MOVE
**PowtarzalnoĹ›Ä‡:** 100% w koĹ„cowym przebiegu docelowym i peĹ‚nym

### Warunki

- zalogowany administrator wĹ‚asnego gospodarstwa;
- poprawnie zaĹ‚adowany kontekst zaleĹĽnoĹ›ci;
- poprawna operacja DELETE, DETACH albo MOVE;
- dla MOVE zatwierdzony zewnÄ™trzny Schowek docelowy.

### Kroki reprodukcji

1. OtwĂłrz `/home`.
2. OtwĂłrz dialog usuniÄ™cia Pomieszczenia, Mebla albo Schowka.
3. Wybierz prawidĹ‚owÄ… rezolucjÄ™ i przejdĹş do podsumowania.
4. ZatwierdĹş operacjÄ™.
5. Obserwuj zamkniÄ™cie dialogu i znikniÄ™cie usuniÄ™tej encji.
6. SprawdĹş widoczny komunikat statusu.
7. OdĹ›wieĹĽ stronÄ™ lub przejdĹş do widoku Rzeczy i zweryfikuj dane.

### Oczekiwane

Po sukcesie widoczny jest odpowiedni komunikat ze sĹ‚ownika:

- `Pomieszczenie zostaĹ‚o usuniÄ™te.`;
- `Mebel zostaĹ‚ usuniÄ™ty.`;
- `Schowek zostaĹ‚ usuniÄ™ty.`.

Komunikat powinien byÄ‡ dostÄ™pny dla technologii asystujÄ…cych i nie znikaÄ‡ zanim uĹĽytkownik moĹĽe go zauwaĹĽyÄ‡.

### Rzeczywiste

Dialog zamyka siÄ™, struktura odĹ›wieĹĽa siÄ™, a mutacja jest poprawna i trwaĹ‚a, lecz ĹĽaden z powyĹĽszych komunikatĂłw nie pojawia siÄ™ w DOM. ĹšcieĹĽka bĹ‚Ä™du dziaĹ‚a: test wymusiĹ‚ bĹ‚Ä…d pobrania zaleĹĽnoĹ›ci Mebla, zobaczyĹ‚ `Nie udaĹ‚o siÄ™ usunÄ…Ä‡ Mebla.`, ponownie siÄ™ zalogowaĹ‚ i skutecznie uĹĽyĹ‚ `Pobierz ponownie`.

### Dowody lokalne

KaĹĽdy katalog zawiera `trace.zip`, `video.webm`, `test-failed-1.png` i `error-context.md` (scenariusz retry ma rĂłwnieĹĽ `video-1.webm`):

```text
test-results\m4d8-location-lifecycle-M4-6d9fb-ter-cancel-Escape-and-retry-chromium
test-results\m4d8-location-lifecycle-M4-af52a-urniture-and-Storage-spaces-chromium
test-results\m4d8-location-lifecycle-M4-f2029-nd-preserves-archived-Items-chromium
test-results\m4d8-location-lifecycle-M4-f2dff-et-and-excludes-its-subtree-chromium
test-results\m4d8-location-lifecycle-M4-7bacd--and-without-Storage-spaces-chromium
test-results\m4d8-location-lifecycle-M4-9e515-r-login-then-detaches-Items-chromium
test-results\m4d8-location-lifecycle-M4-12105-blocks-submit-while-loading-chromium
test-results\m4d8-location-lifecycle-M4-92852-pace-after-cancel-and-retry-chromium
test-results\m4d8-location-lifecycle-M4-9771c-serves-the-parent-Furniture-chromium
test-results\m4d8-location-lifecycle-M4-2786b--and-persists-after-refresh-chromium
```

Artefakty sÄ… lokalne i ignorowane przez Git.

### Podejrzany obszar

To diagnoza, nie zmiana Team B. Dialogi:

- `src/components/home/room-delete-dialog.tsx`;
- `src/components/home/storage-location-l2-delete-dialog.tsx`;
- `src/components/home/storage-location-l3-delete-dialog.tsx`

po sukcesie zamykajÄ… siÄ™ i wywoĹ‚ujÄ… odĹ›wieĹĽenie routingu, ale nie przekazujÄ… widocznego statusu do strony. Strona `/home` potrafi renderowaÄ‡ statusy operacji struktury, gdy otrzyma wĹ‚aĹ›ciwy stan/query. Team B nie zmieniaĹ‚ tego kodu.

## 8. Scenariusze niewykonane i ryzyka

### Role Domownik i Dziecko

BieĹĽÄ…cy browser flow tworzy legalnie wyĹ‚Ä…cznie administratora nowego gospodarstwa. Nie ma aktywnego UI zaproszeĹ„/zmiany rĂłl ani zatwierdzonego fixture, ktĂłry tworzyĹ‚by Domownika lub Dziecko bez service role i bez omijania RLS. Team B nie rozszerzyĹ‚ modelu danych ani produkcyjnego API. Dwa testy sÄ… jawnie oznaczone `skip` z tym powodem.

WidocznoĹ›Ä‡ danych obcego gospodarstwa i obcych celĂłw MOVE zostaĹ‚a sprawdzona z dwoma prawdziwymi administratorami. Semantyka niedozwolonych mutacji rĂłl i obcego `household_id` pozostaje pokryta niĹĽszymi testami pgTAP/logic, ale nie zostaĹ‚a pozornie przedstawiona jako peĹ‚ny E2E roli.

### PozostaĹ‚e ograniczenia

- Browser E2E nie wymusza osobnego konfliktu `DEPENDENCIES_CHANGED` przez rĂłwnolegĹ‚Ä… zmianÄ™ danych; pokrywa bĹ‚Ä…d pobrania kontekstu, komunikat bĹ‚Ä™du i skuteczny retry.
- Uruchomiono tylko projekt Chromium zgodnie z istniejÄ…cÄ… konfiguracjÄ….
- Jeden worker wydĹ‚uĹĽa suite, ale zapobiega kolizjom Mailpit i uĹ‚atwia deterministycznÄ… diagnostykÄ™.
- Dane testowe pozostajÄ… w lokalnej bazie, lecz sÄ… odseparowane przez unikalne gospodarstwa i RLS.
- Zatrzymane niekrytyczne usĹ‚ugi Supabase nie uczestniczyĹ‚y w badanych Ĺ›cieĹĽkach.

## 9. Rozliczenie poprawki Team A

PoniĹĽsze kryteria byĹ‚y warunkami usuniÄ™cia regresji. Team A zrealizowaĹ‚ poprawkÄ™ alertĂłw sukcesu, a Team B potwierdziĹ‚ jÄ… finalnym retestem bez bĹ‚Ä™dĂłw.

1. Po kaĹĽdym skutecznym DELETE, DETACH i MOVE na poziomie Pomieszczenia, Mebla i Schowka pokazaÄ‡ wĹ‚aĹ›ciwy lokalizowany status sukcesu.
2. Status udostÄ™pniÄ‡ w stabilnym, dostÄ™pnym miejscu (`role=status`/live region lub rĂłwnowaĹĽny kontrakt istniejÄ…cego komponentu).
3. Nie zmieniaÄ‡ potwierdzonej semantyki mutacji: aktywne i archiwalne rekordy Rzeczy majÄ… pozostaÄ‡, a przypisania majÄ… byÄ‡ usuwane/przenoszone zgodnie z rezolucjÄ….
4. Po poprawce uruchomiÄ‡ oba polecenia E2E z portem `3108`; oczekiwany wynik obecnego pliku to 12 wykonywalnych testĂłw bez bĹ‚Ä™du oraz 2 jawne skipy rĂłl.
5. JeĹĽeli peĹ‚ny browser E2E Domownika i Dziecka jest wymagany do odbioru M4D.8, dostarczyÄ‡ zatwierdzony fixture lub istniejÄ…cÄ… Ĺ›cieĹĽkÄ™ UI zgodnÄ… z RLS; moĹĽe to wymagaÄ‡ osobnej decyzji produktowo-danych.
6. Po dodaniu fixture zastÄ…piÄ‡ skipy asercjami braku triggerĂłw i odrzucenia bezpoĹ›redniej prĂłby mutacji dla obu rĂłl.

## 10. Zmienione pliki Team B

- `playwright.config.ts`;
- `tests/e2e/support/m4d8.ts`;
- `tests/e2e/m4d8-location-lifecycle.spec.ts`;
- `docs/decisions/m4d-8-e2e-regression-report.md`.

Zakres zmian pozostaje zgodny z ograniczeniami Team B: runner, helpery, testy E2E i raport testowy.
