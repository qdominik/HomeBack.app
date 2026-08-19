# Audyt bezpieczeństwa przed publikacją publiczną - 2026-08-07

## Cel i zakres

Audyt repozytorium HomeBack.app przed upublicznieniem na GitHub.

Zakres objęty audytem:

- wszystkie gałęzie lokalne i zdalne,
- cała historia git (skany `git log --all`),
- pliki śledzone (drzewo robocze + gałęzie),
- pliki środowiskowe i `.gitignore`,
- zależności npm (`npm audit`),
- konfiguracja autoryzacji, RLS, migracje Supabase i Storage,
- ustawienia repozytorium GitHub.

Poza zakresem: maszyny właściciela, panel hosted Supabase, panel Vercel,
GitHub Secrets i pliki właścicielskie wyłączone z repo (zgodnie z
`docs/ops/secret-scanning-baseline-2026-08-02.md`).

## Stan repozytorium

- Repozytorium jest obecnie **prywatne** (`visibility: private`).
- Domyślna gałąź: `main`.
- `allow_forking: true`.
- Skan wykonywany na gałęzi roboczej `codex/item-form-description-layout`.

## Wynik skanowania sekretów

### Drzewo śledzone

Nie zidentyfikowano żadnej żywej wartości sekretnej w śledzonych plikach.
Występujące dopasowania to placeholdery, dokumentacja lub dane testowe:

- `tests/unit/item-form-values.test.ts` - `GROQ_API_KEY: "secret"` (placeholder testowy),
- `docs/decisions/*` - wzmianki o `service_role` i `GROQ_API_KEY=` bez wartości,
- `supabase/config.toml` - komentarze `env(SENDGRID_API_KEY)`, `env(SECRET_VALUE)` itp. bez wartości,
- `docs/ops/secret-scanning-baseline-2026-08-02.md` - wzorce skanujące (nie wartości).

### Historia git

Skan `git log --all` wzorcami (service_role, private keys, sk-*, ghp_*,
github_pat_, AKIA, JWT `eyJ`) nie zwrócił dopasowań z realnymi wartościami.

Dopasowania dla `NEXT_PUBLIC_SUPABASE|SUPABASE_URL|ANON_KEY` dotyczą wyłącznie:

- `.env.example` (same nazwy zmiennych, puste wartości),
- `src/lib/supabase/config.ts` (kod, bez wartości),
- dokumentacji ops/decyzyjnej.

Dopasowania dla `GROQ_API_KEY|ITEM_PHOTO_AI|eyJ` dotyczą wyłącznie:

- kodu integracji Groq (bez kluczy, tylko placeholder testowy),
- dokumentów decyzyjnych AI,
- snapshotu `landing-v201/` w historii (bez sekretów; szczegóły w sekcji
  "Historia - snapshot landingu").

### Pliki środowiskowe

- `.env.example` - śledzony, tylko publiczne nazwy zmiennych, puste wartości.
- `.env.local` - ignorowany przez `.gitignore` (`.env*`), nieśledzony; zawiera
  lokalny URL, anon key i `GROQ_API_KEY`. Nie wyciekł do repo.
- `supabase/.gitignore` - poprawnie ignoruje `.env.keys`, `.env.local`.
- Brak śledzonych plików `.pem`, `.key`, `.crt`, logów, artefaktów builda.

### Znalezisko - ref hostowanego Supabase w dokumentacji

W `docs/ops/preview-deployment-contract-2026-08-02.md` występował 11 razy
realny ref projektu preview Supabase oraz jego URL. W working tree wartości
zostały zastąpione placeholderem:

```text
<SUPABASE_PREVIEW_PROJECT_REF>
https://<SUPABASE_PREVIEW_PROJECT_REF>.supabase.co
```

Anon key nie został zapisany w repo (dokumentacja jawnie zabrania jego
zapisania). Sam ref nie jest poświadczeniem, ale ujawnia aktywny projekt
preview i zwiększa powierzchnię ataku (profilowanie projektu, próby nadużycia
quot, ewentualne skany storage). Rekomendacja: zredagować ref/URL z docs albo
obrócić/usunąć projekt preview przed publikacją.

