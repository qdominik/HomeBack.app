# HomeBack.app — kompletna ocena gotowości produkcyjnej

**Stan raportu:** 2026-07-25, po odbiorze gałęzi `main` na commicie `31a088436f07d464e0b589cb687ddae527c6acd7`.

**Zakres:** aplikacja pod `my.homeback.app`. `homeback.app` jest przyszłą, odrębną stroną marketingową poza tym repozytorium. Ocena opiera się wyłącznie na wersjonowanym repozytorium i potwierdzonym odbiorze lokalnym; nie obejmuje paneli Vercel, hosted Supabase, GitHub Secrets ani plików właścicielskich wyłączonych z zakresu.

## Werdykt produkcyjny: BLOCKED · status dokumentu: READY FOR PR

Techniczne bramki aplikacji potwierdzone dla wskazanego commita są zielone: `test:logic` **140/140 PASS**, lint **PASS**, build **PASS** i `git diff --check` **PASS**. Raport nie jest jednak gotowy do promowania jako pełny plan produkcyjny bez decyzji dotyczących CI, preview, hostingu, danych i bezpieczeństwa. Dane nieweryfikowalne poza repozytorium są celowo oznaczone jako `NOT ASSESSED`, a nie jako `READY`.

### Słownik statusów

- `READY` — jest aktualny dowód i nie wymaga dodatkowej decyzji przed wskazaną bramką.
- `PARTIAL` — część dowodu lub procesu istnieje, lecz wymaga zamknięcia działania.
- `BLOCKED` — brakuje wymaganego mechanizmu lub decyzji; promocja nie może przejść bramki.
- `NOT ASSESSED` — wymaga danych z Vercel, hosted Supabase, GitHub lub ręcznej kontroli właściciela, których nie odczytywano.

## Macierz gotowości

