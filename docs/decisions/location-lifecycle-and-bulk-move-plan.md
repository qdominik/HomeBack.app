# Plan: M4D - cykl zycia lokalizacji, Rzeczy bez lokalizacji i masowe przenoszenie

Data: 2026-07-12
Status: zatwierdzone przez wlasciciela - M4D.1 zaimplementowane i zaakceptowane recznie; M4D.2+ nierozpoczete

## 1. Stan obecny

Projekt jest na `master`, `HEAD` wskazuje commit `768d8c4` oraz tag
`m4a-items-admin-crud-stable`.

M4A jest wdrozone i obejmuje:

- CRUD Rzeczy dla administratora;
- opcjonalna lokalizacje L3 dla Rzeczy;
- jedna glowna lokalizacje Rzeczy przez indeks czesciowy
  `item_location_one_primary_per_item_unique`;
- RPC `set_item_primary_location(uuid, uuid)` jako `security invoker`;
- archiwizacje Rzeczy przez `item.status = 'archiwalne'`;
- brak trwalego usuwania Rzeczy w UI.

Obecna struktura lokalizacji:

- `room` ma `household_id`;
- `storage_location_l2` wskazuje `room_id`;
- `storage_location_l3` wskazuje `storage_location_l2_id`;
- `item_location` wskazuje `item_id` i `storage_location_l3_id`;
- brak lokalizacji Rzeczy oznacza brak glownego rekordu w `item_location`;
- w bazie nie istnieje i nie powinien powstac sztuczny rekord lokalizacji
  typu "Bez lokalizacji".

Obecne usuwanie struktury Domu w `src/app/(app)/home/actions.ts`:

- `deleteRoom` blokuje usuniecie, gdy istnieje co najmniej jeden L2;
- `deleteStorageLocationL2` blokuje usuniecie, gdy istnieje co najmniej jedna
  Pozycja L3;
- `deleteStorageLocationL3` blokuje usuniecie, gdy istnieje co najmniej jeden
  rekord `item_location` dla tej Pozycji.

Obecne constrainty bazy dodatkowo chronia integralnosc:

- `storage_location_l2.room_id` ma FK do `room(id)`;
- `storage_location_l3.storage_location_l2_id` ma FK do
  `storage_location_l2(id)`;
- `item_location.storage_location_l3_id` ma FK do `storage_location_l3(id)`;
- FK nie maja obecnie semantyki kaskadowej w migracji poczatkowej;
- pgTAP potwierdza bledy `23503` przy probie usuniecia room z L2, L2 z L3 i
  L3 uzywanej przez `item_location`.

## 2. Problem

Obecne blokady sa poprawne dla integralnosci danych, ale nie daja
administratorowi bezpiecznego sposobu rozstrzygniecia losu Rzeczy przed
usunieciem elementu struktury.

Uzytkownik musi moc:

1. przeniesc wszystkie Rzeczy z usuwanego zakresu do innej Pozycji L3;
2. pozostawic te Rzeczy bez lokalizacji;
3. anulowac operacje;
4. usunac Pozycje, Schowek albo Pomieszczenie dopiero po rozstrzygnieciu
   zaleznosci.

## 3. Decyzje juz przyjete

- Rzeczy bez lokalizacji nie sa rekordem w `room`, `storage_location_l2` ani
  `storage_location_l3`.
- Brak lokalizacji oznacza brak glownego wpisu w `item_location`.
- M4A utrzymuje najwyzej jedna glowna lokalizacje przez indeks czesciowy.
- `set_item_primary_location` jest `security invoker`, nie uzywa service role i
  respektuje istniejace RLS.
- Domownik i dziecko nie maja pelnego CRUD Rzeczy ani struktury Domu w M4A.
- M4D nie obejmuje pelnego M4B, M4C, kodow Rzeczy, QR/NFC, Storage, zdjec, AI ani Super
  Schowka.
- Widok "Bez lokalizacji" pokazuje domyslnie tylko Rzeczy niearchiwalne bez glownego rekordu `item_location`; archiwalne sa dostepne w osobnym widoku "Archiwalne".
- Wszystkie Rzeczy ze wskazanego zrodla sa w M4D przenoszone do jednej wybranej Pozycji L3.
- Przenoszenie do wielu docelowych Pozycji pozostaje poza M4D.
- Usuniecie Schowka lub Pomieszczenia moze usunac cale poddrzewo dopiero po przeniesieniu Rzeczy albo odpieciu ich lokalizacji.
- UX M4D to jeden dialog krokowy, nie osobna strona ani rozbudowany kreator.
- Liczniki Schowkow, Pozycji i Rzeczy sa pokazywane w dialogu usuwania, bez stalych licznikow przy calej strukturze Domu.
- M4D bedzie realizowane przed pelnym M4B; filtr "Bez lokalizacji" powstaje w M4D.1 i ma byc przygotowany pod pozniejsze filtry M4B.

