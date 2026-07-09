# HomeBack.app

HomeBack.app to Progressive Web App do zarzadzania informacjami domowymi, rzeczami, lokalizacjami, dokumentami, kategoriami, rolami rodziny i ustawieniami gospodarstwa.

## Zrodlo Prawdy

Zrodlem prawdy dla produktu jest:

- [docs/product/homebase-product-spec.md](docs/product/homebase-product-spec.md)

Skrot zasad pracy AI znajduje sie w:

- [docs/ai/vibecoding-guardrails.md](docs/ai/vibecoding-guardrails.md)

Decyzje produktowe i techniczne sa prowadzone w:

- [docs/decisions/decision-log.md](docs/decisions/decision-log.md)

## Zakres MVP

MVP jest ograniczone do modulow:

- Rzeczy / Inventory
- Dom / Structure
- Rodzina / Users & Roles
- Dashboard
- Dokumenty / Knowledge Base
- Kategorie
- Ustawienia

Wszystko poza dokumentem produktu musi zostac oznaczone jako `[WYMAGA DECYZJI]` przed implementacja.

## Uruchomienie Lokalne

Pierwsze uruchomienie bazy i konfiguracji aplikacji w PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-local-dev.ps1
```

Skrypt:

- uruchamia lokalne Supabase,
- stosuje migracje,
- wykonuje testy schematu i RLS,
- tworzy ignorowany przez Git plik `.env.local` tylko z publiczna konfiguracja aplikacji.

Nastepnie uruchom aplikacje:

```bash
npm run dev
```

W PowerShell na Windows, jezeli `npm.ps1` jest blokowany:

```bash
npm.cmd run dev
```

Domyslny adres lokalny:

- `http://127.0.0.1:3000`

## Lokalna Baza Dev

Lokalne Supabase przez Supabase CLI + Docker jest obowiazkowym srodowiskiem developerskim dla migracji, RLS i testow bazy.

Plan konfiguracji lokalnego Supabase:

- [docs/decisions/local-supabase-dev-plan.md](docs/decisions/local-supabase-dev-plan.md)

Zasada pracy:

- migracje powstaja w `supabase/migrations`,
- wykonywalne polityki RLS powstaja w `supabase/migrations`,
- `supabase/policies` jest wylacznie katalogiem pomocniczym,
- migracje i RLS musza przejsc lokalnie przed uzyciem w hosted Supabase,
- hosted Supabase moze sluzyc pozniej do integracji, ale nie zastepuje lokalnej walidacji.

Podstawowe komendy:

```bash
npx.cmd supabase --version
npx.cmd supabase start
npx.cmd supabase stop
```

Aktualny status lokalny: Supabase CLI i Docker sa skonfigurowane, migracje oraz testy RLS przechodza, a API, baza, Studio, lokalna poczta i przeplyw Auth zostaly zweryfikowane.

## Decyzje Techniczne

- Stack MVP: Next.js / React / Tailwind CSS / Supabase / Vercel.
- Trasy aplikacji sa angielskie i techniczne, bez prefiksu jezyka.
- UI startuje po polsku.
- EN jest przygotowany strukturalnie, ale nieaktywny.
- Tlumaczenia UI sa realizowane przez prosty slownik bez dodatkowej biblioteki.
- Dane uzytkownika nigdy nie sa tlumaczone automatycznie.
