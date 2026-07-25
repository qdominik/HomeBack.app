# HomeBack.app — raport gotowości produkcyjnej

**Data oceny:** 2026-07-25
**Zakres:** repozytorium aplikacji `my.homeback.app`; bez dostępu do hostingu, projektu hosted Supabase, sekretów, GitHub Actions ani plików właścicielskich wyłączonych z zakresu. `homeback.app` jest przyszłą, odrębną stroną sprzedażową i nie jest oceniana jako aplikacja produkcyjna.

## Ocena ogólna: BLOCKED

Lokalny build i lint przechodzą, a testy pgTAP przechodzą w całości. Publikację blokuje jednak nieprzechodzący wymagany test logiki, 12 podatności o wysokiej ważności zgłoszonych przez `npm ci`, brak potwierdzonej konfiguracji produkcyjnych domen/Auth/Supabase oraz brak wdrożonego health checku. Nie wykonano żadnego wdrożenia ani zmiany konfiguracji.

## Stan obszarów

| Obszar | Ocena | Ustalenie |
| --- | --- | --- |
| Wymagania builda | PARTIAL | `npm ci`, `npm run lint` i `npm run build` przechodzą lokalnie. Brak pola `engines`/`packageManager`, więc wersja Node dla CI i hostingu nie jest przypięta. Zweryfikowano na Node `v24.18.0` i npm `11.16.0`; lockfile ma wersję 3. |
| Testy logiki | BLOCKED | `npm run test:logic` kończy się wynikiem 139/140. Nie przechodzi test `M4D.6 loads context lazily and uses one final server-side RPC` w `tests/unit/storage-location-l2-delete-resolution.test.ts`. |
| Lint | READY | `npm run lint` przechodzi lokalnie. |
| Produkcyjny build Next.js | READY | `npm run build` przechodzi lokalnie na Next.js 16.2.10. Trasy aplikacji są renderowane dynamicznie tam, gdzie korzystają z sesji Supabase. |
| Supabase: migracje i pgTAP | PARTIAL | Jest 13 sekwencyjnych migracji (`0001`–`0013`) i 15 testów pgTAP; lokalnie `npx supabase test db` przeszedł: 644 testy. Nie potwierdzono stanu historii migracji ani wersji PostgreSQL w hosted Supabase. |
| RLS i RPC | PARTIAL | Pierwsza migracja włącza RLS na 10 tabelach, a kolejne migracje jawnie ograniczają granty i wykonanie RPC do `authenticated`. Testy obejmują izolację gospodarstw, role i operacje RPC. Nie zweryfikowano zgodności polityk oraz grantów w projekcie hosted. |
| Auth, Site URL i redirect URLs | BLOCKED | Repozytorium zawiera tylko adresy lokalne. Rejestracja przekazuje `NEXT_PUBLIC_SITE_URL/auth/confirm`, a szablon e-mail odwołuje się do `SiteURL`; oba muszą odpowiadać domenie produkcyjnej. Brak dowodu konfiguracji hosted Supabase. |
| Domeny i HTTPS | BLOCKED | Brak danych o DNS, certyfikatach i routingu produkcyjnym. Aplikacja musi działać pod `https://my.homeback.app`; `https://homeback.app` pozostaje domeną przyszłej strony sprzedażowej, poza tym repozytorium. |
| Kontrola sekretów | PARTIAL | `.env*` jest ignorowane, a `.env.example` zawiera wyłącznie publiczną konfigurację. Kod aplikacji używa tylko klucza publikowalnego Supabase; nie znaleziono użycia `service_role` po stronie aplikacji. Nie oceniono sekretów hostingu, CI, historii Git ani rotacji. |
| Health check po wdrożeniu | BLOCKED | Nie ma wersjonowanego endpointu health/readiness. Można ręcznie sprawdzić `/login`, ale nie daje to jednoznacznego sygnału dostępności aplikacji i zależności. |
| Rollback | PARTIAL | Aplikacja może wrócić do poprzedniego niezmiennego artefaktu dostawcy hostingu. Migracje nie mają wykonywalnych „down migrations”; komentarze wymagają osobnej, zatwierdzonej migracji kompensacyjnej. Nie ma potwierdzenia kopii zapasowych/PITR ani procedury odzyskiwania hosted Supabase. |