## 4. Proponowana architektura

M4D powinno dodac trzy waskie warstwy:

1. Widok/filter "Bez lokalizacji" w `/items`.
2. Podsumowanie zaleznosci przed usunieciem elementu struktury Domu.
3. Atomowe operacje bazy dla masowego przeniesienia lub odpiecia glownych
   lokalizacji.

Rekomendacja MVP:

- operacje masowe powinny byc wykonywane przez RPC `security invoker`;
- RPC powinny korzystac z istniejacych tabel i RLS, bez service role;
- struktura Domu powinna byc usuwana dopiero po wykonaniu przeniesienia albo
  odpiecia lokalizacji;
- usuniecie L2 lub room moze usunac poddrzewo struktury zgodnie z zatwierdzona decyzja wlasciciela, ale dopiero po przeniesieniu Rzeczy albo odpieciu ich lokalizacji.

## 5. Widok "Rzeczy bez lokalizacji"

### Propozycja UI

W `/items` dodac prosty wybor zakresu listy:

- Wszystkie aktywne;
- Bez lokalizacji;
- Archiwalne.

To nie jest pelne M4B. To minimalny filtr systemowy potrzebny M4D.

### Pobieranie danych

Widok "Bez lokalizacji" powinien pokazywac Rzeczy z aktywnego gospodarstwa,
ktore nie maja glownego wpisu w `item_location`.

Semantyka:

- aktywna Rzecz bez lokalizacji: `item.status <> 'archiwalne'` i brak
  `item_location` z `czy_glowna = true`;
- Rzecz archiwalna bez lokalizacji: nie jest pokazywana w podstawowym widoku "Bez lokalizacji"; pozostaje dostepna w osobnym widoku "Archiwalne".

Technicznie mozliwe warianty:

- query po `item` i osobny odczyt `item_location`, a potem filtr po stronie
  serwera Next.js;
- SQL/RPC/list view zwracajacy Rzeczy bez glownej lokalizacji.

Rekomendacja MVP: zaczac od serwerowego odczytu zgodnego z obecnym stylem
`/items`, bez nowej tabeli i bez materializowanego widoku. Jesli filtrowanie
bedzie nieczytelne lub kosztowne, dopiero wtedy zaproponowac waska RPC/list
query.

### Licznik

Zatwierdzona decyzja wlasciciela: M4D.1 nie dodaje licznikow przy widokach listy. Liczniki Schowkow, Pozycji i Rzeczy sa przewidziane tylko w dialogu usuwania w pozniejszych krokach M4D.

## 6. Usuwanie Pozycji L3

### Gdy Pozycja nie zawiera Rzeczy

Zachowac obecny prosty mechanizm usuniecia.

### Gdy Pozycja zawiera Rzeczy

Przed usunieciem pokazac:

- nazwe Pozycji;
- liczbe przypisanych aktywnych Rzeczy;
- licznik obejmuje domyslnie niearchiwalne Rzeczy; archiwalne sa obslugiwane w osobnym widoku "Archiwalne".

Opcje:

1. "Przenies wszystkie Rzeczy" - administrator wybiera docelowa Pozycje L3.
2. "Pozostaw Rzeczy bez lokalizacji" - usuwane sa glowne wpisy
   `item_location`, same rekordy `item` zostaja.
3. "Anuluj" - brak zmian.

Po wykonaniu opcji 1 albo 2 Pozycja L3 moze zostac usunieta, o ile nie istnieja
inne blokujace zaleznosci.

## 7. Usuwanie Schowka L2

Przed usunieciem Schowka sprawdzic:

- liczbe Pozycji L3 w Schowku;
- liczbe Rzeczy przypisanych do tych Pozycji;
- licznik obejmuje domyslnie niearchiwalne Rzeczy; archiwalne sa obslugiwane w osobnym widoku "Archiwalne".

Opcje:

1. "Przenies wszystkie Rzeczy" - wszystkie glowne lokalizacje z pozycji
   nalezacych do Schowka trafiaja do jednej docelowej Pozycji L3.
