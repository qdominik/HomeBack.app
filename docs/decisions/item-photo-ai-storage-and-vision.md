# Decyzja Techniczna: Storage I Groq Vision Dla Zdjec Rzeczy

## 1. Cel Decyzji

Ta decyzja ustala kontrakt techniczny dla brancha
`codex/item-photo-ai-create`, ktory w kolejnych etapach ma dodac flow
dodawania i edycji Rzeczy na podstawie jednego glownego zdjecia.

Dokument rozstrzyga sposob przechowywania prywatnych zdjec w Supabase Storage,
format sciezek, lifecycle pliku draftowego, zapis referencji w bazie oraz
kontrakt integracji z Groq API do analizy Vision. Ten etap nie implementuje
funkcji, nie tworzy migracji, nie zmienia UI i nie dodaje zaleznosci.

## 2. Decyzje Zatwierdzone

- Bucket Supabase Storage dla zdjec Rzeczy nazywa sie `item-photos`.
- Bucket `item-photos` musi byc prywatny. Publiczny bucket dla zdjec
  uzytkownikow jest niedozwolony.
- W bazie zapisywany jest storage path, a nie publiczny URL ani signed URL.
- Rekomendowany format sciezki draftowej:
  `households/{household_id}/item-photo-drafts/{draft_id}/{filename}`.
- `household_id` w sciezce jest wymagany do izolacji plikow gospodarstw.
- `draft_id` reprezentuje tymczasowy lifecycle pliku przed zatwierdzeniem
  formularza przez uzytkownika.
- Po zatwierdzeniu formularza ta sama sciezka storage path moze zostac zapisana
  w `item.miniatura_url` oraz `file.plik_url`.
- Rekord `file` przechowuje metadane glownego zdjecia: `item_id`,
  `household_id`, `nazwa`, `plik_url`, `typ = 'zdjecie'`, `rozmiar_kb`,
  `czy_zaszyfrowany = false`, `created_by_id`.
- Zakres pierwszego brancha obejmuje jedno glowne zdjecie, JPEG i WebP,
  maksymalnie 2 MB, bez kompresji, bez konwersji, bez galerii, bez kadrowania
  i bez historii analiz.
- Groq API jest stalym API/providerem dla analizy Vision w tym branchu.
- Konkretny model wizyjny nie jest zakodowany na stale. Wlasciciel wybiera go
  przez konfiguracje env.
- UI nie zna providera ani nazwy modelu. Komponenty UI komunikuja sie tylko z
  waska warstwa serwerowa, np. `analyzeItemPhoto(input)`.
- Sekrety sa czytane z env vars. Klucze API nie moga byc zapisane w kodzie.
- Rekomendowane env vars:

```env
GROQ_API_KEY=
ITEM_PHOTO_AI_PROVIDER=groq
ITEM_PHOTO_AI_MODEL=
```

- Brak `GROQ_API_KEY` albo brak `ITEM_PHOTO_AI_MODEL` zwraca kontrolowany blad
  konfiguracji tylko dla akcji analizy zdjecia. Reczne dodawanie Rzeczy bez
  zdjecia lub bez analizy AI musi nadal dzialac.
- Signed URL moze byc generowany wylacznie tymczasowo po autoryzacji, do
  odczytu, wyswietlenia albo analizy. Signed URL nie moze byc zapisywany w
  bazie.

## 3. Kontrakt AI

Server-side helper analizy zdjecia ma zwracac wynik zgodny z zamknietym
kontraktem:

```ts
type ItemPhotoAnalysisSuggestion = {
  nazwa: string | null;
  opis: string | null;
  categoryId: string | null;
  categoryConfidence: "high" | "medium" | "low" | "none";
  categoryFallbackUsed: boolean;
  typ: "unikalny" | "zapas" | "zestaw" | null;
  ilosc: number | null;
  jednostka: string | null;
  userMessage: string | null;
};
```

