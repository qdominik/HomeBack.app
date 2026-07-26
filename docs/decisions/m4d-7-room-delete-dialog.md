# M4D.7 - bezpieczne usuwanie Pomieszczenia wraz z poddrzewem

Status: Zaimplementowano i zweryfikowano automatycznie; oczekuje na ręczny odbiór.

Data: 2026-07-26

## 1. Cel

M4D.7 zastępuje bezpośrednie usuwanie pustego Pomieszczenia dialogiem, który
pokazuje zależności całego poddrzewa. Administrator może usunąć pustą strukturę,
odpiąć wszystkie linki Rzeczy albo przenieść ich główne lokalizacje do jednego
Schowka w innym Pomieszczeniu. Rekordy Rzeczy nigdy nie są usuwane.

## 2. Stan bazowy

- M4D.2 dostarcza podsumowanie zależności Pomieszczenia;
- M4D.3 odpina główne i dodatkowe linki z poddrzewa Pomieszczenia;
- M4D.4 przenosi główne linki do jednego Schowka docelowego;
- M4D.5 i M4D.6 dostarczają wzorzec zamkniętych trybów, atomowej RPC i dialogu.

Sygnatury i semantyka istniejących RPC nie zostały zmienione.

## 3. Sygnatura RPC

Migracja `0014_m4d7_delete_room_with_resolution.sql` dodaje:

`delete_room_with_resolution(p_room_id uuid, p_resolution text, p_target_storage_location_l3_id uuid, p_expected_storage_location_l2_count bigint, p_expected_storage_location_l3_count bigint, p_expected_distinct_item_count bigint, p_expected_location_link_count bigint)`

## 4. Tryby

- `delete`: dozwolony bez linków Rzeczy; usuwa także dowolną liczbę pustych
  Mebli i Schowków;
- `detach`: wywołuje M4D.3, pozostawia Rzeczy i linki poza poddrzewem;
- `move`: wywołuje M4D.4, następnie M4D.3 dla pozostałych linków źródłowych.

Cel jest wymagany wyłącznie dla `move`. Musi być Schowkiem w aktywnym
gospodarstwie, poza usuwanym Pomieszczeniem.

## 5. Snapshot zależności

Dialog zapamiętuje liczby Mebli L2, Schowków L3, unikalnych Rzeczy i wszystkich
linków `item_location`. Finalna RPC ponownie oblicza te wartości przed mutacją.
Zmiana pustej części struktury jest częścią snapshotu i zwraca
`DEPENDENCIES_CHANGED`.

## 6. Blokady i współbieżność

Po autoryzacji źródłowy rekord `room` jest blokowany przez `FOR UPDATE`.
Blokowane są również wszystkie istniejące rekordy L2 w poddrzewie. Blokada
Pomieszczenia chroni przed równoległym dodaniem nowego Mebla przez FK, a blokady
L2 przed dodaniem nowego Schowka do istniejącego Mebla między snapshotem i
usunięciem. Nie dodano blokad tabel ani nie zmieniono poziomu izolacji.

## 7. Atomowość i kolejność

Rozstrzygnięcie linków oraz jawne usunięcie L3, L2 i `room` odbywa się w jednym
wywołaniu PostgreSQL. Dla `move` kolejność to: move głównych linków, detach
pozostałych linków źródłowych, delete L3, delete L2, delete room. Błąd dowolnego
etapu wycofuje całą operację.

## 8. Autoryzacja i izolacja

Operacja wymaga sesji, aktywnego profilu administratora i potwierdzenia
`is_household_admin`. `household_id` pochodzi wyłącznie z aktywnego profilu.
Źródło i cel są weryfikowane w tym gospodarstwie. RPC działa jako
`security invoker`, ma pusty `search_path`, nie używa service role ani
dynamicznego SQL. EXECUTE otrzymuje wyłącznie `authenticated`.

## 9. Server actions i UI

`getRoomDeletionContext` pobiera podsumowanie i zewnętrzne cele dopiero po
otwarciu dialogu. `deleteRoomWithResolution` waliduje zamknięty kontrakt,
wywołuje jedną finalną RPC i odświeża `/home` oraz `/items`.

Natywny `<dialog>` pokazuje ścieżkę Pomieszczenia i wszystkie liczniki. Pusta
struktura przechodzi bezpośrednio do potwierdzenia. Gdy istnieją Rzeczy, decyzja
`move` albo `detach` i cel nie są wybierane automatycznie. Dialog blokuje
podwójny submit, obsługuje `DEPENDENCIES_CHANGED`, Escape i przywracanie focusu.

## 10. i18n

Wszystkie nowe teksty mają wpisy PL i EN w lokalnym słowniku. Dane użytkownika,
w tym nazwy Pomieszczeń, Mebli i Schowków, nie są tłumaczone.

## 11. Weryfikacja automatyczna

- `git diff --check`: bez błędów;
- `npm.cmd run test:logic`: 151/151 testów zaliczonych;
- `npm.cmd run lint`: bez błędów;
- `npm.cmd run build`: Next.js 16.2.10, build produkcyjny zaliczony;
- `npx.cmd supabase test db`: 16 plików, 725 testów, PASS.

Nowy plik pgTAP M4D.7 zawiera 81 asercji. Pokrywa schemat i granty, role, RLS,
trzy tryby, snapshot, aktywne i archiwalne Rzeczy, dokładne liczniki oraz
rollback błędów L3, L2 i `room`.

## 12. Ręczny odbiór

1. Anuluj i usuń całkowicie puste Pomieszczenie.
2. Usuń Pomieszczenie zawierające kilka pustych Mebli i Schowków.
3. Sprawdź `detach` dla aktywnej i archiwalnej Rzeczy oraz linków dodatkowych.
4. Sprawdź `move` do Schowka w innym Pomieszczeniu, także z istniejącym linkiem
   dodatkowym celu.
5. Sprawdź brak dostępnego celu, zmianę zależności w drugim oknie, Escape,
   focus, podwójny submit i szerokość 375 px.

## 13. Poza zakresem

- M4D.8 i nowe filtry;
- zmiany RLS, tabel, pól, relacji albo kaskad FK;
- wiele celów, przenoszenie dodatkowych linków do celu i sztuczna lokalizacja;
- M4B, M4C, AI, QR/NFC, zdjęcia i indywidualne ikony Rzeczy.