## Wymagania builda i zweryfikowane polecenia

Wersjonowane zależności są w `package-lock.json`; wymagane są Node.js, npm, Docker oraz Supabase CLI dla kontroli bazy. Build korzysta z `next build`; konfiguracja Next.js nie wymaga dodatkowego adaptera ani eksportu statycznego.

Wykonane lokalnie:

| Polecenie | Wynik |
| --- | --- |
| `npm ci` | PARTIAL — instalacja zakończona, ale audit zgłosił 12 podatności high. |
| `git diff --check` | READY — bez błędów. |
| `npm run test:logic` | BLOCKED — 1 nieudany test z 140. |
| `npm run lint` | READY |
| `npm run build` | READY |
| `npx supabase test db` | READY — 15 plików, 644 testy pgTAP. |

Przed produkcją należy ustalić i zapisać wspieraną wersję Node/npm (np. przez `engines` i/lub narzędzie do pinowania wersji) oraz rozwiązać podatności bez automatycznego aktualizowania zależności w ramach wdrożenia.

## Zmienne środowiskowe

Nazwy wykryte w kodzie aplikacji i pliku przykładowym — bez wartości:

| Zmienna | Przeznaczenie | Status produkcyjny |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | kanoniczny origin dla przekierowań rejestracji, potwierdzenia i wylogowania | BLOCKED — powinna wskazywać `https://my.homeback.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | publiczny URL API projektu Supabase | NOT ASSESSED |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publiczny klucz klienta Supabase | NOT ASSESSED |

`NEXT_PUBLIC_*` jest dostępne w kliencie i nie może zawierać sekretu. Klucz `service_role`, hasła SMTP, tokeny dostawcy hostingu i token dostępu Supabase nie są zmiennymi runtime tej aplikacji i nie powinny trafić do pliku publicznego ani bundle'u. Jeżeli pipeline będzie zdalnie łączył/publikował migracje przez Supabase CLI, potrzebuje oddzielnego sekretu CI (zwyczajowo `SUPABASE_ACCESS_TOKEN`); jego obecność i nazwa w aktualnym środowisku nie zostały ocenione.

## Supabase, RLS i Auth

Migracje tworzą schemat, włączają RLS od początku oraz dodają polityki zależne od `household_id`, aktywnego profilu i roli administratora. RPC używane przez aplikację mają ograniczone granty; testy pgTAP sprawdzają m.in. izolację obcych gospodarstw, uprawnienia oraz atomowość operacji usuwania/przenoszenia.

Przed pierwszym release'em należy potwierdzić na właściwym projekcie hosted, poza tym repozytorium:

- zgodność historii migracji z `supabase/migrations`, po wykonaniu kopii zapasowej i z identyfikowalnym planem migracji;
- wersję PostgreSQL zgodną z lokalnym `major_version = 17`;
- RLS, granty i sygnatury RPC po zastosowaniu migracji;
- `Site URL`: `https://my.homeback.app`;
- dozwolony redirect URL co najmniej `https://my.homeback.app/auth/confirm` oraz tylko dodatkowe, świadomie zatwierdzone adresy preview/test;
- włączone potwierdzenia e-mail, produkcyjny SMTP, politykę haseł oraz limity/rate limits odpowiednie dla ruchu produkcyjnego.

Konfiguracja lokalna ma wyłącznie HTTP i redirecty `127.0.0.1`/`localhost`; nie może być traktowana jako konfiguracja produkcyjna.

## Domeny, HTTPS i sekrety

Przed publikacją właściciel musi potwierdzić rekord DNS i certyfikat TLS dla `my.homeback.app`, kanoniczne przekierowania HTTPS oraz brak skierowania ruchu aplikacji do `homeback.app`. Następnie należy przejść cały przepływ: rejestracja, e-mail potwierdzający, `/auth/confirm`, utworzenie gospodarstwa, logowanie i wylogowanie.

Kontrola sekretów powinna obejmować repozytorium, historię Git, logi CI i ustawienia dostawców. Wymagane są: najmniejsze uprawnienia, sekrety tylko w magazynie sekretów hostingu/CI, maskowanie logów, brak sekretów w artefaktach oraz procedura okresowej rotacji. Wynik `npm ci` wymaga również osobnego przeglądu 12 podatności high przed release'em.

