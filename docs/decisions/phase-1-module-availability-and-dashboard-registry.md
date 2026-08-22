# Faza 1: dostępność modułów i rejestr Dashboardu

**Status:** Wykonane
**Zakres:** UI i konfiguracja lokalna, bez zmian danych

## Decyzja

Nieaktywne moduły `family` i `documents` są widoczne w nawigacji jako
`Wkrótce` / `Soon`, ale nie wykonują nawigacji. Bezpośrednie wejście na ich
istniejące trasy pokazuje informację o planowanej dostępności zamiast pustej
atrapy. Techniczne klucze i trasy pozostają bez zmian.

Nazwa prezentowana dla modułu `family` to `Osoby` w języku polskim i `Users`
w języku angielskim. Jest to zmiana wyłącznie etykiet UI; nazwy techniczne
pozostają stabilne.

Rejestr modułów Dashboardu przechowuje status, tytuły, opcjonalny opis i
`defaultVisible`. W tej fazie nie obsługuje personalizacji, preferencji,
przeciągania kart ani nowych modułów funkcjonalnych.

## Ograniczenia

- bez zmian tabel, migracji, RLS, RPC, endpointów i tras technicznych;
- bez nowych zależności;
- statusy są lokalną konfiguracją gotową do późniejszego wydzielenia lub
  rozszerzenia;
- aktywne przepływy Inventory, Structure, Categories i Settings pozostają
  dostępne.
