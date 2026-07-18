# M4N.0 - audyt i plan nazewnictwa struktury przechowywania

Status: **Zatwierdzono przez właściciela projektu; gotowe do implementacji M4N.1.**

Data audytu: 2026-07-18
Punkt bazowy: commit `24a6e32`, tag `m4d-5-position-delete-dialog-stable`

Ten dokument jest wyłącznie planem. Nie wdraża zmian interfejsu, danych, bazy,
RLS, RPC, routingu ani kontraktów TypeScript.

## Finalne decyzje właściciela

### Struktura PL

```text
Gospodarstwo
→ Pomieszczenie
→ Mebel
→ Schowek
→ Rzecz
```

### L2 - Mebel

Widoczna nazwa L2 to `Mebel`. W głównych etykietach nie używamy wariantu
`Mebel / wyposażenie`.

Opis pomocniczy:

> Mebel lub większy element wyposażenia, w którym przechowujesz Rzeczy.

### Korzeń struktury

W strukturze przechowywania preferowana jest rzeczywista nazwa gospodarstwa.
Jeżeli nie jest dostępna, fallback to `Dom` po polsku i `Home` po angielsku.

W kontekście członków, ról i ustawień używamy nazw `Gospodarstwo` oraz
`Household`.

### Struktura EN

```text
Home
→ Room
→ Furniture item
→ Storage space
→ Item
```

Zatwierdzone liczby mnogie: `Rooms`, `Furniture`, `Storage spaces`, `Items`.
`Storage space` jest nazwą całego poziomu L3; `Compartment` nie jest nazwą
poziomu, lecz może być rodzajem lub nazwą konkretnego Schowka.

### Reguła „półki”

Nie używamy nieopisanego szablonu `Półka` na obu poziomach.

Mebel: `Półka wisząca`, `Regał`, `Moduł półkowy`.

Schowek: `Górna półka`, `Dolna półka`, `Półka 1`, `Lewa półka`, `Prawa półka`.

### Granice etapów

M4N.1 obejmuje widoczne etykiety PL/EN, resolver, formularze, karty, ścieżki,
dialog M4D.5, komunikaty i testy tekstów. Nie obejmuje zmian bazy.

M4N.2 obejmuje szablony Mebli i Schowków, reguły inferencji, aliasy oraz
kompatybilność istniejących danych.

### Dane i technikalia

Zatwierdzono brak automatycznej migracji danych L2 → L3. Pozostają stabilne:
tabele i kolumny, RLS, RPC, techniczne typy `room`/`storage`/`position` oraz
kody lokalizacji `ROOM-L2-L3`. Kody nie będą regenerowane.

M4N.1 może się rozpocząć. M4D.6 i M4D.7 pozostają wstrzymane do zakończenia
M4N.1 i M4N.2.

## 1. Stan obecny

Widoczna terminologia struktury jest obecnie niespójna z docelowym modelem:

- `room` jest prezentowane jako Pomieszczenie / Room;
- `storage_location_l2` jest prezentowane jako Schowek / Storage location;
- `storage_location_l3` jest prezentowane jako Pozycja / Position;
- część historycznej dokumentacji używa także określeń Miejsce, Miejsce L2,
  Pozycja szczegółowa i Storage;
- szablon `Półka` działa obecnie na L2, mimo że półka może oznaczać zarówno
  wolnostojący lub wiszący element wyposażenia, jak i konkretną przestrzeń w
  regale albo szafie.

Centralny resolver etykiet już oddziela techniczne klucze `room`, `storage` i
`position` od tekstów interfejsu. Dzięki temu docelowa zmiana może być wykonana
bez zmiany modelu danych.

## 2. Model techniczny

Zatwierdzenia wymaga wyłącznie warstwa nazw widocznych dla użytkownika.
Rekomendowane mapowanie jest następujące:

| Identyfikator techniczny | Docelowa nazwa PL | Rola |
| --- | --- | --- |
| `household` | Gospodarstwo | korzeń danych, członkostwo i uprawnienia |
| `room` | Pomieszczenie | pierwszy poziom przestrzenny |
| `storage_location_l2` | Mebel | większy element wyposażenia lub przechowywania |
| `storage_location_l3` | Schowek | konkretna przestrzeń, do której przypisywana jest Rzecz |
| `item` | Rzecz | przechowywany obiekt |
| `item_location` | powiązanie Rzeczy ze Schowkiem | relacja techniczna, bez osobnej encji UI |

Bez zmian pozostają nazwy tabel, kolumn, FK, typów generowanych z bazy,
server actions i istniejących RPC. Nie znaleziono krytycznego problemu, który
uzasadniałby ich zmianę.

## 3. Docelowa struktura użytkownika

```text
Gospodarstwo
└── Pomieszczenie
    └── Mebel
        └── Schowek
            └── Rzecz
```

W widoku przestrzennym rekomendowane jest pokazywanie jako korzenia konkretnej
nazwy gospodarstwa, np. `Bzy`, zamiast powtarzania stałej etykiety
`Gospodarstwo`. Termin `Gospodarstwo` pozostaje właściwy w ustawieniach,
członkostwie i uprawnieniach.

## 4. Macierz PL

| Poziom | Liczba pojedyncza | Liczba mnoga | Akcja dodawania | Opis pomocniczy |
| --- | --- | --- | --- | --- |
| root | Gospodarstwo | Gospodarstwa | Utwórz gospodarstwo | W strukturze można pokazać jego własną nazwę. |
| L1 | Pomieszczenie | Pomieszczenia | Dodaj pomieszczenie | Obejmuje także kuchnię, łazienkę, balkon i garaż. |
| L2 | Mebel | Meble | Dodaj mebel | Mebel lub większy element wyposażenia, w którym przechowujesz Rzeczy. |
| L3 | Schowek | Schowki | Dodaj schowek | Konkretne miejsce w Meblu, w którym znajdują się Rzeczy. |
| obiekt | Rzecz | Rzeczy | Dodaj rzecz | Dane użytkownika nie są automatycznie tłumaczone. |

`Pokój` powinien pozostać nazwą albo rodzajem Pomieszczenia, np. `Pokój
dziecka` lub `Pokój gościnny`. Nie jest dobrym określeniem całego L1.

## 5. Macierz EN

### Kontekst członkostwa i uprawnień

- Household;
- Household members;
- Household administrator.

### Kontekst struktury przechowywania

| Poziom | Singular | Plural | Akcja |
| --- | --- | --- | --- |
| root | Home | Homes | Set up home |
| L1 | Room | Rooms | Add room |
| L2 | Furniture item | Furniture | Add furniture |
| L3 | Storage space | Storage spaces | Add storage space |
| obiekt | Item | Items | Add item |

Nie należy używać `a furniture` ani `furnitures`. Dla pojedynczego rekordu L2
poprawną formą jest `Furniture item`, a w nagłówkach zbiorczych `Furniture`.

Rekomendowane L3 to `Storage space`:

- jest szersze niż `Compartment`, które sugeruje zamkniętą komorę;
- jest mniej materialne niż `Container`, które oznacza typ konkretnego obiektu;
- nie koliduje z `Storage location`, które może oznaczać całą ścieżkę lub
  techniczne powiązanie lokalizacji;
- pozwala używać `Drawer`, `Shelf`, `Compartment`, `Cubby` i `Bin` jako nazw
  albo rodzajów konkretnych Schowków.

## 6. Problem słowa „półka”

Audyt wykazał następujące aktywne znaczenia:

- `src/lib/home/home-template-options.ts` zawiera nieopisany szablon L2
  `Półka`;
