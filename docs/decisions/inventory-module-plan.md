# Plan: M4 - Inventory / Rzeczy

Data: 2026-07-11
Status: M4A wdrozony; M4B i M4C planowane

## Cel i granice

M4 wprowadza Rzeczy etapami, aby najpierw bezpiecznie zweryfikowac podstawowy
CRUD administratora na istniejacym modelu i RLS. Aktualny widok `/items`
pozostaje prostym stanem pustym do rozpoczecia M4A.

Plan nie zmienia zakresu MVP. Nie obejmuje zdjec, Supabase Storage, dokumentow,
QR/NFC, Sejfu, AI, Home Assistant, globalnego wyszukiwania, importu, eksportu,
powiadomien, historii zmian jako osobnego modulu, zaproszen, drag and drop,
skanowania kodow ani OCR.

## Podzial etapu

| Etap | Cel | Status |
|---|---|---|
| M4A | Podstawowy CRUD Rzeczy wylacznie dla administratora | Najblizsza implementacja |
| M4B | Wyszukiwanie, filtrowanie i uzywalnosc realnej listy | Po zweryfikowanym M4A |
| M4C | Ograniczone akcje domownika i dziecka wraz z precyzyjnym RLS | Osobny etap po M4A |

## Stan modelu danych przed M4A

### `item`

| Pole w bazie | Czy uzywane w M4A | Wymagane | Domyslna wartosc | Uwagi |
|---|---:|---:|---|---|
| `id` | Tak | Tak, technicznie | UUID bazy | Nie jest polem formularza. |
| `household_id` | Tak | Tak | Z aktywnego profilu | Ustalane wylacznie po stronie serwera; nigdy z formularza. |
| `category_id` | Tak | Tak | Brak | Musi wskazywac kategorie systemowa albo wlasna tego samego gospodarstwa. |
| `nazwa` | Tak | Tak | Brak | Walidacja po `btrim`; pusta nazwa jest odrzucana. |
| `opis` | Tak | Nie | `null` | Zapis po trimowaniu, gdy podany. |
| `typ` | Tak | Tak w schemacie | Brak | Enum: `unikalny`, `zapas`, `zestaw`. Zatwierdzone: formularz pokazuje wybor, a domyslna wartoscia jest `unikalny`. |
| `ilosc` | Tak, warunkowo | Nie | `1` | Zatwierdzone: dla `unikalny` server action zawsze zapisuje 1; dla `zapas` i `zestaw` UI pokazuje liczbe calkowita >= 1. |
| `jednostka` | Tak, warunkowo | Nie | `null` | Opcjonalna, bez automatycznego tlumaczenia danych uzytkownika. |
| `termin_waznosci` | Nie | Nie | `null` | Istnieje w modelu, ale poza minimalnym formularzem M4A. |
| `opiekun_id` | Nie | Nie | `null` | Istnieje w modelu; M4C potrzebuje decyzji, czy to pole definiuje "swoj przedmiot" domownika. |
| `status` | Tak | Tak w schemacie | `w domu` rekomendowane dla tworzenia | Enum: `w domu`, `zuzyte`, `pozyczone`, `archiwalne`. M4A archiwizuje przez `archiwalne`. |
| `przechowywany_w_sejfie` | Nie | Tak w schemacie | `false` bazy | Pole przyszlosciowe; bez UI M4A. |
| `miniatura_url` | Nie | Nie | `null` | Bez zdjec i Storage w M4A. |
| `notatki` | Nie | Nie | `null` | Poza minimalnym formularzem M4A. |
| `created_by_id` | Tak | Tak | ID aktualnego administratora | Ustalane wylacznie po stronie serwera; RLS wymaga `auth.uid()`. |
| `created_at`, `updated_at` | Tak, odczytowo | Tak, technicznie | `now()` oraz trigger | Nie sa polami formularza. |

### `item_location`

| Pole w bazie | Czy uzywane w M4A | Wymagane | Domyslna wartosc | Uwagi |
|---|---:|---:|---|---|
| `id` | Tak, technicznie | Tak | UUID bazy | Nie jest polem formularza. |
| `item_id` | Tak | Tak | ID tworzonej lub edytowanej rzeczy | Ustalane przez server action. |
| `storage_location_l3_id` | Tak, opcjonalnie | Tak dla utworzonego wiersza | Brak | Brak L3 oznacza brak wiersza lokalizacji. |
| `czy_glowna` | Tak | Tak | Brak | Dla M4A zapisywane jako `true`. |
| `notatka` | Nie | Nie | `null` | Poza M4A. |
| `created_at`, `updated_at` | Tak, odczytowo | Tak, technicznie | `now()` oraz trigger | Nie sa polami formularza. |

Relacja `item_location` pozwala obecnie na wiele lokalizacji jednego przedmiotu.
`czy_glowna` oznacza lokalizacje glowna, ale schema nie gwarantuje jednej
glownej lokalizacji. To jest jedyna wykryta minimalna zmiana schematu potrzebna
M4A.

## M4A - podstawowy CRUD Rzeczy dla administratora

### Zakres funkcjonalny

