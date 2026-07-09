# Plan: Pierwszy Dzialajacy Prototyp

Status: zaakceptowany, wykonany i zweryfikowany lokalnie 2026-07-09.

## Cel

Zbudowac pierwszy pionowy przeplyw HomeBack.app:

1. Rejestracja uzytkownika przez e-mail i haslo.
2. Potwierdzenie adresu e-mail.
3. Utworzenie jednego gospodarstwa.
4. Atomowe utworzenie profilu pierwszego administratora.
5. Wejscie na chroniony Dashboard.
6. Wylogowanie i ochrona tras aplikacji.

Efektem ma byc dzialajacy lokalnie prototyp oparty na prawdziwym Supabase Auth, PostgreSQL i RLS, a nie makieta z danymi tymczasowymi.

## Zakres

### Zaleznosci

Dodac zatwierdzone zaleznosci:

- `@supabase/supabase-js`
- `@supabase/ssr`

Nie dodawac biblioteki formularzy, walidacji, UI ani tlumaczen.

### Baza Danych

Utworzyc dwie wykonywalne migracje:

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/0002_initial_rls.sql`

Pierwsza migracja utworzy zatwierdzone encje:

- `household`
- `profile`
- `room`
- `storage_location_l2`
- `storage_location_l3`
- `category`
- `item`
- `item_location`
- `file`
- `log`

Migracja zachowa nazwy pol, relacje i enumy z dokumentu produktu. Uwzgledni:

- `category.key` jako jedyny stabilny identyfikator kategorii systemowej,
- `category.key = null` dla kategorii wlasnych,
- unikalnosc niepustego `category.key`,
- brak pola `category.system_key`,
- pola przyszlosciowe QR/NFC i Sejfu bez UI oraz bez logiki funkcjonalnej,
- brak tabeli `vault_document`.

Kategorie systemowe zostana dodane przez migracje, aby byly dostepne w kazdym srodowisku:

- `medicines`
- `food`
- `documents`
- `winter_clothes`
- `electronics`
- `tools`
- `books`
- `spare_parts`

### Funkcje Bazy

Dodac kontrolowana funkcje `create_household_with_admin`, ktora:

- wymaga sesji uwierzytelnionego uzytkownika,
- pobiera identyfikator i e-mail z Supabase Auth zamiast zaufac danym klienta,
- odrzuca uzytkownika posiadajacego juz profil,
- tworzy gospodarstwo i profil w jednej transakcji,
- przypisuje pierwszemu profilowi role `admin` i status `aktywny`,
- nie pozwala utworzyc drugiego gospodarstwa dla tego samego uzytkownika.

Dodac ochrone ostatniego administratora, ktora blokuje:

- usuniecie ostatniego aktywnego administratora,
- zmiane jego roli,
- zmiane jego statusu na nieaktywny.

Funkcje uprzywilejowane musza miec jawny `search_path`, minimalne uprawnienia i odebrane wykonanie od roli `public`.

### RLS

Wlaczyc RLS na wszystkich tabelach publicznych.

W pierwszym prototypie:

- dane gospodarstwa sa czytelne tylko dla aktywnych profili tego samego `household_id`,
- administrator moze zarzadzac danymi tylko w swoim gospodarstwie,
- kategorie systemowe sa tylko do odczytu i maja `household_id = null`,
- kategorie wlasne sa ograniczone do jednego gospodarstwa,
- dziecko widzi tylko przedmioty z kategorii `widoczna_dla_dzieci = true`,
- role `domownik` i `dziecko` nie otrzymuja szerokiego zapisu do tabeli `item`.

Kontrolowane operacje `przenies`, `przypisz`, `archiwizuj wlasny` i `odlozone` zostana dodane w osobnym planie przed uruchomieniem CRUD przedmiotow. Do tego czasu RLS ma domyslnie odrzucac te zapisy.

### Supabase Auth I SSR

Zastosowac aktualny wzorzec Supabase SSR:

- klient przegladarkowy,
- klient serwerowy,
- sesja przechowywana w cookies,
- `src/proxy.ts` do odswiezania sesji w Next.js 16,
- autoryzacja danych ponownie sprawdzana w Server Components i przez RLS.

Dodac techniczne endpointy:

- `/auth/confirm` do potwierdzenia e-mail i utworzenia sesji,
- `/auth/signout` do bezpiecznego wylogowania.

Nie dodawac nowego modulu ani publicznej trasy onboardingowej. Po potwierdzeniu e-mail `/register` pokaze drugi krok tworzenia gospodarstwa. Po sukcesie uzytkownik trafi do `/dashboard`.

### Interfejs

Rozbudowac istniejace widoki:

- `/register`: e-mail, haslo, imie, a po potwierdzeniu e-mail nazwa i typ gospodarstwa,
- `/login`: e-mail i haslo,
- `/dashboard`: nazwa gospodarstwa, imie i rola zalogowanego uzytkownika,
- shell aplikacji: akcja wylogowania.

Komunikaty UI pozostaja w prostym slowniku:

- PL aktywny,
- EN strukturalnie uzupelniony, ale nieaktywny,
- dane uzytkownika nie sa tlumaczone.

## Pliki

Planowane nowe pliki:

- `.env.example`
- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/0002_initial_rls.sql`
- `supabase/tests/0001_initial_schema.test.sql`
- `supabase/tests/0002_initial_rls.test.sql`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/proxy.ts`
- `src/types/database.ts`
- `src/proxy.ts`
- `src/app/auth/confirm/route.ts`
- `src/app/auth/signout/route.ts`
- `src/app/(auth)/actions.ts`

Planowane edycje:

- `package.json`
- `package-lock.json`
- `supabase/config.toml`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/components/app-shell.tsx`
- `src/lib/i18n/locales/pl.ts`
- `src/lib/i18n/locales/en.ts`
- `src/lib/i18n/types.ts`
- `README.md`
- `docs/decisions/decision-log.md`