- słowniki EN zawierają jednocześnie `Shelf unit` i `Shelf` w sugestiach L2;
- `src/lib/home/location-code.ts` mapuje `polka` na stabilny segment `POL`;
- rejestr ikon traktuje `Shelf` jako ikonę grupy technicznej `storage`;
- testy UI i pgTAP używają półki zarówno jako L2, jak i nazwy L3;
- specyfikacja produktu wymienia półkę na obu poziomach znaczeniowych.

Rekomendowana zasada:

> Nie używamy nieopisanego szablonu „Półka” jednocześnie na poziomie Mebla i
> Schowka.

Mebel:

- Półka wisząca;
- Regał;
- Moduł półkowy.

Schowek:

- Górna półka;
- Dolna półka;
- Półka 1;
- Lewa półka;
- Prawa półka.

Stabilny kod `POL` może nadal wynikać z nazwy lub rodzaju. Zmiana etykiety nie
wymaga regenerowania istniejących kodów.

## 7. Graniczne przypadki niebędące klasycznymi meblami

| Przykład L2 | Czy mieści się w „Mebel” | Rekomendacja |
| --- | --- | --- |
| Lodówka | częściowo | obsłużyć przez opis „Mebel lub większy element wyposażenia” |
| Sejf | częściowo | traktować jako większy element wyposażenia; nie oznacza modułu Sejf/Vault |
| Wolnostojący pojemnik | niejednoznacznie | L2 tylko gdy sam organizuje własne Schowki; inaczej L3 |
| Walizka | niejednoznacznie | L2 tylko gdy jest trwałym organizatorem z wewnętrznymi Schowkami |
| Wyposażenie garażowe | częściowo | regał, szafa narzędziowa i stół pasują; luźny kosz zwykle L3 |

Termin `Mebel` jest krótki i naturalny, ale sam opis poziomu musi jawnie
obejmować większe wyposażenie. Alternatywa `Mebel / wyposażenie` jest bardziej
precyzyjna, lecz cięższa w przyciskach i breadcrumbach. Wymaga decyzji
właściciela.

## 8. Pełny audyt plików

### 8.1 Klasyfikacja 16 obszarów

