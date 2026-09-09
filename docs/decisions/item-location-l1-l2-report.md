# Zespół A — przypisania rzeczy do L1/L2/L3

Implementacja i testy: 2026-09-08. Kontrola końcowa: 2026-09-09. Branch: `feature/item-location-l1-l2`.
Baza: `origin/main`, `7689a7b` (merge PR #61).
Worktree: `C:/Users/qdomi/AppData/Local/Temp/homeback-item-location-l1-l2`.
Właściciel przyjął implementację do przygotowania PR. Bez merge i wdrożenia produkcyjnego.

## Decyzja i migracja

Migracja: `supabase/migrations/0023_item_location_l1_l2.sql`.
Decyzja: [decision-log.md](decision-log.md), wpis z 2026-09-08.
Jedna tabela `item_location`; dokładnie jeden docelowy FK na rekord:

| Poziom | Pole | Referencja |
| --- | --- | --- |
| Pomieszczenie L1 | `room_id` | `room(id)` |
| Mebel L2 | `storage_location_l2_id` | `storage_location_l2(id)` |
| Schowek L3 | `storage_location_l3_id` | `storage_location_l3(id)` |
| Brak lokalizacji | brak rekordu | bez pustych przypisań |

Wykorzystano istniejące nazewnictwo techniczne mebla. Wszystkie trzy pola są
nullable, a CHECK `num_nonnulls(...) = 1` wymusza jeden cel. Nie przechowujemy
redundantnych rodziców; breadcrumb wynika z relacji struktury. Indeks jednej
głównej lokalizacji pozostaje. Nowe indeksy obejmują niepuste FK L1/L2.
FK nie kasują przypisań kaskadowo. Usunięcie lokalizacji z przypisaniami jest
blokowane do rozwiązania zależności przez istniejące operacje odpinania/przenoszenia.

### Zachowanie istniejących danych

Na lokalnej bazie przed migracją i po migracji było **1442** rekordów L3.
Suma kontrolna wszystkich dotychczasowych kolumn, w kolejności id, pozostała
identyczna: `7974045c9d1768d1d597b5e5b302129b`.
Migracja nie wykonuje UPDATE/DELETE danych przypisań. Zachowuje identyfikatory,
notatki, daty, cele L3 i `czy_glowna`.
Stare wywołanie `set_item_primary_location(uuid, uuid)` pozostaje zgodne przez
wrapper; nowy wariant przyjmuje jawnie cztery argumenty, bez niejednoznacznych
domyślnych parametrów przeciążenia.

## Zapis, formularz i odczyt

Akcje tworzenia/edycji odczytują wszystkie selektory, sprawdzają zgodność rodziców
i przynależność końcowego pomieszczenia do aktywnego gospodarstwa. Do RPC trafia
wyłącznie najgłębszy wybrany cel. RPC blokuje rzecz na czas operacji i ponownie
sprawdza autoryzację oraz gospodarstwo celu.
Ponowny zapis tego samego celu zachowuje rekord; wybór istniejącego dodatkowego
przypisania promuje je bez utraty id/notatki ani tworzenia kolejnej kopii.
Zmiana usuwa poprzednie główne przypisanie. Dodatkowe przypisania pozostają.

Formularz nie wymaga schowka: L1 wystarcza, L2/L3 są opcjonalne. Zmiana rodzica
czyści wybory dzieci, a pusty wybór pomieszczenia czyści główne przypisanie.
Edycja odtwarza pełny wybór rodziców dla każdego poziomu. Zachowano istniejący
układ, style i selektory mobilne. Sprawdzono zrzut karty edycji L2 przy 390 px.

Lista, fokus rzeczy, widok Bez lokalizacji, adapter Dashboardu i globalne
wyszukiwanie obsługują L1/L2/L3. Poprawne główne przypisanie ma pierwszeństwo;
bez niego wybierany jest poprawny dodatkowy cel o najmniejszym UUID, następnie
poziomie i id przypisania. Cała ścieżka musi należeć do odczytanego gospodarstwa.
Przykłady w wyszukiwarce: `Salon`, `Salon → Komoda`, `Salon → Komoda → Szuflada`,
`Brak lokalizacji`. Ranking, miniatury i istniejące linki są zachowane.
Rzecz z dodatkowym przypisaniem poza usuwanym poddrzewem nie jest błędnie
klasyfikowana jako pozbawiona lokalizacji.

## Integralność, struktura i RLS

Zmiana tabeli dotyczy wyłącznie `item_location`. Tabele `room`,
`storage_location_l2` i `storage_location_l3` pozostają bez zmian.
Dwie polityki item_location INSERT/UPDATE dopuszczają każdy z trzech celów
wyłącznie w gospodarstwie administratora. SELECT/DELETE i polityki struktury
pozostają. Nowy RPC jest `security invoker`, z pustym search_path i bez uprawnień
PUBLIC/anon; nie używa service role.

Rozszerzono podsumowania zależności pomieszczenia i mebla, odpinanie poddrzewa
oraz masowe przenoszenie głównych przypisań. Obejmują L1/L2/L3 i rzeczy archiwalne.
Istniejące RPC usuwania korzystają z tych funkcji bez zmiany publicznego kontraktu.
Rzecz przypisana bezpośrednio i zagnieżdżona w tym samym poddrzewie jest liczona
raz jako bezpośrednia; licznik linków nadal obejmuje wszystkie przypisania.

## Weryfikacja

| Kontrola | Wynik końcowy |
| --- | --- |
| `supabase migration up --local` | PASS; migracja 0023 zastosowana lokalnie |
| Zachowanie starych danych | PASS; 1442 rekordy, identyczna suma kontrolna |
| `supabase test db --local` | PASS; 20 plików, 975 testów, w tym 96 nowych |
| Baza/RLS na zdalnym Preview | PASS; te same 20 plików / 975 asercji przez `supabase db query --linked --file` |
| `npm run test:logic` | PASS; 322/322 |
| `npm run lint` | PASS |
| `npm run build` | PASS; Next.js 16.3.2, Turbopack |
| `npm run test:e2e` | PASS; 27 zaliczonych, 2 istniejące pominięte, 0 błędów (2,2 min) |
| `git diff --check` | PASS |

pgTAP obejmuje nullable FK, CHECK, brak rekordu, brakujący cel, odrzucanie wielu
celów, przejścia i idempotencję, promocję dodatkowego przypisania, blokadę dwóch
głównych, RLS INSERT/UPDATE i RPC na wszystkich poziomach, role, obce gospodarstwo,
zmianę rodziców struktury, liczniki, odpinanie, przenoszenie i usuwanie poddrzewa.
Testy działają w transakcjach zakończonych rollbackiem.

Nowy E2E sprawdza mobile, tworzenie na trzech poziomach i bez lokalizacji,
otwieranie po odświeżeniu, L1 → L2 → L3 → L1 → brak, breadcrumb wyszukiwarki,
widok Bez lokalizacji i izolację drugiego gospodarstwa. Stary test odpinania mebla
zaktualizowano, aby uwzględniał zachowane dodatkowe przypisanie poza meblem.

## Ograniczenia i odbiór

- Finalny przegląd migracji i diffu wykonano przed commitem; właściciel upoważnił
  do commita, push i PR do main. Migracja 0023 jest także zastosowana na Preview.
- Nie resetowano Supabase ani nie uruchamiano/zatrzymywano Docker. Sprawdzono
  aktualizację istniejącej bazy i pełną paczkę pgTAP; nie wykonywano resetu od zera.
- Czyszczenie formularza dotyczy głównego przypisania zgodnie z dotychczasowym RPC;
  zachowane dodatkowe przypisania nadal są prezentowane. Formularz nie zarządza
  listą dodatkowych przypisań.
- Istniejący dialog kopiowania nadal zapisuje wybrany schowek L3 albo brak
  lokalizacji; jego rozszerzenie na cele L1/L2 nie należało do zadania dodawania/edycji.
  Poprawiono odtwarzanie rodziców źródła L1/L2 w tym dialogu.
- Dwa istniejące testy E2E ról domownik/dziecko są pomijane przez repozytorium
  z powodu braku zatwierdzonego fixture przeglądarkowego; te role obejmuje pgTAP.
- Początkowe próby wykryły niedostępny dla Turbopack junction node_modules,
  nieodpowiedni dla generatora danych tryb produkcyjny E2E oraz brak przekazania
  L1/L2 do formularza edycji. Naprawiono środowisko/implementację i ponowiono kontrole.

## Migracja na zdalnym Preview — 2026-09-09

Cel zweryfikowany przez `supabase projects list`: **homeback-preview**,
ref `yzewupqxkefyvljnfolk` (osobny od homeback-production). Izolowany worktree
powiązano poleceniem `supabase link --project-ref yzewupqxkefyvljnfolk`;
nie zmieniano `supabase/config.toml`, zmiennych Vercel ani kluczy środowiskowych.

Historia Preview miała migracje do 0022 z wcześniejszym brakiem 0018
(`rename_winter_clothes_category`). Zwykły `db push --dry-run` wykrył tę lukę.
0018 nie jest zależnością 0023 i nie została zastosowana ani oznaczona jako wykonana.
Zastosowano **wyłącznie dokładną treść 0023** przez
`supabase db query --linked --file supabase/.temp/preview-0023.sql`.
Pomocniczy, ignorowany plik opakował SQL w jedną transakcję: timeout blokady 10 s,
LOCK item_location, tymczasowy snapshot, DDL/RPC/RLS, porównanie każdego starego
rekordu i dopiero zapis wersji 0023 w `supabase_migrations.schema_migrations`.
Niepowodzenie porównania wycofałoby także DDL i zapis historii.

Niezależny odczyt po COMMIT potwierdził wersję 0023, CHECK dokładnie jednego celu,
RPC security invoker i zgodność źródła migracji (MD5 po normalizacji CRLF:
`00b816f830e5ee4abf2f471f77a85080`). Wszystkie **25 istniejących rekordów Preview**
pozostało bez zmian: suma starych kolumn przed/po
`e4d6d69ef7ef1d5d8d624a50708d323a`. To osobny dowód od lokalnych 1442 rekordów.

Runner `supabase test db --linked` nie uruchomił asercji z powodu niewidocznej
funkcji pgTAP `plan(integer)` w jego sesji. Następnie wszystkie **20 oryginalnych
plików testowych (975 asercji)** wykonano bez zmian przez Management API
(`supabase db query --linked --file <test>`), kontrolując kod wyjścia i wynik
`finish()` każdego pliku. Wszystkie przeszły, w tym 96 nowych testów L1/L2/L3/RLS.
Każdy plik kończy się ROLLBACK; fixture i tymczasowe rozszerzenie nie zostają w bazie.

Vercel/GitHub CI nie stosuje migracji Supabase automatycznie. Wdrożenie kodu
brancha korzysta z oddzielnie przygotowanej bazy Preview; samo READY w Vercel
nie było traktowane jako dowód zastosowania migracji.

## Pliki

- `supabase/migrations/0023_item_location_l1_l2.sql`
- `supabase/tests/0025_item_location_l1_l2.test.sql`
- `src/types/database.ts`
- `src/app/(app)/items/actions.ts`
- `src/app/(app)/items/page.tsx`
- `src/components/items/item-card.tsx`
- `src/components/items/item-form.tsx`
- `src/components/items/item-location-field.tsx`
- `src/components/items/copy-item-dialog.tsx`
- `src/lib/items/item-options.ts`
- `src/lib/global-search/load-sources.ts`
- `src/lib/global-search/search.ts`
- `src/lib/home/location-dependency-summary.ts`
- `src/lib/i18n/locales/pl.ts`, `src/lib/i18n/locales/en.ts`
- `tests/unit/item-location-options.test.ts`
- `tests/unit/global-search.test.ts`
- `tests/unit/location-dependency-summary.test.ts`
- `tests/e2e/dashboard-item-search.spec.ts`
- `tests/e2e/m4d8-location-lifecycle.spec.ts`
- `docs/decisions/decision-log.md`
- `docs/decisions/item-location-l1-l2-report.md`

Zgodność z MVP: Inventory, Structure, Dashboard; bez nowych modułów, zależności,
tras ani zmian konfiguracji/kluczy Supabase. Plik .env.local w worktree zawiera
wyłącznie lokalny adres i istniejący publiczny klucz na potrzeby testów; jest ignorowany.
