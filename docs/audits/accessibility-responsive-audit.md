# Audyt dostępności i responsywności — HomeBack.app

Data: 2026-07-25
Branch: `audit/accessibility-responsive`
Środowisko: `http://127.0.0.1:3002`
Zmiany produkcyjne: brak

## Zakres i ograniczenia

Sprawdzono odpowiedzi aplikacji dla `/login`, `/register`, `/dashboard`, `/home`, `/items`, `/categories`, `/documents`, `/family` i `/settings`. `/login` oraz `/register` zwracały 200; trasy chronione kierowały niezalogowanego użytkownika do `/login`.

Nie wykonano manualnego testu wizualnego ani obsługi klawiaturą z powodu ograniczenia środowiska kontroli przeglądarki i braku sesji testowej. Nie resetowano Supabase i nie wykonywano operacji zapisu. Analiza kodu nie jest równoważna ręcznemu testowi aplikacji.

## Klasyfikacja

### A. Potwierdzone problemy dostępności

A11, A12, A13, A14, A15 — szczegóły poniżej.

### B. Potwierdzone problemy responsywności

R01 — ustalenie z breakpointów w kodzie; nie jest wynikiem ręcznego testu viewportu.

### C. Luka funkcjonalna (poza zakresem accessibility fix)

F01 — filtry kategorii i pomieszczenia są wymaganiem MVP, ale formularz filtrów nie jest renderowany ani obsługiwany przez `/items`.

### D. Hipotezy wymagające ręcznego sprawdzenia

H01 — niespójna wartość statusu w nieużywanym komponencie filtrów może uniemożliwić filtrowanie po „zużyte”.

### E. Kwestie estetyczne

R01 ma głównie charakter ergonomiczno-estetyczny.

## Weryfikacja viewportów

| Szerokość | Sprawdzone w działającej aplikacji | Tylko analiza kodu | Nieweryfikowane |
| ---: | --- | --- | --- |
| 320 px | brak manualnego testu | `px-4`, płynne szerokości, dialog `calc(100%-2rem)` | rzeczywisty overflow i czytelność |
| 375 px | brak manualnego testu | jak wyżej, zawijanie nagłówka | overflow i kolejność focusu |
| 768 px | brak manualnego testu | karty Rzeczy pozostają w 1 kolumnie do `lg` | wykorzystanie przestrzeni i dotyk |
| 1024 px | brak manualnego testu | `lg` przełącza karty na 2 kolumny | rzeczywiste formularze/dialogi |

## Tabela wszystkich 8 ustaleń

| ID | Priorytet | Obszar | Problem | Wpływ | Właściciel | Niezależnie? | Nakład |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A11 | P1 | Focus, `/home`, `/items`, `AppShell`, `Button` | `focus-visible:outline-none` usuwa widoczny focus. | Utrata orientacji klawiatury. | Zespół A | TAK | lekki |
| A12 | P1 | Komunikaty, `/login`, `/register`, `/items` | Błędy/sukcesy są zwykłymi `p`, bez live regionu i focusu. | Czytnik może nie ogłosić wyniku. | Zespół A | TAK | średni |
| F01 | P1 | Funkcjonalność, `/items`, `ItemFilters` | Wymagane MVP filtry nie są renderowane/obsługiwane. | Trudne odnajdywanie rzeczy. | Zespół A + właściciel produktu | NIE | średni |
| A13 | P2 | Kontrast, formularze, `globals.css` | `#999999` na białym tle daje ok. 2.85:1. | Słaba czytelność placeholderów. | Zespół A | TAK | lekki |
| A14 | P2 | Klawiatura, `AppShell` | Brak skip linku przed 7 pozycjami menu. | Dłuższa nawigacja do treści. | Zespół A | TAK | lekki |
| A15 | P2 | Formularz Rzeczy, `ItemForm` | `quickCategoryFeedback` to zwykły `p`. | Wynik asynchroniczny tylko wizualny. | Zespół A | TAK | lekki |
| R01 | P3 | Responsywność, `/items` | Dwie kolumny kart dopiero od 1024 px. | Niewykorzystana przestrzeń na 768 px. | Zespół A | TAK | lekki |
| H01 | P3 | Hipoteza, `item-filters.tsx` | Status „zużyte” ma niespójne kodowanie. | Filtr może nie zwrócić wyników po F01. | Zespół A | NIE | lekki |

## Szczegóły problemów

### A11 — niewidoczny focus wspólnych przycisków i menu