| Kategoria | Główne pliki | Dyspozycja |
| --- | --- | --- |
| 1. Teksty widoczne | `src/lib/i18n/locales/pl.ts`, `src/lib/i18n/locales/en.ts` | M4N.1: zmienić wartości L2/L3 i opisy. |
| 2. Klucze i18n | `src/lib/i18n/types.ts` | Zachować techniczne klucze `storage`/`position`; dodać klucz tylko gdy zatwierdzony opis nie ma istniejącego miejsca. |
| 3. Resolver encji | `src/lib/i18n/entity-labels.ts` | M4N.1: nowe domyślne etykiety; typ `HomeEntityKey` bez zmian. |
| 4. Formularze | `room-form.tsx`, `storage-location-l2-form.tsx`, `storage-location-l3-form.tsx`, `item-form.tsx`, `item-location-field.tsx` | M4N.1: etykiety i pomoc; M4N.2: listy szablonów. |
| 5. Karty i nagłówki | `home/page.tsx`, `room-card.tsx`, `storage-location-l2-card.tsx`, `storage-location-l3-card.tsx`, `items/page.tsx`, `item-card.tsx` | M4N.1: teksty, statystyki i akcje; dane i propsy bez zmian. |
| 6. Breadcrumbs i ścieżki | `item-card.tsx`, `item-location-field.tsx`, `item-options.ts`, `location-delete-resolution.ts` | M4N.1: nazwy poziomów; wartości nazw użytkownika i techniczne ID bez zmian. |
| 7. Błędy i sukcesy | oba locale, `home/page.tsx`, `items/page.tsx` | M4N.1: teksty; kody `duplicate_location`, `duplicate_position` itd. bez zmian. |
| 8. Dialogi M4D | `storage-location-l3-delete-dialog.tsx`, locale `positionDelete` | M4N.1: widoczne Pozycja→Schowek oraz Schowek→Mebel; logika M4D.5 bez zmian. |
| 9. Szablony i sugestie | `home-template-options.ts`, `infer-home-kind.ts`, `location-code.ts`, `home-structure-icons.ts` | M4N.2: rozdzielić Meble i Schowki; zachować klucze techniczne i kody. |
| 10. Seed/systemowe | `supabase/migrations/0001_initial_schema.sql`, systemowe kategorie i test fixtures | Nie zmieniać w M4N.1. Historyczny enum i dane testowe ocenić dopiero w M4N.2. |
| 11. Typy TypeScript | `src/types/database.ts`, `home-types.ts`, `item-options.ts`, typy helperów M4D | Bez zmian nazw technicznych. |
| 12. Funkcje i RPC | `home/actions.ts`, `items/actions.ts`, helpery `location-*`, migracje M4D.2-M4D.5 | Bez zmian nazw, sygnatur i dispatcherów. |
| 13. Testy logiki | `m3-template-logic.test.ts`, `home-search-logic.test.ts`, `item-filter-logic.test.ts`, `item-location-options.test.ts`, testy `location-*` | M4N.1: asercje tekstów/resolvera; kontrakty helperów bez zmian. M4N.2: szablony i inferencja. |
| 14. Testy pgTAP | `supabase/tests/0003...`, `0006...`, `0007...`, `0009...`, `0012...`, `0013...`, `0014...` | M4N.1 bez zmian. Nazwy fixture są danymi testowymi; ewentualne porządki tylko w M4N.2. |
| 15. Aktualna dokumentacja | spec produktu, plan Inventory, plan lifecycle M4D, dokumenty M4D.2-M4D.5 | Po zatwierdzeniu dodać aneksy/aktualizacje; spec produktu dopiero po decyzji. |
| 16. Historyczna dokumentacja | milestone M2/M3/M4A, stare prompty i wcześniejsze wpisy decision logu | Nie przepisywać. Mogą pozostać dowodem terminologii obowiązującej w danym czasie. |

### 8.2 Pliki wymagające kontroli lub zmiany w M4N.1

| Plik | Planowana zmiana |
| --- | --- |
| `src/lib/i18n/locales/pl.ts` | Mebel/Meble dla L2, Schowek/Schowki dla L3, akcje, błędy, puste stany, wyszukiwanie i M4D.5. |
| `src/lib/i18n/locales/en.ts` | Furniture item/Furniture i Storage space/Storage spaces wraz z gramatycznymi akcjami. |
| `src/lib/i18n/types.ts` | Bez zmiany istniejących kluczy; ewentualnie wyłącznie typ nowego helpera opisowego. |
| `src/lib/i18n/entity-labels.ts` | Zachować `room/storage/position`, podmienić domyślne teksty przez słownik. |
| `src/lib/icons/entity-icon-definitions.ts` | Zmienić widoczne etykiety i aliasy wyszukiwania grup L2/L3; klucze ikon bez zmian. |
| `src/app/(app)/home/page.tsx` | Zweryfikować nagłówek, nazwę gospodarstwa, trzy statystyki i mapowanie komunikatów. |
| `src/components/home/home-search.tsx` | Zakresy wyszukiwania Meble/Schowki. |
| `src/components/home/room-form.tsx` | Zweryfikować teksty poziomu L1 i brak regresji nazw własnych. |
| `src/components/home/room-card.tsx` | Liczniki i akcje dotyczące Mebli oraz Schowków. |
| `src/components/home/storage-location-l2-form.tsx` | Formularz Mebla, opis pomocniczy i akcja zapisu. |
| `src/components/home/storage-location-l2-card.tsx` | Karta Mebla, dodawanie Schowka, liczniki i pusty stan. |
| `src/components/home/storage-location-l3-form.tsx` | Formularz Schowka i opis konkretnej przestrzeni. |
| `src/components/home/storage-location-l3-card.tsx` | Karta i edycja Schowka. |
| `src/components/home/storage-location-l3-delete-dialog.tsx` | Teksty bezpiecznego usuwania Schowka i wyboru docelowego Schowka; logika bez zmian. |
| `src/components/items/item-form.tsx` | Zweryfikować sekcję lokalizacji i nie zmieniać pól danych. |
| `src/components/items/item-location-field.tsx` | Pomieszczenie→Mebel→Schowek, placeholdery i tekst pomocy. |
| `src/components/items/item-filters.tsx` | Filtry Mebel i Schowek. |
| `src/components/items/item-card.tsx` | Etykiety ścieżki; własne nazwy rekordów pozostają nietłumaczone. |
| `src/app/(app)/items/page.tsx` | Zweryfikować przekazanie tekstów i etykiet filtrów; zapytania bez zmian. |
| `tests/unit/m3-template-logic.test.ts` | Asercje resolvera i akcji po zmianie etykiet. |
| `tests/unit/home-search-logic.test.ts` | Widoczne nazwy zakresów; dane użytkownika bez tłumaczenia. |
| `tests/unit/item-filter-logic.test.ts` | Etykiety filtrów, jeśli są asertywowane. |
| `tests/unit/item-location-options.test.ts` | Utrzymać techniczne relacje, zaktualizować tylko widoczne nazwy scenariusza. |
| `tests/unit/location-delete-resolution.test.ts` | Etykiety docelowej ścieżki, jeżeli asercje obejmują tekst UI. |
| `tests/e2e/m3-templates-and-custom-values.spec.ts` | Selektory/teksty formularzy tylko jeśli test jest utrzymywany i uruchamiany. |

