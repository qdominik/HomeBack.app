# M4D.5 - bezpieczny dialog usuwania Pozycji L3

Status: Zaimplementowano, zweryfikowano automatycznie, zaakceptowano recznie i zapisano jako stabilny checkpoint.

Data: 2026-07-18

## Cel

M4D.5 zastepuje proste potwierdzenie usuniecia Pozycji L3 dostepnym dialogiem
krokowym. Administrator moze usunac pusta Pozycje, odpiac wszystkie jej
powiazania z Rzeczami albo przeniesc glowne lokalizacje do jednej innej Pozycji
L3. Rekordy Rzeczy i nadrzedny Schowek pozostaja bez zmian.

## Wykorzystanie M4D.2-M4D.4

- M4D.2 dostarcza aktualne podsumowanie aktywnych i archiwalnych Rzeczy oraz
  linkow glownych i dodatkowych;
- M4D.3 usuwa wszystkie pozostale linki z usuwanej Pozycji;
- M4D.4 przenosi glowne linki do jednej wybranej Pozycji docelowej;
- sygnatury i semantyka istniejacych RPC nie zostaly zmienione.

## Atomowa RPC

Migracja `0012_m4d5_delete_position_with_resolution.sql` dodaje funkcje:

`delete_storage_location_l3_with_resolution(p_storage_location_l3_id uuid, p_resolution text, p_target_storage_location_l3_id uuid, p_expected_distinct_item_count bigint, p_expected_location_link_count bigint)`

Funkcja dziala jako `security invoker` i wykonuje rozstrzygniecie zaleznosci
oraz finalny DELETE Pozycji w jednej transakcji. Wewnetrzny blok wyjatkow jest
podtransakcja: blad przenoszenia, odpinania albo DELETE wycofuje wszystkie
zmiany i zwraca bezpieczny kod `DELETE_FAILED`.

## Tryby

- `delete` jest dozwolony wylacznie dla Pozycji bez Rzeczy i bez linkow;
- `detach` wywoluje semantyke M4D.3, usuwa wszystkie linki zrodla, pozostawia
  Rzeczy oraz ich linki poza zrodlem, a nastepnie usuwa Pozycje;
- `move` wywoluje M4D.4 dla linkow glownych, M4D.3 dla pozostalych linkow
  zrodla, a nastepnie usuwa Pozycje. Linki dodatkowe poza zrodlem pozostaja.

Cel jest wymagany tylko dla `move`, musi nalezec do tego samego gospodarstwa i
nie moze byc usuwana Pozycja. Anulowanie nie jest trybem RPC i nie wykonuje
zadnej mutacji.

## Ochrona przed nieaktualnym dialogiem

RPC ponownie pobiera podsumowanie M4D.2 i porownuje aktualna liczbe unikalnych
Rzeczy oraz wszystkich linkow z licznikami przekazanymi po otwarciu dialogu.
Roznica zwraca `DEPENDENCIES_CHANGED` przed mutacja. UI ponownie pobiera wtedy
kontekst, pozostawia Pozycje i nie pokazuje falszywego sukcesu.

## Finalne usuniecie i kontrakt wyniku

Po rozwiazaniu zaleznosci usuwany jest dokladnie wskazany rekord
`storage_location_l3`. Schowek, Pomieszczenie, pozostale Pozycje, Rzeczy i
Kategorie nie sa usuwane.

Wynik zawiera status, tryb, identyfikator usunietej Pozycji oraz liczniki:

- wszystkich dotknietych Rzeczy;
- aktywnych i archiwalnych Rzeczy;
- przeniesionych glownych lokalizacji;
- odpietych linkow;
- ponownie wykorzystanych i nowo utworzonych linkow docelowych.

Warstwa TypeScript waliduje zamkniety zbior trybow, UUID, nieujemne liczniki,
obecnosc celu i inwarianty odpowiedzi. Do UI nie trafia surowy blad Supabase,
kod PostgreSQL, nazwa constraintu ani polityki RLS.

## Autoryzacja i granty

Operacja wymaga sesji, aktywnego profilu i roli administratora. Gospodarstwo
jest ustalane z profilu po stronie bazy; klient nie przekazuje `household_id`.
Zrodlo i cel sa sprawdzane w tym gospodarstwie. Funkcja nie uzywa service role.
`PUBLIC` i `anon` nie maja EXECUTE, a `authenticated` ma EXECUTE.

## Server actions

- `getStorageLocationL3DeletionContext` pobiera na zadanie podsumowanie M4D.2
  oraz liste bezpiecznych celow, bez N+1 podczas renderowania kart;
- `deleteStorageLocationL3WithResolution` waliduje wejscie, wywoluje jedna
  finalna RPC i po sukcesie rewaliduje `/home` oraz `/items`.