| Obszar | Status | Dowód | Ryzyko | Wymagane działanie | Właściciel | Bramka |
| --- | --- | --- | --- | --- | --- | --- |
| Runtime Node/npm | PARTIAL | Odbiór lokalny: Node 24.18.0, npm 11.16.0; brak `engines` i `.nvmrc`. | Niejednakowe buildy. | Przypiąć Node 24.18.0 (lub zatwierdzony patch 24.x) w `.nvmrc` i `engines`. | Platforma | przed CI |
| Deterministyczny `npm ci` | PARTIAL | `package-lock.json` v3; snapshot audytu z 2026-07-25 zgłosił 12 high. | Nierozwiązane CVE lub dryf zależności. | Powtórzyć audit w CI, przeprowadzić triage. | Security + aplikacja | przed CI |
| Testy logic | READY | Odbiór `main` dla `31a0884`: 140/140 PASS. | Regresja przy zmianie kodu. | Wymagany status check. | Aplikacja | przed CI |
| Lint | READY | Odbiór `main` dla `31a0884`: PASS. | Błędy statyczne. | Wymagany status check. | Aplikacja | przed CI |
| Build produkcyjny | READY | Odbiór `main` dla `31a0884`: `next build` PASS. | Artefakt niezgodny z runtime. | Budować z przypiętym Node. | Platforma | przed CI |
| pgTAP | READY | Udokumentowany lokalny wynik z 2026-07-25: 15 plików, 644 testy PASS. | Brak ciągłego potwierdzenia RLS/RPC. | Uruchamiać w izolowanym CI. | Team A + CI | przed CI |
| `git diff --check` | READY | Odbiór `main` dla `31a0884`: PASS. | Błędy whitespace w zmianie. | Wymagany status check. | CI | przed CI |
| GitHub Actions | NOT ASSESSED | Nie odczytywano workflow ani ustawień GitHub. | Brak automatycznej walidacji. | Właściciel potwierdza workflow i logi. | Platforma | przed CI |
| Ochrona `main` | NOT ASSESSED | Brak dostępu do branch protection. | Merge z czerwonym CI. | Wymagać checks i review przed merge. | Repo owner | przed CI |
| Secret scanning | PARTIAL | `.env*` jest ignorowane; brak oceny historii i CI. | Wyciek sekretów. | Dodać skan repo/historii/PR i proces rotacji. | Security | przed CI |
| Vercel production | NOT ASSESSED | Panel i ustawienia poza zakresem. | Zły runtime, domena lub zmienne. | Zweryfikować projekt, runtime i immutable deployment. | Platforma | przed production |
| Vercel preview | NOT ASSESSED | Brak danych preview. | Preview korzysta z produkcyjnych danych. | Zdefiniować osobny URL, dane i retencję preview. | Platforma + produkt | przed preview |
| Hosted Supabase | NOT ASSESSED | Nie odczytywano projektu hosted. | Rozjazd schematu i konfiguracji. | Ręcznie potwierdzić projekt, region i historię migracji. | Team A + DBA | przed production |
| Migracje produkcyjne | PARTIAL | 13 sekwencyjnych migracji w repozytorium; brak procedury hosted. | Nieodwracalna zmiana danych. | Zatwierdzić procedurę backup → plan → apply → verify. | Team A + DBA | przed production |
| RLS/RPC/granty | PARTIAL | RLS na 10 tabelach, ograniczone granty RPC i pgTAP. | Przekroczenie granic `household_id`. | Potwierdzić stan hosted po migracji. | Team A | przed production |
| Auth Site URL | NOT ASSESSED | Kod używa `NEXT_PUBLIC_SITE_URL`; hosted config poza zakresem. | Błędne linki e-mail. | Ustawić `https://my.homeback.app`. | Auth owner | przed production |
| Auth redirect allow-list | NOT ASSESSED | Lokalna allow-list jest wersjonowana; hosted nie. | Open redirect lub zablokowany signup. | Dopuścić tylko local, jawne preview i production `/auth/confirm`. | Auth owner | przed preview |
| SMTP i limity Auth | NOT ASSESSED | Konfiguracja hosted poza zakresem. | Nieskuteczne lub nadużywalne logowanie. | Zweryfikować SMTP, confirmation, password policy i rate limits. | Auth owner | przed production |
| Supabase Storage | BLOCKED | Brak produkcyjnego kontraktu bucketów i polityk. | Publiczne lub międzygospodarstwowe pliki. | Zdefiniować prywatne buckety, RLS, MIME, limity i retencję. | Team A + Security | przed preview |
| Cookies | BLOCKED | Brak wersjonowanej polityki środowiskowej. | Sesja narażona na przejęcie lub błędny zakres. | Ustalić Secure, HttpOnly, SameSite i domain per środowisko. | Auth owner | przed preview |
| CORS | BLOCKED | Brak macierzy originów. | Wildcard lub odcięcie legalnego klienta. | Zdefiniować local/preview/production bez wildcard dla endpointów wrażliwych. | Platforma + Auth owner | przed preview |
| DNS/TLS `homeback.app` | NOT ASSESSED | Domena marketingowa poza repozytorium. | Kolizja routingu lub certyfikatu. | Potwierdzić niezależny marketingowy routing i TLS. | Domain owner | przed production |
| DNS/TLS `my.homeback.app` | NOT ASSESSED | Brak dostępu do DNS/Vercel. | Niedostępna lub niebezpieczna aplikacja. | Potwierdzić DNS, TLS i canonical HTTPS. | Domain owner + Platforma | przed production |
| Backup/PITR | NOT ASSESSED | Hosted Supabase poza zakresem. | Utrata danych. | Potwierdzić backup, PITR i test odtworzenia. | DBA | przed production |
| RPO/RTO | BLOCKED | Nie ma zatwierdzonych wartości. | Nieakceptowalny czas lub zakres utraty danych. | Właściciel produktu zatwierdza RPO/RTO. | Produkt + DBA | przed production |
| Rollback aplikacji | PARTIAL | Opisano powrót do poprzedniego immutable artefaktu. | Długi incydent po release. | Zweryfikować rollback na dostawcy hostingu. | Platforma | przed production |
| Migracje kompensacyjne | PARTIAL | Podejście forward-only opisane; brak runbooka. | Nieudana migracja bez bezpiecznej korekty. | Zatwierdzić template i ownera migracji kompensacyjnej. | Team A + DBA | przed production |
| Health/readiness check | BLOCKED | Nie ma endpointu readiness; `/login` jest tylko manualnym smoke checkiem. | Fałszywie udane wdrożenie. | Zaprojektować minimalny, niesekretny readiness check. | Aplikacja + Platforma | przed production |
| Smoke test po wdrożeniu | BLOCKED | Brak zatwierdzonego scenariusza i konta testowego. | Promocja niedziałającego release'u. | Zdefiniować HTTPS, login i odczyt kontrolny bez danych produkcyjnych. | QA + Produkt | przed production |
| Monitoring i logi | NOT ASSESSED | Vercel i hosted Supabase poza zakresem. | Brak wykrycia incydentu. | Potwierdzić retencję, alerty i dostęp ownerów. | Platforma + Security | przed production |

