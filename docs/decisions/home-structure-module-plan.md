# Plan: M2 — Moduł Dom / Structure

Status: projekt planu do akceptacji  
Data: 2026-07-09  
Projekt: HomeBack.app  
Poprzedni milestone: M1 — Pierwszy działający prototyp: Auth + Household + Dashboard

## 1. Cel

Celem M2 jest zbudowanie modułu Dom / Structure, czyli zarządzania strukturą gospodarstwa domowego przed rozpoczęciem CRUD przedmiotów.

Moduł ma pozwolić użytkownikowi utworzyć trójpoziomową strukturę lokalizacji:

```text
Pomieszczenie → Miejsce przechowywania L2 → Pozycja szczegółowa L3
```

Przykład:

```text
Kuchnia → Szafka nad zlewem → Górna półka
Garaż → Regał metalowy → Pudełko z kablami
Salon → Komoda → Druga szuflada
```

M2 ma przygotować fundament pod późniejszy moduł Rzeczy / Inventory. Przedmioty nie są implementowane w tym etapie.

## 2. Kontekst

M1 został zamknięty. Aplikacja ma działający lokalnie pionowy przepływ:

- rejestracja,
- potwierdzenie e-mail,
- tworzenie gospodarstwa,
- pierwszy administrator,
- Dashboard,
- wylogowanie,
- ochrona tras,
- Supabase Auth SSR,
- PostgreSQL,
- RLS,
- testy pgTAP,
- lint,
- build.

M2 jest kolejnym logicznym etapem, ponieważ przedmioty muszą być przypisywane do istniejącej struktury domu.

## 3. Zakres M2

### 3.1. Widok `/home`

Rozbudować trasę:

```text
/home
```

Widok powinien zawierać:

- nagłówek modułu Dom,
- nazwę gospodarstwa,
- listę pomieszczeń,
- liczbę miejsc L2 w każdym pomieszczeniu,
- liczbę pozycji L3 w każdym pomieszczeniu,
- pusty stan, jeśli nie ma pomieszczeń,
- akcję „Dodaj pomieszczenie”.

### 3.2. Pomieszczenia — `room`

Funkcje:

- lista pomieszczeń,
- dodanie pomieszczenia,
- edycja pomieszczenia,
- usunięcie pomieszczenia tylko wtedy, gdy nie ma miejsc L2,
- sortowanie według pola `kolejność`.

Pola używane w UI:

- `nazwa`,
- `typ`,
- `ikona`,
- `opis`,
- `kolejność`.

Typy pomieszczeń zgodne ze schematem:

- `salon`,
- `sypialnia`,
- `kuchnia`,
- `garaż`,
- `piwnica`,
- `biuro`.

### 3.3. Miejsca przechowywania L2 — `storage_location_l2`

Funkcje:

- lista miejsc L2 w wybranym pomieszczeniu,
- dodanie miejsca L2,
- edycja miejsca L2,
- usunięcie miejsca L2 tylko wtedy, gdy nie ma pozycji L3,
- sortowanie według pola `kolejność`.

Pola używane w UI:

- `room_id`,
- `nazwa`,
- `typ`,
- `opis`,
- `kolejność`.

Typy miejsc zgodne ze schematem:

- `szafa`,
- `komoda`,
- `regał`,
- `półka`,
- `szuflada`,
- `pudełko`,
- `pojemnik`.

### 3.4. Pozycje szczegółowe L3 — `storage_location_l3`

Funkcje:

- lista pozycji L3 w wybranym miejscu L2,
- dodanie pozycji L3,
- edycja pozycji L3,
- usunięcie pozycji L3 tylko wtedy, gdy nie jest używana przez `item_location`,
- zapis lub automatyczne generowanie kodu lokalizacji,
- sortowanie według pola `kolejność`.

Pola używane w UI:

- `storage_location_l2_id`,
- `nazwa`,
- `opis`,
- `kod_lokalizacji`,
- `kolejność`.

Pola przyszłościowe pozostają bez UI i bez logiki funkcjonalnej:

- `identyfikator_qr`,
- `identyfikator_nfc`.

## 4. Poza zakresem M2

W tym etapie nie implementować:

- CRUD przedmiotów,
- zdjęć pomieszczeń,
- uploadu plików,
- Supabase Storage bucketów,
- QR/NFC,
- skanowania kodów,
- dokumentów,
- AI,
- Home Assistant,
- mapy mieszkania 2D,
- aplikacji mobilnej native,
- multi-household,
- płatności,
- zaproszeń członków gospodarstwa.

Jeśli podczas pracy pojawi się potrzeba funkcji spoza zakresu, należy oznaczyć ją jako `[WYMAGA DECYZJI]` i nie implementować bez akceptacji właściciela projektu.

## 5. Model danych

M2 używa istniejących tabel:

```text
room
storage_location_l2
storage_location_l3
```

Relacja logiczna:

```text
household
└── room
    └── storage_location_l2
        └── storage_location_l3
```

Plan nie zakłada dodawania nowych tabel.

Plan nie zakłada zmiany modelu danych, o ile obecny schemat zawiera pola opisane w dokumencie produktu.

## 6. RLS i bezpieczeństwo

Moduł musi respektować `household_id` i istniejące RLS.

### 6.1. Odczyt

Aktywny użytkownik może widzieć tylko strukturę własnego gospodarstwa.

Dotyczy:

- `room`,
- `storage_location_l2`,
- `storage_location_l3`.

Użytkownik nie może odczytać pomieszczenia, miejsca L2 ani miejsca L3 należącego do innego gospodarstwa.

### 6.2. Zapis

W M2 zapis do struktury domu powinien mieć tylko `admin`.

Admin może:

- dodawać pomieszczenia,
- edytować pomieszczenia,
- usuwać puste pomieszczenia,
- dodawać miejsca L2,
- edytować miejsca L2,
- usuwać puste miejsca L2,
- dodawać pozycje L3,
- edytować pozycje L3,
- usuwać pozycje L3 nieużywane przez `item_location`.

`domownik` w M2 może tylko odczytywać strukturę domu.

`dziecko` w M2 może tylko odczytywać strukturę domu, jeśli będzie to potrzebne do późniejszego widoku rzeczy dostępnych dla dzieci.

### 6.3. Zakazy

Aplikacja i RLS nie mogą pozwolić na:

- utworzenie `room` z obcym `household_id`,
- podpięcie `storage_location_l2` do pokoju z innego gospodarstwa,
- podpięcie `storage_location_l3` do miejsca L2 z innego gospodarstwa,
- usunięcie pomieszczenia, jeśli ma miejsca L2,
- usunięcie miejsca L2, jeśli ma pozycje L3,
- usunięcie pozycji L3, jeśli jest używana przez `item_location`.

## 7. Logika kodu lokalizacji

Dla `storage_location_l3.kod_lokalizacji` należy dodać prostą logikę generowania kodu lokalizacji.

Proponowany format:

```text
ROOM-L2-L3
```

Przykład:

```text
SAL-KOM-SZ1
```

Znaczenie:

- `SAL` — salon,
- `KOM` — komoda,
- `SZ1` — szuflada 1.

W M2 kod może być generowany funkcją aplikacyjną na podstawie:

- typu lub nazwy pomieszczenia,
- typu lub nazwy miejsca L2,
- kolejności albo nazwy pozycji L3.

Kod powinien być edytowalny przez admina.

Jeśli automatyczne generowanie kodu okaże się niejednoznaczne, należy oznaczyć szczegóły jako `[WYMAGA DECYZJI]`, ale nie blokować podstawowego CRUD struktury domu.

## 8. Interfejs

### 8.1. `/home`

Widok główny modułu Dom.

Sekcje:

- nagłówek: „Dom”,
- opis: „Zarządzaj pomieszczeniami i miejscami przechowywania”,
- lista pomieszczeń,
- przycisk „Dodaj pomieszczenie”,
- pusty stan: „Dodaj pierwsze pomieszczenie”.

### 8.2. Szczegóły pomieszczenia

Sekcja lub widok po kliknięciu pomieszczenia.

Pokazuje:

- nazwę pomieszczenia,
- typ,
- opis,
- listę miejsc L2,
- przycisk „Dodaj miejsce”.

### 8.3. Szczegóły miejsca L2

Pokazuje:

- nazwę miejsca,
- typ,
- opis,
- listę pozycji L3,
- przycisk „Dodaj pozycję”.

### 8.4. Formularze

Formularz pomieszczenia:

- nazwa,
- typ,
- ikona,
- opis,
- kolejność.

Formularz L2:

- nazwa,
- typ,
- opis,
- kolejność.

Formularz L3:

- nazwa,
- opis,
- kod lokalizacji,
- kolejność.

Walidacja minimalna:

- `nazwa` wymagana,
- `typ` wymagany tam, gdzie istnieje enum,
- `kolejność` opcjonalna,
- `kod_lokalizacji` wymagany dla L3, jeśli nie zostanie wygenerowany automatycznie.

Nie dodawać zewnętrznej biblioteki formularzy ani walidacji.

## 9. Pliki

### 9.1. Nowe pliki

Proponowane nowe pliki:

```text
docs/decisions/home-structure-module-plan.md
src/app/(app)/home/actions.ts
src/components/home/room-card.tsx
src/components/home/room-form.tsx
src/components/home/storage-location-l2-card.tsx
src/components/home/storage-location-l2-form.tsx
src/components/home/storage-location-l3-card.tsx
src/components/home/storage-location-l3-form.tsx
src/lib/home/location-code.ts
```

Nazwy mogą zostać dopasowane do istniejących konwencji projektu, ale bez zmiany routingu i bez dodawania nowych modułów.

### 9.2. Edytowane pliki

```text
src/app/(app)/home/page.tsx
src/components/app-shell.tsx
src/lib/i18n/locales/pl.ts
src/lib/i18n/locales/en.ts
src/lib/i18n/types.ts
docs/decisions/decision-log.md
```

### 9.3. Pliki testów

Jeśli RLS wymaga doprecyzowania:

```text
supabase/tests/0003_home_structure_rls.test.sql
```

Jeśli trzeba zmienić polityki RLS:

```text
supabase/migrations/0003_home_structure_rls.sql
```

Wykonywalne SQL RLS musi być w `supabase/migrations`, nie tylko w `supabase/policies`.

## 10. Wpływ na bazę danych

Plan zakłada brak zmian schematu, jeśli istniejące tabele zawierają wymagane pola.

Możliwa nowa migracja tylko wtedy, gdy okaże się, że:

- brakuje indeksów potrzebnych dla listowania po `household_id`, `room_id` lub `storage_location_l2_id`,
- istniejące RLS nie obejmuje bezpiecznie relacji L2 i L3,
- trzeba doprecyzować blokady usuwania struktur używanych przez przedmioty.

W takim przypadku zmiana powinna być wykonana w osobnej migracji:

```text
supabase/migrations/0003_home_structure_rls.sql
```

## 11. Wpływ na RLS

RLS musi zachować izolację danych między gospodarstwami.

Testy powinny potwierdzić:

1. użytkownik A nie widzi pomieszczeń gospodarstwa B,
2. użytkownik A nie widzi miejsc L2 gospodarstwa B przez join z `room`,
3. użytkownik A nie widzi miejsc L3 gospodarstwa B przez join z L2 i `room`,
4. admin może dodać pomieszczenie tylko do własnego gospodarstwa,
5. admin nie może dodać L2 do pokoju z obcego gospodarstwa,
6. admin nie może dodać L3 do L2 z obcego gospodarstwa,
7. domownik nie może modyfikować struktury domu,
8. dziecko nie może modyfikować struktury domu.

## 12. Testy

### 12.1. Testy bazy

Uruchomić:

```powershell
npx.cmd supabase db reset
npx.cmd supabase test db
```

Testy powinny objąć:

- relacje `room -> storage_location_l2 -> storage_location_l3`,
- RLS dla odczytu,
- RLS dla zapisu admina,
- brak zapisu dla `domownik`,
- brak zapisu dla `dziecko`,
- brak dostępu między gospodarstwami.

### 12.2. Testy aplikacji

Scenariusze ręczne:

1. zalogowany admin wchodzi na `/home`,
2. admin dodaje pomieszczenie,
3. admin dodaje miejsce L2,
4. admin dodaje pozycję L3,
5. admin widzi wygenerowany kod lokalizacji,
6. admin edytuje pomieszczenie,
7. admin edytuje L2,
8. admin edytuje L3,
9. niezalogowany użytkownik nie ma dostępu do `/home`,
10. użytkownik z innego gospodarstwa nie widzi cudzej struktury.

### 12.3. Testy jakości

Uruchomić:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

