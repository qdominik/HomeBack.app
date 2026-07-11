# Plan: M4 - Inventory / pierwszy CRUD przedmiotow

Data: 2026-07-11
Status: planowany

## Cel

M4 rozpocznie sie wraz z rzeczywistym CRUD przedmiotow: lista, dodawanie,
edycja, archiwizacja oraz przypisanie kategorii i lokalizacji L3.

## Wyszukiwanie i filtrowanie

Rozbudowane wyszukiwanie, filtrowanie i sortowanie `/items` zostaje odlozone
do M4, gdy lista bedzie zawierala rzeczywiste dane przedmiotow. Obecny widok
`/items` pozostaje celowo prostym stanem pustym i nie udaje gotowej funkcji.

Wyszukiwanie struktury domu jest realizowane niezaleznie na `/home`. Nie jest
globalna wyszukiwarka i nie rozszerza zakresu M4.

## Poza zakresem

- globalna trasa `/search`,
- zdjecia i Storage,
- QR/NFC, AI oraz Home Assistant,
- nowe tabele, pola, migracje i zmiany RLS przed zaakceptowaniem planu CRUD.