1. `/items` odczytuje przez klienta serwerowego liste aktywnych przedmiotow
   dostepnych w RLS; domyslnie nie pokazuje `status = 'archiwalne'`.
2. Administrator dodaje przedmiot, ze stanami ladowania, bledu i sukcesu zapisu.
3. Administrator edytuje nazwe, opis, wymagany typ przedmiotu po decyzji,
   kategorie oraz opcjonalna lokalizacje L3.
4. Administrator archiwizuje przedmiot przez ustawienie `status = 'archiwalne'`.
   W UI nie ma trwalego usuwania.
5. Formularz kategorii pokazuje tylko systemowe oraz wlasne kategorie widoczne
   dla aktualnego gospodarstwa przez RLS.
6. Formularz lokalizacji prowadzi hierarchicznie: Pomieszczenie -> Schowek
   (`storage_location_l2`) -> Pozycja L3. Tylko L3 jest zapisywana w
   `item_location`; widok pokazuje `Pomieszczenie / Schowek / Pozycja`.
7. M4A pozwala na zero albo jedna lokalizacje przedmiotu: wskazanie L3 tworzy
   jedno powiazanie z `czy_glowna = true`; brak L3 nie tworzy powiazania.
8. Zapisy przechodza przez server actions, ktore odczytuja aktywny profil,
   nie przyjmuja `household_id` ani `created_by_id` z klienta i waliduja
   identyfikatory kategorii oraz lokalizacji.

### Walidacja serwerowa

- Wymagane sa: nazwa po trimowaniu, kategoria oraz `typ` wymagany przez enum
  po rozstrzygnieciu decyzji.
- `opis` jest opcjonalny; pusty tekst staje sie `null`.
- Kategoria musi istniec i byc systemowa (`czy_systemowa = true`,
  `household_id is null`) albo wlasna dla `current_household_id()`.
- Wybrana pozycja L3 musi przez L2 i room nalezec do aktywnego gospodarstwa.
  Identyfikator z formularza nie jest zrodlem prawdy.
- `household_id` oraz `created_by_id` pochodza z profilu serwera.
- Przy zmianie lokalizacji zatwierdzona funkcja RPC atomowo usuwa poprzednia
  lokalizacje glowna i dodaje nowa, albo usuwa lokalizacje przy braku L3.

### Wdrozona minimalna migracja M4A

`supabase/migrations/0005_item_primary_location.sql`

```sql
create unique index item_location_one_primary_per_item_unique
  on public.item_location (item_id)
  where czy_glowna;
```

Indeks zachowuje przewidziana przez model relacje wiele-lokalizacji, ale
gwarantuje najwyzej jedna lokalizacje glowna. Server action M4A utrzymuje
dodatkowo jedna lokalizacje glowna dla przedmiotu w przeplywie M4A.

### Archiwizacja

Model juz obsluguje archiwizacje: `item.status` ma wartosc `archiwalne`.
M4A ustawia te wartosc zamiast wywolania `delete` i domyslnie ukrywa rekord
na aktywnej liscie. Nie jest potrzebna migracja dla samej archiwizacji.

### Istniejace RLS i testy M4A

Istniejace polityki juz zapewniaja:

- odczyt `item` tylko wlasnego gospodarstwa, z ograniczeniem widocznosci
  kategorii dla dziecka;
- insert i update `item` tylko administratorowi wlasnego gospodarstwa;
- sprawdzenie kategorii systemowej albo kategorii tego samego gospodarstwa;
- sprawdzenie `created_by_id = auth.uid()` przy tworzeniu;
- zapis `item_location` tylko administratorowi oraz sprawdzenie, ze L3
  nalezy do aktualnego gospodarstwa;
- odczyt `item_location` tylko dla rzeczy z aktualnego gospodarstwa.

M4A nie wymaga zmiany polityk RLS dla standardowego CRUD administratora.
Wymaga rozszerzenia testow RLS o realne operacje M4A oraz, po akceptacji,
indeks jednej lokalizacji glownej. Service role key nie moze trafic do
przegladarki ani zwyklych server actions.

Testy RLS i danych:

1. Uzytkownik widzi tylko przedmioty swojego gospodarstwa.
2. Uzytkownik nie widzi przedmiotow innego gospodarstwa.
3. Administrator tworzy przedmiot tylko w swoim gospodarstwie.
4. Administrator nie tworzy ani nie edytuje przedmiotu innego gospodarstwa.
5. Kategoria systemowa oraz wlasna kategoria tego samego gospodarstwa sa
   dozwolone.
6. Wlasna kategoria innego gospodarstwa i nieistniejace ID kategorii sa
   odrzucane.
7. Lokalizacja L3 wlasnego gospodarstwa jest dozwolona; cudza i nieistniejaca
   sa odrzucane.
8. Jedna rzecz ma najwyzej jedna lokalizacje z `czy_glowna = true`.
9. Archiwizacja nie omija RLS i zmienia tylko przedmiot wlasnego gospodarstwa.
10. Domownik i dziecko nie maja pelnego CRUD M4A.
11. Service role key nie jest obecny w kodzie klienckim ani zwyklych server
    actions.

### Prawdopodobne pliki implementacyjne

