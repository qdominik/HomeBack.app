# Aktualizacja zależności bezpieczeństwa — 2026-09-11

Zespół A. Branch: `security/dependency-updates-2026-09`.
Baza: zaktualizowany lokalny main i origin/main `937c75238ae9593a396407e8fe355fdf264f6be2`.
Autoryzacja: zadanie właściciela z 2026-09-11 dotyczące wskazanych advisory,
niezbędnej kompatybilności, walidacji oraz regresji Zespołu B.

## Zakres i decyzja

Zmieniono Next i eslint-config-next z 16.3.2 na 16.3.4, Sharp z 0.35.3 na
0.35.4 oraz js-yaml z 4.3.1 na 4.3.2. PR #54 proponuje Next 16.3.4,
a PR #51 eslint-config-next 16.3.4; ich zakres sprawdzono przed aktualizacją.
Nie zmieniono major Next. React i React DOM pozostały na 19.2.8.

Lockfile wygenerowano wyłącznie npm: `npm install --no-audit --no-fund`, następnie
celowane `npm update js-yaml --no-audit --no-fund`. Nie stosowano audit fix,
zbiorowego upgrade ani ręcznej edycji lockfile. Zmieniło się 41 wpisów wersji;
nie dodano ani nie usunięto ścieżek pakietów. Zmiany pośrednie to pakiety Next,
natywne warianty Sharp/libvips oraz @emnapi/runtime. Ostatni jest wymagany przez
nowe @img/sharp-wasm32: zakres ^1.11.1 został podniesiony upstream do ^1.11.3.

Nie zmieniono kodu aplikacji, tras, konfiguracji Supabase, migracji, RLS/RPC,
schematu, lokalizacji, wyszukiwarki, menu ani formularza rzeczy. Nie zmieniono
środowisk Production. Nie uruchamiano, zatrzymywano ani resetowano Docker/Supabase.
Istniejące lokalne usługi wykorzystano do testów. Worktree A ma ignorowany
.env.local z lokalnym adresem Supabase, publicznym kluczem i lokalnym site URL;
nie przeniesiono do niego sekretów serwerowych ani konfiguracji Production.

## Podatności i npm audit

| Pakiet | Advisory | Przed | Po | Status |
| --- | --- | --- | --- | --- |
| Next.js | GHSA-p293-qw3h-jr36; GHSA-2xp9-vwfh-vxw4 | 16.3.2, critical | 16.3.4 | Usunięte z aktualnego audytu |
| Sharp | GHSA-rgj7-g3m4-5g8c | 0.35.3, high | 0.35.4 | Usunięte z aktualnego audytu |
| js-yaml | GHSA-2883-xcg3-v3hh | 4.3.1, high | 4.3.2 | Usunięte z aktualnego audytu |

Baseline: 3 podatne pakiety (1 critical, 2 high).
Po aktualizacji: `npm audit` — **0 vulnerabilities**;
`npm audit --omit=dev` — **0 vulnerabilities**.
js-yaml jest zależnością narzędzi ESLint; nie dodano go jako zależności aplikacji.

## Override Sharp — usunięty

Metadata npm oraz lockfile Next 16.3.4 deklarują optionalDependencies.sharp =
^0.35.4. Ten zakres wyklucza podatne wersje <0.35.4. Stary override 0.35.3
blokował naprawioną wersję i przy nowym minimum upstream nie jest potrzebny.
Nie dodano bezpośredniej zależności Sharp. `npm ls` potwierdził Sharp 0.35.4
pod Next, bez override i bez konfliktów zależności.

Node >=20.9.0 wymagany przez Next i Sharp jest zgodny z przypiętym Node projektu
24.18.0. Bezpieczeństwo potwierdzono audytem; kompatybilność przez build, natywne
przetwarzanie PNG/JPEG/WebP/AVIF i działający endpoint optymalizatora Next.
Historyczne decyzje o override pozostawiono jako zapis wcześniejszego stanu.

## Walidacja

Użyto przypiętych Node 24.18.0 / npm 11.16.0 z odizolowanego runtime w katalogu
tymczasowym; nie zmieniono globalnych instalacji ani konfiguracji projektu.