2. "Pozostaw Rzeczy bez lokalizacji" - glowne wpisy `item_location` dla tego
   poddrzewa zostaja usuniete.
3. "Anuluj" - brak zmian.

Po rozstrzygnieciu Rzeczy mozna usunac poddrzewo L3, a potem L2.

Wazne przypadki:

- docelowa Pozycja nie moze nalezec do usuwanego Schowka;
- zrodlo i cel nie moga byc tym samym zakresem;
- pusty zakres powinien zwrocic zero i pozwolic przejsc do zwyklego usuniecia.

## 8. Usuwanie Pomieszczenia

Przed usunieciem Pomieszczenia sprawdzic:

- liczbe Schowkow L2;
- liczbe Pozycji L3;
- liczbe Rzeczy przypisanych do tych Pozycji;
- licznik obejmuje domyslnie niearchiwalne Rzeczy; archiwalne sa obslugiwane w osobnym widoku "Archiwalne".

Opcje:

1. "Przenies wszystkie Rzeczy" - wszystkie glowne lokalizacje z poddrzewa
   Pomieszczenia trafiaja do jednej docelowej Pozycji L3.
2. "Pozostaw Rzeczy bez lokalizacji" - glowne wpisy `item_location` dla tego
   poddrzewa zostaja usuniete.
3. "Anuluj" - brak zmian.

Po rozstrzygnieciu Rzeczy mozna usunac cale poddrzewo L3 -> L2 -> room zgodnie z zatwierdzona decyzja wlasciciela.

Docelowa Pozycja nie moze znajdowac sie wewnatrz usuwanego Pomieszczenia.

## 9. Warianty RPC

Nazwy ponizej sa robocze i wymagaja potwierdzenia przed migracja.

### Wariant A - dwie waskie RPC

1. RPC do masowego przeniesienia glownych lokalizacji.
2. RPC do masowego odpiecia glownych lokalizacji.

Parametry:

- typ zrodla: `position`, `storage`, `room`;
- ID zrodla;
- dla przeniesienia: docelowa Pozycja L3;
- domyslne dzialanie na niearchiwalnych Rzeczach zgodnie z zatwierdzona decyzja o widoku "Bez lokalizacji".

Zalety:

- proste kontrakty;
- latwe testy;
- oddziela destrukcyjne odpiecie od przenoszenia.

Wady:

- UI musi wywolac odpowiednia operacje.

Rekomendacja MVP: Wariant A.

### Wariant B - jedna RPC z trybem operacji

Jedna RPC przyjmuje `operation = move | detach`.

Zalety:

- jeden punkt wejscia.

Wady:

- wiekszy kontrakt;
- trudniejsze testowanie i komunikaty bledow;
- latwiej pomylic tryb destrukcyjny.

Rekomendacja: nie wybierac na MVP.

### Wariant C - bez RPC, przez server actions

Server action wykonuje kilka zapytan: pobiera Rzeczy, usuwa lub aktualizuje
`item_location`, a potem usuwa strukture.

Zalety:

- mniej SQL.

Wady:

- trudniej zapewnic atomowosc;
- wieksze ryzyko czesciowo wykonanej operacji;
- trudniejsze testy pgTAP;
- slabiej pasuje do decyzji M4A o atomowym ustawianiu lokalizacji.

Rekomendacja: odrzucic.

## 10. Masowe przenoszenie

Proponowana RPC powinna:

- byc `security invoker`;
- wymagac uwierzytelnienia;
- potwierdzic aktywny profil administratora;
- ustalic gospodarstwo zrodla na podstawie `room`/L2/L3;
- ustalic gospodarstwo celu na podstawie docelowej L3;
- odrzucic operacje miedzy gospodarstwami;
- odrzucic cel wewnatrz usuwanego poddrzewa;
- odrzucic przypadek zrodlo = cel dla Pozycji;
- przeniesc tylko glowne lokalizacje Rzeczy;
- nie tworzyc drugiej glownej lokalizacji;
- zachowac `item`, `status`, `category_id`, `created_by_id`, `opiekun_id`;
- zwrocic liczbe przeniesionych Rzeczy;
- dzialac atomowo.

Model zapisu:

- dla kazdej Rzeczy w zakresie zrodla usunac jej obecny glowny wpis
  `item_location`;
- wstawic nowy wpis z docelowa `storage_location_l3_id` i `czy_glowna = true`;
- albo uzyc UPSERT zgodnego z indeksem czesciowym, jesli bedzie to czytelne i
  testowalne.

