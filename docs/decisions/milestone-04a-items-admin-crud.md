# Milestone M4A - Rzeczy: CRUD administratora

Data: 2026-07-11
Status: wykonane lokalnie

## Wdrozony zakres

M4A wprowadza podstawowy CRUD Rzeczy na istniejacej trasie `/items`:

- lista aktywnych rzeczy odczytywana zgodnie z RLS;
- dodawanie, edycja i archiwizacja tylko dla administratora;
- formularz z nazwa, opcjonalnym opisem, kategoria, typem i warunkowa iloscia;
- opcjonalny wybor lokalizacji: Pomieszczenie -> Schowek -> Pozycja L3;
- wyswietlanie pelnej sciezki lokalizacji;
- domyslne ukrycie rekordow o statusie `archiwalne`;
- stany ladowania, powodzenia i bledu.

Nie ma trwalego usuwania rzeczy w UI.

## Typ i ilosc

Formularz zapisuje zatwierdzone wartosci enumu bez ich zmiany:

- Pojedyncza rzecz -> `unikalny`;
- Zapas -> `zapas`;
- Zestaw -> `zestaw`.

Dla `unikalny` server action zawsze zapisuje `ilosc = 1`. Dla `zapas`
i `zestaw` formularz pokazuje ilosc z wartoscia domyslna `1`, a serwer
akceptuje tylko liczby calkowite wieksze lub rowne `1`. `jednostka`
pozostaje poza UI M4A i jest zapisywana jako `null`.

## Migracja i RPC

Dodano migracje
`supabase/migrations/0005_item_primary_location.sql`.

Migracja:

- dodaje czesciowy indeks unikalny gwarantujacy najwyzej jedna lokalizacje
  glowna na rzecz;
- dodaje `set_item_primary_location(item_id, storage_location_l3_id)`.

Funkcja RPC jest `security invoker`, ma pusty `search_path` i korzysta z
istniejacych RLS. Sprawdza uwierzytelnienie, aktywny profil administratora,
gospodarstwo rzeczy oraz przynaleznosc pozycji L3 przez Schowek i
Pomieszczenie. W jednej transakcji usuwa poprzednia lokalizacje glowna,
dodaje nowa z `czy_glowna = true` albo usuwa lokalizacje przy wartosci
`null`.

Nie uzyto service role.

## RLS i walidacja

Nie zmieniono polityk RLS dla M4C. Istniejace polityki nadal ograniczaja pelny
zapis `item` i `item_location` do administratora wlasnego gospodarstwa.

Server actions dodatkowo:

- ustalaja `household_id` i `created_by_id` na serwerze;
- potwierdzaja kategorie systemowa lub wlasna aktualnego gospodarstwa;
- potwierdzaja cala sciezke wskazanej pozycji L3;
- nie przyjmuja z formularza roli, gospodarstwa, autora ani relacji danych
  jako zrodla prawdy.

## Testy

Przeszly lokalnie:

- `npx.cmd supabase db reset`;
- `npx.cmd supabase test db` - 7 plikow, 136 testow;
- `npm.cmd run test:logic` - 26 testow;
- `npm.cmd run lint`;
- `npm.cmd run build`.

Nowy pgTAP obejmuje indeks jednej lokalizacji glownej, RPC z zastapieniem i
usunieciem lokalizacji, izolacje gospodarstw, kategorie systemowe i wlasne,
cudza kategorie/L3, archiwizacje, role domownik i dziecko oraz ochrone
`created_by_id`.

`npm.cmd audit --omit=dev` nadal raportuje 2 umiarkowane ostrzezenia dla
przechodniego PostCSS dostarczanego przez Next.js. Dostepna automatyczna
"naprawa" wymaga `npm audit fix --force` i zmiany Next.js do niezgodnej
wersji, dlatego jej nie zastosowano.

## Swiadomie pominiete

Poza M4A pozostaja:

- M4B: wyszukiwanie, filtrowanie, sortowanie i widok archiwum;
- M4C: przenoszenie przez domownika oraz akcja dziecka "odlozone";
- zdjecia, Storage, dokumenty, QR/NFC, AI, Home Assistant;
- termin waznosci, opiekun, notatki, jednostki, Sejf;
- wiele aktywnych lokalizacji, import, eksport, OCR i skanowanie kodow.

## Ryzyka i ograniczenia

RPC atomowo zmienia tylko lokalizacje glowna. Zapis pozostalych pol rzeczy i
wywolanie RPC sa dwiema kontrolowanymi operacjami server action; pozycja L3
jest walidowana przed zapisem rzeczy. Ewentualne rozszerzenie do jednej
transakcji obejmujacej caly CRUD rzeczy wymaga osobnej decyzji i nie wchodzi do
M4A.

M4C nadal wymaga decyzji, czy "swoj przedmiot" domownika oznacza
`created_by_id`, `opiekun_id` czy inna relacje.