**Suma:** READY **5**, PARTIAL **7**, BLOCKED **6**, NOT ASSESSED **12**.

## Środowiska i izolacja danych

| Środowisko | URL | Źródło danych / Supabase | Zmienne i redirect URLs | Izolacja i czas życia | Właściciel |
| --- | --- | --- | --- | --- | --- |
| Local | `http://127.0.0.1:3000` | Lokalny Supabase z migracjami; nie jest hosted. | Trzy `NEXT_PUBLIC_*`; redirecty tylko localhost/127.0.0.1. | Dane lokalne, usuwalne przez właściciela; bez danych produkcyjnych. | Developer + Team A |
| Preview | **NOT ASSESSED** — do decyzji | Osobny projekt Supabase albo równoważna, udokumentowana izolacja. | Dedykowany preview origin i wyłącznie jawne redirect URLs. | Zakaz danych produkcyjnych użytkowników; określona retencja i usuwanie środowiska. | Platforma + Produkt + Team A |
| Production | `https://my.homeback.app` | Właściwy hosted Supabase — szczegóły nieocenione. | `NEXT_PUBLIC_SITE_URL=https://my.homeback.app`; tylko produkcyjne Auth redirects. | Trwałe dane, backup/PITR i kontrola dostępu. | Platforma + DBA + Auth owner |

## Zmienne środowiskowe

Nazwy używane przez aplikację, bez wartości:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`NEXT_PUBLIC_*` nie może zawierać sekretu. Potencjalny sekret CI do zdalnej administracji Supabase (np. `SUPABASE_ACCESS_TOKEN`) nie jest zmienną runtime aplikacji i jego istnienie jest `NOT ASSESSED`.

## Storage, cookies i CORS — wymagania do decyzji

### Storage

Przed preview należy przyjąć prywatne buckety, polityki RLS zależne od gospodarstwa, allow-list MIME i limit wielkości. Kontrakt musi obejmować retencję/usuwanie, przyszłe ryzyko skanowania plików oraz testy, że użytkownik nie odczyta pliku innego `household_id`.

### Cookies

Production i preview wymagają `Secure`, `HttpOnly`, świadomej wartości `SameSite` oraz minimalnego zakresu domeny. Local używa HTTP i nie może być utożsamiany z polityką produkcyjną. Właściciel Auth musi potwierdzić faktyczne atrybuty cookies po wdrożeniu.

### CORS

Allow-list musi być osobna dla local, preview i production. Wrażliwe endpointy nie mogą używać wildcard origin ani luźnych reguł z credentials. Właściciel Platformy i Auth potwierdza konfigurację w usługach hosted.

## Projekt CI — bez YAML

**Runner:** `ubuntu-24.04`, zamiast ruchomego `ubuntu-latest`, aby ograniczyć dryf obrazu. **Runtime:** Node `24.18.0`, przypięty w przyszłym zadaniu przez `.nvmrc` i `engines`; nie jest to zmiana w tym raporcie.

Kolejność joba aplikacji:

1. checkout;
2. setup Node 24.18.0;
3. cache npm kluczowany hashem `package-lock.json`;
4. `npm ci`;
5. `git diff --check`;
6. `npm run test:logic`;
7. `npm run lint`;
8. `npm run build`.

Osobny job bazy uruchamia Docker i lokalny Supabase **wyłącznie w efemerycznym runnerze**, wykonuje readiness check, następnie `supabase test db`. `supabase db reset` jest dozwolony tylko w takim runnerze i nigdy wobec local współdzielonego ani hosted. Job ma timeout całkowity, osobny timeout startu Supabase, jeden retry wyłącznie dla błędu infrastruktury oraz artefakty logów Supabase/Playwright przy błędzie.

`main` ma wymagać zielonych status checks obu jobów i review przed merge. Promotion nie może pomijać czerwonego testu, audytu bezpieczeństwa ani bramki migracji.

## Podatności zależności

Informacja o **12 podatnościach high** pochodzi ze snapshotu `npm ci` z 2026-07-25, dotyczącego zależności z lockfile. Liczba wymaga ponownej weryfikacji w CI przed decyzją. Właściciel: Security wraz z właścicielem aplikacji. Termin decyzji: przed wdrożeniem CI na chronionym `main`.