- **Trasa/komponent:** `/home`, `/items`, `AppShell`, `src/components/ui/button.tsx`.
- **Metoda:** analiza kodu; nie test manualny. **Viewport:** wszystkie, bez manualnego pomiaru.
- **Kroki:** wejść na chronioną trasę i naciskać Tab do przycisku z `buttonClassName()` lub linku menu.
- **Aktualne:** `focus-visible:outline-none` usuwa globalny obrys bez gwarantowanego zamiennika.
- **Oczekiwane:** każdy element interaktywny ma widoczny, kontrastowy focus.
- **Wpływ:** ryzyko aktywacji niewłaściwej akcji.
- **Rekomendacja:** usunąć nadpisanie lub dodać jednolity `focus-visible:ring`.
- **Ryzyko regresji:** zmiana geometrii; sprawdzić 320/375 px. **Zespół:** A. **Niezależne:** TAK. **Nakład:** lekki.

### A12 — nieogłaszane komunikaty operacji

- **Trasa/komponent:** `/login`, `/register`, `/items`, strony auth i `ItemsPage`.
- **Metoda:** analiza kodu; bez manualnego testu czytnikiem. **Viewport:** wszystkie, bez manualnego pomiaru.
- **Kroki:** wysłać błędny formularz lub wejść na URL z `?error=...` i obserwować komunikat/focus.
- **Aktualne:** zwykły `p`, brak `role="alert"`, `role="status"`, `aria-live` i zarządzania focusem.
- **Oczekiwane:** alert/status jest ogłoszony, focus trafia do komunikatu lub nagłówka.
- **Wpływ:** wynik może być niewidoczny dla czytnika.
- **Rekomendacja:** wspólny komponent live regionów i przewidywalny focus.
- **Ryzyko regresji:** podwójne ogłaszanie; sprawdzić wszystkie statusy. **Zespół:** A. **Niezależne:** TAK. **Nakład:** średni.

### F01 — brak wymaganych filtrów Rzeczy

- **Trasa/komponent:** `/items`, `src/components/items/item-filters.tsx`, `ItemsPage`.
- **Metoda:** analiza kodu oraz decyzja właściciela o wymaganiu MVP. **Viewport:** wszystkie, bez manualnego pomiaru.
- **Kroki:** wejść na `/items`, szukać filtrów kategorii/pomieszczenia i sprawdzić `searchParams` strony.
- **Aktualne:** komponent nie jest importowany/renderowany; parametry nie są parsowane.
- **Oczekiwane:** filtrowanie po kategorii i pomieszczeniu, czyszczenie i utrzymanie parametrów URL.
- **Wpływ:** luka MVP, trudne odnajdywanie danych.
- **Rekomendacja:** osobne zadanie funkcjonalne: formularz, parser i filtrowanie serwerowe.
- **Ryzyko regresji:** konflikt z widokami archiwalnych/bez lokalizacji; potrzebne testy. **Zespół:** A + właściciel produktu. **Niezależne:** NIE. **Nakład:** średni.

### A13 — kontrast placeholdera

- **Trasa/komponent:** formularze auth/Rzeczy/Domu/Kategorii, `globals.css`.
- **Metoda:** analiza kodu i obliczenie kontrastu; bez pomiaru DOM. **Viewport:** wszystkie, bez manualnego pomiaru.
- **Kroki:** wyświetlić pustą kontrolkę z placeholderem i zmierzyć `#999999` względem `#ffffff`.
- **Aktualne:** ok. 2.85:1.
- **Oczekiwane:** co najmniej 4.5:1 dla zwykłego tekstu.
- **Wpływ:** gorsza czytelność podpowiedzi.
- **Rekomendacja:** przyciemnić placeholder i sprawdzić disabled/focus.
- **Ryzyko regresji:** zatarcie hierarchii tekstu. **Zespół:** A. **Niezależne:** TAK. **Nakład:** lekki.

### A14 — brak skip linku

- **Trasa/komponent:** wszystkie chronione trasy, `AppShell`.
- **Metoda:** analiza kodu; nie test manualny. **Viewport:** wszystkie, bez manualnego pomiaru.
- **Kroki:** wejść na trasę i naciskać Tab od początku dokumentu.
- **Aktualne:** focus przechodzi przez logo, wylogowanie i 7 pozycji menu przed `main`.
- **Oczekiwane:** pierwszy focusowalny element przechodzi bezpośrednio do `main`.
- **Wpływ:** powtarzalny koszt nawigacji.
- **Rekomendacja:** skip link oraz unikalne `id` na `main`.
- **Ryzyko regresji:** zasłonięcie nagłówka lub zmiana kolejności focusu. **Zespół:** A. **Niezależne:** TAK. **Nakład:** lekki.

