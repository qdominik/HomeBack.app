# M4D.6 - bezpieczne usuwanie Mebla wraz ze Schowkami

Status: Zaimplementowano technicznie i zweryfikowano automatycznie; oczekuje na ręczny odbiór.

Data: 2026-07-19

## 1. Cel

M4D.6 zastępuje bezpośrednie usuwanie Mebla dialogiem, który przed mutacją
pokazuje zależności całego poddrzewa. Administrator może usunąć pusty Mebel,
odpiąć wszystkie Rzeczy albo przenieść ich główne lokalizacje do jednego
zewnętrznego Schowka. Rekordy Rzeczy nigdy nie są usuwane razem ze strukturą.

## 2. Terminologia Mebel i Schowek

Widoczny poziom L2 to Mebel (EN: Furniture item), a poziom L3 to Schowek
(EN: Storage space). Techniczne nazwy `storage_location_l2`,
`storage_location_l3` oraz typ źródła `storage` pozostają bez zmian.

## 3. Stan bazowy M4D.2-M4D.5

- M4D.2 dostarcza odczytowe podsumowanie zależności Mebla;
- M4D.3 odpina główne i dodatkowe linki z poddrzewa;
- M4D.4 przenosi główne linki do jednego Schowka docelowego;
- M4D.5 dostarcza wzorzec zamkniętych trybów, atomowej RPC i dialogu.

Sygnatury i semantyka stabilnych RPC M4D.2-M4D.5 nie zostały zmienione.

## 4. Sygnatura RPC

Migracja `0013_m4d6_delete_furniture_with_resolution.sql` dodaje:

`delete_storage_location_l2_with_resolution(p_storage_location_l2_id uuid, p_resolution text, p_target_storage_location_l3_id uuid, p_expected_storage_location_l3_count bigint, p_expected_distinct_item_count bigint, p_expected_location_link_count bigint)`

## 5. Tryby delete, detach i move

- `delete`: dozwolony bez linków Rzeczy; usuwa także dowolną liczbę pustych
  Schowków;
- `detach`: wywołuje M4D.3, pozostawia Rzeczy i linki poza poddrzewem;
- `move`: wywołuje M4D.4, następnie M4D.3 dla pozostałych linków źródła.

Cel jest wymagany wyłącznie dla `move` i musi znajdować się poza usuwanym
Meblem, ale w aktywnym gospodarstwie.

## 6. Snapshot zależności

Dialog zapamiętuje liczbę Schowków L3, unikalnych Rzeczy i wszystkich linków
`item_location`. Finalna RPC ponownie oblicza te trzy wartości przed mutacją.
Zmiana liczby pustych Schowków jest częścią snapshotu.

## 7. DEPENDENCIES_CHANGED

Każda różnica snapshotu kończy operację kodem `DEPENDENCIES_CHANGED` przed
mutacją. Dialog pozostaje otwarty, czyści decyzję i cel oraz wymaga jawnego
odświeżenia podsumowania. Nie wykonuje automatycznej drugiej próby.

## 8. Blokady i współbieżność

Po autoryzacji źródłowy rekord `storage_location_l2` jest blokowany przez
`FOR UPDATE` przed finalnym snapshotem. Blokada chroni także przed dodaniem
nowego Schowka przez klucz obcy pomiędzy weryfikacją i usunięciem. Nie dodano
blokad tabel ani nie zmieniono globalnego poziomu izolacji.

## 9. Atomowość

Rozstrzygnięcie linków, jawne usunięcie Schowków i usunięcie Mebla odbywają
się w jednym wywołaniu PostgreSQL i jednej transakcji. Błąd dowolnego etapu
wycofuje wszystkie zmiany.

## 10. Kolejność mutacji

Dla `move` obowiązuje kolejność: move głównych linków -> detach pozostałych
linków źródłowych -> delete L3 -> delete L2. Dla `detach` pomijany jest move,
a dla `delete` oba etapy rozstrzygania linków są pomijane.

## 11. Kontrakt sukcesu

