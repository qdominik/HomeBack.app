# Checklista gotowości publikacji (żywy dokument)

Cel: kompletny, aktualizowany w kolejnych iteracjach stan przygotowań
repozytorium HomeBack.app do publikacji publicznej. Źródło szczegółów:
`docs/ops/security-audit-before-public-2026-08-07.md`.

## Instrukcje dla kolejnych iteracji (zasady postępowania)

1. **Nie przepisuj istniejących napraw.** Przed zmianą sprawdź `git log --all`,
   gałęzie (`git branch -a`) i `docs/decisions/`. Przypadek 4fdf968: naprawa
   `bodySizeLimit` istniała na `fix/item-photo-upload-errors`, nie została
   zmergowana, a PR #16 rozgałęziony przed nią odtworzył błąd. Właściwa ścieżka
   to integracja istniejącej naprawy, nie nowa implementacja.
2. **Ustawienia repo tylko przez `gh api`, najpierw odczyt (GET).** Każdą
   zmianę weryfikować ponownym GET. Nie używać `git push --force` itp. (zakaz w
   AGENTS.md).
3. **Ograniczenia planu Free / konta osobistego GitHub:**
   - Secret Scanning + Push Protection, CodeQL, branch protection, rulesets,
     Dependabot wersjonowanie - dostępne dopiero po publikacji.
   - `allow_forking` niezmienialne na prywatnym repo konta osobistego
     (422, tylko org-owned).
4. **PowerShell/`gh api` gotchas** (łamanie `powershell -Command`):
   - nie używać cudzysłowów podwójnych `"` wewnątrz argumentów `--jq` -
     psuła przekazywanie argumentów ("accepts N arg(s)");
   - tablice JSON (np. `patterns_allowed`) przekazywać przez plik + `--input`,
     nie przez powtórzone `-f` (override) ani `-F` z JSON (koniec stringiem);
   - powtórzone `-f` z tą samą nazwą pola = błąd "unexpected override".
5. **Nie commituj plików spoza wątku:** smoketest preview (Team B:
   `playwright.preview.config.ts`, `tests/e2e/preview-smoke.spec.ts`),
   pliki przygotowawcze publikacji (`.github/dependabot.yml`, `SECURITY.md`) -
   trafiają do main, nie do PR #16. Temp pliki robocze trzymaj w
   `C:\Users\qdomi\AppData\Local\Temp\opencode`.
6. **Po każdej zmianie:** `npm run test:logic` (230 testów) i `npm run lint`.
7. **Wszystkie odczyty/nadpisy danych** szanują `household_id` i RLS
   (AGENTS.md); MVP bez AI/QR/NFC/2D maps itd.

## Zrobione (2026-08-07)

- [x] Vulnerability alerts włączone (PUT -> 204).
- [x] Automated security fixes włączone.
- [x] Actions permissions: `allowed_actions: selected` (allowlista
      `actions/checkout:*`, `actions/setup-node:*`), workflow default `read`,
      `can_approve_pull_request_reviews: false`.
- [x] `delete_branch_on_merge` włączone.
- [x] Utworzone (nieśledzone, do main): `.github/dependabot.yml` (npm weekly),
      `SECURITY.md`.
- [x] SSO Vercel preview wyłączone; alias preview publiczny (tymczasowo).
- [x] Smoketest preview 6/6 PASS; testy logiki 230/230 PASS.
- [x] README: angielska wersja publiczna - PR #17 zmergowany do main
      (commit 2877e4a); GitHub renderuje EN.
- [x] Zależności: bump `next`/`eslint-config-next` do 16.3.0 + `js-yaml` 4.3.1 -
      zweryfikowane (audit 0, testy 214/214, lint, build); **PR #18 otwarty**.

## Do zrobienia przed publikacją

- [ ] Zmergować PR #18 (bump next 16.3.0 + js-yaml 4.3.1) - gotowy i
      zweryfikowany, do akceptacji właściciela.
- [ ] Zredagować ref `yzewupqxkefyvljnfolk`/URL preview Supabase z docs
      (redakcja w working tree, do zacommitowania) oraz obrócić/usunąć projekt
      preview.
- [ ] Ustawić `NEXT_PUBLIC_SITE_URL` produkcyjne; usunąć fallback do nagłówka
      `Origin` w rejestracji.
- [ ] Dodać nagłówki bezpieczeństwa w `next.config.ts`.
- [ ] Usunąć/sparametryzować `192.168.0.205`.
- [ ] Wynieść stałe hasło E2E (`Password123!`) do zmiennych środowiskowych
      (Team B).
- [ ] Wyrównać `minimum_password_length` do 8 na hosted; decyzja o CAPTCHA
      (Turnstile).
- [ ] Zintegrować istniejącą naprawę `4fdf968` (bodySizeLimit 3mb) przed
      zamknięciem PR #16 - NIE przepisywać.

## Do zrobienia po publikacji

- [ ] Secret Scanning + Push Protection.
- [ ] Code scanning / CodeQL.
- [ ] Branch protection na `main` (PR + review wg AGENTS.md).
- [ ] Rulesets (plan Free po publikacji).
- [ ] Dependabot version updates (aktywny po publikacji).
- [ ] Weryfikacja PR #16 z integracją 4fdf968 przed startem produkcyjnym.

## Otwarte wątki

- **PR #18** (`fix/deps-audit`): bump next/eslint-config-next 16.3.0 + js-yaml
  4.3.1; zależności naprawione (audit 0) - czeka na merge do main.
- PR #16 (`codex/item-form-description-layout`): blocker E394 - domyślny limit
  body server actions Next.js 1 MB vs limit pliku 2 MB. Naprawa istnieje
  (4fdf968, 3mb) na `fix/item-photo-upload-errors` - integracja do decyzji
  właściciela/Team A.
- Snapshot landingu (`landing-v201/`) w historii gałęzi
  `preview/supabase-hosted-preview` (commit 484fb63): rewrite historii wymaga
  zgody właściciela (operacja objęta zakazem w AGENTS.md).
- Dokumentacja: `docs/ops/preview-deployment-contract-2026-08-02.md` -
  redakcja refu zrobiona, niezacommitowana (osobny wątek).
- Stan PR #16 i preview: `C:\Users\qdomi\AppData\Local\Temp\opencode\pr16-state-2026-08-07.md`
  (pliki tymczasowe - nie commituj).
