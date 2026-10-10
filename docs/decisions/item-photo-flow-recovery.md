# Odzyskiwanie formularza zdjęć — pozostały zakres PR #15

Data: 2026-10-10. Zespół A. Baza: `origin/main` na
`3bd65a4`. Nowy branch: `fix/photo-flow-exception-recovery-20261010`.
PR #15 pozostaje otwarty, na branchu `fix/item-photo-upload-errors`,
head `4fdf968f6182522a36d5fbe79e610fe636f16b71`.

## Pokrycie starego PR

| Zakres #15 | Stan w main i decyzja |
| --- | --- |
| Limit Server Actions 3 MB | Nie przenosimy. Kompresja z `68aa08f` ma target 750 KiB, maksymalny upload klienta 800 KiB i 1600 px. Plik mieści się pod domyślnym limitem 1 MB z zapasem na multipart. |
| Walidacja MIME i rozmiaru przed uploadem | Obecne przygotowanie zdjęcia oraz serwerowa walidacja JPEG/WebP i 2 MiB zachowane. Nie dodajemy starego odrzucania dużego pliku przed kompresją. |
| Diagnostyka i błędy AI | Rozwinięte w `21d69e3`: klasyfikacja, kontrolowane retry, request ID, schema validation i diagnostyka z ograniczonym zakresem pól. Zachowane. |
| Wyjątki uploadu, analizy, cleanupu i szybkiej kategorii | Nadal brak ochrony formularza przed odrzuconymi obietnicami Server Actions. Uzupełnione. |
| Ochrona nazwy i komunikat słabej sugestii | Brak w main. Uzupełnione o low/none confidence i ręczną edycję w trakcie oczekiwania. |
| i18n i regresje | Bieżące słowniki PL/EN rozszerzone; testy dopasowane do aktualnego przepływu, bez kopiowania starego patcha. |

Przed rozpoczęciem sprawdzono stan lokalnego `main-integration`, worktree
`fix-item-photo-oversize-crash`, `fix-groq-photo-analysis-observability` oraz
istniejące branche zdjęć. Worktree diagnostyki Groq zawiera zastaną,
niezacommitowaną pracę w AGENTS, providerze, testach i alertach e-mail.
Nie została zmieniona ani włączona do tego PR. Nowy worktree zaczynał czysty.

## Potwierdzone braki i zmiany

- Odrzucone obietnice analiz i szybkiej kategorii są zamieniane na istniejące
  kody błędów. Formularz zachowuje dane, a zakończona funkcja przejścia pozwala
  ponowić akcję. Treść wyjątku nie trafia do UI ani nowych logów.
- Nowe zdjęcie jest przygotowywane i uploadowane przed cleanupem poprzedniego
  draftu. Błąd przygotowania/uploadu zachowuje poprzednią selekcję i metadane
  ukrytych pól. Input pliku jest czyszczony, aby można było wybrać ten sam plik.
- Nieudane usunięcie draftu zachowuje go w formularzu i umożliwia ponowienie.
  Po udanym zastąpieniu zdjęcia błąd cleanupu starego draftu daje osobny komunikat,
  a nowe zdjęcie pozostaje gotowe do zatwierdzenia.
- Spóźniony udany upload sprząta własny nowy draft i nie zmienia nowszego stanu.
  Dotychczasowe identyfikatory wywołań nadal odrzucają stare wyniki analizy.
- Serwerowy błąd podglądu, także rzucony wyjątek, powoduje próbę usunięcia
  wyłącznie ścieżki z potwierdzonego uploadu tego wywołania (`upsert: false`).
  Niepewny lub odrzucony upload nie uprawnia do usunięcia obiektu.
- Nazwa istniejąca w formularzu nie jest zastępowana pustą nazwą, placeholderem
  PL/EN ani sugestią o confidence low/none. Funkcyjna aktualizacja czyta bieżącą
  nazwę. Licznik ręcznych edycji chroni również mocną sugestię przed nadpisaniem
  nazwy wpisanej lub celowo wyczyszczonej w czasie analizy.
- Pozostałe pola sugestii, wybór lokalizacji, kategoria, typ, ilość i jednostka
  zachowują bieżące reguły. Mocne sugestie nadal można zastosować bez ręcznej
  edycji w czasie oczekiwania.

## Granice cleanupu i zgodność

Wywołania cleanupu klienta pochodzą tylko z `photoDraft` zwróconego przez upload
danego formularza lub z jego spóźnionego wyniku. `persistedPhoto` i `photo` nie
są przekazywane do cleanupu. Usunięcie istniejącego zdjęcia tylko ustawia znacznik
formularza; finalizacja zapisu nadal działa zgodnie z dotychczasowym kontraktem.
Serwer nadal sprawdza aktywnego admina, `household_id` i format ścieżki draftu.