RPC zwraca status, tryb, ID usuniętego Mebla oraz liczniki usuniętych Schowków,
dotkniętych Rzeczy aktywnych i archiwalnych, przeniesionych Rzeczy, odpiętych
linków, ponownie użytych i utworzonych linków celu oraz usuniętych linków
źródłowych. Nie zwraca `household_id` ani danych Rzeczy.

## 12. Autoryzacja

Operacja wymaga sesji, aktywnego profilu administratora i potwierdzenia
`is_household_admin`. Gospodarstwo pochodzi z aktywnego profilu. Źródło i cel
są weryfikowane w tym gospodarstwie, bez `household_id` z klienta i bez service
role.

## 13. Granty

RPC działa jako `security invoker` z pustym `search_path`. `PUBLIC` i `anon`
nie mają prawa EXECUTE; prawo otrzymuje wyłącznie `authenticated`.

## 14. Server actions

- `getStorageLocationL2DeletionContext` pobiera podsumowanie M4D.2 i cele
  dopiero po otwarciu dialogu;
- `deleteStorageLocationL2WithResolution` waliduje wejście, wywołuje dokładnie
  jedną finalną RPC M4D.6 i odświeża `/home` oraz `/items`.

Stara bezpośrednia akcja usuwania L2 została usunięta z aktualnej ścieżki UI.

## 15. Dialog

Natywny `<dialog>` pokazuje ścieżkę Mebla i wszystkie liczniki. Pusty Mebel
otrzymuje prosty krok usunięcia, Mebel z pustymi Schowkami potwierdzenie
usunięcia poddrzewa, a Mebel z Rzeczami jawny wybór `move` albo `detach`.
Decyzja i cel nie są wybierane automatycznie. Dialog blokuje podwójny submit,
obsługuje Escape przed wysłaniem i przywraca focus.

## 16. i18n

Wszystkie nowe teksty mają wpisy PL i EN w lokalnym słowniku. UI używa nazw
Mebel/Schowek/Rzecz oraz Furniture item/Storage space/Item. Dane użytkownika
nie są tłumaczone.

## 17. Testy pgTAP

Plik `0015_m4d6_delete_furniture_with_resolution.test.sql` zawiera 101 asercji.
Pokrywa schemat, granty, role, izolację gospodarstw, walidację, trzy tryby,
snapshot, aktywne i archiwalne Rzeczy, linki poza poddrzewem, dokładne liczniki
oraz rollback przy błędzie usuwania L3 i L2.

## 18. Testy logiki

Test helpera obejmuje parser, zamknięte tryby, UUID, target, liczniki, pełny
kontrakt, inwarianty, bezpieczne błędy, budowanie celów i stałą nazwę RPC.
Kontrole integracyjne potwierdzają podłączenie dialogu Mebla, zachowanie
dialogu M4D.5 i pojedynczy finalny submit RPC.

## 19. Instrukcja ręcznego odbioru

1. Sprawdź anulowanie i usunięcie całkowicie pustego Mebla.
2. Usuń Mebel z kilkoma pustymi Schowkami i potwierdź brak `move`/`detach`.
3. Dla aktywnej i archiwalnej Rzeczy sprawdź `detach`, link dodatkowy i link
   poza Meblem oraz widoki Bez lokalizacji i Archiwalne.
4. Sprawdź `move` do innego Mebla w tym samym Pomieszczeniu i do innego
   Pomieszczenia, także z istniejącym dodatkowym linkiem celu.
5. Bez celu zewnętrznego sprawdź disabled `move`, komunikat, `detach` i Anuluj.
6. Po otwarciu dialogu dodaj pusty Schowek w drugim oknie i potwierdź
   `DEPENDENCIES_CHANGED` bez częściowej mutacji.
7. Sprawdź Escape, focus, podwójny submit, 375 px, tablet, desktop, brak
   poziomego scrolla i brak błędów runtime/RSC/hydration.

## 20. Poza zakresem

- usuwanie Pomieszczenia i M4D.7/M4D.8;
- zmiany M4D.2-M4D.5, RLS, tabel, relacji lub kaskad FK;
- wiele celów, przenoszenie dodatkowych linków do celu i sztuczna lokalizacja;
- M4B, M4C, AI, QR/NFC, zdjęcia i indywidualne ikony Rzeczy.
