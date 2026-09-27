# Raport zespołu A — nawigacja mobilna (PR #60)

Branch: `ui/mobile-navigation-menu`.
PR: <https://github.com/qdominik/HomeBack.app/pull/60>.
Baza po aktualizacji: `origin/main` (`fe8dfc2`, sprawdzony 2026-09-27 przez `git fetch` i `git ls-remote`).

## Stan aktualizacji

Przed aktualizacją GitHub raportował `mergeable: CONFLICTING` i `mergeStateStatus: DIRTY`. Branch był 55 commitów za `main` i 1 commit przed nim. Rzeczywiste konflikty występowały w:

- `src/components/app-shell.tsx`,
- `src/lib/i18n/locales/en.ts`,
- `src/lib/i18n/locales/pl.ts`,
- `src/lib/i18n/types.ts`,
- `tests/e2e/mobile-navigation.spec.ts` (konflikt add/add).

Do brancha scalono aktualny `main`. We wszystkich pięciu konfliktach zachowano wersje z `main`, ponieważ są one bezpośrednimi nadzbiorami funkcji z PR #60: zawierają tę samą nawigację oraz późniejsze zmiany dotyczące szybkiego dodawania Rzeczy, modułu Osoby, zamykania wyszukiwarki przez tło, ról i rozszerzonych testów. Po rozwiązaniu konfliktów wynik kodu aplikacji jest identyczny z `main`; różnicą pozostaje ten raport. Nie zmieniono logiki wyszukiwarki, schematu bazy, RLS ani akcji serwerowych.

Pierwszy przebieg CI po scaleniu wykrył jeden flaky retry w teście desktopowym nawigacji: po zmianie URL na `/login` test mógł jeszcze kliknąć hamburger poprzedniego, zalogowanego nagłówka. Test czeka teraz na widoczny nagłówek `Logowanie` przed sprawdzeniem menu gościa. Jest to wyłącznie synchronizacja testu; zachowanie aplikacji nie zostało zmienione.

GitHub raportował również `REVIEW_REQUIRED`. Jest to osobny warunek ochrony brancha i nie był przyczyną konfliktowego stanu merge.

## Aktualne zachowanie nawigacji

Wspólny nagłówek ma logo prowadzące do `/dashboard`, lupę, przycisk szybkiego dodawania Rzeczy dla zalogowanej osoby oraz hamburger na telefonie i desktopie. Menu pokazuje aktywną trasę przez `aria-current="page"`, zamyka się po ponownym użyciu przycisku, kliknięciu poza panelem, naciśnięciu Escape, opuszczeniu fokusem lub wyborze aktywnego linku. Escape przywraca fokus na hamburger.

Kolejność menu pozostaje zgodna z rejestrem modułów. `Osoby` są obecnie działającym linkiem do `/family`; `Dokumenty` pozostają nieaktywną pozycją z oznaczeniem `Wkrótce`. Dla sesji dostępne jest `Wyloguj`, a dla gościa `Zaloguj`.

Lupa otwiera istniejący dialog `GlobalSearch`. Otwarcie ustawia fokus w polu wyszukiwania; zamknięcie przyciskiem tekstowym, ikoną, Escape lub kliknięciem tła przywraca fokus na lupę. Nie zmieniono rankingu, normalizacji, filtrów, miniatur, breadcrumbów ani linków wyników.

## Świeża walidacja lokalna po aktualizacji

- `npm run test:logic`: 359/359 PASS.
- `npm run lint`: PASS (kod wyjścia 0); pozostaje 1 istniejące ostrzeżenie `no-unused-vars` w `src/lib/items/item-photo-ai/providers/groq.ts`, poza zakresem nawigacji.
- `npm run build`: PASS, wraz z TypeScript i generowaniem 20 stron.
- `npm run check:env -- --example`: PASS.
- `npm audit`: 0 podatności.
- `git diff --check`: PASS.
- `npm run test:e2e`: nie uruchomiono lokalnie, ponieważ lokalny Supabase nie był dostępny. Zgodnie z `AGENTS.md` nie uruchamiano ani nie resetowano usług. Świeży wynik E2E ma zostać potwierdzony przez CI po pushu, gdzie workflow uruchamia efemeryczny Supabase.

Historyczny wynik 24 PASS / 2 SKIP z 2026-09-07 nie jest przedstawiany jako aktualny wynik.

## Preview

Przed pushem aktualizacji alias PR `https://homeback-app-git-ui-mobile-navigation-menu-qdominiks-projects.vercel.app` wskazywał stary deployment SHA `75df2a5` z 2026-09-07. Vercel raportował `Ready`, a `/login` odpowiadał HTTP 200. Nowy Preview wymaga pushu merge commita i ponownej weryfikacji statusu.

## Ręczna lista kontrolna

Telefon (zalecane 390×844):

1. Na `/login` sprawdzić, że logo prowadzi do `/dashboard`, a menu zawiera `Zaloguj`.
2. Po zalogowaniu otworzyć hamburger, przejść kolejno do Dashboardu, Rzeczy, Pomieszczeń, Osób, Kategorii i Ustawień; sprawdzić aktywną sekcję oraz brak poziomego przewijania.
3. Potwierdzić, że `Dokumenty — Wkrótce` nie nawigują i nie zamykają menu.
4. Zamknąć menu ponownym kliknięciem hamburgera, kliknięciem poza panelem, Escape i przejściem fokusu poza menu; po Escape fokus ma wrócić na hamburger.
5. Otworzyć lupę, potwierdzić fokus w polu, wykonać wyszukiwanie i otworzyć wynik; zamknąć dialog tekstowym przyciskiem, ikoną X, Escape i kliknięciem tła, każdorazowo sprawdzając powrót fokusu na lupę.
6. Wylogować się z menu i potwierdzić powrót do ekranu logowania.

Desktop (zalecane 1280×844):

1. Powtórzyć nawigację logo → `/dashboard`, aktywną sekcję, `Dokumenty — Wkrótce` oraz `Zaloguj`/`Wyloguj`.
2. Sprawdzić położenie panelu względem prawej strony nagłówka, kolejność elementów i brak kolizji logo, szybkiego dodawania, lupy i hamburgera.
3. Przejść po kontrolkach klawiaturą; sprawdzić widoczny fokus, Escape oraz powrót fokusu po zamknięciu menu i wyszukiwarki.
4. Sprawdzić wyszukiwarkę z dłuższymi wynikami i przewijaniem dialogu oraz wszystkie cztery sposoby zamknięcia.