### 8.3 Pliki techniczne pozostające bez zmian

- `src/types/database.ts`;
- `src/components/home/home-types.ts`;
- `src/lib/items/item-options.ts` - nazwy pól `storageId`, `positionId` i
  `positionName` pozostają kontraktem wewnętrznym;
- `src/lib/home/location-dependency-summary.ts`;
- `src/lib/home/location-detach.ts`;
- `src/lib/home/location-move.ts`;
- `src/lib/home/location-delete-resolution.ts` poza ewentualnym formatowaniem
  widocznej etykiety ścieżki;
- `src/app/(app)/home/actions.ts` i `src/app/(app)/items/actions.ts`;
- wszystkie migracje i funkcje RPC M4D.2-M4D.5;
- techniczne typy `room`, `storage`, `position` i
  `LocationDependencyEntityType`;
- nazwy kolumn `room_id`, `storage_location_l2_id`,
  `storage_location_l3_id`.

### 8.4 Dokumentacja

- `docs/product/homebase-product-spec.md`: aktualny dokument produktu, ale nie
  wolno go zmieniać przed zatwierdzeniem macierzy;
- `docs/decisions/inventory-module-plan.md` oraz
  `location-lifecycle-and-bulk-move-plan.md`: po zatwierdzeniu powinny dostać
  aneks mapujący stare nazwy na nowe, bez przepisywania historii;
- dokumenty M4D.2, M4D.4 i M4D.5: traktować jako technicznie aktualne; po
  zatwierdzeniu wystarczy aneks terminologiczny;
- `milestone-02-home-structure.md`, `home-structure-module-plan.md`, dokumenty
  M3/M4A, stare prompty i wcześniejsze wpisy decision logu: dokumentacja
  historyczna, bez przepisywania.

## 9. Audyt danych

Audyt wykonano odczytowo w lokalnym Supabase. Wynik:

| Tabela | Liczba rekordów |
| --- | ---: |
| `room` | 0 |
| `storage_location_l2` | 0 |
| `storage_location_l3` | 0 |

Nie ma więc lokalnych rekordów L2, które można faktycznie sklasyfikować.
Poniższa tabela jest raportem ryzyka dla wartości dopuszczanych przez elastyczne
pole `text` i obecne szablony:

| Nazwa/typ L2 | Liczba lokalna | Proponowana klasyfikacja | Ryzyko automatycznej migracji |
| --- | ---: | --- | --- |
| Szuflada | 0 | zwykle Schowek L3 | wysokie: trzeba znać docelowy Mebel i zachować linki |
| Półka | 0 | niejednoznaczne; wisząca może być Meblem, wewnętrzna Schowkiem | wysokie: nazwa nie wystarcza do decyzji |
| Pudełko | 0 | zwykle Schowek L3, czasem samodzielny organizator L2 | wysokie |
| Pojemnik | 0 | zależnie od rozmiaru i funkcji L2 albo L3 | wysokie |
| Kosz | 0 | zwykle Schowek L3, czasem samodzielne wyposażenie | wysokie |
| Schowek pod łóżkiem | 0 | Schowek L3 pod Meblem `Łóżko` | wysokie: może wymagać utworzenia rodzica |

Nie należy automatycznie przenosić żadnych rekordów między L2 i L3. W bazie
produkcyjnej przed M4N.2 potrzebny będzie taki sam raport odczytowy, ponieważ
lokalna baza po resecie nie reprezentuje danych użytkowników.

## 10. Elementy bez zmian

M4N nie zmienia:

- tabel, kolumn, relacji i identyfikatorów;
- RLS, grantów i funkcji pomocniczych uprawnień;
- nazw ani sygnatur RPC M4D.2-M4D.5;
- server actions i kodów błędów transportowych;
- tras URL;
- schematu `item_location`;
- danych wpisanych przez użytkownika;
- kodów lokalizacji;
- kluczy ikon encji, o ile są techniczne;
- statusów Rzeczy ani zachowania archiwizacji.

Kody lokalizacji zachowują format `ROOM-L2-L3`. Nie są regenerowane. Zmienia
się wyłącznie opis semantyki segmentów na:

- PL: Pomieszczenie-Mebel-Schowek;
- EN: Room-Furniture-Storage space.

## 11. Ryzyka

1. `Mebel` nie obejmuje intuicyjnie każdego większego organizatora, np.
   walizki lub pojemnika.
2. Istniejące dane produkcyjne mogą używać L2 dla obiektów, które po zmianie
   użytkownik uzna za Schowek L3.
3. Jednoczesne używanie `Półka` na L2 i L3 prowadzi do niejednoznacznych
   formularzy i kodów.
4. Angielskie `Furniture` jest niepoliczalne; mechaniczne generowanie tekstów
   może stworzyć błędne `a furniture` lub `furnitures`.
5. Zmiana samych locale bez pełnej kontroli kart, filtrów, pustych stanów i
   dialogu M4D.5 pozostawi niespójne teksty.
6. Przepisywanie historycznych dokumentów zacierałoby kontekst wcześniejszych
   decyzji i nazw RPC.
7. Automatyczna zmiana danych użytkownika mogłaby zerwać hierarchię, kody i
   powiązania `item_location`.
8. M4D.6 wdrożone przed zmianą terminologii utrwaliłoby w nowym dialogu błędne
   znaczenie `Schowek` dla L2 i wymagałoby natychmiastowej przebudowy tekstów.

## 12. Plan M4N.1 - słownik i interfejs

Cel: spójna zmiana nazw widocznych bez zmiany bazy.

1. Zatwierdzić macierze PL i EN oraz formy gramatyczne akcji.
2. Zmienić wartości w obu lokalnych słownikach i domyślne wartości resolvera.
3. Zachować techniczne klucze `storage` i `position`.
4. Dodać zatwierdzone opisy poziomów Mebel/Furniture item oraz
   Schowek/Storage space.
5. Przejść przez formularze, statystyki, karty, wyszukiwarkę, filtry, puste
   stany i ścieżki Rzeczy.