| Kontrola | Wynik |
| --- | --- |
| npm install | PASS; następnie celowane npm update js-yaml |
| npm ls next eslint-config-next sharp js-yaml --depth=4 | PASS, oczekiwane wersje |
| npm audit | PASS, 0 vulnerabilities |
| npm audit --omit=dev | PASS, 0 vulnerabilities |
| npm run test:logic | PASS, 322/322; 0 failed, 0 skipped |
| npm run lint | PASS; ponownie również po dodaniu testu B |
| npm run build | PASS, Next 16.3.4, Turbopack i TypeScript |
| tsc --noEmit po dodaniu testu B | PASS |
| git diff --check | PASS |
| Sharp runtime | PASS: kodowanie, resize 96×96 -> 48×48 i odczyt PNG/JPEG/WebP/AVIF; Sharp 0.35.4, libvips 8.18.6 |
| Next image optimizer | PASS: lokalne next start, /_next/image dla publicznego PNG -> HTTP 200, image/webp, 640×221 |
| Lokalny build: /login i /items bez sesji | PASS: HTTP 200 i przekierowanie 307 do /login |
| Pełne E2E Zespołu B | PASS: 28 passed, 2 istniejące skipped, 0 failed (2,4 min); lokalny dev, Chromium |

Npm zgłosił ostrzeżenie o niezatwierdzonym postinstall unrs-resolver@1.12.2
w polityce allowScripts. Nie poszerzano uprawnień skryptów. Instalacja, lint,
TypeScript i build zakończyły się poprawnie. Nie wykryto problemu kompatybilności.
Walidacja natywna obejmuje Windows; pozostałe warianty platformowe zachowano
w lockfile, ale nie wykonywano ich na tym komputerze. Wynik audit dotyczy bazy
advisory dostępnej w chwili sprawdzenia.

## Regresja Zespołu B

Zespół B przygotował w osobnym worktree test w tests/e2e/mobile-navigation.spec.ts;
po przeglądzie przeniesiono go do A. Test generuje lokalny JPEG większy niż 800 KiB,
dodaje rzecz przez przycisk +, sprawdza kompresję do limitu, podgląd, zapis,
miniaturę po odświeżeniu oraz zachowanie zdjęcia po edycji nazwy. Nie zmienia
aplikacji, konfiguracji ani zależności testowych.

| Wymagany przepływ | Pokrycie |
| --- | --- |
| Logowanie i wylogowanie | auth-regression.spec.ts |
| /items i dodawanie rzeczy | auth-regression.spec.ts, mobile-navigation.spec.ts, dashboard-item-search.spec.ts |
| Globalna wyszukiwarka | dashboard-item-search.spec.ts; wyniki, filtry, stany, izolacja gospodarstw |
| Zapis i odczyt L1/L2/L3 | dashboard-item-search.spec.ts, m4d8-location-lifecycle.spec.ts; zapis, edycja, odświeżenie |
| Upload i miniatury | nowy test JPEG w mobile-navigation.spec.ts |
| Hamburger, lupa, + | mobile-navigation.spec.ts; widoki 390/768/1280, focus/Escape i nawigacja |

Pełny skonfigurowany zestaw obejmuje 30 testów: 28 wykonywalnych oraz dwa
istniejące pominięcia dotyczące ról. Nie rozszerzano scope o realizację tych
wcześniej pominiętych scenariuszy. Testy B wykonywane są na dokładnym checkout
A i jego zaktualizowanym node_modules, z lokalnymi Supabase/Mailpit.

Pierwsza próba pełnego E2E z E2E_PRODUCTION_BUNDLE=1 napotkała istniejącą
blokadę generatora danych testowych: src/lib/settings/qa-test-data.ts wymaga
dla lokalnego trybu NODE_ENV innego niż production. Auth przeszedł, przygotowanie
danych wyszukiwarki nie mogło się zakończyć. Pełną regresję uruchomiono ponownie
w standardowym trybie dev, bez modyfikacji bramki ani podszywania się pod Preview.
Build produkcyjny i optymalizator obrazów zweryfikowano osobno.

Końcowy pełny przebieg dev: **28 passed, 2 skipped, 0 failed (2,4 min)**.
Nowy test JPEG przeszedł, podobnie jak wszystkie wykonywalne scenariusze
logowania/wylogowania, /items, wyszukiwania, L1/L2/L3 i menu. Dwa pominięte
testy member/child wymagają wcześniej zaplanowanych fixture przeglądarkowych.
Zespół B uruchomił pełny przebieg; A odebrał kompletny log po limicie użycia
agenta B. Log: C:\Users\qdomi\AppData\Local\Temp\homeback-security-e2e-dev.log.

