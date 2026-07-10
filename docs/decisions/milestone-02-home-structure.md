# Milestone 02: Modul Dom / Structure

Data: 2026-07-09  
Status: wykonany i zweryfikowany lokalnie, z poprawkami M2.1 i M2.2  
Projekt: HomeBack.app  
Poprzedni milestone: M1 - Pierwszy dzialajacy prototyp

## 1. Cel

Celem M2 bylo zbudowanie modulu Dom / Structure przed rozpoczeciem CRUD przedmiotow.

Zakres obejmuje trojpoziomowa strukture lokalizacji:

```text
Pomieszczenie -> Miejsce przechowywania L2 -> Pozycja szczegolowa L3
```

## 2. Zmieniono

- rozbudowano trase `/home` z placeholdera do dzialajacego widoku struktury domu,
- dodano liste pomieszczen z licznikami miejsc L2 i pozycji L3,
- dodano formularze tworzenia, edycji i usuwania pustych pomieszczen,
- dodano formularze tworzenia, edycji i usuwania pustych miejsc L2,
- dodano formularze tworzenia, edycji i usuwania pozycji L3 nieuzywanych przez `item_location`,
- dodano generowanie kodu lokalizacji L3 w formacie `ROOM-L2-L3`,
- zmieniono `room.typ` i `storage_location_l2.typ` z enumow na elastyczne pola `text`,
- zamieniono sztywne listy wyboru typu na elastyczne pola tekstowe z sugestiami,
- poprawiono M2.2 po tescie recznym: natywny `datalist` zastapiono prostym wlasnym comboboxem, poniewaz wartosc `Inne` filtrowala liste do jednej sugestii,
- zmieniono etykiete pola z `Typ` na `Rodzaj`,
- dodano inteligentne podpowiadanie pola `Rodzaj` na podstawie pola `Nazwa`,
- zachowano mozliwosc recznego wpisania wlasnego rodzaju bez automatycznego nadpisywania,
- ukryto kontrolki zapisu dla rol innych niz `admin`,
- dodano test pgTAP dla RLS i relacji modulu Dom,
- poprawiono stare asercje testu schematu, aby byly zgodne z aktualna wersja pgTAP.

## 3. Pliki

Dodane:

- `src/app/(app)/home/actions.ts`
- `src/components/home/home-kind-input.tsx`
- `src/components/home/home-types.ts`
- `src/components/home/room-card.tsx`
- `src/components/home/room-form.tsx`
- `src/components/home/storage-location-l2-card.tsx`
- `src/components/home/storage-location-l2-form.tsx`
- `src/components/home/storage-location-l3-card.tsx`
- `src/components/home/storage-location-l3-form.tsx`
- `src/lib/home/home-kind-suggestions.ts`
- `src/lib/home/infer-home-kind.ts`
- `src/lib/home/location-code.ts`
- `supabase/migrations/0003_flexible_home_structure_types.sql`
- `supabase/tests/0003_home_structure_rls.test.sql`
- `docs/decisions/milestone-02-home-structure.md`

Edytowane:

- `src/app/(app)/home/page.tsx`
- `src/lib/i18n/types.ts`
- `src/lib/i18n/locales/pl.ts`
- `src/lib/i18n/locales/en.ts`
- `src/types/database.ts`
- `supabase/tests/0001_initial_schema.test.sql`
- `docs/decisions/decision-log.md`

## 4. Zgodnosc Z MVP

Zmiana miesci sie w module Dom / Structure.

Nie dodano:

- CRUD przedmiotow,
- zdjec pomieszczen,
- uploadu plikow,
- bucketow Supabase Storage,
- QR/NFC,
- dokumentow,
- AI,
- Home Assistant,
- mapy 2D,
- aplikacji mobilnej native,
- multi-household,
- platnosci,
- zaproszen czlonkow gospodarstwa.

## 5. Baza Danych

Dodano migracje `supabase/migrations/0003_flexible_home_structure_types.sql`.

