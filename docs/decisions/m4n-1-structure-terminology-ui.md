# M4N.1 — widoczne nazewnictwo struktury

**Status:** Zaimplementowano technicznie i zweryfikowano automatycznie; oczekuje na ręczną akceptację.

## Cel

M4N.1 wprowadza zatwierdzone nazwy widoczne w interfejsie bez zmiany modelu danych, relacji ani kontraktów technicznych.

## Widoczna struktura

| PL | EN | Klucz techniczny |
| --- | --- | --- |
| rzeczywista nazwa gospodarstwa, fallback `Dom` | actual household name, fallback `Home` | `household` |
| Pomieszczenie | Room | `room` |
| Mebel | Furniture item | `storage` / `storage_location_l2` |
| Schowek | Storage space | `position` / `storage_location_l3` |
| Rzecz | Item | `item` |

W kontekstach administracyjnych, takich jak członkowie, role, zaproszenia i ustawienia, pozostają nazwy `Gospodarstwo` oraz `Household`.

## Zakres implementacji

- słowniki PL i EN, centralny resolver oraz etykiety akcji;
- formularze, karty, statystyki, wyszukiwarka struktury i selektor lokalizacji Rzeczy;
- opis pomocniczy Mebla: „Mebel lub większy element wyposażenia, w którym przechowujesz Rzeczy.”;
- widoczne teksty dialogu M4D.5, w tym komunikat braku docelowego Schowka;
- widoczne etykiety rejestru ikon L2/L3;
- nagłówek `/home`, który pokazuje rzeczywistą nazwę gospodarstwa, z fallbackiem `Dom` / `Home`.

## Granice

M4N.1 nie zmienia:

- tabel, kolumn, relacji, RLS, RPC, migracji ani server actions;
- technicznych kluczy `room`, `storage`, `position` i nazw `storage_location_l2` / `storage_location_l3`;
- formularzy danych, nazw wpisanych przez użytkownika, list szablonów, inferencji ani aliasów danych;
- formatu i istniejących wartości kodów `ROOM-L2-L3`;
- M4N.2, M4D.6 ani M4D.7.

## Ręczny odbiór

- `/home`: nagłówek pokazuje nazwę gospodarstwa albo fallback `Dom` / `Home`; widoczne poziomy, formularze, karty, liczniki, puste stany i wyszukiwarka używają Pomieszczenia, Mebla i Schowka.
- `/items`: formularze dodawania i edycji pokazują kolejno Pomieszczenie, Mebel i Schowek; ścieżka lokalizacji zachowuje wyłącznie wpisane przez użytkownika nazwy rekordów; widoki Wszystkie, Bez lokalizacji i Archiwalne działają bez regresji.
- M4D.5: dialog używa słowa Schowek / Storage space dla usuwania, odpięcia i przeniesienia; brak alternatywnego celu pokazuje zatwierdzony komunikat; `DEPENDENCIES_CHANGED` pozostaje bez zmian.
- Konteksty członków, ról i ustawień nadal używają Gospodarstwa / Household.
- Widoki 375 px, tablet i desktop nie mają poziomego scrolla ani błędów runtime, RSC lub hydration.
## Weryfikacja

Testy logiki obejmują nowe etykiety resolvera PL/EN, teksty selektora lokalizacji oraz komunikat braku celu M4D.5. Kontrakty technicznych helperów lokalizacji pozostają pokryte istniejącymi testami.
