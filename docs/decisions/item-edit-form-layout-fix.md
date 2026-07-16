# Item Edit Form Layout Fix

Status: Zaimplementowano, przetestowano i zaakceptowano recznie.

## Problem

Rozwiniety formularz edycji Rzeczy byl renderowany wewnatrz natywnego elementu `details`, ktory znajdowal sie w siatce akcji karty. Na szerszych ekranach `details` nie rozszerzal stabilnie formularza poza szerokosc kolumny akcji. W efekcie formularz byl bardzo waski i niepotrzebnie wysoki.

## Zmiana

- Wiersz metadanych i akcji pozostaje osobnym, zwartym ukladem.
- Rozwiniety formularz jest renderowany ponizej tego wiersza, na pelnej szerokosci karty.
- Tylko formularz edycji korzysta z wariantu zwartego: na `sm+` pola nazwy, opisu i lokalizacji zajmuja pelny wiersz, a krotsze pola moga korzystac z dwoch kolumn.
- Na mobile formularz pozostaje jednokolumnowy, bez poziomego przewijania.

## Zakres i brak zmian

Nie zmieniono nazw FormData, walidacji, server actions, wyboru kategorii lub lokalizacji, archiwizacji ani trwalego usuwania. Nie zmieniono bazy danych, migracji, RLS ani RPC.

Indywidualna ikona Rzeczy i przywracanie archiwalnych Rzeczy pozostaja poza zakresem.

## Weryfikacja

- `npm.cmd run test:logic`: 75/75.
- `npm.cmd run lint`: sukces.
- `npm.cmd run build`: sukces.
- `git diff --check`: sukces.
- Reczny odbior mobile, tablet i desktop: zaakceptowany.
- Reczny test zapisu oraz zamkniecia formularza bez zapisu: zaakceptowany.
- Archiwizacja oraz trwale usuwanie wraz z potwierdzeniem: bez regresji.