## Pełna lista zmienionych pakietów
| Pakiet | Przed | Po |
| --- | --- | --- |
| @emnapi/runtime | 1.11.2 | 1.11.3 |
| @img/sharp-darwin-arm64 | 0.35.3 | 0.35.4 |
| @img/sharp-darwin-x64 | 0.35.3 | 0.35.4 |
| @img/sharp-freebsd-wasm32 | 0.35.3 | 0.35.4 |
| @img/sharp-libvips-darwin-arm64 | 1.3.2 | 1.3.3 |
| @img/sharp-libvips-darwin-x64 | 1.3.2 | 1.3.3 |
| @img/sharp-libvips-linux-arm | 1.3.2 | 1.3.3 |
| @img/sharp-libvips-linux-arm64 | 1.3.2 | 1.3.3 |
| @img/sharp-libvips-linux-ppc64 | 1.3.2 | 1.3.3 |
| @img/sharp-libvips-linux-riscv64 | 1.3.2 | 1.3.3 |
| @img/sharp-libvips-linux-s390x | 1.3.2 | 1.3.3 |
| @img/sharp-libvips-linux-x64 | 1.3.2 | 1.3.3 |
| @img/sharp-libvips-linuxmusl-arm64 | 1.3.2 | 1.3.3 |
| @img/sharp-libvips-linuxmusl-x64 | 1.3.2 | 1.3.3 |
| @img/sharp-linux-arm | 0.35.3 | 0.35.4 |
| @img/sharp-linux-arm64 | 0.35.3 | 0.35.4 |
| @img/sharp-linux-ppc64 | 0.35.3 | 0.35.4 |
| @img/sharp-linux-riscv64 | 0.35.3 | 0.35.4 |
| @img/sharp-linux-s390x | 0.35.3 | 0.35.4 |
| @img/sharp-linux-x64 | 0.35.3 | 0.35.4 |
| @img/sharp-linuxmusl-arm64 | 0.35.3 | 0.35.4 |
| @img/sharp-linuxmusl-x64 | 0.35.3 | 0.35.4 |
| @img/sharp-wasm32 | 0.35.3 | 0.35.4 |
| @img/sharp-webcontainers-wasm32 | 0.35.3 | 0.35.4 |
| @img/sharp-win32-arm64 | 0.35.3 | 0.35.4 |
| @img/sharp-win32-ia32 | 0.35.3 | 0.35.4 |
| @img/sharp-win32-x64 | 0.35.3 | 0.35.4 |
| @next/env | 16.3.2 | 16.3.4 |
| @next/eslint-plugin-next | 16.3.2 | 16.3.4 |
| @next/swc-darwin-arm64 | 16.3.2 | 16.3.4 |
| @next/swc-darwin-x64 | 16.3.2 | 16.3.4 |
| @next/swc-linux-arm64-gnu | 16.3.2 | 16.3.4 |
| @next/swc-linux-arm64-musl | 16.3.2 | 16.3.4 |
| @next/swc-linux-x64-gnu | 16.3.2 | 16.3.4 |
| @next/swc-linux-x64-musl | 16.3.2 | 16.3.4 |
| @next/swc-win32-arm64-msvc | 16.3.2 | 16.3.4 |
| @next/swc-win32-x64-msvc | 16.3.2 | 16.3.4 |
| eslint-config-next | 16.3.2 | 16.3.4 |
| js-yaml | 4.3.1 | 4.3.2 |
| next | 16.3.2 | 16.3.4 |
| sharp | 0.35.3 | 0.35.4 |

## Źródła i dalszy krok

- [PR #54 — Next](https://github.com/qdominik/HomeBack.app/pull/54)
- [PR #51 — eslint-config-next](https://github.com/qdominik/HomeBack.app/pull/51)
- [Next 16.3.4](https://github.com/vercel/next.js/releases/tag/v16.3.4)
- [Sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c)
- [js-yaml advisory](https://github.com/advisories/GHSA-2883-xcg3-v3hh)

Rekomendacja: można przygotować PR z tego brancha. Wymagane kontrole przeszły;
istniejące dwa SKIP oraz ograniczenie fixture w lokalnym next start są jawnie
opisane powyżej. Po integracji trzeba osobno wykonać standardową akceptację
właściciela i procedurę wdrożenia. Właściciel zaakceptował przygotowanie commita,
push brancha i PR do main, bez merge. Finalny przegląd przed commitem potwierdził
zgodność manifestu/lockfile, oczekiwane wersje i brak override Sharp; npm audit
ponownie zwrócił 0 podatności, a npm install --dry-run --ignore-scripts
--no-audit --no-fund zwrócił up to date. Ochrona GitHub/CI pozostaje osobnym zakresem
Zespołu D.