Dwa ostrzeżenia `moderate` PostCSS z Next.js, jeśli nadal występują i nie mają dostępnej bezpiecznej poprawki, pozostają znanym ryzykiem zależności frameworka.

## 13. Kryteria akceptacji

M2 można uznać za zakończony, gdy:

- `/home` działa dla zalogowanego użytkownika,
- admin widzi strukturę własnego gospodarstwa,
- admin może dodać, edytować i usuwać puste pomieszczenia,
- admin może dodać, edytować i usuwać puste miejsca L2,
- admin może dodać, edytować i usuwać nieużywane pozycje L3,
- kod lokalizacji L3 jest generowany albo poprawnie zapisywany,
- domownik i dziecko nie mogą modyfikować struktury domu,
- dane innego gospodarstwa są niewidoczne,
- RLS pozostaje aktywne,
- testy pgTAP przechodzą,
- lint i build przechodzą,
- nie dodano funkcji spoza MVP,
- nie dodano sekretów,
- nie utworzono publicznych bucketów.

## 14. Ryzyka

### 14.1. RLS przez relacje pośrednie

`storage_location_l2` nie ma bezpośrednio `household_id`, tylko `room_id`.  
`storage_location_l3` nie ma bezpośrednio `household_id`, tylko `storage_location_l2_id`.

Ryzyko: błędna polityka może dopuścić odczyt lub zapis przez obce relacje.

Ograniczenie ryzyka:

- testy pgTAP dla relacji pośrednich,
- walidacja `room.household_id` przy L2,
- walidacja `room.household_id` przez L2 przy L3.

### 14.2. Usuwanie struktur używanych później przez przedmioty

Na tym etapie CRUD przedmiotów nie jest implementowany, ale tabela `item_location` istnieje.

Ryzyko: późniejsze przedmioty mogą wskazywać na L3, którego nie wolno usuwać.

Ograniczenie ryzyka:

- w M2 zakazać usuwania L3, jeśli istnieje powiązanie z `item_location`.

### 14.3. Zbyt szerokie uprawnienia domownika

Decyzje projektowe ograniczają rolę `domownik` do przypisywania/przenoszenia przedmiotów i archiwizacji własnych przedmiotów. Dlatego w M2 `domownik` nie powinien edytować struktury domu.

### 14.4. Przedwczesne dodanie Storage

Zdjęcia pomieszczeń są opcjonalnie opisane w produkcie, ale ich implementacja wymagałaby Storage, polityk bucketów i osobnych decyzji.

W M2 zdjęcia pomieszczeń są poza zakresem.

## 15. Wymaga decyzji

Na tym etapie brak decyzji blokujących implementację podstawowego M2.

Potencjalne decyzje późniejsze:

1. Czy zdjęcia pomieszczeń mają wejść do pełnego MVP, czy dopiero po M2?
2. Czy `domownik` może kiedykolwiek edytować strukturę domu, czy zawsze tylko admin?
3. Czy kod lokalizacji ma być w pełni automatyczny, czy edytowalny ręcznie przez admina?
4. Czy usuwanie pomieszczeń ma być fizyczne, czy przez archiwizację?

Dla M2 przyjmujemy:

- zdjęć nie implementujemy,
- strukturę edytuje tylko admin,
- kod lokalizacji może być generowany i edytowany przez admina,
- usuwanie jest możliwe tylko dla pustych elementów struktury.

## 16. Raport po wykonaniu

Po zakończeniu implementacji należy przygotować raport:

```text
docs/decisions/milestone-02-home-structure.md
```

Raport powinien zawierać:

- co zmieniono,
- dodane i edytowane pliki,
- zgodność z MVP,
- wpływ na bazę danych,
- wpływ na RLS,
- bezpieczeństwo,
- testy,
- znane ograniczenia,
- kwestie wymagające decyzji,
- następny etap.

## 17. Następny etap po M2

Po zamknięciu M2 następnym logicznym etapem będzie:

```text
M3 — Inventory: pierwszy CRUD przedmiotów
```

M3 powinien obejmować dopiero wtedy:

- listę przedmiotów,
- dodawanie przedmiotu,
- przypisanie kategorii,
- przypisanie lokalizacji L3,
- podstawowe filtrowanie,
- RLS dla odczytu i zapisu przedmiotów.
