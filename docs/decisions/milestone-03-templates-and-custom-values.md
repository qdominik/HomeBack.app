# Milestone 03: Szablony i wlasne wartosci

Data: 2026-07-09  
Status: wykonany i zweryfikowany lokalnie  
Projekt: HomeBack.app  
Poprzedni milestone: M2 - Dom / Structure

## 1. Cel

Celem M3 bylo dodanie jednoznacznego mechanizmu:

```text
wybierz z szablonu albo wybierz Inne i wpisz wlasna wartosc
```

Zakres obejmuje:

- pomieszczenia,
- miejsca L2,
- kategorie systemowe i wlasne.

## 2. Zmieniono

- dodano wspolny komponent `TemplateOrCustomField`,
- zastapiono poprzednie pole `Rodzaj` w module Dom wyborem z szablonu i polem wlasnej wartosci,
- dodano szablony pomieszczen zgodne z M3,
- dodano szablony miejsc L2 zgodne z M3,
- zachowano automatyczne podpowiadanie rodzaju na podstawie pola `Nazwa`,
- dodano minimalny widok kategorii z listami kategorii systemowych i wlasnych,
- dodano formularz tworzenia kategorii wlasnej,
- dodano edycje nazwy kategorii wlasnej,
- dodano usuwanie kategorii wlasnej, z blokada dla kategorii uzywanej przez `item`,
- dodano szablony kategorii,
- dodano normalizacje wartosci szablonow niezalezna od wielkosci liter, polskich znakow i nadmiarowych spacji.
- usunieto poprzedni komponent `src/components/home/home-kind-input.tsx`, poniewaz M3 ma jeden wspolny komponent szablon/wlasna wartosc.

M3.1 rozdziela w formularzu wybor szablonu od wartosci wlasnej i server
actions jednoznacznie zapisuje wynik do rodzaju pomieszczenia, miejsca L2
oraz nazwy kategorii. Poprawka blokuje zduplikowane nazwy pomieszczen, miejsc
L2, pozycji L3 i kategorii wlasnych. Gdy kolejnosc pozostaje pusta, serwer
ustawia maksymalna istniejaca wartosc plus jeden.

## 3. Pliki Dodane

- `src/components/form/template-or-custom-field.tsx`
- `src/lib/templates/normalize-template-value.ts`
- `src/lib/templates/infer-template-option.ts`
- `src/lib/home/home-template-options.ts`
- `src/lib/categories/category-template-options.ts`
- `src/app/(app)/categories/actions.ts`
- `src/components/categories/category-form.tsx`
- `src/components/categories/category-card.tsx`
- `supabase/tests/0004_custom_categories_rls.test.sql`
- `docs/decisions/milestone-03-templates-and-custom-values.md`

## 4. Pliki Edytowane

- `src/components/home/room-form.tsx`
- `src/components/home/storage-location-l2-form.tsx`
- `src/lib/home/infer-home-kind.ts`
- `src/lib/home/home-kind-suggestions.ts`
- `src/lib/home/location-code.ts`
- `src/app/(app)/categories/page.tsx`
- `src/lib/i18n/types.ts`
- `src/lib/i18n/locales/pl.ts`
- `src/lib/i18n/locales/en.ts`
- `supabase/tests/0003_home_structure_rls.test.sql`
- `docs/decisions/decision-log.md`
- `docs/decisions/milestone-02-home-structure.md`

Usuniete:

- `src/components/home/home-kind-input.tsx`

## 5. Zgodnosc Z MVP

Zmiana miesci sie w modulach Dom / Structure i Kategorie.

Nie dodano:

- CRUD przedmiotow,
- zdjec,
- uploadu plikow,
- Supabase Storage,
- QR/NFC,
- AI,
- Home Assistant,
- mapy 2D,
- aplikacji mobilnej native,
- platnosci,
- nowych zaleznosci,
- nowych tras,
- nowych tabel.

## 6. Baza Danych

M3 nie dodalo migracji.

M3.1 dodaje migracje 0004_unique_home_and_category_names.sql z indeksami
unikalnymi dla znormalizowanych nazw:

- room: gospodarstwo i nazwa,
- storage_location_l2: pomieszczenie i nazwa,
- storage_location_l3: miejsce L2 i nazwa,
- category: gospodarstwo i nazwa, tylko dla kategorii wlasnych.

M3 korzysta z istniejacego modelu:

- `room.typ` jako `text`,
- `storage_location_l2.typ` jako `text`,
- `category` dla kategorii systemowych i wlasnych,
- `item.category_id` do blokady usuwania uzywanej kategorii.

Kategorie systemowe pozostaja:

- `household_id = null`,
- `czy_systemowa = true`,
- `key` ustawione.

Kategorie wlasne sa zapisywane jako:

- `household_id = household_id aktywnego profilu`,
- `czy_systemowa = false`,
- `key = null`,
- `nazwa = wartosc wybrana lub wpisana przez uzytkownika`,
- `widoczna_dla_dzieci = true`.

## 7. Wplyw Na RLS

Nie zmieniono RLS.