Triage: zidentyfikować zależność bezpośrednią/przechodnią, ekspozycję runtime, dostępny upgrade i testy regresji. Akceptacja ryzyka wymaga pisemnego ownera, terminu wygaśnięcia i uzasadnienia braku ekspozycji. Zakazane jest automatyczne `npm audit fix` bez przeglądu diffu, lockfile i pełnej walidacji.

## Blokery i bramki publikacyjne

### A. Przed CI

- [ ] Przypięcie Node/npm i cache lockfile — **Platforma**.
- [ ] Workflow, Docker runner, timeouty, artefakty i wymagane checks — **Platforma**.
- [ ] Ochrona `main` i blokada merge przy czerwonym CI — **Repo owner**.
- [ ] Triage audytu zależności oraz secret scanning — **Security**.

### B. Przed preview

- [ ] Kontrakt preview: URL, oddzielny/izolowany Supabase, retencja i brak danych produkcyjnych — **Platforma + Produkt + Team A**.
- [ ] Auth redirects, cookies i CORS dla preview — **Auth owner + Platforma**.
- [ ] Storage: prywatne buckety, RLS, MIME, limity i test izolacji gospodarstw — **Team A + Security**.

### C. Przed production

- [ ] Vercel runtime/artefakt, `my.homeback.app`, DNS/TLS i canonical HTTPS — **Platforma + Domain owner**.
- [ ] Hosted Supabase, Site URL, redirects, SMTP, limity Auth, RLS/RPC/granty — **Team A + Auth owner**.
- [ ] Backup/PITR, RPO/RTO, migracje kompensacyjne i rollback — **DBA + Produkt + Team A**.
- [ ] Health check, smoke test, monitoring i alerty — **Aplikacja + QA + Platforma**.

### D. Kryteria przerwania deployu

Przerwać promocję, gdy którekolwiek wymagane checki CI jest czerwone, stan migracji różni się od zatwierdzonego planu, backup/PITR nie jest potwierdzony, smoke test nie przechodzi, readiness jest niezdrowy, domena/TLS/Auth redirect różnią się od zatwierdzonej wartości lub Security nie zaakceptował ryzyka. Właściciel decyzji stop: **release owner**; owner obszaru usuwa przyczynę.

### E. Kryteria rollbacku

Rollback aplikacji inicjuje **release owner** przy błędzie health/smoke, wzroście błędów krytycznych lub naruszeniu bezpieczeństwa; powrót wyłącznie do poprzedniego immutable artefaktu. Dla danych **DBA + Team A** stosują zatwierdzoną migrację kompensacyjną; odtwarzanie PITR wymaga decyzji incident ownera i jest rejestrowane.

### F. Promocja preview → production

Wymaga zielonych CI, zatwierdzonego owner review, izolowanego preview, pozytywnego smoke testu, zamkniętego triage podatności, potwierdzonych domen/Auth/Storage oraz backupu przed migracją. Właściciel promocji: **release owner**.

## Dane wymagane od usług zewnętrznych

### Vercel

- runtime Node, build command i cache;
- production/preview environment variables bez wartości;
- przypisanie domen, TLS i redirect policy;
- immutable artefakty, retencja deploymentów i rollback;
- logi, alerty i dostęp ownerów.

### Hosted Supabase

- project/ref, region, PostgreSQL i historia migracji;
- Site URL, redirect allow-list, SMTP, confirmation, limity i cookies;
- RLS, RPC, granty oraz Storage buckets/policies;
- backup/PITR, RPO/RTO, monitoring/logi i retencja.

## Osobne następne zadania — bez implementacji w tym branchu

1. **CI foundation** — Platforma: workflow, Ubuntu 24.04, Node 24.18.0, cache, Docker, timeouty i branch protection.
2. **Secret scanning** — Security: skan repozytorium, historii i PR oraz rotacja.
3. **Preview deployment contract** — Platforma + Produkt + Team A: izolacja danych i URL/Auth.
4. **Hosted Supabase migration procedure** — Team A + DBA: backup, plan, apply, verify i compensating migration.
5. **Health/readiness i smoke test** — Aplikacja + QA + Platforma.
6. **Rollback procedure** — Platforma + DBA + release owner.
7. **Final production checklist** — release owner po uzyskaniu danych z Vercel i hosted Supabase.

## Rekomendowana kolejność

CI foundation → secret scanning i triage zależności → preview contract (Storage/cookies/CORS/Auth) → hosted migration/backup procedure → health/smoke/monitoring → final production checklist i ręczny odbiór ownera.