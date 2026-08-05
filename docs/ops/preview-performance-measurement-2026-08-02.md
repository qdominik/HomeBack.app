# Preview performance measurement — 2026-08-02

## Zakres i metodologia

- Preview: `https://homeback-app-git-preview-supabase-hos-0c79a6-qdominiks-projects.vercel.app/`
- Commit aplikacji: `3a5dd237` (`perf: parallelize SSR page data loading`)
- Vercel deployment: `READY`, SSR `iad1`, build `sfo1`
- Sesja: zalogowany użytkownik `Dominik`, gospodarstwo `Sweet Home Bzy`, rola Administrator.
- Każda trasa została otwarta przez pełną nawigację dokumentu i oczekiwano na `load`.
- Wykonano 5 pomiarów na trasę: pierwszy (`first`) oraz 4 kolejne z rozgrzaną sesją/cache (`warm`).
- `DOMContentLoaded` i `load` są liczone od requestu dokumentu do odpowiednich zdarzeń CDP. Status HTTP pochodzi z `Network.responseReceived` dla dokumentu.
- Nie mierzono samego przekierowania `302`; każda z poniższych próbek dotyczy wyrenderowanej strony po zalogowaniu.

## Wyniki

Wartości w tabelach są w milisekundach.

| Trasa | Pierwszy load | Mediana load | Najlepszy load | Najgorszy load | Mediana DOMContentLoaded | Status dokumentu |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `/dashboard` | 975 | 1087 | 961 | 1417 | 944 | 200, 200, 200, 200, 200 |
| `/home` | 1516 | 1542 | 1284 | 2062 | 1477 | 200, 200, 200, 200, 200 |
| `/items` | 1528 | 1528 | 950 | 1697 | 1516 | 200, 200, **204**, 200, 200 |
| `/categories` | 995 | 1377 | 995 | 1462 | 1248 | 200, 200, 200, 200, 200 |

### Surowe czasy próbek

| Trasa | Typ próby | DOMContentLoaded | load | Wall time |
| --- | --- | ---: | ---: | ---: |
| `/dashboard` | first | 841 | 975 | 988 |
| `/dashboard` | warm 1 | 1264 | 1417 | 1433 |
| `/dashboard` | warm 2 | 1143 | 1299 | 1313 |
| `/dashboard` | warm 3 | 814 | 961 | 975 |
| `/dashboard` | warm 4 | 944 | 1087 | 1104 |
| `/home` | first | 1300 | 1516 | 1531 |
| `/home` | warm 1 | 2012 | 2062 | 2076 |
| `/home` | warm 2 | 1477 | 1542 | 1556 |
| `/home` | warm 3 | 1165 | 1284 | 1299 |
| `/home` | warm 4 | 1580 | 1670 | 1684 |
| `/items` | first | 1516 | 1528 | 1546 |
| `/items` | warm 1 | 1556 | 1564 | 1577 |
| `/items` | warm 2 | 1235 | 1243 | 1260 |
| `/items` | warm 3 | 1690 | 1697 | 1714 |
| `/items` | warm 4 | 943 | 950 | 966 |
| `/categories` | first | 878 | 995 | 1011 |
| `/categories` | warm 1 | 1255 | 1390 | 1406 |
| `/categories` | warm 2 | 947 | 1123 | 1137 |
| `/categories` | warm 3 | 1248 | 1377 | 1394 |
| `/categories` | warm 4 | 1410 | 1462 | 1477 |

## Statusy, konsola i requesty

- Wszystkie 20 nawigacji faktycznie wyrenderowały chronioną aplikację i miały URL docelowej trasy.
- Dokumenty zwróciły `200` w 19/20 próbek. Jedyny wyjątek to trzeci pomiar `/items`, gdzie CDP odczytał `204` przy `/items`, choć strona była wyrenderowana i końcowa kontrola `/items` pokazała pełną zawartość listy rzeczy. Późniejsza diagnostyka Vercel logs wyjaśniła ten przypadek jako pomocniczy `HEAD /items` z `source=serverless-middleware`; sąsiadujące główne `GET /items` zwracały `200`. `204` nie dotyczył głównego renderu HTML `/items` i nie wymaga poprawki teraz.
- Błędy konsoli: brak ostrzeżeń i błędów we wszystkich próbkach.
- Błędy requestów: wystąpiły wyłącznie `net::ERR_ABORTED` z `canceled: true` (33 łącznie). Dotyczyły requestów pomocniczych/prefetch anulowanych przy następnej pełnej nawigacji; nie wystąpił nieudany request serwera ani błąd zasobu wymagany do wyrenderowania strony.
- Najczęściej obserwowane requesty pomocnicze RSC/prefetch prowadziły do: `/items`, `/settings`, `/categories`, `/documents`, `/family`, `/home` i `/dashboard`. Jest to fan-out nawigacji Next.js dla elementów nawigacji i nie jest osobnym pomiarem SSR strony docelowej.
- Każda pełna nawigacja pobierała dokument trasy oraz wspólny CSS/JS Next.js. Obecny overlay Vercel dodawał requesty `vercel.live`; nie jest on częścią aplikacji produkcyjnej.
- Zapytania Supabase wykonywane po stronie serwera nie są widoczne jako osobne requesty z przeglądarki; ich koszt jest zawarty w czasie odpowiedzi dokumentu SSR.

## Wnioski

1. **Czasy:** `/dashboard` jest najszybszy (mediana `load` 1087 ms), `/categories` ma medianę 1377 ms, `/items` 1528 ms, a `/home` 1542 ms.
2. **Najwolniejsza trasa:** `/home` — najwyższa mediana oraz najgorszy wynik (`2062 ms`). `/items` ma podobną medianę i większy pojedynczy pik (`1697 ms`).
3. **Główne czynniki:** odpowiedź dokumentu SSR wraz z serwerowym ładowaniem danych, następnie wspólne assety Next.js. RSC/prefetch wielu tras zwiększa aktywność sieciową, ale nie blokuje podstawowego renderu tak jak dokument docelowy.
4. **Ocena obecnej optymalizacji SSR:** poprawka równoległego ładowania danych jest wystarczająca jako następny checkpoint — wszystkie trasy renderują się poprawnie, bez błędów konsoli, zwykle w około `1.0–1.7 s` do `load`. Wyniki są jednak zmienne, szczególnie dla `/home` i `/items`.
5. **`preferredRegion` / kolejna poprawka:** nie ma podstaw do natychmiastowej zmiany `preferredRegion` na podstawie tych pomiarów. Nie planujemy Performance Patch 3 na tym etapie. Ewentualna kolejna poprawka powinna być rozważana dopiero po powtórzeniu testu bez overlayu Vercel i po pomiarze serwerowego waterfallu/latencji Supabase.

## Werdykt checkpointu

**AUTHENTICATED PREVIEW PERFORMANCE MEASUREMENT — PASS WITH FOLLOW-UPS**

Pomiar spełnił warunek testowania faktycznie wyrenderowanych stron po zalogowaniu. Pojedynczy `204` dla `/items` został wyjaśniony jako pomocniczy `HEAD /items` z `source=serverless-middleware`, a nie główny render HTML. Pozostaje opcjonalny follow-up: pomiar bez dodatkowego `vercel.live` i z bezpośrednią obserwacją latencji SSR/Supabase.