## Proponowany pipeline CI

Nie tworzono workflow YAML. Proponowany układ to dwa niezależne joby, uruchamiane dla każdego PR i wymagane przed merge'em:

1. **Aplikacja:** `npm ci` → `git diff --check` → `npm run test:logic` → `npm run lint` → `npm run build`.
2. **Baza (izolowany runner z Dockerem):** uruchomienie lokalnego Supabase → `npx supabase db reset` → `npx supabase test db` → zatrzymanie usług. Nie należy używać w tym jobie danych ani sekretów produkcyjnych.

Job publikacyjny po zatwierdzeniu musi używać niezmiennego artefaktu builda i osobnego, chronionego środowiska. Zdalne zastosowanie migracji wymaga osobnej bramki: zatwierdzenia właściciela, aktualnej kopii zapasowej/PITR, sprawdzenia historii migracji i planu migracji kompensacyjnej. Wdrożenie aplikacji nie powinno automatycznie omijać nieudanego testu logiki ani wyniku audytu zależności.

## Rollback

### Aplikacja

1. Zatrzymać promocję nowego release'u i zachować identyfikator wadliwego artefaktu.
2. Przełączyć `my.homeback.app` na ostatni sprawdzony, niezmienny artefakt hostingu.
3. Sprawdzić HTTPS, `/login`, logowanie i odczyt danych dla konta testowego.
4. Zachować logi/incydent i zablokować kolejną promocję do czasu analizy przyczyny.

### Baza danych

Migracje są traktowane jako forward-only. Nie wolno usuwać ani zmieniać już zastosowanej migracji. Dla błędu odwracalnego należy przygotować osobną migrację kompensacyjną, przetestować ją lokalnie z pgTAP i zatwierdzić. Dla błędu utraty danych konieczne są potwierdzone backupy/PITR, właściciel procedury odtwarzania i udokumentowany dopuszczalny RPO/RTO — obecnie **NOT ASSESSED**.

## Health check po wdrożeniu

Do momentu dodania endpointu readiness minimalny check ręczny to `GET https://my.homeback.app/login` z oczekiwanym HTTPS i odpowiedzią 200 oraz kontrola logów hostingu/Supabase. Nie zastępuje on endpointu health.

Przed uruchomieniem ruchu zalecany endpoint powinien nie ujawniać sekretów ani danych użytkownika i raportować co najmniej gotowość aplikacji oraz bezpieczną dostępność wymaganej konfiguracji. Jego dodanie jest zmianą produktu/kodu poza zakresem Team D.

## Checklista publikacji

- [ ] Ustalona i przypięta wersja Node/npm; `npm ci` bez nierozwiązanych krytycznych wyników audytu.
- [ ] `git diff --check`, testy logiki, lint, build i job pgTAP są zielone w CI.
- [ ] Naprawiony i ponownie zweryfikowany nieudany test M4D.6.
- [ ] Potwierdzony projekt hosted Supabase, historia migracji, backup/PITR i plan rollbacku migracji.
- [ ] Potwierdzone RLS, granty i RPC na hosted Supabase po migracji.
- [ ] Ustawione trzy publiczne zmienne runtime dla `my.homeback.app`; żaden sekret nie trafia do `NEXT_PUBLIC_*`.
- [ ] Ustawione Site URL i allow-list redirectów Auth dla `https://my.homeback.app/auth/confirm`.
- [ ] Działają DNS, HTTPS i kanoniczny routing `my.homeback.app`; `homeback.app` nie hostuje tej aplikacji.
- [ ] Skonfigurowane produkcyjne SMTP, polityka haseł, limity Auth i rotacja sekretów.
- [ ] Dodany lub formalnie zaakceptowany zastępczy health/readiness check; wykonany smoke test po wdrożeniu.

## Blokery

1. `npm run test:logic` nie przechodzi (1/140 testów).
2. `npm ci` raportuje 12 podatności o wysokiej ważności.
3. Nie potwierdzono produkcyjnych domen, HTTPS, Site URL, redirect URL ani konfiguracji hosted Supabase.
4. Brak endpointu health/readiness.
5. Brak zweryfikowanego backupu/PITR i operacyjnej procedury rollbacku migracji.