Dotychczasowa akcja `deleteStorageLocationL3` pozostala w kodzie, ale karta
Pozycji korzysta z nowego dialogu i atomowej akcji.

## Dialog i dostepnosc

Osobny komponent klientowy uzywa natywnego `<dialog>`. Po otwarciu pobiera
aktualny kontekst, pokazuje stan ladowania i nie wykonuje mutacji. Dla zaleznosci
nie wybiera domyslnej decyzji ani celu. Finalny krok ponownie pokazuje nazwe
Pozycji, decyzje, cel i liczniki.

Dialog:

- ma tytul, opis, widoczny focus i obsluge klawiatury;
- zamyka sie przez Anuluj lub Escape przed wyslaniem;
- podczas wysylania blokuje zamkniecie i ponowny submit;
- po zamknieciu przywraca focus na przycisk Usun;
- przy braku alternatywnego celu blokuje tylko opcje przeniesienia;
- po sukcesie zamyka sie i odswieza dane routera.

## Responsywnosc

Na 375 px dialog ma pelna dostepna szerokosc, wewnetrzny pionowy scroll,
zawijane sciezki celu i przyciski mieszczace sie w kontenerze. Na tablecie i
desktopie ma ograniczona szerokosc, zwarty uklad licznikow i nierozciagniete
akcje. Select celu pozostaje czytelny i nie powoduje poziomego scrolla.

## Brak zmian L2 i Room

Karty, dialogi, server actions i semantyka usuwania Pomieszczen oraz Schowkow L2
nie zostaly zmienione. M4D.5 dotyczy wylacznie jednej Pozycji L3.

## Testy automatyczne

Test pgTAP M4D.5 zawiera 73 asercje obejmujace tryby `delete`, `detach` i
`move`, aktywne i archiwalne Rzeczy, linki zewnetrzne, walidacje celu i trybu,
role, izolacje gospodarstw, granty, `DEPENDENCIES_CHANGED`, liczniki oraz
wycofanie detach i move po wymuszonym bledzie finalnego DELETE.

Pelny zestaw pgTAP przechodzi: 543/543. Testy logiki przechodza: 112/112 i
obejmuja parser, inwarianty, bezpieczne bledy, cele, sciezki oraz stan przycisku
finalnego. Lint i build przechodza.

Wyniki checkpointu:

- pgTAP: 543/543, w tym 73 asercje M4D.5;
- test:logic: 112/112;
- lint: sukces;
- build: sukces;
- git diff --check: sukces;
- reczny odbior: zaliczony.

## Reczny odbior - zaakceptowany

Wlasciciel zaakceptowal pusta Pozycje, anulowanie, detach, widok Bez lokalizacji, move, brak alternatywnego celu wraz z komunikatem noTarget, Escape i przywracanie focusu oraz widoki 375 px, tablet i desktop.

### Pusta Pozycja

1. Utworz pusta Pozycje, otworz Usun i sprawdz prosty dialog.
2. Anuluj i potwierdz, ze Pozycja pozostala.
3. Otworz dialog ponownie, usun trwale i potwierdz pozostanie Schowka oraz
   innych Pozycji.

### Odpiecie

1. Umiesc aktywna Rzecz w Pozycji, otworz dialog i sprawdz liczniki.
2. Wybierz pozostawienie bez lokalizacji, przejdz do podsumowania i anuluj.
3. Powtorz operacje i zatwierdz.
4. Potwierdz usuniecie Pozycji, pozostanie Rzeczy i jej widocznosc w widoku
   Bez lokalizacji.
5. Powtorz scenariusz z Rzecza archiwalna i potwierdz jej pozostanie w
   Archiwalne.

### Przeniesienie

1. Przygotuj zrodlowa i docelowa Pozycje oraz Rzecz w zrodle.
2. Wybierz przeniesienie i potwierdz, ze cel nie jest wybrany automatycznie.
3. Wybierz cel, zatwierdz i sprawdz usuniecie zrodla oraz nowa glowna
   lokalizacje Rzeczy.
4. Potwierdz pozostanie celu, jego struktury i dodatkowych linkow poza zrodlem.

### Brak celu i dostepnosc

1. Pozostaw tylko jedna Pozycje i sprawdz, ze przeniesienie jest niedostepne,
   ale odpiecie i anulowanie dzialaja.
2. Sprawdz 375 px, tablet i desktop, Escape, przywracanie focusu, brak
   poziomego scrolla, brak podwojnego submitu i brak bledow runtime/RSC.

## Poza zakresem

- usuwanie Schowka wraz z poddrzewem;
- usuwanie Pomieszczenia wraz z poddrzewem;
- M4D.6, M4D.7 i M4D.8;
- przenoszenie dodatkowych linkow do celu lub wybieranie wielu celow;
- indywidualne ikony Rzeczy;
- automatyczna retencja.
