# Raport zespołu A — korekta nawigacji po PR #60

## Branch i baza

- Branch: `ui/navigation-search-add-action`.
- Osobny worktree: `C:/Users/qdomi/AppData/Local/Temp/homeback-navigation-add-action`.
- Baza pobrana przez `git fetch origin main`: `b140967`.
- PR #60 pozostawał OPEN, bez merge do main. Aby zachować zaakceptowany hamburger, przeniesiono jego zmiany z `75df2a5` do nowego worktree jako niezacommitowany diff, a następnie wykonano niniejszą korektę. Nie mergowano PR #60 i nie utworzono commita.

## Zmienione zachowanie

Dashboard nie renderuje już osadzonego panelu wyszukiwania ani tekstowego przycisku Dodaj przedmiot. Wyszukiwanie jest dostępne z lupy w nagłówku. Używa niezmienionego komponentu GlobalSearch i tej samej akcji serwerowej; zachowano cztery typy, Wszystko i filtry typów, ranking, polskie znaki, breadcrumb, miniatury, linki, limit 40, household_id i RLS.

Popup wyszukiwarki zamyka przycisk tekstowy, X, Escape i kliknięcie w tło poza panelem. Kliknięcie wewnątrz ani przeciągnięcie rozpoczęte wewnątrz panelu nie jest traktowane jako kliknięcie w tło. Otwarcie ustawia fokus w zapytaniu, zamknięcie przywraca fokus na lupę. Zachowano styl i zawartość popupu.

Przycisk + ma zielone tło głównego akcentu, białą ikonę, tooltip i aria-label Dodaj przedmiot oraz obszar minimum 44×44 px. Kliknięcie bezpośrednio otwiera dialog w nagłówku, bez zmiany URL, ładowania /items ani renderowania listy rzeczy. Nie wymaga drugiego kliknięcia. Opcje formularza są przygotowane po stronie serwera w chronionym layoucie. Odczyty respektują household_id, dostępne kategorie systemowe oraz RLS; poziomy lokalizacji ograniczono do potomków pomieszczeń gospodarstwa.

Dialog montuje istniejący ItemForm dopiero przy otwarciu. Używa niezmienionej akcji createItem. Po zapisie zamyka się, a istniejąca akcja odświeża dane i przekierowuje na listę rzeczy ze statusem item_created. X i Escape zamykają formularz bez nawigacji i przywracają fokus na +. Usunięto pośredni mechanizm /items?add=1. Zwykłe strony i ich routing pozostają bez zmian.

Zachowano dotychczasowe uprawnienia: formularz i + są dostępne dla aktywnego administratora. Nie rozszerzono dostępu innym rolom. Formularz na stronie Rzeczy nadal korzysta z tego samego ItemForm.

Logo nadal kieruje bezpośrednio na `/dashboard`. Hamburger zachowuje układ i pozycje z PR #60. Nagłówek ma stałą wysokość w danym breakpointcie; jego otwieranie i korzystanie z ikon nie zmienia wysokości.

## Diagnoza logoutu — dowody

Wykonano POST bez cookies użytkownika na:
`https://homeback-app-git-ui-mobile-navigation-menu-qdominiks-projects.vercel.app/auth/signout`.

Odpowiedź:

```text
POST /auth/signout: 303
Location: https://homeback-app-git-preview-supabase-hos-0c79a6-qdominiks-projects.vercel.app/login
GET powyższego Location: 410
x-vercel-error: GONE
```

Błąd występuje na celu przekierowania, a nie jako odpowiedź samego endpointu logout. Dotychczasowy kod preferował NEXT_PUBLIC_SITE_URL przed adresem żądania. Preview odsyłał w ten sposób do wygasłego adresu innego deploymentu, mimo poprawnej ścieżki `/login`. Diagnostyka nie wylogowywała sesji właściciela.

Rozwiązanie: po istniejącym signOut i revalidatePath endpoint zwraca 303 z względnym `Location: /login`. Przeglądarka pozostaje na bieżącym originie aplikacji, niezależnie od domeny produkcyjnej, aliasu Preview i lokalnego portu. Nie zmieniono logiki usuwania sesji.

PR #58 jest obecny w main i dotyczył wyłącznie konfiguracji Playwright oraz dokumentacji; nie zmieniał produkcyjnego endpointu logout. Jego webServer.env zachowano. NEXT_PUBLIC_DEV_ORIGIN nadal służy istniejącemu kontraktowi środowiska lokalnego; przed zmianą nie był używany przez logout i teraz również nie jest jego celem przekierowania. NEXT_PUBLIC_SITE_URL pozostaje używany w istniejących pozostałych miejscach, np. potwierdzaniu konta.

