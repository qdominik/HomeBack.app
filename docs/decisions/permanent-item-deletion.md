# Trwale Usuwanie Aktywnych I Archiwalnych Rzeczy

## Status

Zaimplementowano, przetestowano automatycznie i zaakceptowano recznie w dostepnych scenariuszach.

## Cel I Zakres

Administrator aktywnego gospodarstwa moze trwale usunac jedna aktywna albo
archiwalna Rzecz. Aktywna Rzecz zachowuje akcje Edytuj i Archiwizuj oraz
otrzymuje akcje Usun. Archiwalna Rzecz otrzymuje w tym etapie wylacznie akcje
trwalego usuniecia.

Operacja nie implementuje automatycznej retencji, przywracania archiwum,
M4D.3, M4D.4, M4D.5 ani indywidualnych ikon Rzeczy.

## Audyt Zaleznosci `item`

| Zaleznosc | Relacja i zachowanie FK | Decyzja |
|---|---|---|
| `item_location.item_id` | FK do `item.id`, bez `ON DELETE`; domyslnie `NO ACTION` | RPC usuwa wszystkie glowne i nieglowne linki wskazanej Rzeczy przed usunieciem `item`. |
| `file.item_id` | Opcjonalny FK do `item.id`, bez `ON DELETE`; domyslnie `NO ACTION` | Obecnosc rekordu blokuje operacje kodem `item_has_files`. Metadane i potencjalny obiekt Storage pozostaja nietkniete. |
| `item.miniatura_url` | Pole tekstowe, bez deklarowanej relacji do Storage | Niepusta wartosc blokuje operacje kodem `item_has_files`. |
| `log.obiekt_id` | Brak FK do `item` | Historia pozostaje. CRUD Rzeczy nie zapisuje obecnie logow, dlatego etap nie buduje nowego systemu audytu. |
| `item.category_id` | FK z `item` do `category`, bez kaskady w strone kategorii | Kategoria pozostaje. |
| `item.opiekun_id` | Opcjonalny FK z `item` do `profile` | Profil opiekuna pozostaje. |
| `item.created_by_id` | FK z `item` do `profile` | Profil tworzacego pozostaje. |
| `item.household_id` | FK z `item` do `household` | Gospodarstwo pozostaje. |
| `item_location.storage_location_l3_id` | FK z linku do Pozycji L3 | Pomieszczenie, Schowek i Pozycja pozostaja. |

Schemat nie zawiera triggera usuwajacego zaleznosci Rzeczy. Trigger `item_set_updated_at`
dotyczy tylko aktualizacji znacznika czasu. Funkcje podsumowania M4D.2 jedynie
odczytuja `item` i `item_location`.

## Pliki I Supabase Storage

Repozytorium nie posiada aktywnego uploadu ani bezpiecznego cleanupu plikow
Rzeczy w Supabase Storage. Konfiguracja nie definiuje aktywnego bucketu dla
tych plikow, a formularze M4A nie zapisują zdjec. Sam model zawiera jednak
przyszlosciowe `file.item_id`, `file.plik_url` i `item.miniatura_url`.

Aby nie pozostawic osieroconych obiektow, RPC nie ufa zadnej sciezce z klienta
i blokuje Rzecz z rekordem `file` albo `miniatura_url`. Cleanup plikow wymaga
osobnego, zatwierdzonego etapu.

## Architektura I Atomowosc

Migracja `0008_permanent_item_deletion.sql` dodaje:

`delete_item_permanently(p_item_id uuid)`

Funkcja jest `security invoker`, wykonuje operacje w jednej transakcji i
korzysta z istniejacego RLS. Blokuje wiersz Rzeczy, sprawdza pliki, usuwa
wylacznie jej `item_location`, a nastepnie usuwa jedna Rzecz. Blad drugiego
DELETE wycofuje cleanup linkow.

Funkcja nie przyjmuje `household_id`, statusu ani sciezek plikow. Nie uzywa
`service_role`. `PUBLIC` i `anon` nie maja `EXECUTE`; grant otrzymuje tylko
`authenticated`.

## Autoryzacja I Izolacja

Operacja wymaga:

- sesji `auth.uid()`;
- aktywnego profilu;
- roli `admin`;
- administratora gospodarstwa ustalonego po stronie bazy;
- Rzeczy nalezacej do aktywnego gospodarstwa.

Nieistniejace ID i ID z innego gospodarstwa zwracaja ten sam kod
`item_not_available`, bez ujawniania istnienia cudzego rekordu.

## Kontrakt Wyniku

- `success`;
- `auth_required`;
- `active_profile_required`;
- `admin_required`;
- `item_not_available`;
- `item_has_files`;
- `deletion_failed`.

Server action `deleteItemPermanently` waliduje tekstowy UUID, wywoluje tylko
RPC, mapuje wynik na bezpieczny komunikat i odswieza `/items` oraz Dashboard.
Surowe bledy PostgreSQL nie sa przekazywane do interfejsu.

## UI

Aktywna Rzecz pokazuje Edytuj, Archiwizuj i Usun. Archiwalna Rzecz pokazuje
wylacznie Usun. Przycisk korzysta z istniejacego `ConfirmDeleteButton`, wariantu
danger i ikony kosza Phosphor. Potwierdzenie zawiera nazwe Rzeczy i jawnie
informuje o nieodwracalnosci operacji.

Przywracanie archiwalnych Rzeczy nie jest obecnie zaimplementowane ani
zdefiniowane produktowo. W etapie trwałego usuwania widok Archiwalne
otrzymuje wyłącznie akcję trwałego usunięcia. Przywracanie wymaga osobnej
decyzji dotyczącej statusu docelowego i pozostaje poza zakresem.

Jest to swiadome odstępstwo od pierwotnego wymagania UI, zatwierdzone przez
wlasciciela projektu.

## Testy

Test `0010_permanent_item_deletion.test.sql` zawiera 37 przypadkow pgTAP:
role, granty, izolacje gospodarstw, aktywne i archiwalne Rzeczy, zero/jeden/wiele
linkow, zachowanie kategorii i struktury, blokade plikow oraz atomowy rollback.

Testy logiki obejmuja UUID, zamkniety kontrakt wynikow, ukrywanie surowego
bledu, komunikat potwierdzenia, uzycie `ConfirmDeleteButton`, brak `restoreItem`
i brak danych gospodarstwa lub statusu w zadaniu RPC.

Pelny zestaw pgTAP przeszedl 244/244, a testy logiki 75/75.

## Reczny Odbior

Recznie zaakceptowano:

- anulowanie i potwierdzenie usuniecia aktywnej Rzeczy bez lokalizacji;
- usuniecie aktywnej Rzeczy z lokalizacja przy zachowaniu struktury Domu i innych Rzeczy;
- widok Archiwalne z wylaczna akcja Usun oraz anulowanie i potwierdzenie usuniecia;
- mobile, tablet i desktop, brak podwojnego submitu oraz brak bledow runtime i RSC zwiazanych z etapem.

Scenariusze plikow oraz rol nie zostaly zweryfikowane recznie z powodu
braku aktywnego modulu uploadu i dodatkowych kont. Zostaly pokryte testami
automatycznymi pgTAP. Obejmują rekord `file`, `miniatura_url`, administratora,
domownika, dziecko, goscia, nieaktywny profil, anonimowa sesje i administratora
innego gospodarstwa.

## Uwagi Poza Zakresem

- Przywracanie Rzeczy wymaga osobnej decyzji dotyczacej statusu docelowego.
- Uklad formularza edycji wymaga osobnego mikroetapu frontendowego.
- Indywidualna ikona Rzeczy wymaga osobnego etapu obejmujacego model danych,
  formularze, walidacje i fallback do ikony Kategorii.

Zadne z tych zadan nie zostalo rozpoczęte w tym etapie.

## Przyszla Retencja

Automatyczne usuwanie pozostaje poza zakresem. Przyszly mechanizm powinien byc
konfigurowalny, domyslnie wylaczony i po wlaczeniu uzywac domyslnego okresu
3 miesiecy. Czas powinien byc liczony od przyszlego `archived_at`, a nie od
`created_at`.
