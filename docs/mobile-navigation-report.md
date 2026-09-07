# Raport zespołu A — uproszczenie nawigacji

Branch: `ui/mobile-navigation-menu`.
Baza: aktualny `origin/main`, `b140967` (sprawdzony przez `git fetch origin main`).
Worktree: `C:/Users/qdomi/AppData/Local/Temp/homeback-mobile-navigation`.

## Zmiana

Wspólny nagłówek ma klikalne logo prowadzące bezpośrednio do `/dashboard`, lupę oraz hamburger na mobile i desktopie. Menu rozwija się pod nagłówkiem po prawej stronie. Zamyka je ponowne kliknięcie, kliknięcie poza menu, Escape, przejście fokusu poza menu i wybór aktywnego linku. Escape przywraca fokus na hamburger. Przycisk ma etykietę PL/EN, `aria-expanded` i `aria-controls`; aktywna trasa otrzymuje `aria-current="page"` i wyróżnienie kolorem.

Kolejność: Dashboard, Rzeczy, Pomieszczenia, Osoby, Dokumenty, Kategorie, Ustawienia, a na końcu Wyloguj lub Zaloguj odpowiednio do sesji. Osoby i Dokumenty pozostają nieaktywnymi przyciskami z oznaczeniem Wkrótce. Nie powstały nowe trasy.

Dane konta przeniesiono do panelu menu. Ten sam nagłówek dodano do istniejących ekranów logowania i rejestracji, aby obsłużyć pozycję Zaloguj dla gościa. Formularze autoryzacji zachowują obecną logikę.

## Wyszukiwanie

Lupa otwiera istniejący natywny dialog z tym samym komponentem `GlobalSearch` z `src/components/dashboard/item-search.tsx`. Nie zmieniono jego implementacji, akcji serwerowych, rankingu, normalizacji, filtrów, miniatur, breadcrumbów ani linków wyników. Otwarcie ustawia fokus w polu; zamknięcie przyciskiem tekstowym, ikoną X lub Escape przywraca fokus na lupę. Wybranie wyniku zamyka dialog. Panel zachowuje dotychczasowy układ i style; dodano ikonę zamknięcia i powiązanie ARIA.

## Pliki

- `src/components/app-shell.tsx` — wspólny nagłówek, menu i integracja dialogu.
- `src/lib/modules/navigation.ts` — kolejność menu i rozpoznawanie aktywnej trasy.
- `src/lib/i18n/types.ts` — kontrakt etykiet menu.
- `src/lib/i18n/locales/pl.ts` — etykiety polskie.
- `src/lib/i18n/locales/en.ts` — etykiety angielskie.
- `src/app/(auth)/login/page.tsx` — wspólny nagłówek.
- `src/app/(auth)/register/page.tsx` — wspólny nagłówek.
- `tests/unit/dashboard-module-registry.test.ts` — kolejność, granice dopasowania tras, etykiety.
- `tests/e2e/mobile-navigation.spec.ts` — nowe scenariusze menu i dialogu dla sesji i gościa.
- `tests/e2e/auth-regression.spec.ts` — otwarcie menu przed sprawdzaniem danych konta i wylogowaniem.
- `tests/e2e/dashboard-item-search.spec.ts` — selektor lupy w nagłówku.
- `tests/e2e/m4d8-location-lifecycle.spec.ts` — otwarcie menu przed wylogowaniem.
- `playwright.config.ts` — dołączenie nowych scenariuszy.
- `docs/mobile-navigation-report.md` — niniejszy raport.

## Walidacja

- `npm run test:logic`: 307/307 poprawnych.
- `npm run lint`: poprawnie.
- `npm run build`: poprawnie, wraz ze sprawdzeniem TypeScript.
- `npm run test:e2e`: 24 zaliczone, 2 pominięte, 0 błędów (26 scenariuszy, 1,8 min).
- `git diff --check`: poprawnie.

E2E uruchomiono z `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001`, zgodnie z portem serwera Playwright. Istniejący lokalny Supabase i Mailpit były dostępne; nie uruchamiano ani nie resetowano usług.

Interfejs sprawdzono automatycznie przy 390×844, 768×844 i 1280×844. Testy mierzą szerokość panelu i nagłówka, brak poziomego scrolla, rozdzielenie logo i ikon, przejścia między sekcjami, oznaczenia Wkrótce, obsługę Escape, kliknięcia poza menu, fokus wyszukiwarki i wszystkie sposoby jej zamknięcia. Przejrzano również zrzuty menu dla wszystkich trzech szerokości. Zrzuty są zapisywane w ignorowanym `test-results/`.

## Zgodność i ograniczenia

Zmiana mieści się w MVP. Brak zmian zależności, schematu, danych produkcyjnych, RLS, akcji serwerowych i routingu. Istniejące testy izolacji gospodarstw oraz wyszukiwania czterech typów zachowano.

Dwa istniejące scenariusze uprawnień domownika i dziecka są pomijane przez testy, ponieważ projekt nie ma zatwierdzonych fixture tych ról. Nie zmieniano ich statusu.

Początkowy build wymagał zastąpienia dowiązania `node_modules` lokalną kopią istniejących zależności, ponieważ Turbopack nie obsługuje dowiązania poza root projektu. Test runner wymagał uruchomienia poza sandboxem z powodu blokady tworzenia procesów (`EPERM`). Pierwsze przebiegi wykryły dwa stare sprawdzenia widoczności nazwy gospodarstwa przed otwarciem menu; testy zostały dostosowane. W logach dev sporadycznie pojawia się `The destination stream closed early` przy nawigacji, bez niepowodzenia scenariuszy menu.

Właściciel zaakceptował funkcjonalność i zlecił przygotowanie commita oraz PR do main. Przed commitem ponownie zaliczono testy logiki (307/307), lint, build i git diff --check. Wynik E2E powyżej pochodzi z pełnego przebiegu implementacyjnego; dwa pominięcia dotyczą istniejącego braku fixture ról. Oryginalny katalog roboczy i zastane w nim zmiany pozostawiono bez zmian. Merge i tag nie są częścią tej operacji.