Nie zmieniono plików env, ustawień Vercel, NEXT_PUBLIC_SUPABASE_URL ani kluczy Supabase. Dodatkowy proces testowy otrzymał celowo wygasły NEXT_PUBLIC_SITE_URL oraz inny NEXT_PUBLIC_DEV_ORIGIN, aby wykazać niezależność poprawki od tych wartości. Był to wyłącznie override procesu testowego, bez zapisu konfiguracji.

## Testy

| Kontrola | Wynik |
| --- | --- |
| npm run test:logic | 308 PASS, 0 FAIL |
| npm run lint | PASS |
| npm run build | PASS, także TypeScript |
| npm run test:e2e | 25 PASS, 2 SKIP, 0 FAIL (ponowny pełny przebieg po korekcie +) |
| Dodatkowa regresja logout z wygasłym SITE_URL | 1 PASS: 303, Location /login, GET /login 200 |
| git diff --check | PASS |

Pełny przebieg E2E sprawdził autentyczne lokalne logowanie/wylogowanie, przekierowanie i ponowną ochronę Dashboardu. Dwa pominięcia są istniejącym brakiem zatwierdzonych fixture dla ról domownika i dziecka; nie dodano nowych pominięć. Regresja logoutu jest częścią końcowego pełnego przebiegu. W sumie zaliczono 25 scenariuszy E2E, a 2 pozostały pominięte.

Testy wyszukiwarki przełączono z osadzonego panelu na dialog pod lupą. Nadal testują filtry, cztery typy, polskie znaki, wyniki i ich linki oraz izolację gospodarstw. Testy nawigacji sprawdzają brak wyszukiwarki/przycisku w Dashboardzie, zielony +, fokus, otwieranie/zamykanie dialogu, skuteczny zapis nowej rzeczy i jej obecność na liście. Test logoutu weryfikuje względny Location, ten sam origin oraz HTTP 200 na `/login`, bez 410.

Podczas E2E pojawia się sporadyczny komunikat Next dev `The destination stream closed early` przy nawigacji; nie powodował błędów testów. Nie uruchamiano, nie zatrzymywano i nie resetowano Docker/Supabase.

## Mobile i wygląd

Sprawdzono 390×844, 768×844 i 1280×844. Testy potwierdzają brak poziomego scrolla, brak nakładania logo na ikony, obszar + minimum 44×44, stałą wysokość nagłówka, dopasowanie obu popupów, fokus oraz działający zapis z formularza. Przejrzano zrzuty dialogu dodawania dla wszystkich trzech szerokości i nagłówka dla mobile. Długi formularz przewija się pionowo wewnątrz dialogu.

Zrzuty lokalne w ignorowanym `test-results/`:
- `authenticated-navigation-390.png`, `authenticated-navigation-768.png`, `authenticated-navigation-1280.png`;
- `add-item-390.png`, `add-item-768.png`, `add-item-1280.png`.

## Pliki zmienione względem main

