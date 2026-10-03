# Naprawa audytu npm po PR #60 — 2026-10-03

Zespół B, zgodnie z zadaniem właściciela Backend / Security / zależności.
Branch: `security/npm-audit-pr60`. Baza: aktualny `origin/main`
`dfb90114682fbffcb56e1e0b346d4c22ff625a95`. Osobny worktree; zastane
checkouty i lokalne zmiany pozostawiono bez zmian.

## Problem i decyzja

[CI po PR #60](https://github.com/qdominik/HomeBack.app/actions/runs/37137697724)
zatrzymało App na niezmienionej bramce `npm audit`. Czyste `npm ci` i
`npm audit --json` potwierdziły 7 podatnych pakietów: 6 high i 1 critical.
Audyt produkcyjny (`--omit=dev`) wykazał wyłącznie 1 critical w Next.

Przed pracą sprawdzono otwarte PR-y i historię aktualizacji. PR #18 z sierpnia
aktualizuje Next do 16.3.0 oraz js-yaml; PR #63 we wrześniu wprowadził 16.3.4.
Nie naprawiają obecnych advisory. Pozostałe otwarte PR-y Dependabot dotyczą
innych pakietów. Nie dublowano ich zakresu.

Wybrano najnowszy dostępny stabilny patch Next i eslint-config-next 16.3.8,
z zachowaniem wspólnej wersji frameworka, konfiguracji i pluginu ESLint.
Advisory Next wskazuje pierwszą naprawioną wersję 16.3.6; zweryfikowano
dostępność obu wersji oraz ich peerDependencies w rejestrze npm.
React i React DOM 19.2.8 spełniają zakres `^19.0.0`; ESLint 9.39.4 spełnia
`>=9.0.0`. Nie zmieniono ich wersji, progów CI ani polityki skryptów instalacji.
Lockfile wygenerowano npm 11.16.0, z celowanym `npm update brace-expansion`.
Nie używano `npm audit fix --force` ani downgrade.

| Pakiet | Przed | Po |
| --- | --- | --- |
| next, eslint-config-next, @next/env, @next/eslint-plugin-next | 16.3.4 | 16.3.8 |
| @next/swc-* (8 wariantów platformowych) | 16.3.4 | 16.3.8 |
| brace-expansion (ESLint → minimatch 3.1.5) | 1.1.18 | 1.1.21 |
| brace-expansion (typescript-estree → minimatch 10.2.5) | 5.0.9 | 5.0.12 |
| fast-glob (wyłącznie plugin Next ESLint) | 3.3.1 | lokalny adapter @homeback/next-eslint-glob 1.0.0 |
| micromatch / braces | 4.0.8 / 3.0.3 | usunięte z drzewa |
| picomatch (deduplikacja) | 2.3.2 i 4.0.5 | 4.0.7 |
| tinyglobby | 0.2.17 | 0.2.17, istniejąca zależność developerska |
| react / react-dom | 19.2.8 | 19.2.8 |

## Scoped override i zgodność

Ścieżka developerska: eslint-config-next → @next/eslint-plugin-next →
fast-glob → micromatch → braces. Advisory braces GHSA-vfj7-8cjw-p6xm
obejmuje wszystkie opublikowane wersje do 3.0.3; brak poprawki upstream.
Plugin Next 16.3.8, a także sprawdzony canary, nadal deklarują fast-glob 3.3.1.
Proponowany przez audit downgrade eslint-config-next do 14.2.35 jest niezgodny.

Niniejszy zapis dokumentuje decyzję o dodaniu lokalnej zależności developerskiej
`fast-glob: file:tools/next-eslint-glob` oraz override ograniczony do pluginu
Next, odwołujący się do niej przez `$fast-glob`. Pakiet ma własną nazwę
`@homeback/next-eslint-glob`, jawny kod źródłowy i korzysta z istniejącego
tinyglobby oraz picomatch 4.0.7. Nie zawiera ani nie ukrywa podatnego braces.
Npm audit ocenia rzeczywiste pozostałe zależności; `npm ls` potwierdza prawidłowe
rozwiązywanie pakietów, bez invalid dependencies.

Zweryfikowano kod zainstalowanego pluginu: jedynym konsumentem fast-glob jest
getRootDirs, wywołujący `globSync(string, { onlyDirectories: true })`.
Adapter obsługuje dokładnie ten kontrakt. Nie implementuje pełnego API
fast-glob i jawnie odrzuca inne opcje. Prosty alias tinyglobby nie byłby zgodny:
domyślnie rozwija statyczne katalogi, dodaje ukośniki i zmienia ścieżki absolutne.
Adapter wyłącza expandDirectories, zachowuje ścieżki absolutne, usuwa końcowy
ukośnik oraz pomija bazowy katalog przy dynamicznym globstar.

12 testów uruchamianych przez istniejący `test:logic` sprawdza rzeczywisty
getRootDirs i regułę no-html-link-for-pages: domyślny root, katalog statyczny,
wildcard, braces, globstar, brak katalogu, pomijanie plików, tablice rootDir,
ścieżki Windows, ścieżki absolutne, wykrywanie nieprawidłowego linku i odrzucanie
nieobsługiwanego API. Adapter ESM jest ładowany przez require pluginu dzięki
Node 24.18.0 przypiętemu w projekcie; pakiet deklaruje to minimum.

Przy kolejnej aktualizacji pluginu należy ponownie sprawdzić jego używane API.
Override należy usunąć, gdy upstream usunie braces albo opublikuje naprawę.
Nie wolno używać adaptera jako ogólnego zamiennika fast-glob w aplikacji.

## Ekspozycja next/og

Przeszukanie src i tests nie wykazało importów next/og, ImageResponse,
@vercel/og, satori ani dynamicznych opengraph-image / twitter-image.
Ikony aplikacji są statycznymi plikami PNG/ICO. W tym checkout nie znaleziono
ścieżki przekazującej dane atakującego do Node.js ImageResponse i SVG,
wymaganej przez advisory GHSA-vcvr-r3jv-pc5j. Jest to ocena kodu repozytorium,
nie potwierdzenie stanu wdrożonego Production. Podatny pakiet zaktualizowano
niezależnie od braku tej ścieżki.

## Walidacja i ograniczenia

Walidacja lokalna używa odizolowanych Node 24.18.0 / npm 11.16.0 bez zmiany
globalnej instalacji. Czyste npm ci, pełny npm audit oraz audit --omit=dev
przechodzą z 0 podatności. Testy logiki: 359 istniejących + 12 zgodności
adaptera, 0 failed i 0 skipped. Lint ma 0 błędów i jedno zastane ostrzeżenie
nieużywanego typu w providers/groq.ts. Kontrakt .env.example przechodzi.
`npm run build` (Turbopack oraz TypeScript), osobne `tsc --noEmit` i
`git diff --check` również przechodzą.

Lokalny `supabase status` potwierdził brak działającego Docker Engine.
Nie uruchamiano ani nie resetowano Docker/Supabase. Lokalnych E2E i pgTAP
nie raportuje się jako PASS. Wymagane E2E (w tym kill switch zaproszeń),
pgTAP, migracja na zapełnionej bazie i rzeczywiste transakcje współbieżne
muszą przejść w niezmienionym workflow PR, na jego izolowanych usługach.
Końcowy wynik CI i bezpośredni link do pipeline zostaną podane w opisie PR.

Nie merguje się tego PR ani nie wykonuje ręcznego wdrożenia Production.

## Źródła

- [Next RCE advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)
- [braces advisory, brak poprawki](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [brace-expansion: quadratic expansion](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr)
- [brace-expansion: nested groups](https://github.com/advisories/GHSA-qhr7-859c-m2p7)
- [brace-expansion: parseCommaParts](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p)
- [tinyglobby upstream](https://github.com/SuperchupuDev/tinyglobby)
