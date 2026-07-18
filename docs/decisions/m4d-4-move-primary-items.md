# M4D.4 - atomowe masowe przenoszenie glownych lokalizacji Rzeczy

Status: Zaimplementowano, zweryfikowano automatycznie i zapisano jako stabilny checkpoint techniczny.

Data: 2026-07-17

## Cel

M4D.4 dodaje bezpieczna operacje przeniesienia glownych linkow `item_location`
ze wskazanej Pozycji L3, Schowka L2 albo Pomieszczenia do jednej wybranej,
zewnetrznej Pozycji L3. Etap nie dodaje interfejsu, nie usuwa struktury Domu i
nie uruchamia M4D.5.

## Audyt przed implementacja

- zakres zrodla jest wyznaczany przez relacje L3 -> L2 -> Room;
- gospodarstwo zrodla i celu jest ustalane po stronie bazy, bez parametru
  `household_id` od klienta;
- czesciowy indeks `item_location` dopuszcza najwyzej jeden link glowny Rzeczy;
- schemat nie ma unikalnosci dla pary `(item_id, storage_location_l3_id)`, dlatego
  operacja jawnie ponownie wykorzystuje istniejacy dodatkowy link docelowy;
- istniejace RLS pozwala aktywnemu administratorowi na wymagane operacje
  SELECT, DELETE, UPDATE i INSERT w jego gospodarstwie;
- aktualizacja linku docelowego zachowuje jego `notatka`, a operacja nie zmienia
  rekordu `item` ani jego `updated_at`.

## Zatwierdzona semantyka

- przenoszone sa tylko linki z `czy_glowna = true` znajdujace sie w zakresie
  zrodla;
- linki dodatkowe, takze te wewnatrz zrodla, pozostaja bez zmian;
- operacja obejmuje aktywne i archiwalne Rzeczy;
- status, metadane archiwizacji, kategoria i pozostale dane Rzeczy nie sa
  modyfikowane;
- wszystkie przenoszone linki trafiaja do jednej Pozycji L3;
- cel musi nalezec do aktywnego gospodarstwa i znajdowac sie poza zakresem
  zrodla;
- jezeli Rzecz ma dodatkowy link w celu, ten link zostaje awansowany na glowny,
  a jego notatka pozostaje bez zmian;
- jezeli link docelowy nie istnieje, powstaje nowy link glowny;
- ponowienie operacji dla oproznionego zakresu zwraca sukces i zera.

## Implementacja

Migracja `0011_m4d4_move_primary_items.sql` dodaje jedna jawna funkcje
`security invoker`:

`move_primary_items_from_location(p_source_type, p_source_id, p_target_storage_location_l3_id)`

`p_source_type` przyjmuje wylacznie `room`, `storage` albo `position`. Funkcja
sprawdza uwierzytelnienie, aktywny profil administratora, przynaleznosc zrodla i
celu do aktualnego gospodarstwa oraz polozenie celu poza poddrzewem zrodla.
`PUBLIC` i `anon` nie maja prawa wykonania; prawo otrzymuje tylko
`authenticated`.

Usuniecie dotychczasowych linkow glownych, awansowanie istniejacych linkow
docelowych albo utworzenie nowych linkow odbywa sie w jednym wywolaniu i jednej
transakcji. Blad dowolnego zapisu wycofuje cala operacje i zwraca bezpieczny kod
`MOVE_FAILED`.

RPC nie wywoluje M4D.3. Przyszla orkiestracja M4D.5+ bedzie mogla najpierw
przeniesc linki glowne przez M4D.4, a nastepnie odpiac pozostale linki przez
M4D.3 przed usunieciem struktury; ta sekwencja nie jest czescia obecnego etapu.

Wynik zawiera:

- `moved_item_count`;
- `active_item_count`;
- `archived_item_count`;
- `reused_target_link_count`;
- `created_target_link_count`;
- `removed_source_link_count`.

Obowiazuja inwarianty:

- `moved_item_count = active_item_count + archived_item_count`;
- `moved_item_count = reused_target_link_count + created_target_link_count`;
- `moved_item_count = removed_source_link_count`.

Warstwa TypeScript udostepnia zamkniety parser wejscia, nazwe jednej jawnej RPC,
mapowanie wyniku, walidacje inwariantow i bezpieczne mapowanie bledow. Klient nie
przekazuje dowolnej nazwy funkcji.

## Bezpieczenstwo i model danych

Nie dodano tabel, kolumn, relacji ani indeksow. Nie zmieniono RLS, RPC M4D.2 i
M4D.3, server actions, UI, routingu, metod HTTP ani zaleznosci. Funkcja korzysta
z istniejacych polityk jako `security invoker` i nie uzywa service role.

## Weryfikacja

Testy pgTAP obejmuja:

- zrodla Room, L2 i L3;
- aktywne i archiwalne Rzeczy;
- pozostawienie linkow dodatkowych bez zmian;
- ponowne uzycie linku docelowego wraz z zachowaniem notatki;
- utworzenie brakujacego linku docelowego;
- brak duplikatu i najwyzej jeden link glowny;
- zewnetrzny cel oraz izolacje gospodarstw;
- role, granty i nieaktywny profil;
- atomowe wycofanie operacji po bledzie;
- idempotencje i dokladnosc licznikow;
- regresje M4D.2, M4D.3, archiwizacji, przywracania i trwalego usuwania Rzeczy.

Testy logiki obejmuja zamkniete typy zrodla, walidacje UUID, mapowanie wyniku,
inwarianty, wynik zerowy i bezpieczne bledy. Test reczny UI nie nalezy do M4D.4,
poniewaz etap nie dodaje interfejsu.

Wyniki checkpointu technicznego:

- Supabase stop/start: sukces;
- reset bazy i migracje 0001-0011: sukces;
- pgTAP: 470/470;
- test M4D.4: 83 asercje;
- test:logic: 99/99;
- lint: sukces;
- build: sukces;
- git diff --check: sukces;
- testu recznego UI nie wykonywano, poniewaz UI nie nalezy do M4D.4.

## Poza zakresem

- dialog i server action uruchamiajace operacje;
- przenoszenie linkow dodatkowych;
- wiele docelowych Pozycji;
- usuwanie Pozycji, Schowka albo Pomieszczenia;
- M4D.5 i kolejne etapy;
- indywidualne ikony Rzeczy i M4B/M4C.