Odpowiedz modelu musi byc walidowana po stronie serwera do zamknietego schematu
przed przekazaniem czegokolwiek do UI. Niepoprawna, niekompletna albo
nieoczekiwana odpowiedz modelu nie moze modyfikowac formularza w sposob
niejawny i musi zostac zmapowana do kontrolowanego bledu lub bezpiecznych
wartosci `null`.

AI zwraca wylacznie sugestie. AI nie tworzy ani nie aktualizuje rekordu `item`
bez jawnego zatwierdzenia formularza przez uzytkownika.

## 4. Bezpieczenstwo I Prywatnosc

- Bucket `item-photos` nie moze byc publiczny.
- Obrazy uzytkownika nie moga byc logowane.
- Signed URL nie moga byc logowane.
- Surowe odpowiedzi modelu zawierajace dane uzytkownika nie moga byc logowane.
- Kazdy upload, odczyt, analiza, zapis i cleanup musi ustalac aktywny profil
  oraz aktywne `household_id` po stronie serwera.
- Operacje uploadu, analizy, finalizacji, wymiany i usuwania glownego zdjecia
  wymagaja roli `admin`, zgodnie z obecnym CRUD Rzeczy.
- Sciezki Storage musza byc izolowane przez `household_id`; klient nie moze
  dostarczac zaufanej sciezki do cudzego gospodarstwa.
- Signed URL jest krotkotrwaly, generowany dopiero po autoryzacji i nie jest
  utrwalany w tabelach `item` ani `file`.
- Dane innego gospodarstwa nie moga byc dostepne przez UI, server action,
  route handler, Storage ani rekordy `file`.
- Bledy providera AI i Storage musza byc mapowane do kontrolowanych kodow lub
  komunikatow bez ujawniania sekretow, signed URL, sciezek cudzych plikow ani
  surowych odpowiedzi modelu.

## 5. Lifecycle Pliku

1. Upload draftu:
   - admin aktywnego gospodarstwa wybiera jeden plik JPEG albo WebP do 2 MB,
   - serwer waliduje typ i rozmiar,
   - serwer tworzy storage path w formacie
     `households/{household_id}/item-photo-drafts/{draft_id}/{filename}`,
   - plik trafia do prywatnego bucketu `item-photos`.

2. Analiza AI:
   - po autoryzacji serwer odczytuje draft albo generuje krotkotrwaly signed URL
     tylko na potrzeby analizy,
   - serwer wysyla obraz do Groq API przez helper, np. `analyzeItemPhoto`,
   - odpowiedz modelu jest walidowana do kontraktu `ItemPhotoAnalysisSuggestion`,
   - UI otrzymuje tylko zwalidowane sugestie i kontrolowane komunikaty.

3. Zatwierdzenie formularza:
   - uzytkownik poprawia albo akceptuje sugestie,
   - dopiero submit formularza tworzy albo aktualizuje rekord `item`,
   - draft storage path jest zapisywany jako prywatna referencja w
     `item.miniatura_url`,
   - tworzony albo aktualizowany jest rekord `file` powiazany z `item_id` i
     aktywnym `household_id`.

4. Wymiana zdjecia:
   - nowe zdjecie jest najpierw uploadowane i walidowane jako nowy draft,
   - baza jest aktualizowana tak, aby `item.miniatura_url` i `file.plik_url`
     wskazywaly nowa sciezke,
   - stary plik i stary rekord `file` sa usuwane dopiero po udanym zapisie
     nowej referencji,
   - blad usuniecia starego pliku musi byc kontrolowany i nie moze cofac
     poprawnie zapisanej nowej referencji bez osobnej decyzji.

