# UI-06B — WeatherAPI i preferencje wyglądu

Status: implementacja do Preview i odbioru; nie jest decyzją o wdrożeniu Production. Baza `dc43c9fbf6f103ac58e2c6af9e9e6599fc3e18bf` po PR #147. Projekt 6B z 1–4.11.2026 zachowany w `output/ui06b-source-snapshot-20261125` z sumami SHA-256; źródłowy worktree nie został zmieniony. Wybrano wyłącznie niezbędne części. Zgodnie z aktualnym poleceniem właściciela i 6A rytm korzysta z zegara i strefy urządzenia, także gdy pogoda ma inną strefę; nie przeniesiono historycznego remapowania astronomicznego. Dane pogodowe nie zmieniają tokenów i nie powodują koloryzacji zdjęć.

## Kontrakt

- Lokalizacja jest wspólna dla gospodarstwa; aktywny administrator zmienia miasto, kod i kraj oraz jawnie zatwierdza proponowaną miejscowość. Przy zapytaniu do dostawcy wysyłamy miasto i kraj albo współrzędne centrum; bez kodu pocztowego, ulicy, identyfikatorów i danych domowników. Numer rewizji chroni przed spóźnionym wyborem.
- Preferencje `auto/light/dark`, ruch, wpływ pogody i intensywność są indywidualne dla aktywnego profilu i zapisywane na koncie. Podgląd to szkic, nie jest automatycznie zapisywany. Ograniczony ruch systemowy ma pierwszeństwo.
- WeatherAPI działa wyłącznie na serwerze: `WEATHERAPI_KEY`; serwerowy cache współdzielony wymaga `SUPABASE_SERVICE_ROLE_KEY` danego środowiska. Klucze nie są publicznymi zmiennymi ani częścią repozytorium. Cache 45 min, lease 30 s, timeout 5 s, opóźnienie ponowienia po błędzie/limicie 120/600 s. Dane bez aktualnego czasu nie udają bieżącej pogody. W razie braku konfiguracji, lokalizacji, danych, limitu lub błędu pozostaje neutralna scena i działający zegar. Pogoda przykładowa jest oznaczona.
- Addytywna migracja dodaje tabele lokalizacji, preferencji oraz cache; RLS ogranicza odczyt do gospodarstwa i zapisy do administratora, a preferencje do właściciela profilu. Cache i jego funkcje pozostają niedostępne dla anon/authenticated. Cofnięcie po zapisaniu danych wymaga osobnej migracji i oceny utraty danych. Nie uruchamiano migracji w Production.

## Weryfikacja

Wyniki bieżącej pracy należy przypisać do konkretnego SHA PR. Testy logiki obejmują parsowanie, limity, brak klucza, timeout i referencyjne sceny; pgTAP obejmuje RLS i cache. Wspólny resolver i bootstrap są testowane dla trybów. Historyczne wyniki i zrzuty starego worktree nie stanowią dowodu działania tego brancha. Zrzuty lokalne w `output/ui06b-local-20261125` są emulacją Chromium, nie próbą na telefonie fizycznym. Dostępność hostowanego Preview, jego izolacja, migracja i konfiguracja sekretów muszą zostać potwierdzone osobno.