Rekomendacja: jawne `delete` glownych lokalizacji dla wybranych `item_id`, a
potem `insert` nowych glownych wpisow w jednej funkcji i jednej transakcji.

## 11. Masowe usuniecie przypisania

Proponowana RPC powinna:

- byc `security invoker`;
- wymagac aktywnego administratora;
- przyjmowac typ zrodla i ID zrodla;
- wyliczac Rzeczy z glownej lokalizacji w tym zakresie;
- usuwac tylko glowne wpisy `item_location`;
- nie usuwac rekordow `item`;
- nie zmieniac `item.status`;
- nie zmieniac `category_id`;
- nie archiwizowac Rzeczy;
- zwracac liczbe odpietych Rzeczy;
- powodowac widocznosc Rzeczy w filtrze "Bez lokalizacji";
- dzialac atomowo.

## 12. Wplyw na RLS i bezpieczenstwo

Rekomendacja: RPC `security invoker`, tak jak `set_item_primary_location`.

Wymagane zabezpieczenia:

- `auth.uid()` nie moze byc `null`;
- `current_household_id()` musi zwrocic aktywne gospodarstwo;
- `is_household_admin(source_household_id)` musi byc prawda;
- gospodarstwo zrodla i celu musi byc takie samo;
- `domownik` i `dziecko` dostaja blad `ADMIN_REQUIRED`;
- brak service role w server action;
- operacja korzysta z transakcyjnosci funkcji PostgreSQL;
- indeks `item_location_one_primary_per_item_unique` nadal chroni przed dwiema
  glownymi lokalizacjami.

RLS nie powinno byc wylaczane ani obchodzone. Jesli implementacja RPC wymaga
operacji, ktore RLS odrzuca mimo poprawnej roli, nalezy najpierw doprecyzowac
polityki lub funkcje pomocnicze w osobnym planie, a nie uzyc service role.

## 13. Migracje

M4D bedzie wymagac migracji w etapie implementacji zaakceptowanych RPC.

Proponowana zawartosc migracji:

- funkcja masowego przeniesienia glownych lokalizacji;
- funkcja masowego odpiecia glownych lokalizacji;
- `revoke all` od `public`;
- `grant execute` dla `authenticated`;
- komentarz migracji opisujacy wplyw na dane, rollback i testy.

Nie rekomenduje sie zmiany istniejacych FK na `on delete cascade` bez osobnej
decyzji. Obecne jawne rozstrzygniecie losu Rzeczy jest bezpieczniejsze dla MVP.

## 14. Proponowany UX

Przeplyw:

1. Administrator klika "Usun" przy Pozycji, Schowku albo Pomieszczeniu.
2. Aplikacja pobiera podsumowanie zaleznosci:
   - liczba Schowkow;
   - liczba Pozycji;
   - liczba Rzeczy.
3. Jesli brak zaleznosci, pokazuje proste potwierdzenie usuniecia.
4. Jesli sa Rzeczy, pokazuje wybory:
   - "Przenies wszystkie Rzeczy";
   - "Pozostaw Rzeczy bez lokalizacji";
   - "Anuluj".
5. Dla przeniesienia administrator wybiera docelowa Pozycje L3.
6. Aplikacja blokuje cel wewnatrz usuwanego poddrzewa.
7. Po zatwierdzeniu pokazuje wynik:
   - ile Rzeczy przeniesiono albo odpieto;
   - czy usuniecie struktury sie powiodlo;
   - czy dane zmienily sie w miedzyczasie.

Komunikaty bledow:

- brak uprawnien administratora;
- zrodlo nie istnieje;
- cel nie istnieje;
- cel jest w innym gospodarstwie;
- cel znajduje sie w usuwanym poddrzewie;
- dane zmienily sie od otwarcia dialogu;
- operacja nie zostala wykonana.

Destrukcyjne usuniecie struktury powinno wymagac jawnego potwierdzenia.

## 15. Ryzyka

- Zmiana danych przez innego uzytkownika miedzy otwarciem dialogu i
  zatwierdzeniem. Mitigacja: RPC ponownie liczy zakres i waliduje cel.
- Docelowa Pozycja w usuwanym poddrzewie. Mitigacja: walidacja w RPC i UI.
- Czesc operacji wykonana przed bledem. Mitigacja: jedna funkcja PostgreSQL i
  transakcja.
