# M4C.1 v2 - kopiowanie encji

Status: **OWNER MANUAL ACCEPTANCE: PASS. Gotowe do commita na branchu funkcji.**

## Kontekst

Historyczny branch `feature/m4c1-copy-entities` i tag
`m4c-1-copy-entities-stable` pozostają niezmienionym checkpointem. Audyt po
zamknięciu M4D wykazał, że jego migracja, testy i uniwersalny dialog nie
spełniają aktualnego kontraktu M4D. M4C.1 v2 jest ręcznym portem z aktualnego
`main`, bez rebase ani przenoszenia starej implementacji SQL.

Przyszły tag po pełnym odbiorze: `m4c-1-copy-entities-v2-stable`.

## Role i granice

| Encja | Dozwolone role | Zakres |
| --- | --- | --- |
| Pomieszczenie | administrator | Pomieszczenie oraz opcjonalnie Meble i Schowki |
| Mebel | administrator | Mebel oraz opcjonalnie Schowki |
| Schowek | administrator | Wyłącznie Schowek |
| Rzecz | administrator, domownik | Dane użytkowe oraz opcjonalna jedna główna lokalizacja |

Dziecko nie może kopiować żadnej encji. Klient nie przekazuje `household_id`.
RPC wyznacza aktywne gospodarstwo z profilu po stronie bazy, a Server Action
powtarza kontrolę roli i walidację payloadu.

## Macierz danych

| Encja | Kopiowane | Generowane ponownie | Pomijane |
| --- | --- | --- | --- |
| Pomieszczenie | `typ`, `ikona`, `opis` | UUID, nazwa, kolejność, daty | Rzeczy, lokalizacje Rzeczy, historia, pliki |
| Mebel | `typ`, `opis` | UUID, nazwa, kolejność | Rzeczy, lokalizacje Rzeczy, historia, pliki |
| Schowek | `opis` | UUID, nazwa, kod, kolejność | QR/NFC, Rzeczy, historia, pliki |
| Rzecz | kategoria, nazwa, opis, typ, ilość, jednostka, termin, notatki, poprawny opiekun | UUID, aktywny status, `created_by_id`, wybrana lokalizacja, daty | status archiwalny, historia, pliki, zdjęcia, techniczne identyfikatory |

Kopia Rzeczy ma status `w domu`. Opiekun jest zachowany tylko dla aktywnego
profilu tego samego gospodarstwa; w pozostałych przypadkach jest `null`.

## Nazwy, kody i współbieżność

Domyślna nazwa to `<nazwa> — kopia`; kolejne kolizje otrzymują numer 2, 3 i
dalej. Porównanie używa `lower(btrim(nazwa))`. Transakcyjne advisory locki
serializują kopiowanie w zakresie gospodarstwa, docelowego Pomieszczenia lub
docelowego Mebla, zależnie od encji.

Kody Schowków tworzy SQL-owy odpowiednik algorytmu `generateLocationCode`:
te same segmenty, aliasy i normalizacja co w TypeScript. Dla kopii wybierany
jest kolejny wolny standardowy segment końcowy, nigdy zmodyfikowany kod
źródłowy ani losowy sufiks. Testy pgTAP sprawdzają zgodność znanych aliasów.

## Granice odpowiedzialności

- DB/RPC: auth, household, role, źródło, cel, nazwy, kody, UUID, atomowość i
  rollback.
- Server Action: UUID i payload, rola aplikacyjna, mapowanie kodów błędów,
  rewalidacja oraz redirect statusu URL.
- UI: wariant dialogu dla encji, wybór dozwolonych opcji, loading, anulowanie,
  Escape, focus return i komunikaty z lokalnego słownika.

Trzy RPC struktury są `SECURITY INVOKER` z `search_path = ''`. `copy_item`
jest jedynym wyjątkiem `SECURITY DEFINER`: obecne RLS dopuszcza insert do
`item` i `item_location` wyłącznie administratorowi, a zatwierdzony kontrakt
pozwala Domownikowi skopiować Rzecz bez nadania mu ogólnego prawa tworzenia
Rzeczy. Funkcja ma pusty search path, używa wyłącznie w pełni kwalifikowanych
odwołań bez dynamicznego SQL, sprawdza auth, aktywny profil, rolę, źródło i cel
w tym samym gospodarstwie; wykonanie jest przyznane wyłącznie `authenticated`.

## Testy i odbiór

Testy logiki obejmują nazwy, role, payload, zależne selektory, i18n i feedback.
pgTAP wykonuje rzeczywiste RPC dla danych, ról, izolacji, kodów, rollbacku i
równoległych kopii. E2E pozostaje zakresem późniejszego zespołu testowego.

Odbiór wymaga PASS dla logic, lint, build, pgTAP oraz ręcznej checklisty dla
czterech dialogów na 375 px, 768 px i desktop. Nie obejmuje kopiowania między
gospodarstwami, masowego kopiowania, zdjęć, plików ani historii.

## Finalizacja odbioru

Owner manual acceptance: **PASS**.

Koncowy zakres odbioru obejmuje:

- kopiowanie Pomieszczenia, Mebla, Schowka i Rzeczy;
- kopiowanie Rzeczy do `Bez lokalizacji`;
- zalezne selektory Pomieszczenie -> Mebel -> Schowek i reset zaleznych wyborow;
- jawny wynik Server Action, zamykanie dialogow po sukcesie, zakonczenie pending, `router.refresh()` i blokade double submit;
- poprawke crasha zaleznych selektorow przez przechwytywanie wartosci eventu przed callbackiem aktualizacji stanu;
- aplikacyjny dialog trwalego usuwania Rzeczy zamiast `window.confirm()`.
