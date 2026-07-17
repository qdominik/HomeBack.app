# M4D.3 — atomowe odpinanie Rzeczy od lokalizacji

Status: Zaimplementowano, zweryfikowano automatycznie i zapisano jako stabilny checkpoint techniczny.

Data: 2026-07-17

## Cel

M4D.3 dodaje bezpieczną operację usuwania powiązań `item_location` ze wskazanej
Pozycji L3, Schowka L2 albo Pomieszczenia wraz z jego poddrzewem. Etap nie usuwa
Rzeczy ani elementów struktury Domu i nie dodaje jeszcze interfejsu usuwania
lokalizacji.

## Audyt przed implementacją

- `item_location.item_id` wskazuje `item.id`, a
  `item_location.storage_location_l3_id` wskazuje `storage_location_l3.id`;
- poddrzewo jest wyznaczane przez relacje L3 → L2 → Room, a
  `room.household_id` ustala gospodarstwo;
- jedna Rzecz może mieć wiele rekordów `item_location`; częściowy indeks
  ogranicza wyłącznie liczbę linków z `czy_glowna = true` do jednego i nie
  blokuje usuwania linków;
- istniejący trigger `item_location` dotyczy aktualizacji `updated_at`, nie
  operacji DELETE, a odpięcie nie aktualizuje `item.updated_at`;
- istniejąca polityka DELETE `item_location` pozwala administratorowi usuwać
  linki Rzeczy jego gospodarstwa i blokuje pozostałe role oraz obce
  gospodarstwa;
- aktywny profil i rolę administratora ustalają istniejące funkcje
  `current_household_id`, `current_profile_role` i
  `is_household_admin`;
- M4D.2 liczy osobno unikalne aktywne i archiwalne Rzeczy oraz liczbę głównych,
  dodatkowych i wszystkich linków. M4D.3 zachowuje rozróżnienie liczby
  unikalnych Rzeczy od liczby usuniętych rekordów.
## Zatwierdzona semantyka

- usuwane są wszystkie główne i dodatkowe linki znajdujące się w zakresie
  źródła;
- linki tej samej Rzeczy poza wskazanym poddrzewem pozostają bez zmian;
- operacja obejmuje aktywne i archiwalne Rzeczy;
- dane `item`, w tym status, metadane archiwizacji, kategoria i pozostałe pola,
  nie są modyfikowane;
- ponowienie operacji dla pustego zakresu kończy się sukcesem z zerowymi
  licznikami.

## Implementacja

Migracja `0010_m4d3_detach_items_from_locations.sql` dodaje trzy jawne funkcje
`security invoker`:

- `detach_items_from_room_location`;
- `detach_items_from_storage_location_l2`;
- `detach_items_from_storage_location_l3`.

Każda funkcja sprawdza uwierzytelnienie, aktywny profil administratora oraz
przynależność źródła do bieżącego gospodarstwa. Brak i obcy rekord zwracają ten
sam bezpieczny błąd `LOCATION_NOT_AVAILABLE`. Dostęp otrzymuje wyłącznie rola
`authenticated`; `PUBLIC` i `anon` są jawnie wycofane.

Usunięcie linków oraz policzenie wyniku odbywa się w jednym wywołaniu i jednej
transakcji. Błąd kasowania wycofuje całą operację i jest mapowany na bezpieczny
kod `DETACH_FAILED`.

Wynik zawiera:

- liczbę odpiętych unikalnych Rzeczy;
- liczbę usuniętych linków;
- liczbę aktywnych Rzeczy;
- liczbę archiwalnych Rzeczy.

Warstwa TypeScript udostępnia zamknięty dispatcher wybierający jedną z trzech
funkcji. Nie przyjmuje dowolnej nazwy RPC i waliduje identyfikator źródła oraz
kontrakt odpowiedzi.

## Bezpieczeństwo i model danych

Istniejące RLS `item_location` i hierarchii Domu wystarcza dla funkcji
`security invoker`; polityki nie zostały zmienione. Nie dodano tabel, kolumn,
relacji ani zależności. Nie zmieniono routingu, metod HTTP ani server actions.

## Weryfikacja

Testy pgTAP obejmują trzy poziomy źródła, linki główne i dodatkowe, aktywne i
archiwalne Rzeczy, zachowanie linków zewnętrznych, izolację gospodarstw, role,
granty, idempotencję, dokładność liczników i wycofanie całej operacji po błędzie.
Testy regresyjne potwierdzają brak zmian w M4D.2, archiwizacji, przywracaniu,
trwałym usuwaniu Rzeczy i blokadach kluczy obcych lokalizacji.

Testy logiki obejmują zamknięty wybór RPC, walidację wejścia, mapowanie wyniku,
idempotentny wynik zerowy oraz bezpieczne mapowanie błędów.
Końcowa weryfikacja checkpointu:

- Supabase stop/start: sukces;
- reset bazy i migracje 0001–0010: sukces;
- pgTAP: 387/387;
- test M4D.3: 82 asercje;
- testy logiki: 91/91;
- lint: sukces;
- build: sukces;
- git diff --check: sukces;
- ręcznego testu UI nie wykonywano, ponieważ UI nie należy do M4D.3.

## Poza zakresem

- interfejs i dialog usuwania struktury;
- przenoszenie linków M4D.4;
- usuwanie poddrzewa M4D.5+;
- zmiana statusu lub innych danych Rzeczy.