## Podatności zależności (npm audit - 2026-08-07)

Wynik na gałęzi `codex/item-form-description-layout`: 3 podatności
(0 krytycznych, 2 wysokie, 1 umiarkowana).

| Pakiet | Ścieżka | Poziom | Uwagi |
|---|---|---|---|
| `js-yaml` | zależność dev/transitive | high | CVE-2026-59870 (GHSA-5p4m-2wfm-xmqj), fix dostępny |
| `postcss` | przez `next` | high | GHSA-6g55-p6wh-862q i in.; poprawione w `next@16.3.0` |
| `next` | bezpośredni | moderate | przez postcss; bump do `16.3.0` |

Uwaga: `sharp` nie jest już zgłaszany - na `origin/main` obowiązuje override
`sharp: 0.35.3` w `package.json`.

## Ustawienia GitHub - stan po sesji 2026-08-07

Wykonane (przez `gh api`):

- **Vulnerability alerts** - włączone (PUT -> 204).
- **Automated security fixes** - włączone.
- **Actions permissions** - `allowed_actions: selected` (allowlista:
  `actions/checkout:*`, `actions/setup-node:*`), domyślne uprawnienia workflow
  `read`, `can_approve_pull_request_reviews: false`.
- **delete_branch_on_merge** - włączone.
- **`.github/dependabot.yml` i `SECURITY.md`** - utworzone (nieśledzone,
  do zacommitowania w main, nie w PR #16).

Niemożliwe / dopiero po publikacji:

1. **`allow_forking`** - niezmienialne na prywatnym repo konta osobistego
   (422; zmiana tylko dla repo org-owned).
2. **Secret Scanning + Push Protection** - dostępne po publikacji.
3. **Code scanning / CodeQL** - dostępne po publikacji.
4. **Branch protection na `main`** - 403 na Free/private; po publikacji
   (PR + review zgodnie z AGENTS.md).
5. **Rulesets** - po publikacji.
6. **Dependabot (wersjonowanie zależności)** - aktywny po publikacji.

## Znalezione zagrożenia w kodzie

### Średnie

1. **Fallback nagłówka `Origin` w przepływie rejestracji** -
   `src/app/(auth)/actions.ts:56-60`. Gdy `NEXT_PUBLIC_SITE_URL` nie jest
   ustawione, `emailRedirectTo` buduje się z nagłówka `Origin`, który kontroluje
   atakujący (ryzyko otwartego przekierowania w linku potwierdzającym e-mail).
   Podobny wzorzec w `src/app/auth/confirm/route.ts:37`
   (`request.nextUrl.origin`). Rekomendacja: ustawić `NEXT_PUBLIC_SITE_URL`
   we wszystkich środowiskach i usunąć fallback do nagłówka.

2. **Brak nagłówków bezpieczeństwa** w `next.config.ts` - brak CSP,
   `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
   `Permissions-Policy`. Rekomendacja: dodać blok `headers()` dla środowiska
   produkcyjnego.

### Niskie

3. **Testy E2E** - stałe hasło `Password123!` w
   `tests/e2e/support/auth.ts:71` i `tests/e2e/m3-templates-and-custom-values.spec.ts:31`.
   Używane tylko lokalnie z unikalnymi mailami testowymi; wynieść do zmiennych
   środowiskowych przed publikacją.

4. **Zakodowany adres LAN** - `192.168.0.205` w `next.config.ts:7,14`
   (`allowedDevOrigins`, `serverActions.allowedOrigins`). Tylko dev; usunąć lub
   sparametryzować.

5. **`minimum_password_length = 6`** w `supabase/config.toml:185`, podczas gdy
   aplikacja wymaga 8 znaków (`src/app/(auth)/actions.ts:52`). Wyrównać na
   hosted Supabase do 8.

6. **Otwarty signup bez CAPTCHA** - `enable_signup = true` przy braku Turnstile
   (sekcja `[auth.captcha]` zakomentowana). Rozważyć CAPTCHA przed publicznym
   startem, aby ograniczyć zakładanie kont spamerskich.

## Dobre praktyki potwierdzone

- **RLS:** wszystkie 10 tabel z `enable row level security`; granty wyłącznie
  dla `authenticated`; `revoke` dla `anon`/`public`; polityki spinają się o
  `current_household_id()`; ochrona ostatniego administratora
  (`protect_last_household_admin`).
- **Storage:** bucket `item-photos` prywatny, limity rozmiaru 2 MiB i dozwolone
  MIME; funkcja `item_photo_storage_household_id` z `security definer`,
  `search_path=''`, revoke dla `public`/`anon`.
- **Route preview zdjęć:** `src/app/api/item-photos/photo/route.ts` - weryfikuje
  auth, aktywny profil i ścieżkę (tylko UUID, bez trawersu), używa
  krótkotrwałych signed URL (TTL 60 s).
- **Server actions:** ponowna kontrola admina/roli/statusu i granic household
  po stronie serwera (nie tylko RLS).
- **Auth:** potwierdzenie e-mail włączone, rotacja refresh tokenów włączona,
  skonfigurowane rate-limity logowania/rejestracji.
- **Dane testowe:** `generate_test_data` ograniczona do aktywnych adminów i
  środowiska lokalnego/preview (`isQaTestDataEnvironment`), z walidacją typu
  datasetu.
- **CI:** workflow bez sekretów, uruchamia testy logiki, lint i build.
- **Landing page:** katalogi `landing-v*/` i `HomeBack.landing/` ignorowane.

## Historia - snapshot landingu

Commit `484fb6317e74972db65dab2e94be31a91500840b` na gałęzi
`preview/supabase-hosted-preview` zawiera nieśledzony wcześniej snapshot
`landing-v201/` (i `landing/`). Nie znaleziono w nim sekretów
(`.openai/hosting.json` = `{"d1":null,"r2":null}`). Narusza to jednak zasadę
separacji landingu z AGENTS.md i powiększa historię. Ewentualny rewrite
historii wymaga decyzji właściciela (wymagałby operacji objętych zakazem w
AGENTS.md).

## Lista kontrolna przed publikacją

- [x] Włączyć Vulnerability alerts i Automated security fixes (2026-08-07).
- [x] Ograniczyć Actions permissions (selected + read) i włączyć
      delete_branch_on_merge (2026-08-07).
- [x] Utworzyć `.github/dependabot.yml` i `SECURITY.md` (2026-08-07,
      nieśledzone, do main).
- [ ] `npm audit fix` oraz bump `next` do `16.3.0`, przebudowa i testy.
- [x] Zredagować ref `<SUPABASE_PREVIEW_PROJECT_REF>` / URL preview Supabase z docs
      (redakcja zrobiona w working tree, do zacommitowania); nadal należy
      obrócić/usunąć projekt preview.
- [ ] Ustawić `NEXT_PUBLIC_SITE_URL` produkcyjne w konfiguracji wdrożenia;
      fallback do adresu żądania został usunięty z kodu.
- [x] Dodać nagłówki bezpieczeństwa w `next.config.ts`.
- [x] Usunąć/sparametryzować `192.168.0.205` przez `HOMEBACK_DEV_ORIGIN`.
- [x] Wynieść stałe hasło E2E do `E2E_PASSWORD`.
- [ ] (Po publikacji) włączyć Secret Scanning + Push Protection oraz Code
      scanning/CodeQL.
- [ ] (Po publikacji) dodać branch protection na `main` (PR + review).
- [ ] (Po publikacji) zweryfikować rulesets na planie publicznym.
- [ ] Wyrównać `minimum_password_length` do 8 na hosted i rozważyć CAPTCHA
      (Turnstile).
- [ ] Usunąć/zgasić projekt preview Supabase lub ograniczyć jego dostęp.
- [x] Ustawić `bodySizeLimit` Server Actions na `2mb`, zgodnie z limitem
      zdjęć; limit `3mb` z `4fdf968` nie został użyty.

## Status

Status: ZALECENIA WYPRACOWANE - CZĘŚĆ ZADAŃ WYMAGA DZIAŁAŃ WŁAŚCICIELA.

Kod i zależności są gotowe do poprawy w repo. Ustawienia GitHub, hosted
Supabase i rotacja/obrót projektu preview są po stronie właściciela.
