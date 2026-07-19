# M4N.2 — szablony i kompatybilność struktury

**Status:** Zaimplementowano, zweryfikowano automatycznie, zaakceptowano ręcznie i zapisano jako stabilny checkpoint.

## Cel etapu

M4N.2 porządkuje sugestie i inferencję dla struktury Mebel → Schowek bez zmiany modelu danych, danych użytkownika ani kontraktów technicznych.

## Stan przed zmianą

L2 przechowywało polską listę zawierającą zarówno Meble, jak i wartości semantycznie bliższe Schowkom, w tym nieopisaną `Półkę`, `Szufladę`, `Pudełko` i `Pojemnik`. L3 miało wyłącznie pole `nazwa` bez osobnego rodzaju i bez listy szablonów. Inferencja L2 korzystała z normalizacji polskich znaków i najdłuższego dopasowania. Lokalna baza podczas odczytowego audytu zawierała po 0 rekordów `room`, `storage_location_l2` i `storage_location_l3`.

## Szablony Mebli

PL: Komoda, Szafa, Szafka, Szafka nocna, Regał, Półka wisząca, Moduł półkowy, Łóżko, Biurko, Stół, Ława, Witryna, Kredens, RTV, Lodówka, Zamrażarka, Sejf, Walizka, Skrzynia, Inny mebel lub element wyposażenia.

EN: Chest of drawers, Wardrobe, Cabinet, Bedside table, Shelving unit, Wall shelf, Shelving module, Bed, Desk, Table, Coffee table, Display cabinet, Cupboard, TV unit, Refrigerator, Freezer, Safe, Suitcase, Storage chest, Other furniture or equipment.

## Szablony Schowków

PL: Szuflada, Górna szuflada, Dolna szuflada, Górna półka, Dolna półka, Półka 1, Półka 2, Lewa półka, Prawa półka, Komora, Wnęka, Schowek pod łóżkiem, Pojemnik, Pudełko, Kosz, Organizer, Drzwiczki lewe, Drzwiczki prawe, Górna część, Dolna część, Inny Schowek.

EN: Drawer, Top drawer, Bottom drawer, Top shelf, Bottom shelf, Shelf 1, Shelf 2, Left shelf, Right shelf, Compartment, Cubby, Under-bed storage, Bin, Box, Basket, Organizer, Left section, Right section, Upper section, Lower section, Other storage space.

## Reguła słowa „Półka”

Nie promujemy samodzielnego szablonu `Półka` na poziomie Mebla. Mebel używa wariantów Półka wisząca, Regał i Moduł półkowy, a Schowek używa wariantów opisujących położenie lub numer. Historyczna wartość `Półka` pozostaje dozwolonym custom value.

## Inferencja

Normalizacja nadal ignoruje wielkość liter, polskie znaki i nadmiarowe spacje. Kandydaci są sortowani od najdłuższego, dzięki czemu `Szafka nocna` wygrywa z `Szafka`. L2 podpowiada rodzaj na podstawie nazwy. Wspólny helper obsługuje również kontrolowane sugestie L3, ale formularz L3 zapisuje nazwę wybraną z listy albo dokładną wartość custom; nie reklasyfikuje automatycznie wpisanego tekstu.

Ręczny wybór i każda istniejąca wartość mają pierwszeństwo przed inferencją. Sugestia działa tylko przed pierwszą ingerencją użytkownika i przy braku wartości początkowej.

## Kompatybilność starych danych

Wartości L2 spoza nowej listy, między innymi `Półka`, `Szuflada` i `Pojemnik`, są otwierane jako custom value, wyświetlane i wysyłane bez zmiany. Nie są przenoszone do L3, nie tworzą nadrzędnego Mebla i nie są normalizowane do nowego szablonu. L3 nadal zapisuje wyłącznie istniejące pole `nazwa`.

## Aliasy kodów lokalizacji

