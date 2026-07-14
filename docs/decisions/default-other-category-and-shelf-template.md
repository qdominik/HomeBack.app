# Systemowa kategoria Inne i szablon Polka

Data: 2026-07-13
Status: Zaimplementowano i zaakceptowano recznie.

## Cel

Dodac systemowa kategorie `Inne`, ustawic ja jako domyslna kategorie nowej
Rzeczy oraz dodac podstawowy rodzaj Schowka L2 `Polka`.

## Reprezentacja kategorii Inne

`Inne` jest globalna kategoria systemowa, zgodna z obecnym modelem kategorii
systemowych:

- `key = 'other'`;
- `nazwa = 'Inne'`;
- `czy_systemowa = true`;
- `household_id = null`;
- `widoczna_dla_dzieci = true`.

Nie jest sztuczna opcja formularza ani kategoria wlasna gospodarstwa. Jest
widoczna dla kazdego gospodarstwa przez istniejace RLS, tak jak pozostale
kategorie systemowe. Istniejace RLS nie pozwala jej edytowac ani usunac.

## Istniejace i nowe gospodarstwa

Dodano migracje `0006_system_other_category.sql`. Dla baz bez kategorii
wlasnej o znormalizowanej nazwie `Inne` tworzy ona jeden globalny rekord.
Nowe gospodarstwa widza ten rekord automatycznie, poniewaz aktualny model nie
kopiuje kategorii systemowych na gospodarstwa.

Jesli baza ma juz kategorie wlasna `Inne` (po trimowaniu i zmianie wielkosci
liter), migracja zatrzymuje sie przed zmiana danych. Konwersja takiego rekordu
do jednej globalnej kategorii rozszerzylaby jego zakres i moglaby wymagac
zmiany relacji wielu gospodarstw; nie wykonujemy jej automatycznie ani nie
przepinamy Rzeczy. Taki przypadek wymaga osobnej decyzji wlasciciela.

## Formularz Rzeczy

Formularz `Dodaj rzecz` wybiera domyslnie identyfikator kategorii systemowej
o kluczu `other`. Uzytkownik moze wybrac inna kategorie, a server action nadal
waliduje przekazany identyfikator kategorii wedlug RLS i aktywnego
`household_id`.

Formularz `Edytuj rzecz` zawsze zachowuje aktualne `category_id` Rzeczy;
domyslne `Inne` nie nadpisuje danych podczas edycji. Szybkie tworzenie
kategorii wlasnej nadal korzysta z istniejacego dopasowania znormalizowanej
nazwy, dlatego `Inne`, `inne` i ` INNE ` wybieraja rekord systemowy zamiast
tworzyc duplikat.

## Szablon Schowka

Do wspolnej listy `STORAGE_LOCATION_TEMPLATE_OPTIONS` dodano `Polka` dokladnie
raz, po `Regal wiszacy` i przed kolejnymi rodzajami. `Inne` pozostaje ostatnia
opcja. Ta lista jest wspolna dla tworzenia i edycji Schowka L2. Kolumna `typ`
jest juz tekstowa, dlatego nie zmieniono tabel ani kolumn.

Slownik EN ma juz odpowiednik `Shelf` w istniejacych sugestiach interfejsu.
Lista aktywnych szablonow jest obecnie polska, zgodnie ze startowym jezykiem
MVP, wiec nie dodano niezaleznego mechanizmu tlumaczen danych formularza.

## Wplyw na baze i RLS

Dodano jedna migracje danych systemowych. Nie zmieniono tabel, kolumn,
relacji, RLS, RPC, routingu ani zaleznosci. Nie uzyto service role.

## Testy i reczna akceptacja

Testy logiczne pokrywaja kolejnosc systemowej kategorii `Inne`, domyslny
wybor dla nowej Rzeczy, zachowanie kategorii w edycji, normalizacje duplikatu
i pojedyncze wystapienie `Polka` przed koncowym `Inne`.

Testy pgTAP pokrywaja globalny rekord systemowy, widocznosc w dwoch
gospodarstwach, izolacje kategorii wlasnej oraz blokade usuniecia przez
istniejace RLS.

Reczna kontrola:

1. Otworz `Dodaj rzecz` i potwierdz, ze wybrane jest `Inne`.
2. Zapisz Rzecz bez zmiany kategorii, a potem utworz druga z `Zywnosc`.
3. Otworz edycje obu Rzeczy i potwierdz zachowanie ich kategorii.
4. Sprobuj szybko utworzyc kategorie `inne`; duplikat nie moze powstac.
5. Otworz `Dodaj schowek`, wybierz `Polka`, zapisz i otworz edycje.
6. Potwierdz, ze wlasny rodzaj Schowka nadal dziala, a `Inne` pozostaje ostatnie.

## Poza zakresem

Nie rozpoczeto M4UX.2, M4D.2, M4B ani M4C. Nie zmieniono lokalizacji Rzeczy,
RPC lokalizacji, metod HTTP, Storage, QR/NFC, AI, Home Assistant ani modelu
danych poza dodaniem jednego rekordu systemowego przez migracje.