Istniejace polityki z `0002_initial_rls.sql` pokrywaja M3:

- uzytkownik widzi kategorie systemowe oraz dozwolone kategorie swojego gospodarstwa,
- uzytkownik nie widzi kategorii wlasnych innego gospodarstwa,
- zapis kategorii wlasnych ma tylko `admin`,
- `domownik` i `dziecko` nie moga tworzyc kategorii,
- systemowych kategorii nie da sie edytowac przez aplikacje.

## 8. Bezpieczenstwo

- RLS pozostaje wlaczone.
- Nie uzyto `service_role` w aplikacji.
- Nie dodano sekretow.
- Nie utworzono publicznych bucketow.
- Server actions dla kategorii pobieraja aktywny profil i wymagaja roli `admin`.
- Zapis kategorii wlasnej zawsze ustawia `household_id` z aktywnego profilu.
- Usuwanie kategorii wlasnej jest blokowane, jesli istnieje powiazany `item`.
- Dane uzytkownika nie sa tlumaczone automatycznie.

## 9. Testy

Zaliczone:

- `npx.cmd supabase db reset`
- `npx.cmd supabase test db` - 4 pliki, 81 testow, PASS
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test:logic` - 4 testy logiki szablonow, PASS

Audyt:

- `npm.cmd audit --omit=dev` zostal uruchomiony.
- Audyt nadal zglasza 2 ostrzezenia `moderate` dla `postcss` jako zaleznosci `next`.
- Nie uruchamiano `npm audit fix --force`, poniewaz proponuje lamliwa zmiane wersji Next.js.

E2E:

- Dodano `playwright.config.ts`.
- Dodano `tests/e2e/m3-templates-and-custom-values.spec.ts`.
- Dodano skrypt `npm.cmd run test:e2e`.
- Test E2E obejmuje rejestracje, lokalne potwierdzenie e-mail przez Mailpit, utworzenie gospodarstwa, Dom i Kategorie.
- Uruchomienie E2E jest obecnie zablokowane, poniewaz `@playwright/test` nie zostal zainstalowany: proba `npm.cmd install --save-dev @playwright/test@^1.51.1` zostala odrzucona przez srodowisko przy dostepie do rejestru npm, a druga proba z lokalnym cache przekroczyla limit czasu.
- `package-lock.json` nie zostal recznie zmieniony, zeby nie rozspojnic lockfile z faktycznie zainstalowanymi pakietami.

Weryfikacja M3.1:

- supabase db reset: PASS,
- supabase test db: 5 plikow, 99 testow, PASS,
- test logiki szablonow: 5 testow, PASS,
- lint: PASS,
- build: PASS.

Audyt produkcyjnych zaleznosci nadal zglasza 2 ostrzezenia moderate dla
postcss jako przechodniej zaleznosci Next.js. Nie uruchomiono wymuszonej
automatycznej naprawy, poniewaz proponuje ona lamliwa zmiane Next.js.

## 10. Znane Ograniczenia

- Nie wykonano CRUD przedmiotow.
- Kategorie wlasne maja domyslnie `widoczna_dla_dzieci = true`.
- Nie dodano edycji ikony ani koloru kategorii wlasnej.
- Nie dodano osobnego przelacznika widocznosci kategorii dla dzieci.
- Wybieranie szablonu kategorii systemowej nie duplikuje kategorii systemowej; aplikacja pokazuje status, ze taka kategoria jest juz dostepna.

## 11. Wymaga Decyzji

- [WYMAGA DECYZJI] Czy w kolejnym etapie kategorie wlasne maja miec przelacznik `widoczna_dla_dzieci`.
- [WYMAGA DECYZJI] Czy edycja kategorii wlasnej w MVP ma obejmowac takze `ikona` i `kolor`, czy tylko nazwe do czasu CRUD przedmiotow.

## 12. Przed Inventory / CRUD Przedmiotow

Przed startem CRUD przedmiotow pozostaje przygotowac osobny plan dla:

- formularza przedmiotu,
- wyboru kategorii,
- wyboru lokalizacji L3,
- roli `domownik` przy przypisywaniu i przenoszeniu przedmiotow,
- roli `dziecko` dla zapisu "odlozone",
- archiwizacji przedmiotow,
- ewentualnych plikow i zdjec, jezeli wejda do zakresu danego etapu.

## 13. M3.1 - Naprawa Zapisu I Jednoznacznosci

Przyczyna zapisywania wartosci Inne byla niejednoznaczna komunikacja
formularza z server action: formularz wysylal tylko pomocnicze ukryte pole,
ktore moglo pozostac przy wartosci domyslnej.

M3.1 wysyla osobno wybrany szablon i wpisana wartosc wlasna. Server action
zapisuje etykiete wybranego szablonu, a po wyborze Inne zapisuje tylko
przycieta wartosc wlasna albo Inne, gdy wartosc pozostaje pusta.

Walidacja server action daje czytelny blad przed zapisem. Indeksy unikalne
w bazie stanowia niezalezna ochrone przed rownoleglymi zapisami. RLS nie
zostal zmieniony.
