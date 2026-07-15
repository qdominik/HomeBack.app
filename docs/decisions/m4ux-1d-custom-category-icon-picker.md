# M4UX.1D - Picker Ikony Wlasnej Kategorii

## Status

Zaimplementowano, przetestowano i zaakceptowano recznie.

## Zakres

- Picker ikony jest dostepny tylko podczas tworzenia i edycji wlasnej kategorii.
- Wykorzystuje istniejaca kolumne `category.ikona` oraz rejestr stabilnych kluczy ikon.
- Domyslnym i bezpiecznym fallbackiem jest klucz `other`.
- Wybor jest reczny; M4UX.1D nie dodaje automatycznej sugestii na podstawie nazwy kategorii.
- Kategorie systemowe pozostaja bez zmian i nadal korzystaja z mapowania `category.key`.

## Dane I Bezpieczenstwo

Server actions akceptuja tylko klucze z dozwolonego rejestru ikon kategorii.
Nieznane wartosci, nazwy komponentow React oraz klucze z innych grup ikon sa
normalizowane do `other`. Etap nie wprowadza zmian w modelu danych, bazie,
migracjach, RLS ani RPC.

## Weryfikacja

- Picker zostal sprawdzony recznie podczas tworzenia i edycji wlasnej Kategorii.
- Zapis korzysta z istniejacej kolumny category.ikona i zachowuje wybor po odswiezeniu.
- Testy logiki: 70/70; lint, build i git diff --check przeszly pomyslnie.