### A15 — nieogłaszany wynik szybkiej kategorii

- **Trasa/komponent:** `/items`, `ItemForm`.
- **Metoda:** analiza kodu; nie test manualny. **Viewport:** wszystkie, bez manualnego pomiaru.
- **Kroki:** wybrać „inna kategoria”, wpisać nazwę i aktywować „dodaj szybką kategorię”.
- **Aktualne:** `quickCategoryFeedback` pojawia się jako `p`, focus nie trafia do potwierdzenia.
- **Oczekiwane:** sukces to `status`, błąd to `alert`, focus jest przewidywalny.
- **Wpływ:** wynik asynchroniczny jest tylko wizualny.
- **Rekomendacja:** live region i jawny stan komunikatu.
- **Ryzyko regresji:** wielokrotne ogłoszenia. **Zespół:** A. **Niezależne:** TAK. **Nakład:** lekki.

### R01 — jedna kolumna kart na 768 px

- **Trasa/komponent:** `/items`, sekcja `grid gap-3 lg:grid-cols-2`.
- **Metoda:** analiza kodu; nie test manualny. **Viewport:** dotyczy 768 px; pozostałe szerokości tylko z CSS.
- **Kroki:** otworzyć `/items` przy 768 px z co najmniej dwiema kartami.
- **Aktualne:** jedna kolumna do breakpointu `lg` (1024 px).
- **Oczekiwane:** proporcjonalne wykorzystanie tabletu bez ściskania treści.
- **Wpływ:** dłuższy skan listy i pusta przestrzeń.
- **Rekomendacja:** rozważyć dwie kolumny od `md` po manualnym sprawdzeniu długich nazw i edycji.
- **Ryzyko regresji:** ściskanie przycisków/formularzy. **Zespół:** A. **Niezależne:** TAK. **Nakład:** lekki.

### H01 — niespójny status w filtrze (hipoteza)

- **Trasa/komponent:** przyszły formularz `/items`, `item-filters.tsx`.
- **Metoda:** hipoteza z analizy kodu; ręczne potwierdzenie po F01. **Viewport:** nie dotyczy.
- **Kroki:** po włączeniu filtrów wybrać „zużyte”, wysłać formularz i porównać parametr z enumem.
- **Aktualne:** komponent zawiera niespójnie zakodowaną wartość i nie jest używany.
- **Oczekiwane:** parametr dokładnie odpowiada statusowi i zwraca rekordy.
- **Wpływ:** potencjalnie pusty wynik.
- **Rekomendacja:** potwierdzić po F01 i dodać test parsera.
- **Ryzyko regresji:** ujawnienie innych niespójności domenowych. **Zespół:** A. **Niezależne:** NIE. **Nakład:** lekki.

## Plan mikrozadań

| Zadanie | Właściciel | Nakład | Zależności | Ryzyko konfliktu z A |
| --- | --- | --- | --- | --- |
| 1. Dynamiczne komunikaty formularzy i operacji — `aria-live`/`alert` | A | średni | wspólna konwencja komunikatów | wysokie — wiele komponentów |
| 2. `focus-visible` wspólnych przycisków i kontrolek | A | lekki | brak | średnie — wspólne klasy |
| 3. `focus-visible` głównej nawigacji | A | lekki | 2 zalecane | średnie — `AppShell` |
| 4. Skip link i landmarki | A | lekki | brak | średnie — layout |
| 5. Kontrast placeholderów i disabled | A | lekki | brak | średnie — `globals.css` |
| 6. Ręczna walidacja dialogów i focus trap | C | średni | sesja i dane testowe | niskie — bez kodu |
| 7. Ręczna walidacja zalogowanych tras 320/375/768/1024 px | C | średni | sesja testowa | niskie — bez kodu |
| 8. Filtry Rzeczy — zadanie funkcjonalne poza accessibility fix | A + właściciel produktu | średni | decyzja zakresowa; H01 po implementacji | wysokie — `/items` |

## Rekomendacja odbiorowa

Raport zawiera 8 rzeczywistych ustaleń, rozdziela potwierdzone problemy, lukę funkcjonalną, hipotezę i estetykę oraz jawnie opisuje ograniczenia testu manualnego. Rekomendacja: **READY FOR PR**.
