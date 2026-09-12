# Priorytet 1 — bezpieczeństwo, migracje, CI i cleanup

**Stan:** 2026-09-12

**Branch roboczy:** `ops/priority-1-completion` od `origin/main` na `f432e64`

**Zakres:** operacje i dokumentacja; bez zmian funkcjonalnych, danych, RLS ani konfiguracji Supabase

## Werdykt

- GitHub Secret Scanning i Push Protection są włączone. Otwartych alertów
  Secret Scanning po włączeniu: **0**.
- `main` wymaga aktualnego brancha, PR, jednego review, ponownego review po
  ostatnim pushu, rozstrzygnięcia rozmów oraz checków `App`,
  `Database (pgTAP)` i `E2E (local)`.
- Jedyny administrator repozytorium zachowuje admin bypass. Wymuszenie tych
  zasad także na administratorze zablokowałoby wszystkie merge'e, dopóki repo
  nie otrzyma drugiego uprawnionego reviewera.
- Migracja `0018` jest brakującą migracją historyczną zarówno na Preview, jak
  i Production. Powinna zostać zastosowana na obu środowiskach, najpierw na
  Preview, ale dopiero po osobnej akceptacji właściciela i prechecku danych.
- CI zostało przygotowane do rozszerzenia o blokujący `npm audit`, lokalny
  pgTAP oraz lokalny E2E bez sekretów hosted. Zmiany są gotowe do review w PR.
- Nie zamknięto PR-ów i nie usunięto żadnego brancha ani worktree.

## Środowiska

| Środowisko | Aplikacja | Supabase | Dane i przeznaczenie | Migracje |
| --- | --- | --- | --- | --- |
| Local | `http://127.0.0.1:3000` (E2E: port `3001`) | lokalny stack z `supabase/config.toml` | dane deweloperskie/testowe; Mailpit dla potwierdzeń e-mail | pełny łańcuch repo uruchamiany wyłącznie przez właściciela lokalnie albo w efemerycznym runnerze CI |
| Preview | Vercel Preview, zgodnie z kontraktem Preview | `homeback-preview`, ref `yzewupqxkefyvljnfolk`, `eu-west-3` | testy wewnętrzne; bez danych Production | remote ma `0001–0017` i `0019–0023`; brakuje `0018` |
| Production | `https://my.homeback.app` | `homeback-production`, ref `vtiygneyxyoxvsgafsnm`, `eu-central-1` | trwałe dane użytkowników | remote ma `0001–0017` i `0019–0023`; brakuje `0018` |

Local, Preview i Production nie mogą współdzielić sekretów ani danych
użytkowników. Landing page `https://homeback.app` pozostaje osobnym projektem.

## Rozstrzygnięcie migracji `0018`

Plik `0018_rename_winter_clothes_category.sql` zmienia wyłącznie nazwę
globalnej kategorii systemowej o stabilnym kluczu `winter_clothes` z
`Ubrania zimowe` na `Ubrania`. Warunki `household_id is null` oraz dokładnej
starej nazwy ograniczają operację do oczekiwanego rekordu. Migracja nie zmienia
schematu, referencji Rzeczy ani RLS.

Historia Git wyjaśnia drift: zmiana powstała 2026-08-07 poza historią obecnego
`main`, a plik został przywrócony do `main` 2026-08-23, już po zastosowaniu na
hosted migracji `0019–0022`. Migracja `0023` została później zastosowana, a
`0018` nadal nie została zarejestrowana. Odczyt historii obu hosted projektów
potwierdził identyczną lukę.

### Decyzja Zespołu A

`0018` należy zastosować na Preview i Production, ponieważ zapisuje
zaakceptowaną semantykę nazwy i usuwa drift historii. Zalecana kolejność:

1. Owner zatwierdza osobno operację Preview.
2. Potwierdzić backup/snapshot i wykonać read-only precheck rekordu
   `public.category` dla `key = 'winter_clothes'`.
3. Jeżeli nazwa to `Ubrania zimowe`, wykonać dokładnie SQL z pliku `0018`.
   Jeżeli nazwa to `Ubrania`, SQL jest no-op; można przejść do weryfikacji.
   Brak rekordu, więcej niż jeden rekord albo inna nazwa zatrzymują operację.
4. Zweryfikować nazwę, `household_id is null` i brak zmian w rekordach
   householdowych.
5. Dopiero po weryfikacji oznaczyć wersję `0018` jako zastosowaną w historii
   migracji za pomocą kontrolowanego `migration repair --status applied 0018`.
6. Powtórzyć te kroki na Production dopiero po odbiorze Preview i nowej zgodzie
   ownera.

Nie używać `db push --include-all`. Nie stosować zbiorczo innych migracji. Nie
uruchomiono SQL `0018`, `migration repair`, `db push` ani żadnej innej mutacji
hosted w ramach tego zadania.

## Zakres CI

Workflow zachowuje stałe, wymagane nazwy checków:

| Check | Zakres | Sekrety hosted |
| --- | --- | --- |
| `App` | `npm ci`, pełny `npm audit`, kontrakt env, whitespace, testy logiczne, lint i build | brak |
| `Database (pgTAP)` | osobny efemeryczny Supabase, wszystkie migracje repo, `supabase test db`, cleanup stacku | brak |
| `E2E (local)` | osobny efemeryczny Supabase + Mailpit, Chromium, serwer dev i skonfigurowany suite Playwright | brak |

E2E działa bez `E2E_PASSWORD` i bez sekretów Preview/Production: testy tworzą
unikalnych użytkowników oraz householdy w jednorazowej lokalnej bazie. Suite ma
28 wykonywalnych testów i 2 jawne skipy dla ról bez zatwierdzonego fixture.
Konfiguracja Playwright wybiera teraz `npm` na Linuxie i `npm.cmd` na Windows.