Katalog `supabase/policies` moze zawierac opis polityk lub material pomocniczy, ale wykonywalny SQL RLS pozostaje w `supabase/migrations`.

## Zgodnosc Z MVP

Zmiana miesci sie w modulach:

- Rodzina,
- Dashboard,
- Ustawienia w zakresie sesji uzytkownika.

Nie dodaje:

- AI,
- Home Assistant,
- funkcji QR/NFC,
- Sejfu,
- platnosci,
- multi-household,
- mapy 2D,
- aplikacji native.

## Wplyw Na Dane

Jest to pierwsza migracja, wiec nie ma istniejacych danych uzytkownika do migracji.

Sposob cofniecia:

- lokalnie: usuniecie migracji przed wdrozeniem i `supabase db reset`,
- po wdrozeniu: osobna, zatwierdzona migracja odwrotna usuwajaca obiekty w kolejnosci zaleznosci,
- nie stosowac recznych zmian schematu na hosted Supabase.

## Bezpieczenstwo

- Brak klucza `service_role` w przegladarce i repozytorium.
- `.env.example` zawiera tylko nazwy zmiennych i puste wartosci.
- Do klienta trafia wylacznie publiczny URL i publishable key Supabase.
- RLS pozostaje wlaczone.
- Funkcja inicjalizujaca gospodarstwo nie ufa `household_id`, roli ani e-mailowi przeslanym przez klienta.
- `src/proxy.ts` odswieza sesje, ale nie jest jedyna warstwa autoryzacji.
- Nie sa tworzone buckety Storage.

## Ryzyka

- Bledna polityka RLS moze zablokowac onboarding albo ujawnic dane innego gospodarstwa.
- Funkcja z podwyzszonymi uprawnieniami wymaga scislego ograniczenia parametrow i `search_path`.
- `@supabase/ssr` jest oznaczone przez Supabase jako beta, wiec przyszle aktualizacje moga wymagac dostosowania.
- Potwierdzenie e-mail wymaga poprawnego lokalnego szablonu i redirect URL.
- Srodowisko Codex nie ma bezposredniego dostepu do systemowego lacza Docker; komendy resetu bazy moga wymagac uruchomienia w konsoli wlasciciela projektu.

## Testy

### Migracje

1. `npx.cmd supabase db reset`
2. Sprawdzenie tabel, kolumn, enumow, FK i indeksow.
3. Sprawdzenie osmiu kategorii systemowych i ich `key`.
4. Ponowny reset potwierdzajacy odtwarzalnosc.

### RLS

Testy pgTAP uruchamiane przez `npx.cmd supabase test db`:

1. Brak sesji nie daje dostepu do danych.
2. Uzytkownik A nie widzi gospodarstwa B.
3. Admin nie moze zapisac danych z obcym `household_id`.
4. Kategorie systemowe sa czytelne, ale nieedytowalne.
5. Dziecko nie widzi niedozwolonych kategorii przedmiotow.
6. Nie mozna usunac ani zdegradowac ostatniego admina.
7. Nie mozna utworzyc drugiego profilu lub gospodarstwa dla tego samego uzytkownika.

### Aplikacja

1. Rejestracja wysyla lokalny e-mail potwierdzajacy.
2. `/auth/confirm` tworzy sesje i usuwa token z adresu przekierowania.
3. Utworzenie gospodarstwa tworzy profil `admin`.
4. Dashboard pokazuje dane tylko przez RLS.
5. Niezalogowany uzytkownik wraca do `/login`.
6. Wylogowanie uniewaznia sesje.
7. `npm.cmd run lint`
8. `npm.cmd run build`

## Kryteria Akceptacji

- Pelny przeplyw dziala lokalnie od rejestracji do Dashboardu.
- Pierwszy uzytkownik jest aktywnym administratorem.
- Nie mozna utworzyc drugiego gospodarstwa dla tego samego profilu.
- Dane innego gospodarstwa sa niewidoczne.
- Migracje daja sie odtworzyc od zera.
- Testy RLS, lint i build przechodza.
- Nie ma sekretow, publicznych bucketow ani funkcji spoza MVP.

## Wymaga Decyzji

Brak otwartych decyzji w zakresie tego planu.

## Raport Wykonania

### Zmieniono

- utworzono poczatkowy schemat dziesieciu encji MVP,
- dodano wykonywalne RLS i testy pgTAP,
- dodano atomowe tworzenie gospodarstwa i pierwszego administratora,
- dodano ochrone ostatniego aktywnego administratora,
- podlaczono Supabase Auth i sesje SSR,
- wdrozono rejestracje, potwierdzenie e-mail, logowanie, onboarding i wylogowanie,
- zabezpieczono trasy aplikacji,
- dodano skrypt konfigurujacy lokalne srodowisko jednym poleceniem.

### Zgodnosc Z MVP

Zmiana realizuje fundament modulow Rodzina i Dashboard. Nie dodaje funkcji spoza zamrozonego zakresu MVP. Pola przyszlosciowe istnieja tylko w schemacie.

### Baza Danych

- migracje `0001_initial_schema.sql` i `0002_initial_rls.sql` zostaly zastosowane lokalnie,
- osiem kategorii systemowych korzysta z `category.key`,
- nie utworzono `vault_document`,
- test odtworzenia bazy i testy pgTAP przeszly przed utworzeniem `.env.local`.

### Bezpieczenstwo

- RLS jest wlaczone na wszystkich tabelach publicznych MVP,
- odczyt i zapis respektuja `household_id`,
- anon nie ma grantow do tabel danych,
- klucz administracyjny nie jest uzywany przez aplikacje,
- lokalny `.env.local` jest ignorowany przez Git,
- nie utworzono publicznych bucketow.

### Test

- `npm.cmd run lint` przechodzi,
- `npm.cmd run build` przechodzi,
- `npm.cmd audit --omit=dev` zglasza dwa ostrzezenia `moderate` w zaleznosci PostCSS dostarczanej przez Next.js; brak dostepnej poprawki,
- rejestracja i lokalna wiadomosc potwierdzajaca dzialaja,
- potwierdzenie e-mail prowadzi do tworzenia gospodarstwa,
- gospodarstwo i profil administratora powstaja atomowo,
- Dashboard pokazuje imie, gospodarstwo i role Administrator,
- wylogowanie i ochrona `/dashboard` dzialaja,
- ponowne logowanie dziala.

### Dane Testowe

W lokalnym Supabase pozostaly techniczne konta testowe oraz jedno gospodarstwo `Dom testowy`. Dane sa lokalne i zostana usuniete przy kolejnym `supabase db reset`.

### Wymaga Decyzji

Brak.

### Ryzyko Pozostale

Dwa ostrzezenia `moderate` PostCSS pozostaja bez dostepnej poprawki w aktualnej wersji Next.js. Nie wykonano wymuszonej ani niezatwierdzonej zmiany frameworka.
