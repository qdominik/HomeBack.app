# Przywracanie archiwalnych Rzeczy

Status: Zaimplementowano, przetestowano automatycznie i zaakceptowano ręcznie
w dostępnych scenariuszach.

## Problem

Dotychczasowa akcja archiwizacji wykonywala bezposredni `UPDATE` statusu na
`archiwalne`. Poprzedni status byl tracony, dlatego nie mozna bylo bezpiecznie
przywrocic Rzeczy do jej rzeczywistego stanu.

## Model danych

Migracja `0009_item_archive_restore.sql` dodaje do `item`:

- `archived_at timestamptz null`;
- `status_before_archive public.item_status null`.

Constraint dopuszcza `NULL`, ale zabrania `archiwalne` w
`status_before_archive`. Istniejace archiwalne rekordy otrzymuja
`archived_at = COALESCE(updated_at, created_at)`. Ich poprzedni status pozostaje
`NULL`, poniewaz nie mozna go wiarygodnie odtworzyc.

## Atomowe operacje

`archive_item(uuid)` blokuje rekord, odczytuje jego aktualny status i w jednym
UPDATE zapisuje poprzedni status, czas archiwizacji oraz status `archiwalne`.

`restore_item(uuid, item_status)` blokuje rekord i uzywa zapisanego
`status_before_archive`. Parametr statusu jest wymagany tylko dla starszego
rekordu z `NULL`. Po przywroceniu oba pola archiwizacji sa czyszczone.

Obie funkcje sa `security invoker`, korzystaja z istniejacego RLS i wymagaja
aktywnego administratora gospodarstwa. `PUBLIC` i `anon` nie maja EXECUTE;
`authenticated` ma grant, ale autoryzacja pozostaje wewnatrz RPC. Obce i
nieistniejace UUID zwracaja ten sam bezpieczny rezultat.

## UI i legacy

Nowo archiwalna Rzecz pokazuje akcje `Przywroc`, ktora automatycznie odtwarza
status sprzed archiwizacji. Starsza Rzecz z `status_before_archive = NULL`
wymaga jawnego wyboru: W domu, Pozyczone albo Zuzyte. Brak domyslnego wyboru,
a przycisk jest niedostepny do wskazania statusu.

Archiwalna Rzecz zachowuje akcje trwalego usuniecia. Aktywna Rzecz zachowuje
Edytuj, Archiwizuj i Usun.

## Zachowanie danych

Archiwizacja i przywracanie nie zmieniaja `item_location`, kategorii, ilosci,
opisu ani innych danych Rzeczy. Nie zmieniono `delete_item_permanently`, jego
blokad plikow ani atomowego usuwania lokalizacji podczas trwalego DELETE.

## Poza zakresem

Nie dodano automatycznej retencji, harmonogramu usuwania, indywidualnej ikony
Rzeczy ani M4D.3-M4D.5.

## Testy automatyczne

- `npx.cmd supabase stop` i `npx.cmd supabase start`: sukces;
- `npx.cmd supabase db reset`: sukces, migracja 0009 zastosowana;
- pgTAP: 305/305, w tym kolumny i constraint, granty, trzy statusy, legacy,
  role, izolacja gospodarstw, zachowanie lokalizacji, rollback obu RPC oraz
  regresja trwalego usuwania;
- `npm.cmd run test:logic`: 83/83;
- `npm.cmd run lint`: sukces;
- `npm.cmd run build`: sukces;
- `git diff --check`: sukces.

## Ręczny odbiór

Właściciel projektu potwierdził:

- archiwizację i przywrócenie Rzeczy ze statusem `w domu`;
- automatyczne usunięcie przywróconej Rzeczy z widoku Archiwalne i jej
  ponowne pojawienie się we Wszystkie;
- pojawienie się przywróconej Rzeczy bez lokalizacji także w widoku Bez
  lokalizacji;
- zachowanie kategorii, opisu, ilości, lokalizacji i pozostałych danych;
- brak regresji trwałego usuwania: Anuluj zachowuje Rzecz, a potwierdzenie
  usuwa ją trwale przez niezmieniony `ConfirmDeleteButton`;
- poprawne działanie na 375 px, tablecie i desktopie, bez poziomego scrolla,
  nakładania akcji, podwójnego submitu oraz błędów runtime i RSC.

Scenariusze przywracania statusów Pożyczone i Zużyte oraz obsługa
starszego rekordu bez `status_before_archive` nie zostały wykonane ręcznie
z powodu braku odpowiedniego UI i danych legacy. Zostały pokryte testami
automatycznymi pgTAP i testami logiki.