Hosted Preview E2E pozostaje poza tym checkiem. Nie ma obecnie repozytoryjnych
ani środowiskowych GitHub Actions secrets/variables ani zaakceptowanego konta
smoke. Przyszły hosted smoke wymaga osobnego, niemutującego produkcji speca,
`E2E_BASE_URL`, dedykowanych credentials w GitHub Environment `Preview` i
kontrolowanego cleanupu. Nie uruchamiać obecnego lokalnego suite przeciw
Production.

Oficjalne akcje GitHub podniesiono z `v4` do bieżącego major `v7`, aby usunąć
ostrzeżenie o zdeprecjonowanym runtime Node 20 akcji. Wersja Supabase CLI jest
przypięta przez `package-lock.json`.

## Aktualny status bezpieczeństwa GitHub

| Kontrola | Status 2026-09-12 |
| --- | --- |
| Repo visibility | Public |
| Secret Scanning | ENABLED |
| Push Protection | ENABLED |
| Otwarte alerty Secret Scanning | 0 |
| Non-provider patterns | DISABLED |
| Validity checks | DISABLED |
| PR przed merge do `main` | REQUIRED |
| Review | 1, stale reviews dismiss, last push approval required |
| Required checks | `App`, `Database (pgTAP)`, `E2E (local)`; strict/up-to-date |
| Conversation resolution | REQUIRED |
| Force push / delete `main` | DISABLED |
| Admin enforcement | DISABLED — świadomy bypass dla jedynego administratora |
| Dependabot security updates | DISABLED |

Rekomendacja: dodać co najmniej jednego zaufanego reviewera, a następnie
włączyć enforce administrators. Po pierwszym runie nowego workflow potwierdzić,
że wszystkie trzy wymagane konteksty pojawiają się dokładnie pod zapisanymi
nazwami. Osobno zdecydować o Dependabot security updates i CodeQL; nie były
częścią tego zakresu.

## Cleanup do akceptacji

Poniższa lista jest propozycją. Niczego nie zamknięto ani nie usunięto.

### Otwarte PR-y

- **Bezpieczny kandydat:** PR `#46` jest zastąpiony przez scalony PR `#58`;
  zmiana Playwright jest identyczna, a pozostała różnica jest dokumentacyjna.
- **Wymagają przeglądu przed zamknięciem:** `#19`, `#18`, `#15`; ich commity
  nadal są unikalne względem `main`.
- **Zachować do decyzji produktowej:** `#60`, `#56`.
- **Triage osobno, nie cleanup zbiorczy:** Dependabot `#53`, `#52`, `#50`,
  `#49`, `#48`, `#47`, `#25`, `#24`; bot odświeżył je po ostatnich zmianach,
  a `#47` jest czerwonym major update ESLint.

### Remote branche będące przodkami `origin/main`

- `audit/accessibility-responsive`
- `docs/clarify-agent-terminal-rules`
- `docs/m4d-final-owner-acceptance`
- `docs/sharp-security-risk-defer`
- `feature/m4c1-copy-entities-v2`
- `feature/m4d7-room-delete-resolution`
- `feature/settings-test-data-foundation`
- `ops/production-readiness-final`
- `security/dependency-updates-2026-09`
- `test/e2e-regression-foundation`
- `test/m4d8-e2e-regression`
- `test/m4d8-lifecycle-final-verification`

Branch `preview/supabase-hosted-preview` także jest przodkiem `main`, ale należy
go zachować jako długowieczny branch środowiskowy. Branch
`codex/team-b-e2e-logout-site-url` jest kandydatem dopiero po zamknięciu PR
`#46` jako zastąpionego.

### Czyste worktree z HEAD będącym przodkiem `origin/main`

- `C:/Users/qdomi/AppData/Local/Temp/homeback-global-search`
- `C:/Users/qdomi/AppData/Local/Temp/homeback-item-location-l1-l2`
- `C:/Users/qdomi/AppData/Local/Temp/homeback-navigation-add-action`
- `C:/Users/qdomi/AppData/Local/Temp/homeback-security-dependency-updates-2026-09`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/docs-sharp-security-risk-defer`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/fix-item-photo-oversize-crash`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/integration-icon-catalog-locales-clean`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/integration-pr13-sharp-risk`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/pr31-react-peer-fix`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/production-preflight-pr20`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/security-sharp-audit`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/team-a-m4c1-copy-entities-v2`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/team-a-m4d7-room-delete-resolution`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/team-a-m4d8-lifecycle-final-verification`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/team-b-e2e`
- `C:/Users/qdomi/Desktop/HomeBack.worktrees/team-f-settings`

Nie usuwać aktywnego `ops-priority-1-completion`. Nie usuwać głównego worktree,
worktree dirty ani czystych worktree z niepołączonymi zmianami. Szczególnie
główny `Homeback.app` jest dirty i znajduje się na `fix/vercel-env-contract`.
Przed każdą przyszłą operacją cleanup trzeba ponownie wykonać `git status`,
sprawdzić powiązany branch i potwierdzić ancestor/patch-equivalence.

## Zakres zmian w branchu

- `.github/workflows/ci.yml` — audit, pgTAP, lokalny E2E, minimalne permissions,
  aktualne wersje oficjalnych akcji i diagnostyka błędów.
- `playwright.config.ts` — przenośne uruchamianie npm na Linux/Windows.
- `README.md` — aktualny podział środowisk, CI, migracje i bezpieczeństwo.
- ten raport operacyjny.

Nie zmieniono kodu funkcjonalnego, danych, RLS, migracji, konfiguracji Supabase,
zależności ani lockfile.