5. Cleanup po anulowaniu albo bledzie finalizacji:
   - jesli uzytkownik anuluje formularz po uploadzie draftu, draft powinien
     zostac usuniety przez kontrolowana akcje cleanupu, jesli jest to mozliwe,
   - jesli finalizacja bazy nie powiedzie sie po uploadzie, draft powinien
     zostac usuniety albo oznaczony do pozniejszego cleanupu,
   - poniewaz Storage i baza nie tworza jednej transakcji, implementacja musi
     zakladac mozliwosc osieroconych draftow i miec bezpieczna strategie ich
     usuwania.

## 6. Ryzyka

| Ryzyko | Plan ograniczenia |
|---|---|
| Brak transakcji miedzy Storage i baza | Najpierw zapis nowej referencji w bazie, potem cleanup starego pliku; dla draftow stosowac idempotentny cleanup i bezpieczne retry. |
| Osierocone drafty | Uzywac sciezki `item-photo-drafts/{draft_id}` i dodac pozniejszy, zatwierdzony mechanizm cleanupu draftow po czasie. |
| Blad po uploadzie | Zwracac kontrolowany blad, probowac usunac draft i nie tworzyc ani nie aktualizowac `item` automatycznie. |
| Blad po zapisie item | Zachowac spojnosc referencji w bazie jako priorytet; cleanup Storage wykonywac po udanym zapisie referencji albo przez retry. |
| Niepoprawna odpowiedz modelu | Walidowac odpowiedz do zamknietego schematu po stronie serwera i mapowac niezgodnosc do kontrolowanego bledu lub wartosci `null`. |
| Zmiana modelu wizyjnego w Groq API | Nie kodowac nazwy modelu w UI ani kontrakcie domenowym; czytac `ITEM_PHOTO_AI_MODEL` z env i utrzymac waski helper serwerowy. |
| Koszt i opoznienie analizy AI | Analiza pozostaje akcja jawna dla uzytkownika; zwykle reczne dodawanie Rzeczy dziala bez AI. |
| Bezpieczenstwo signed URL | Generowac signed URL tylko po autoryzacji, z krotkim TTL, bez zapisu w bazie i bez logowania. |

## 7. Punkty Integracji W Kodzie

Przewidywane miejsca przyszlych zmian w Etapie 2 i dalej:

- `src/components/items/item-form.tsx` - wybor jednego zdjecia, preview,
  obsluga sugestii i komunikatow walidacji.
- `src/app/(app)/items/actions.ts` - server actions dla uploadu draftu,
  analizy, create/update z `miniatura_url`, rekordem `file`, wymiana zdjecia
  i cleanup.
- `src/components/items/item-card.tsx` - wyswietlanie prywatnej miniatury po
  autoryzowanym wygenerowaniu signed URL.
- `src/lib/items/*` - walidacja pliku, kontrakty formularza, mapowanie sugestii
  AI, walidacja wyniku i pomocnicze typy domenowe.
- Przyszla warstwa Storage - helpery dla uploadu, signed URL, usuwania draftow
  i usuwania starych obiektow.
- Przyszly helper AI - np. `analyzeItemPhoto(input)`, ukrywajacy Groq API,
  model i mapowanie odpowiedzi.
- Migracje Supabase - utworzenie prywatnego bucketu `item-photos`, polityki
  Storage i ewentualne doprecyzowanie kontraktu `file`.
- Testy unit/logiczne/RLS - walidacja plikow, mapowanie AI, role admina,
  izolacja `household_id`, polityki Storage, brak publicznych URL-i i cleanup.

Te zmiany nie sa implementowane w tym etapie.

## 8. Kryteria Przejscia Do Implementacji

Do Etapu 2 mozna przejsc dopiero po:

1. utworzeniu tego dokumentu decyzji technicznej,
2. sprawdzeniu, ze working tree zawiera wylacznie zamierzony dokument decyzji
   dla tego etapu oraz zastane, niezalezne zmiany nie sa dolaczane do pracy,
3. zatwierdzeniu decyzji przez wlasciciela.

Etap 1 konczy sie dokumentem decyzji. Commit dokumentu jest osobna decyzja
wlasciciela po przegladzie statusu working tree.