M2.2 nie dodaje kolejnej migracji.

Poprawka M2.2 po tescie recznym rowniez nie dodaje migracji.

Migracja:

- zmienia `public.room.typ` z enum na `text`,
- zmienia `public.storage_location_l2.typ` z enum na `text`,
- zachowuje istniejace wartosci przez `using typ::text`.

M2 nadal uzywa tych samych tabel:

- `room`,
- `storage_location_l2`,
- `storage_location_l3`,
- `item_location` tylko do sprawdzania, czy L3 jest uzywane.

## 6. RLS

Istniejace polityki RLS z migracji `0002_initial_rls.sql` pokrywaja M2, M2.1 i M2.2:

- aktywny uzytkownik widzi tylko strukture wlasnego gospodarstwa,
- L2 jest izolowane przez relacje do `room`,
- L3 jest izolowane przez relacje do L2 i `room`,
- zapis do struktury domu ma tylko `admin`,
- `domownik` i `dziecko` moga tylko odczytywac strukture.

Dodano test `supabase/tests/0003_home_structure_rls.test.sql`, ktory potwierdza izolacje, blokady zapisu oraz mozliwosc zapisu elastycznych wartosci `typ`.

M2.2 nie wymaga zmian RLS.

## 7. Bezpieczenstwo

- RLS pozostaje wlaczone.
- Nie uzyto `service_role` w aplikacji.
- Nie dodano sekretow.
- Nie utworzono publicznych bucketow.
- Server actions pobieraja `household_id` z aktywnego profilu i sprawdzaja role `admin`.
- Baza nadal egzekwuje ograniczenia przez RLS i klucze obce.
- Sugestie w UI nie ograniczaja zapisu do zamknietej listy wartosci.
- Automatyczne podpowiedzi nie nadpisuja recznie wpisanego rodzaju.
- Pole `Rodzaj` nie jest juz wypelniane wartoscia `Inne` na starcie formularza tworzenia; pusty rodzaj nadal jest bezpiecznie zamieniany na `Inne` dopiero w server action.

## 8. Testy

Zaliczone:

- `npx.cmd supabase db reset`
- `npx.cmd supabase test db`
- `npm.cmd run lint`
- `npm.cmd run build`

Audyt:

- `npm.cmd audit --omit=dev` zostal uruchomiony.
- Audyt nadal zglasza 2 ostrzezenia `moderate` dla `postcss` jako zaleznosci `next`.
- Nie uruchamiano `npm audit fix --force`, poniewaz proponuje lamliwa zmiane wersji Next.js.

## 9. Znane Ograniczenia

- Nie wykonano CRUD przedmiotow.
- Nie dodano zdjec pomieszczen ani Storage.
- Kod lokalizacji jest generowany aplikacyjnie i moze byc recznie edytowany przez administratora.
- Sugestie rodzaju sa startowo po polsku; wpisane wartosci wlasne sa przechowywane i wyswietlane bez automatycznego tlumaczenia.
- Usuwanie jest fizyczne, ale tylko dla pustych elementow struktury.

## 10. Wymaga Decyzji

Brak decyzji blokujacych M2.

Potencjalne decyzje pozniejsze:

- czy zdjecia pomieszczen wejda do pelnego MVP,
- czy `domownik` kiedykolwiek bedzie mogl edytowac strukture domu,
- czy kod lokalizacji ma miec bardziej formalny, w pelni deterministyczny format dla dowolnych wartosci `typ`,
- czy usuwanie struktur ma pozostac fizyczne, czy przejsc na archiwizacje.

## 11. Nastepny Etap

Po M2 wykonano osobny etap M3 - Szablony i wlasne wartosci dla Domu oraz Kategorii.

Pierwszy CRUD przedmiotow powinien wystartowac kolejnym osobnym planem, bo bedzie dotykal `item`, `item_location`, kategorii, uprawnien rol i potencjalnie plikow.