6. Zmienić wszystkie teksty dialogu M4D.5 bez dotykania jego logiki, RPC i
   warunków bezpieczeństwa.
7. Zaktualizować widoczne etykiety rejestru ikon bez zmiany kluczy ikon.
8. Zaktualizować testy resolvera i tekstów UI.
9. Wykonać kontrolę PL/EN oraz widoków 375 px, tablet i desktop.
10. Po akceptacji dopisać aneksy do aktualnych planów i zaktualizować produkt
    spec osobnym, kontrolowanym zakresem.

## 13. Plan M4N.2 - szablony i kompatybilność danych

Cel: dopasować sugestie do zatwierdzonej semantyki bez automatycznego
tłumaczenia lub przenoszenia danych użytkownika.

1. Zastąpić nieopisany szablon L2 `Półka` wariantami Mebla, np. `Półka
   wisząca`, `Regał`, `Moduł półkowy`.
2. Przygotować listę sugestii L3 Schowka: Szuflada, Górna półka, Dolna półka,
   Półka 1, Komora, Pojemnik, Kosz, Schowek pod łóżkiem.
3. Zaktualizować inferencję rodzaju tylko dla zatwierdzonych szablonów i
   zachować możliwość wpisania własnej wartości.
4. Zachować stabilne segmenty kodów lokalizacji i kompatybilność aliasów,
   w tym `POL`.
5. Rozszerzyć testy szablonów, normalizacji polskich znaków i ochrony ręcznego
   wyboru.
6. Przed jakąkolwiek korektą danych uruchomić raport produkcyjnych L2 według
   nazwy i typu.
7. Uporządkowanie danych testowych lub ręczna reklasyfikacja wymagają osobnej
   akceptacji. Bez automatycznego przenoszenia L2→L3.

## 14. Kolejność względem M4D.6 i M4D.7

Rekomendowana kolejność:

1. M4D.5 - zakończone;
2. M4N.0 - audyt i zatwierdzenie słownika;
3. M4N.1 - zmiana etykiet i UI;
4. M4N.2 - szablony i kompatybilność;
5. M4D.6 - bezpieczne usuwanie Mebla;
6. M4D.7 - bezpieczne usuwanie Pomieszczenia.

M4D.6 nie powinno powstać pod starą nazwą `Schowek` dla L2, ponieważ nowy
dialog zależności, ostrzeżenia i akcje od początku utrwaliłyby niepoprawną
semantykę. Po M4N.1 M4D.6 może używać docelowej nazwy `Mebel`, a `Schowek`
pozostanie jednoznacznie poziomem L3.

## 15. Decyzje wymagające zatwierdzenia właściciela

1. Czy L2 przyjmuje krótką nazwę `Mebel`, z opisem rozszerzającym ją na większe
   wyposażenie?
2. Czy zamiast tego nazwa L2 ma brzmieć `Mebel / wyposażenie` mimo większej
   długości w przyciskach i breadcrumbach?
3. Czy w widoku struktury korzeniem ma być zawsze rzeczywista nazwa
   gospodarstwa, a `Gospodarstwo` pozostaje tylko nazwą encji administracyjnej?
4. Czy zatwierdzamy EN: `Furniture item` / `Furniture` oraz `Storage space` /
   `Storage spaces`?
5. Czy zatwierdzamy zakaz nieopisanego szablonu `Półka` na obu poziomach i
   proponowane listy wariantów?
6. Czy M4N.1 ma być wyłącznie zmianą słownika i UI, a wszystkie szablony oraz
   inferencja mają pozostać do M4N.2?
7. Które aktualne dokumenty po akceptacji mają dostać aneks: rekomendowane są
   produkt spec, Inventory plan, lifecycle plan i dokumenty M4D.2-M4D.5.
8. Czy potwierdzamy brak automatycznej migracji danych i osobną decyzję przed
   jakimkolwiek uporządkowaniem rekordów użytkownika lub fixture testowych?