- `src/app/(app)/dashboard/page.tsx` — usunięcie panelu i tekstowej akcji.
- `src/app/(app)/items/page.tsx` — usunięcie pośredniego mechanizmu add=1.
- `src/app/(app)/layout.tsx` — przygotowanie opcji formularza dla uprawnionego administratora.
- `src/lib/server/item-create-options.ts` — odczyt opcji kategorii i lokalizacji ograniczonych do gospodarstwa.
- `src/app/auth/signout/route.ts` — względne przekierowanie /login.
- `src/components/app-shell.tsx` — zachowany hamburger, +, tło zamykające wyszukiwanie, stała wysokość.
- `src/components/items/item-create-dialog.tsx` — wyłącznie oprawa dialogu dla istniejącego formularza.
- `src/lib/i18n/locales/pl.ts`, `src/lib/i18n/locales/en.ts`, `src/lib/i18n/types.ts` — dostępne etykiety.
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx` — nagłówek przeniesiony z PR #60.
- `src/lib/modules/navigation.ts` — pomocnicza nawigacja przeniesiona z PR #60.
- `playwright.config.ts` — dołączenie scenariuszy nawigacji z PR #60, bez usuwania poprawki #58.
- `tests/e2e/mobile-navigation.spec.ts` — scenariusze +, popupów, Dashboardu i responsywności.
- `tests/e2e/auth-regression.spec.ts` — wylogowanie oraz regresja wygasłego SITE_URL.
- `tests/e2e/dashboard-item-search.spec.ts` — testy dotychczasowej wyszukiwarki w popupie.
- `tests/e2e/m4d8-location-lifecycle.spec.ts` — obsługa hamburgera przeniesiona z PR #60.
- `tests/unit/dashboard-module-registry.test.ts` — test nawigacji przeniesiony z PR #60.
- `tests/unit/env-contract.test.ts` — regresja kontraktu logoutu.
- `docs/navigation-search-add-action-report.md` — ten raport.

## Zakres i status

Zgodność z MVP: tak. Sprawdzony diff potwierdza brak zmian ItemForm, akcji zapisu rzeczy, komponentu globalnego wyszukiwania, migracji, RLS, schematu, zależności i konfiguracji środowiska. Automatyczny dopisek Next dev do AGENTS.md usunięto z diffu.

Właściciel zaakceptował wyniki i zlecił przygotowanie commita oraz PR do main. Przed commitem ponownie zaliczono npm run test:logic (308/308), npm run lint, npm run build i git diff --check. Wcześniejsze wyniki E2E pozostają opisane powyżej. Zakres publikacji obejmuje branch i PR z Preview, bez merge ani tagu.


## Korekta po odbiorze warunkowym (2026-09-08)

Zmieniono wyłącznie przycisk +, sposób osadzenia jego dialogu i przygotowania opcji, usunięto przejście add=1 oraz zaktualizowano testy i raport. Hamburger, lupa, logout, ItemForm, createItem, Supabase, RLS, migracje i zależności pozostały bez zmian względem poprzedniego commita PR #61.

Testy dla 390×844, 768×844 i 1280×844 sprawdzają kolor tła i białą ikonę, natychmiastowy dialog, niezmieniony URL i brak żądań /items przed zapisem, zamknięcie oraz skuteczny zapis. Lint, build, testy logiki (308) i diff-check ponownie zaliczono. Lokalny node_modules wymagał odtworzenia przez npm ci --ignore-scripts z niezmienionego lockfile; brakujące pliki Next/ESLint były problemem środowiska testowego. Narzędzia zgłosiły lokalne Node 24.19.0/npm 12.0.2 względem deklarowanych 24.18.0/11.16.0; kontroli nie blokowało to po odtworzeniu zależności.

## Domknięcie wyszukiwarki w obecnym modelu (2026-09-08)

Przyczyną pomijania dodatkowych lokalizacji był filtr czy_glowna=true zarówno w loaderze, jak i podczas wyboru breadcrumb. Loader pobiera teraz wszystkie przypisania pasujących rzeczy w bieżącym gospodarstwie, zachowując paginację i RLS. Wybór najpierw odrzuca ścieżki spoza dostępnej struktury gospodarstwa, następnie preferuje poprawną lokalizację główną. Jeśli jej brak, wybiera poprawne przypisanie do schowka o najmniejszym UUID (porządek leksykograficzny), niezależnie od kolejności rekordów. Zwracana jest pełna ścieżka Pomieszczenie → Mebel → Schowek. Bez poprawnego zapisanego przypisania pozostaje Brak lokalizacji.

Ograniczenie modelu: item_location wymaga storage_location_l3_id; same wybory L1/L2 nie są utrwalane przez istniejący zapis. PR #61 nie dodaje pól, migracji, zmian formularza ani akcji zapisu i nie symuluje takich przypisań w testach. Rozszerzenie L1/L2 odłożono do osobnego zadania po zamknięciu PR #61, wraz z decyzją, migracją, kompatybilnością, zapisami, formularzem, loaderami, RLS i testami. Decyzję zapisano w docs/decisions/decision-log.md.

Pliki tej korekty: src/lib/global-search/load-sources.ts, src/lib/global-search/search.ts, tests/unit/global-search.test.ts, tests/e2e/dashboard-item-search.spec.ts oraz niniejszy raport i decision log.

Testy logiki obejmują pełną ścieżkę Kuchnia → Lodówka → Górna półka, brak przypisania, odczyt dodatkowej lokalizacji bez głównej, pierwszeństwo głównej, deterministyczny wybór przy wielu dodatkowych przypisaniach i izolację gospodarstw. E2E sprawdza pełną lokalizację bez fałszywego Brak lokalizacji oraz rzeczywisty zapis rzeczy bez lokalizacji i prezentację tego stanu w wyszukiwarce. Nie zmieniono rankingu, normalizacji, filtrów, miniatur, linków, limitu 40, interfejsu wyszukiwarki, hamburgera, + ani formularza.

Końcowa walidacja domknięcia: npm run test:logic — 312 PASS; npm run lint — PASS; npm run build — PASS; npm run test:e2e — 26 PASS, 2 istniejące SKIP fixture ról, 0 FAIL (1,8 min); git diff --check — PASS.