- `src/app/(app)/items/page.tsx`
- `src/app/(app)/items/actions.ts`
- `src/components/items/item-form.tsx`
- `src/components/items/item-card.tsx`
- `src/components/items/item-list.tsx`
- `src/components/items/item-location-field.tsx`
- `src/lib/items/` - walidacja i budowanie sciezki lokalizacji
- `src/lib/i18n/types.ts`
- `src/lib/i18n/locales/pl.ts`
- `src/lib/i18n/locales/en.ts`
- `src/types/database.ts` - tylko gdy zatwierdzona migracja lub typy tego wymagaja
- `supabase/migrations/0005_item_primary_location.sql` - tylko po akceptacji
- `supabase/tests/0006_inventory_rls.test.sql` lub kolejny numer zgodny ze stanem katalogu
- `docs/decisions/milestone-04a-items-admin-crud.md`

### Kryteria akceptacji M4A

1. Administrator tworzy przedmiot, a rekord pojawia sie na `/items` po odswiezeniu.
2. Przedmiot ma prawidlowa kategorie systemowa albo wlasna gospodarstwa.
3. Przedmiot moze miec opcjonalna lokalizacje L3.
4. Widok pokazuje pelna sciezke `Pomieszczenie / Schowek / Pozycja`.
5. Administrator edytuje przedmiot, kategorie i lokalizacje.
6. Administrator archiwizuje przedmiot; rekord nie jest widoczny na aktywnej liscie.
7. Nie powstaje wiecej niz jedna glowna lokalizacja tego samego przedmiotu.
8. Dane pozostaja po odswiezeniu strony.
9. Inne gospodarstwo nie ma dostepu do danych ani powiazan lokalizacji.
10. Domownik i dziecko nie otrzymuja pelnego CRUD.
11. Nie dodano zdjec, Storage, QR/NFC ani AI.

## M4B - wyszukiwanie, filtrowanie i uzywalnosc listy

M4B rozpoczyna sie dopiero po dzialajacym i przetestowanym M4A. Obejmuje:

- proste wyszukiwanie po nazwie;
- ewentualne wyszukiwanie po opisie, po potwierdzeniu potrzeby na realnych danych;
- filtr kategorii;
- filtr pomieszczenia;
- filtr statusu;
- sortowanie;
- stan "brak wynikow".

Nie nalezy wczesniej przywracac rozbudowanego panelu filtracji `/items` ani
wdrazac jednoczesnie filtrow kategorii, pomieszczenia, schowka, pozycji,
statusu i sortowania bez potwierdzonej potrzeby. Wyszukiwanie struktury
pozostaje niezalezne na `/home`; globalna wyszukiwarka nie jest czescia M4B.

## M4C - role i ograniczone akcje

M4C jest osobnym etapem, bo wymaga waskich polityk RLS, server actions oraz
testow dla kazdej dozwolonej zmiany.

### Admin

Moze tworzyc, edytowac, przypisywac lokalizacje, przenosic i archiwizowac rzeczy
w swoim gospodarstwie.

### Domownik

Ma moc przypisywania i przenoszenia rzeczy oraz archiwizacji tylko swoich
rzeczy. `item.created_by_id` wskazuje tworce, a `item.opiekun_id`
opcjonalnego opiekuna, ale obecne decyzje nie definiuja, ktore z tych pol
znaczy "jego".

**[WYMAGA DECYZJI]** Przed M4C wlasciciel musi okreslic, czy "swoj przedmiot"
oznacza `created_by_id`, `opiekun_id`, czy inna relacje. Bez tego nie wolno
tworzyc polityki domownika.

### Dziecko

Moze wykonac tylko akcje "odlozone", ktora ustawia `item.status = 'w domu'`.
Wartosci enumu zostaly potwierdzone w schemacie: `w domu`, `zuzyte`,
`pozyczone`, `archiwalne`.

M4C musi ograniczyc update do tej pojedynczej zmiany i nie moze udostepnic
pelnej edycji przedmiotu ani lokalizacji.

## Weryfikacja przyszlej implementacji

Po wdrozeniu M4A nalezy uruchomic:

```text
npx.cmd supabase db reset
npx.cmd supabase test db
npm.cmd run test:logic
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

Nie uzywac `npm audit fix --force`. Znane przechodnie ostrzezenia PostCSS nie
sa powodem do wymuszonej zmiany wersji Next.js.

## Zatwierdzone decyzje M4A

1. Formularz pokazuje wymagany typ: `unikalny`, `zapas` albo `zestaw`; domyslny jest `unikalny`.
2. Dla `unikalny` ilosc wynosi zawsze `1`; dla `zapas` i `zestaw` jest dodatnia liczba calkowita z domyslna wartoscia `1`.
3. Migracja `0005_item_primary_location.sql` dodaje indeks czesciowy jednej lokalizacji glownej.
4. Funkcja `set_item_primary_location` atomowo ustawia lub usuwa lokalizacje glowna, korzystajac z istniejących RLS.

M4A jest wdrozone. M4B i M4C wymagaja osobnych zlecen i nie sa rozpoczynane przez ten etap.