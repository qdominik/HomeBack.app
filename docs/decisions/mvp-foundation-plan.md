# Plan: Fundament MVP HomeBack.app

Status: zaakceptowany 2026-07-08 przez wlasciciela projektu.

## Cel

Przygotowac bezpieczny fundament techniczny MVP zgodny z dokumentem produktu:

- schemat bazy Supabase/PostgreSQL,
- polityki RLS respektujace `household_id`,
- prywatne zalozenia storage dla zdjec i dokumentow,
- obowiazkowe lokalne srodowisko Supabase przez Supabase CLI + Docker,
- przygotowanie do scaffoldu aplikacji PWA,
- przygotowanie do pierwszego pionowego zakresu: auth, gospodarstwo, profil admina.

## Zakres Zmiany

Plan obejmuje przygotowanie do kolejnych etapow, bez implementowania funkcji:

1. Migracje Supabase dla encji z dokumentu produktu.
2. Polityki RLS dla danych gospodarstwa.
3. Prywatny model storage dla plikow uzytkownikow.
4. Minimalny scaffold aplikacji po zatwierdzeniu stacku.
5. Pierwszy pionowy zakres po scaffoldzie: rejestracja/logowanie, utworzenie gospodarstwa, profil uzytkownika, rola admin.
6. Lokalne uruchamianie migracji i testow RLS przez Supabase CLI + Docker.

Plan nie obejmuje:

- AI,
- Home Assistant,
- QR/NFC jako funkcji,
- Sejfu jako funkcji,
- platnosci,
- multi-household,
- mapy 2D,
- natywnej aplikacji mobilnej.

## Pliki Do Utworzenia Lub Edycji