To poprawka istniejącej, zatwierdzonej funkcji zdjęć i AI (decyzje
`item-photo-ai-create-prompt.md` i `item-photo-ai-storage-and-vision.md`), bez
rozszerzenia produktu. Brak nowych zależności, tras, pól, tabel, migracji,
zmian uprawnień/RLS, konfiguracji i hosted danych. Bez ręcznego deploya i merge.
Bucket, limity, kompresja oraz formaty ścieżek pozostają bez zmian.

Sprawdzono dokumentację Next 16.3.8 z zainstalowanego pakietu i changelog
Supabase. API Storage pozostaje istniejącym `upload`/`remove`:
[upload](https://supabase.com/docs/reference/javascript/storage-from-upload),
[remove](https://supabase.com/docs/reference/javascript/storage-from-remove).

## Weryfikacja

- `npm ci --ignore-scripts`: PASS, 366 audytowanych pakietów.
- `npm audit`: PASS, zero podatności.
- `npm run check:env -- --example`, `npm run icons:check`, `git diff --check`: PASS.
- `npx tsc --noEmit`: PASS.
- `npm run test:logic`: PASS, 12 testów glob + 385 testów logiki.
- 18 nowych testów zachowania: błędy prepare/upload, zachowanie starego draftu,
  kolejność kompresja/upload/cleanup, błędy cleanupu i retry, spóźnione wyniki,
  brak cleanupu persisted photo, rollback potwierdzonego uploadu, błędy AI i
  kategorii, brak treści wyjątków w wynikach, słabe sugestie i ręczna edycja nazwy.
- `npm run lint`: PASS, jedno zastane ostrzeżenie unused type import w
  `src/lib/items/item-photo-ai/providers/groq.ts`.
- Standardowy lokalny build Turbopack zgłosił błąd uruchomienia procesu PostCSS
  (`node process exited before we could connect`, exit code 0), także poza
  sandboxem. Wynik standardowego builda na Linuxie należy sprawdzić w CI PR.
- `npm run build -- --webpack`: PASS, kompilacja, TypeScript i prerendering.
- Lokalny runtime: Node 24.19.0 / npm 12.0.2; CI używa `.nvmrc` (24.18.0).

Wyniki finalnego SHA i linki CI są publikowane w opisie PR i raporcie przekazania.
Testy pgTAP oraz E2E uruchamia standardowy workflow na izolowanych bazach CI.
Nie uruchamiano ani nie resetowano współdzielonej lokalnej bazy.

## Kandydat do regresji B

Regresja przeglądarkowa powinna używać odtwarzalnego lokalnego środowiska i
kontrolowanych błędów transportu; nie testować destrukcyjnie na hosted danych.

1. Utworzenie bez zdjęcia i zwykły upload JPEG/WebP, również pliku wymagającego
   kompresji. Limity, wybór lokalizacji i hidden metadata mają działać jak w main.
2. Wyjątek uploadu: input pozwala ponownie wybrać ten sam plik, przyciski wracają
   do gotowości, nazwa i dane formularza pozostają. Błąd zastąpienia zachowuje
   poprzedni draft oraz istniejące zdjęcie na ekranie edycji.
3. Wyjątek analizy: brak error boundary, bez utraty draftu, ponowna analiza i
   ręczny zapis dostępne. W komunikacie brak signed URL, klucza i body providera.
4. Nieudany cleanup draftu: selekcja i hidden metadata pozostają; ponowienie
   usuwania działa. Nieudany cleanup po wymianie pokazuje ostrzeżenie i zachowuje
   nowy draft. Sprawdzić dokładne ścieżki usuwania: tylko drafty tego formularza.
5. Błąd szybkiej kategorii: nazwa kategorii i pozostałe dane pozostają, ponowienie
   może zwrócić już istniejącą kategorię i ją wybrać.
6. Ręczna nazwa + placeholder PL/EN, pusta nazwa AI, confidence low/none: ręczna
   nazwa pozostaje. Ręczna edycja lub wyczyszczenie podczas opóźnionej analizy:
   pozostaje nawet przy mocnej sugestii. Bez edycji mocna sugestia nadal działa.
7. Usunięcie zastępczego draftu przy edycji przywraca oryginalne zdjęcie bez jego
   usuwania w Storage. Usunięcie persisted photo tylko ustawia znacznik do zapisu.

## Ograniczenia

Unit testy wykonują rzeczywiste helpery przepływu, ale nie montują interaktywnego
formularza React. Zwalnianie przycisków i DOM/hidden inputs po wyjątkach wymaga
powyższej regresji B. Zwykłe E2E CI nie zastępuje tych kontrolowanych awarii.
Storage i baza nie mają wspólnej transakcji. Przy błędzie transportu po zapisie,
nieudanym cleanupie lub zamknięciu karty może pozostać osierocony draft; bez
potwierdzonego wyniku nie usuwamy pliku. Ten PR nie dodaje background cleanupu,
zmian finalizacji ani retry usuwania cudzych/istniejących plików.