Zachowano wszystkie stare aliasy. Dodano deterministyczne aliasy dla nowych typów: Szafka nocna `SNC`, Półka wisząca `PWI`, Moduł półkowy `MPO`, Stół `STO`, Ława `LAW`, Witryna `WIT`, Kredens `KRE`, RTV `RTV`, Lodówka `LOD`, Zamrażarka `ZAM`, Sejf `SEJ`, Walizka `WAL`, Skrzynia `SKR`. Angielskie odpowiedniki mapują się na te same segmenty. Istniejące kody nie są regenerowane, a format pozostaje `ROOM-L2-L3`.

## Brak migracji i zmian backendu

Nie zmieniono tabel, kolumn, typów, danych, migracji, RLS, RPC, server actions, request/response, kodów błędów ani routingu. Techniczne nazwy `storage`, `position`, `storage_location_l2` i `storage_location_l3` pozostają bez zmian.

## Zmienione obszary

- listy szablonów struktury i helper inferencji;
- wspólny mechanizm template-or-custom;
- formularze Mebla i Schowka;
- normalizacja dopasowania wartości;
- aliasy generatora nowych kodów;
- słowniki PL/EN i ich typy;
- testy jednostkowe oraz dokumentacja produktu i decyzji.

## Testy automatyczne

Testy obejmują kompletność i unikalność list PL/EN, regułę `Półki`, inferencję L2/L3, najdłuższe dopasowanie, ochronę ręcznej wartości, custom values, legacy values oraz stare i nowe aliasy kodów.

## Ręczny odbiór

1. Utwórz Mebel z szablonu Komoda i Półka wisząca.
2. Wpisz custom value `Sejf ścienny` oraz legacy value `Półka`; zmień ręcznie sugestię i potwierdź, że nie jest nadpisywana.
3. Utwórz Schowki Górna półka, Szuflada i Schowek pod łóżkiem; wpisz custom value `Lewa wnęka`.
4. Sprawdź inferencję nazw: Komoda w salonie, Szafka nocna, Półka wisząca, Szuflada na dokumenty, Górna półka i Pojemnik na kable.
5. Potwierdź, że stare wartości L2 pozostają widoczne, nie przechodzą do L3, ścieżki Rzeczy działają, a istniejące kody się nie zmieniają.
6. Sprawdź 375 px, tablet i desktop: brak poziomego scrolla oraz błędów runtime, RSC i hydration.

## Ryzyka przed produkcją

Lokalny audyt nie wykazał danych. Przed wdrożeniem produkcyjnym należy przygotować osobny, wyłącznie odczytowy raport unikalnych wartości L2 `typ` i L3 `nazwa`, aby oszacować udział legacy custom values. Raport nie może automatycznie zmieniać ani przenosić rekordów.

## Późniejsze etapy

M4D.6 i M4D.7 pozostają nierozpoczęte. Ewentualne narzędzie do ręcznego porządkowania historycznych danych wymaga osobnej decyzji właściciela.

## Finalizacja checkpointu

M4N.2 został ręcznie zaakceptowany i zapisany jako stabilny checkpoint.

Zakres ręcznie zaakceptowany:
- tworzenie i edycja Mebli z szablonu, własną wartością oraz legacy wartością Półka;
- inferencja Komoda, Szafka nocna, Półka wisząca i Moduł półkowy z ochroną ręcznego wyboru;
- tworzenie i edycja Schowków z szablonów, wartości własnych, Szuflada, Górna półka oraz legacy Półka;
- sugestie nazw Pozycji L3 bez dodawania pola rodzaju;
- zachowanie legacy danych bez migracji, tworzenia nadrzędnego Mebla ani przenoszenia danych;
- zachowanie kodów ROOM-L2-L3, aliasów oraz istniejącego aliasu SZF;
- widoki 375 px, tablet i desktop bez poziomego scrolla, błędów runtime, RSC i hydration mismatch.

Weryfikacja automatyczna:
- npm.cmd run test:logic — 128/128;
- npm.cmd run lint — sukces;
- npm.cmd run build — sukces;
- git diff --check — sukces.

Nie zmieniono bazy, migracji, RLS, RPC, server actions ani modelu danych.