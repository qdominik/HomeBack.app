# Plan: Lokalne Supabase Dev

Status: wykonany i zweryfikowany lokalnie 2026-07-08.

Wykonane:

- dodano `supabase` jako dev dependency,
- potwierdzono Supabase CLI `2.109.1`,
- uruchomiono `npx.cmd supabase init`,
- utworzono `supabase/config.toml`,
- wlasciciel projektu uruchomil lokalny stack przez `npx.cmd supabase start`,
- potwierdzono dostepnosc lokalnych portow API, bazy, Studio i poczty,
- potwierdzono odpowiedz REST API oraz otwarcie Supabase Studio.

## Cel

Przygotowac obowiazkowe lokalne srodowisko Supabase dla HomeBack.app, uzywane do:

- migracji bazy danych,
- testow RLS,
- testow wielu gospodarstw i rol,
- lokalnej walidacji przed hosted Supabase.

## Zrodla

- Oficjalna dokumentacja Supabase CLI: https://supabase.com/docs/guides/local-development/cli/getting-started
- Oficjalna dokumentacja local development: https://supabase.com/docs/guides/local-development

## Zakres Zmiany

Planowany zakres:

1. Dodanie Supabase CLI jako dev dependency.
2. Inicjalizacja lokalnego projektu Supabase.
3. Utworzenie i utrzymanie `supabase/config.toml`.
4. Ustalenie lokalnych komend dev.
5. Przygotowanie miejsca na migracje i polityki RLS.
6. Przygotowanie testow lokalnych dla schematu i RLS.

Poza zakresem tego kroku:

- tworzenie migracji schematu,
- pisanie polityk RLS,
- uruchamianie hosted Supabase,
- tworzenie bucketow storage,
- podpinanie aplikacji Next.js do Supabase.

## Pliki Do Utworzenia Lub Edycji

- `package.json`
- `package-lock.json`
- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/policies/`
- `README.md`
- `docs/decisions/decision-log.md`

## Zgodnosc Z MVP

Tak. To zmiana infrastruktury developerskiej wymagana do bezpiecznego przygotowania MVP. Nie dodaje nowych modulow ani funkcji produktowych.

## Proponowana Zaleznosc

Nazwa:

- `supabase`

Powod dodania:

- lokalne uruchamianie Supabase CLI przez `npx supabase`,
- init projektu,
- start lokalnego stacku,
- migracje,
- reset lokalnej bazy,
- przyszle generowanie typow bazy.

Alternatywa bez dodania zaleznosci:

- uzywanie globalnej instalacji przez Scoop albo standalone binary,
- uzywanie `npx supabase` bez wpisu w `package.json`.

Rekomendacja:

- dodac `supabase` jako dev dependency, poniewaz wersja CLI bedzie kontrolowana w repo przez lockfile.

Wplyw na bundle size:

- brak wplywu na bundle aplikacji, bo to zaleznosc dev-only.

Ryzyka bezpieczenstwa:

- supply chain dev dependency,
- Docker bedzie pobieral obrazy Supabase,
- lokalne klucze i hasla z `supabase start` nie moga trafic do repo poza bezpiecznym `.env.example`.

Czy konieczna dla MVP:

- tak, po decyzji wlasciciela projektu lokalne Supabase CLI + Docker jest obowiazkowym srodowiskiem dev dla bazy.

Licencja:

- MIT dla zainstalowanej paczki `supabase@2.109.1`, zweryfikowane przez metadane npm przed instalacja.

## Komendy Docelowe

Po akceptacji planu:

```bash
npm.cmd install supabase --save-dev
npx.cmd supabase init
npx.cmd supabase start
```

Na Windows PowerShell uzywamy `npm.cmd` i `npx.cmd`, poniewaz lokalne `npm.ps1` moze byc blokowane przez execution policy.

## Wplyw Na Baze Danych

Ten krok nie tworzy jeszcze tabel ani migracji.

Po `supabase init` powstanie konfiguracja lokalnego projektu. Pierwsze migracje beda przygotowane osobno:

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/0002_initial_rls.sql`
- `supabase/policies/` moze zawierac materialy pomocnicze, ale nie jest jedynym zrodlem wdrozeniowym

## Wplyw Na RLS

Ten krok nie tworzy jeszcze polityk RLS.

Srodowisko ma przygotowac miejsce i workflow do testowania RLS lokalnie przed hosted Supabase.

## Bezpieczenstwo

Zasady:

- nie zapisywac sekretow w repo,
- nie commitowac lokalnych kluczy wygenerowanych przez `supabase start`,
- `.env.example` moze zawierac tylko puste placeholdery,
- lokalny stack nie moze byc wystawiony publicznie,
- przy pracy w niezaufanej sieci nalezy rozwazyc Docker network zbindowany do `127.0.0.1`.

## Ryzyka

- Docker Desktop moze nie dzialac albo nie miec dostepu do konfiguracji uzytkownika.
- Supabase CLI moze wymagac pobrania pakietow z npm.
- Pierwsze `supabase start` moze wymagac pobrania obrazow Docker.
- Porty lokalne Supabase moga byc zajete.
- Instalacja CLI doda dev dependency i lockfile changes.

## Testy

Po implementacji:

1. `npx.cmd supabase --version`
2. `npx.cmd supabase init` tworzy albo respektuje `supabase/config.toml`.
3. `npx.cmd supabase start` uruchamia lokalny stack.
4. Supabase Studio jest dostepne lokalnie.
5. Lokalny REST endpoint odpowiada.
6. `npx.cmd supabase stop` zatrzymuje stack.

## Kryteria Akceptacji

- Supabase CLI jest dostepne lokalnie z repo.
- `supabase/config.toml` istnieje.
- Lokalny stack startuje przez Docker.
- README opisuje lokalny workflow.
- Nie dodano sekretow.
- Nie utworzono jeszcze migracji ani RLS bez osobnego planu.

## Wymaga Decyzji

- [ZATWIERDZONE] Dodanie `supabase` jako dev dependency.
- [ZATWIERDZONE] Uruchomienie `supabase init`.
- [ZATWIERDZONE] Uruchomienie `supabase start`, ktore moze pobrac obrazy Docker i wymaga dostepu do sieci.

## Aktualny Bloker

- Brak blokera dla lokalnego developmentu po stronie wlasciciela projektu.
- Srodowisko Codex nie ma dostepu do systemowego lacza Docker `//./pipe/docker_engine`, dlatego komendy wymagajace bezposredniej inspekcji kontenerow musza byc uruchamiane w konsoli wlasciciela projektu.
- Pelny test `supabase db reset` zostanie wykonany po utworzeniu pierwszej migracji, aby jednoczesnie zweryfikowac odtworzenie rzeczywistego schematu.