- Dwie glowne lokalizacje. Mitigacja: obecny indeks czesciowy i testy.
- Rzeczy archiwalne sa poza podstawowym widokiem "Bez lokalizacji" i pozostaja dostepne w osobnym zakresie "Archiwalne".
- Przenoszenie wielu Rzeczy tylko do jednej Pozycji moze byc zbyt proste w
  przyszlosci. Mitigacja: MVP zaczyna od jednego celu; multi-target poza
  zakresem.

## 16. Testy

Wymagane testy pgTAP lub integracyjne:

1. Admin przenosi Rzeczy z Pozycji w swoim gospodarstwie.
2. Admin przenosi Rzeczy ze Schowka.
3. Admin przenosi Rzeczy z Pomieszczenia.
4. Admin odpina lokalizacje Rzeczy.
5. Rzeczy pozostaja w tabeli `item`.
6. Status Rzeczy pozostaje bez zmian.
7. Kategoria pozostaje bez zmian.
8. Nie mozna przeniesc do Pozycji innego gospodarstwa.
9. Nie mozna uzyc zrodla z innego gospodarstwa.
10. Domownik nie wykonuje operacji.
11. Dziecko nie wykonuje operacji.
12. Nie powstaja dwie glowne lokalizacje.
13. Operacja jest atomowa.
14. Pusty zakres zwraca zero bez bledu.
15. Nie mozna przeniesc do Pozycji nalezacej do usuwanego poddrzewa.
16. Usuniecie Pozycji nie pozostawia uszkodzonych FK.
17. Usuniecie Schowka nie pozostawia uszkodzonych FK.
18. Usuniecie Pomieszczenia nie pozostawia uszkodzonych FK.
19. Rzeczy bez lokalizacji sa widoczne w odpowiednim widoku.
20. Rzeczy archiwalne pozostaja poza podstawowym widokiem "Bez lokalizacji" i sa dostepne w osobnym widoku "Archiwalne".

Testy logiki UI:

- budowanie podsumowania zaleznosci;
- filtrowanie docelowych Pozycji tak, aby wykluczyc usuwane poddrzewo;
- widok "Bez lokalizacji" nie tworzy sztucznej lokalizacji;
- komunikaty i statusy dla powodzenia, anulowania i bledow.

## 17. Zatwierdzone decyzje wlasciciela

### 1. Widok "Bez lokalizacji"

Zatwierdzone:

- widok pokazuje domyslnie tylko Rzeczy niearchiwalne;
- widok pokazuje tylko Rzeczy bez glownego rekordu `item_location`;
- Rzeczy archiwalne sa dostepne w osobnym widoku "Archiwalne";
- nie tworzymy sztucznego Pomieszczenia, Schowka ani Pozycji dla Rzeczy bez lokalizacji.

Konsekwencja dla implementacji: filtr "Bez lokalizacji" musi byc filtrem systemowym/listowym, a nie elementem struktury Domu.

### 2. Docelowa lokalizacja masowego przenoszenia

Zatwierdzone: w M4D wszystkie Rzeczy ze wskazanego zrodla sa przenoszone do jednej wybranej Pozycji L3.

Dotyczy zrodel:

- Pozycja L3;
- Schowek L2;
- Pomieszczenie.

Konsekwencja dla implementacji: RPC masowego przenoszenia przyjmuje jedno `target_storage_location_l3_id`.

### 3. Przenoszenie do wielu miejsc

Zatwierdzone: przenoszenie do wielu docelowych Pozycji pozostaje poza zakresem M4D.

Konsekwencja dla implementacji: M4D nie projektuje mapowania wielu Rzeczy do wielu celow. Taki mechanizm moze zostac zaplanowany pozniej jako osobna organizacja Rzeczy.

### 4. Usuwanie poddrzewa

Zatwierdzone: usuniecie Schowka lub Pomieszczenia moze usunac cale poddrzewo Schowkow i Pozycji.

Warunki:

- wszystkie przypisane Rzeczy zostaly przeniesione do innej Pozycji L3 albo odpiete od lokalizacji;
- rekordy `item` nigdy nie sa usuwane razem ze struktura Domu;
- docelowa Pozycja nie moze znajdowac sie w usuwanym poddrzewie.

Konsekwencja dla implementacji: server action/RPC usuwania struktury musi wykonywac usuniecie w kolejnosci L3 -> L2 -> room dopiero po rozstrzygnieciu `item_location`.

### 5. UX

Zatwierdzone: M4D uzywa jednego dialogu krokowego.

Kroki dialogu:

1. podsumowanie zaleznosci;
2. wybor: przenies wszystkie Rzeczy, pozostaw Rzeczy bez lokalizacji albo anuluj;
3. wybor docelowej Pozycji, jesli wybrano przeniesienie;
4. koncowe potwierdzenie;
5. komunikat z liczba zmienionych Rzeczy.

Nie projektujemy osobnej strony ani rozbudowanego kreatora.

### 6. Liczniki

Zatwierdzone: liczby Schowkow, Pozycji i Rzeczy sa pokazywane w dialogu usuwania.

Nie dodajemy w M4D stalych licznikow przy wszystkich elementach struktury Domu.

### 7. Kolejnosc etapow

Zatwierdzone: M4D bedzie realizowane przed pelnym M4B.

Filtr "Bez lokalizacji" powstaje w M4D.1 i powinien byc przygotowany tak, aby pozniej mozna go bylo wykorzystac w systemie filtrow M4B.

## 17A. Otwarte szczegoly techniczne

Otwarte pozostaja tylko szczegoly, ktorych nie trzeba rozstrzygac przed akceptacja planu:

- finalne nazwy RPC i parametrow;
- czy podsumowanie zaleznosci bedzie osobna RPC, czy server action skladajaca odczyty zgodnie z RLS;
- dokladne kody bledow zwracane przez RPC;
- finalny ksztalt testow pgTAP po wyborze nazw funkcji;
- detale implementacyjne odswiezania `/home` i `/items` po operacji.
## 18. Poza zakresem

M4D nie projektuje i nie implementuje:

- kodow Rzeczy;
- Super Schowka;
- QR;
- NFC;
- zdjec;
- Storage;
- AI;
- historii zmian;
- wielu lokalizacji jednej Rzeczy;
- rezerwacji;
- wypozyczen;
- M4C;
- zaawansowanego M4B.

## 19. Proponowany podzial implementacji

1. M4D.1 - widok systemowy "Bez lokalizacji" w `/items` - Zaimplementowane i zaakceptowane recznie. Implementacja jest przygotowana pod pozniejsze filtry M4B i nie dodaje licznikow przy widokach listy.
2. M4D.2 - RPC podsumowania zaleznosci albo server action odczytujaca
   podsumowanie zgodnie z RLS.
3. M4D.3 - RPC masowego odpiecia glownych lokalizacji i testy pgTAP.
4. M4D.4 - RPC masowego przeniesienia glownych lokalizacji i testy pgTAP.
5. M4D.5 - dialog usuwania Pozycji L3 z opcjami przenies/odepnij/anuluj.
6. M4D.6 - dialog usuwania Schowka L2 z podsumowaniem poddrzewa.
7. M4D.7 - dialog usuwania Pomieszczenia z podsumowaniem poddrzewa.
8. M4D.8 - testy UI/logiki, dokumentacja milestone i finalna weryfikacja.

Kazdy krok powinien zachowac dzialajace M4A i nie uruchamiac M4B/M4C.

## Aneks M4D.3 — decyzja zastępująca z 2026-07-17

Na mocy decyzji właściciela projektu poniższe ustalenia zastępują wcześniejsze
założenia wyłącznie dla etapu M4D.3. Historyczne zapisy powyżej pozostają w
dokumencie jako ślad procesu decyzyjnego.

1. Zakres odpinania zmienia się z usuwania wyłącznie głównych wpisów
   `item_location` na usuwanie wszystkich głównych i dodatkowych linków, których
   `storage_location_l3_id` znajduje się we wskazanej lokalizacji albo jej
   poddrzewie. Linki tej samej Rzeczy poza poddrzewem pozostają bez zmian, a
   rekord `item` nie jest usuwany.
2. Zakres Rzeczy zmienia się z wyłącznie niearchiwalnych na aktywne i
   archiwalne. Operacja nie zmienia `item.status`, `item.archived_at`,
   `item.status_before_archive`, `category_id` ani innych danych Rzeczy.
3. Architektura zmienia się z jednej ogólnej RPC przyjmującej typ źródła na trzy
   jawne RPC: dla Pomieszczenia, Schowka L2 i Pozycji L3. Warstwa TypeScript może
   używać zamkniętego dispatchera, ale klient nie przekazuje dowolnej nazwy RPC.

Aneks nie rozstrzyga semantyki M4D.4 dotyczącej przenoszenia linków głównych i
dodatkowych. M4D.4 nie jest częścią implementacji M4D.3.