### Supabase

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/0002_initial_rls.sql`
- `supabase/policies/` jako katalog pomocniczy, nie jako jedyne zrodlo wdrozeniowe
- `supabase/config.toml`

### Lokalne Srodowisko Bazy

- Supabase CLI + Docker sa obowiazkowe dla developmentu bazy.
- Migracje musza byc testowane lokalnie przed uruchomieniem na hosted Supabase.
- RLS musi byc testowany lokalnie na scenariuszach wielu gospodarstw i rol.
- Hosted Supabase moze byc uzyty pozniej do integracji, ale nie zastepuje lokalnej walidacji migracji.

### Aplikacja

Po akceptacji stacku:

- `package.json`
- `next.config.*`
- `tailwind.config.*`
- `postcss.config.*`
- `src/`
- pliki routingu wybranego frameworka
- pliki klienta Supabase
- pliki typow/modeli zgodne z dokumentem

### Dokumentacja

- `docs/decisions/decision-log.md`
- ewentualny plan testow przed migracja produkcyjna

## Zgodnosc Z MVP

Tak, pod warunkiem ze implementacja pozostanie ograniczona do modulow:

- Rzeczy,
- Dom,
- Rodzina,
- Dashboard,
- Dokumenty,
- Kategorie,
- Ustawienia.

Pola przyszlosciowe opisane w dokumencie produktu moga znalezc sie w schemacie, ale nie wolno budowac funkcji QR/NFC ani Sejfu w MVP.

## Wplyw Na Baze Danych

Planowana migracja poczatkowa powinna utworzyc encje:

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

Zatwierdzone doprecyzowanie modelu danych:

- `category.key` jako jedyny stabilny identyfikator kategorii systemowych,
- `category.key = null` dla kategorii wlasnych,
- pole `category.system_key` nie bedzie uzywane,
- dane uzytkownika nigdy nie beda tlumaczone automatycznie.

Model ma zawierac pola przyszlosciowe opisane w dokumencie produktu, w tym:

- `storage_location_l3.identyfikator_qr`
- `storage_location_l3.identyfikator_nfc`
- `item.przechowywany_w_sejfie`

Nie nalezy tworzyc tabeli `vault_document` w MVP, poniewaz dokument opisuje ja jako przyszlosc i modul Sejf jest poza MVP.

## Wplyw Na RLS

Kazda tabela z danymi gospodarstwa musi miec wlaczone RLS.

Minimalna zasada:

- uzytkownik moze czytac tylko dane swojego `household_id`,
- zapis wymaga profilu w tym samym `household_id`,
- operacje administracyjne wymagaja roli `admin`,
- rola `dziecko` musi respektowac widocznosc kategorii przez `widoczna_dla_dzieci`,
- co najmniej jeden czlonek gospodarstwa musi miec role `admin`,
- pierwszy uzytkownik tworzacy gospodarstwo otrzymuje role `admin`,
- system nie moze pozwolic na usuniecie lub degradacje ostatniego admina gospodarstwa.

Zatwierdzone zalozenia rol:

- `admin` ma pelny dostep CRUD do danych wlasnego gospodarstwa w zakresie MVP.
- `domownik` moze tylko przypisywac i przenosic przedmioty.
- `domownik` moze archiwizowac tylko swoje przedmioty.
- `dziecko` moze wykonac zapis "odlozone", ktory zmienia `item.status` na `w domu`.
- `dziecko` nie ma ogolnego dostepu do tworzenia, edycji ani usuwania danych.
- `dziecko` widzi tylko elementy dozwolone przez kategorie `widoczna_dla_dzieci = true`.

Zatwierdzone zalozenia zaproszen:

- zaproszenia beda realizowane bez osobnej tabeli zaproszen w MVP,
- admin wpisuje e-mail i role zapraszanej osoby,
- serwerowy endpoint Next.js sprawdza, czy zapraszajacy jest adminem danego `household_id`,
- endpoint uzywa Supabase Auth Admin API po stronie serwera,
- sekret Supabase nie moze trafic do klienta ani repozytorium,
- tworzony jest `profile` ze statusem `zaproszony`, `household_id`, `email` i wybrana rola,
- po zaakceptowaniu zaproszenia profil przechodzi na `status = aktywny`,
- `household.kod_zaproszenia` pozostaje w modelu, ale nie jest publicznym kodem dolaczania bez osobnej decyzji.

## Ryzyka

- Dokument zawiera pola przyszlosciowe, ale MVP zakazuje funkcji, ktore tych pol dotycza. Ryzyko ograniczamy przez dodanie pol bez UI i bez logiki funkcjonalnej.
- RLS moze zablokowac prawidlowe przeplywy, jesli waskie uprawnienia `domownik` i `dziecko` nie zostana dokladnie przetestowane.
- Zaproszenia wymagaja serwerowego endpointu i bezpiecznego uzycia Supabase Auth Admin API.
- Storage musi pozostac prywatny; publiczne buckety sa niedozwolone.
- Scaffold aplikacji wymaga potwierdzenia stacku i zaleznosci.

## Testy

### Migracje

1. Uruchomic migracje lokalnie przez Supabase CLI + Docker.
2. Sprawdzic, czy wszystkie tabele, FK i enumy powstaja zgodnie z dokumentem.
3. Sprawdzic rollback lub sposob odtworzenia pustego schematu.

### RLS

1. Uzytkownik A widzi tylko dane swojego gospodarstwa.
2. Uzytkownik B z innego gospodarstwa nie widzi danych A.
3. Dziecko widzi tylko elementy z kategorii `widoczna_dla_dzieci = true`.
4. Operacje admina dzialaja tylko w jego `household_id`.

### Aplikacja

Po scaffoldzie:

1. Aplikacja uruchamia sie lokalnie.
2. Ekran startowy nie pokazuje danych bez sesji.
3. Logowanie/rejestracja prowadzi do tworzenia profilu i gospodarstwa.
4. Brak publicznych sekretow w kodzie.

## Przygotowanie Do Kroku 5: Scaffold Aplikacji

Zatwierdzone zalozenia scaffoldu:

- standardowy scaffold Next.js,
- recznie dopisane ograniczenia projektu,
- angielskie techniczne trasy bez prefiksu jezyka,
- UI w jezyku PL na start,
- EN przygotowany strukturalnie, ale nieaktywny,
- tlumaczenia UI przez prosty slownik bez dodatkowej biblioteki.

Scaffold aplikacji bedzie wykonany standardowym scaffolodem Next.js, z recznie dopisanymi ograniczeniami projektu. Po zatwierdzeniu nazw tras scaffold powinien zawierac tylko fundament aplikacji i puste lub minimalne widoki MVP.

Trasy MVP:

- `/dashboard`
- `/items`
- `/home`
- `/family`
- `/documents`
- `/categories`
- `/settings`
- `/login`
- `/register`

## Przygotowanie Do Kroku 6: Pierwszy Pionowy Zakres

Pierwszy pionowy zakres powinien objac:

1. Rejestracje i logowanie przez e-mail.
2. Utworzenie gospodarstwa domowego.
3. Utworzenie profilu uzytkownika.
4. Przypisanie roli `admin` pierwszemu uzytkownikowi gospodarstwa.
5. Podstawowe przekierowanie po zalogowaniu do Dashboardu.
6. Potwierdzenie, ze odczyt i zapis ida przez RLS oraz `household_id`.

Nie nalezy jeszcze implementowac CRUD przedmiotow, dokumentow ani rozbudowanego dashboardu.

## Warunki Startu Implementacji

Implementacja moze ruszyc po:

1. Akceptacji tego planu.
2. Potwierdzeniu stacku.
3. Potwierdzeniu workflow migracji Supabase.
4. Potwierdzeniu nazewnictwa tras dla modulow MVP.
5. Potwierdzeniu lokalnego Supabase CLI + Docker jako obowiazkowego srodowiska dev dla bazy.

Warunki powyzej zostaly spelnione 2026-07-08. Kolejna wieksza zmiana nadal wymaga osobnego planu lub jawnego polecenia implementacji zgodnie z guardrails.
