# UI-01 — weryfikacja 30.10.2026

## Kod i build

- npm ci: 364 pakiety dodane, audyt bez zgłoszonych podatności. Nie dodano zależności aplikacji; zmiany zależności z aktualnego main zostały odziedziczone przy aktualizacji bazy.
- npm run test:logic: 12 testów konfiguracji Next/ESLint i 390 testów logiki/komponentów zakończonych powodzeniem (łącznie 402).
- npx tsc --noEmit oraz npm run lint: przeszły dla całej gałęzi, lint bez błędów i ostrzeżeń.
- npm run build -- --webpack: kompilacja, TypeScript i 20/20 stron przeszły. Nie zmieniono skryptu build ani konfiguracji bundlera.
- Standardowy npm run build / Turbopack nie przeszedł lokalnie: „node process exited before we could connect”, przy przetwarzaniu CSS fontu. Próba poza sandboxem dała ten sam typ błędu. Podobny lokalny problem Windows jest opisany w docs/decisions/item-photo-flow-recovery.md. Przejście Webpack nie potwierdza przejścia Turbopack; standardowy build w Linux CI pozostaje wymagany przed integracją.

Narzędzia lokalne: Node 24.22.1 / npm 12.0.2. Repo/CI deklaruje Node 24.18.0 / npm 11.16.0. Nie zmieniono tych deklaracji. Nie wykonywano operacji Docker, migracji, testów SMTP ani pełnego logowania/RLS.

## Przegląd w przeglądarce

Plansza korzysta z produkcyjnych komponentów i skompilowanego CSS, bez aplikacyjnego API. W IAB sprawdzono rzeczywiste fonty, polskie znaki, jasne powierzchnie i jasny akcent z ciemnym tekstem w ciemnej palecie. Wymiary faktyczne porównano z żądanymi; bez poziomego przewijania. Sprawdzono także rzeczywisty anonimowy ekran /login?error=confirmation_failed: pusty formularz z kontrolowanym komunikatem błędu, bez wysyłania formularza, danych użytkownika i prywatnych zrzutów.

Pomiary, viewporty i trzy próby interakcji zawiera browser-samples.json. Pola zachowują edycję i natywny select, fokus klawiatury jest widoczny w ciemnym wariancie, disabled działa, a trzy błędy mają istniejące aria-describedby. Są to próby wspólnych kontrolek, nie pełny audyt dostępności wszystkich ekranów. Część formularzy aplikacji nadal korzysta z dawnych klas; ich ujednolicenie jest zadaniem UI-02.

Pierwotny kontrast w commicie 104e784 policzono z rzeczywistych computed styles i całego łańcucha teł, z uwzględnieniem przezroczystości i Oklab. 33 pary tekstowe: minimum **5,284:1** (próg 4,5). 9 par granic normalnych/błędnych pól: minimum **3,708:1** (próg 3). Nie obejmuje to każdego ekranu, stanu hover, zdjęć ani wyłączonych kontrolek. To kontrola fundamentu trzech palet, nie certyfikacja WCAG ani ponowne wykonanie 77 790 prób prototypu UI-00. Aktualny zestaw po korekcie opisano poniżej.

Manifest fontów zapisuje sumy, 431 752 B i zakresy osi. Skrypt konwersji sprawdza komplet polskich glifów. Wszystkie trzy WOFF2 i licencje OFL są lokalne; jedynie Inter jest preładowany.

## Końcowe kontrole

Końcowy lint i TypeScript przeszły. Ponowna kontrola pakietu UI-00: 264/264 oraz 77 790 asercji resolvera, minimum kontrastu 5,193:1. Są to kontrole plików i resolvera, nie nowe testy interakcji aplikacji.

Zapisano 7 widoków z załadowanymi fontami i bez poziomego przewijania:

| Viewport | Zakres |
| --- | --- |
| 320 × 844 | Plansza komponentów |
| 390 × 844 | Plansza i rzeczywisty ekran logowania |
| 834 × 1112 | Plansza i rzeczywisty ekran logowania |
| 1440 × 900 | Plansza i rzeczywisty ekran logowania; obraz planszy obejmuje pełną stronę |

Tymczasowy viewport przywrócono do domyślnego po testach. Zapisane pliki komputerowy i 320 px obejrzano również z dysku. Akceptacja właściciela dotyczy UI-00 (4673342); UI-01 jest nowym wynikiem do oceny, bez deklaracji akceptacji lub wdrożenia Production.

Przy kontroli całej gałęzi poprawiono pomocniczy verifier UI-00 z CommonJS require na ESM (.mjs), aby był zgodny z aktualnym lint. Zaktualizowano wywołania i instrukcje; scena, resolver, obrazy oraz zaakceptowane zachowanie prototypu pozostają bez zmian.

## Korekta tekstów i palety dziennej — 30.10.2026

Po opinii właściciela zachowano kolory wariantów ciepłego i ciemnego. Propozycja dzienna używa #dceafb / #fbfdff / #e6eef8. Nagłówek, nazwa rzeczy, notatka i akcja usunięcia mają konkretne opisy. Sprawdzono w DOM brak odrzuconych metaforycznych haseł. Stopka prototypu UI-00 pokazuje teraz „HomeBack · Rzeczy i miejsca”; jego historycznych obrazów nie odtwarzano.

Ponownie wyrenderowano cztery obrazy planszy: 320 × 844, 390 × 844, 834 × 1112 i 1440 × 900 (komputer: pełna strona). Faktyczne wymiary są zgodne z żądanymi, fonty użyte w widoku załadowane, brak poziomego przewijania. Trzy obrazy logowania i trzy próby interakcji pozostają dowodem bazowym z 104e784; nie deklaruje się ich ponownego wykonania w tej korekcie. Pochodzenie zaznaczono w browser-samples.json.

Nowa kontrola obejmuje także notatki rzeczy i opisy bezpośrednio na tłach palet: **39 par tekstu, minimum 4,966:1**, oraz **9 par granic pól, minimum 3,708:1**. Zestaw i wyniki są w browser-samples.json / contrast-result.json. Nowy build Webpack, jego TypeScript, lint oraz kontrola UI-00 (264/264 i 77 790 asercji) przeszły. Testów logiki ponownie nie uruchamiano dla korekty CSS i tekstów; wynik 402 testów powyżej dotyczy bazowego wdrożenia. Ograniczenie lokalnego Turbopack nadal obowiązuje.

## Porównanie zakresów temperatury bieli — 30.10.2026

Po odrzuceniu błękitnej interpretacji przygotowano trzy zakresy tej samej adaptacji: A delikatny, B wyraźniejszy oraz C z cieplejszą bielą także w południe. Główne wejście podglądu i temperature.html pokazują porównanie cykli. Poprzednia plansza jest w foundation.html jako archiwum; wcześniejsze zdjęcia i pomiary nie są dowodem wyboru docelowej palety.

W przeglądarce sprawdzono 05:45, 08:00, 13:00, 18:00 i 23:00, a klawiaturą także odcinek 13:15 oraz północ. Rzeczywiste powierzchnie w południe są neutralnie białe; rano i wieczorem mają cieplejszy odcień. Noc i północ używają zaakceptowanych #122b29 / #193431 we wszystkich opcjach. Zmiana godziny zachowała wpisany tekst pola, po czym przywrócono dane przykładowe.

Z rzeczywistych computed styles i łańcuchów teł policzono **168 wybranych par tekstu (minimum 5,191:1)** oraz **21 granic pól (minimum 3,452:1)**. To siedem stanów porównawczych, nie pełny audyt wszystkich minut i ekranów. Dane są w temperature-browser-checks.json. Wymiary 320 × 844, 390 × 844, 834 × 1112 i 1440 × 900 są zgodne z żądanymi, użyte fonty załadowane, bez poziomego przewijania. Zapisano obrazy południa, wieczoru, nocy i trzech mniejszych viewportów. Tymczasowy rozmiar okna przywrócono.

Kompilacja TypeScript rendererów, składnia skryptu i lint całego repo przeszły. Nie powtarzano builda aplikacji ani testów logiki dla tej dokumentacyjnej propozycji: src, zależności i backend nie zostały zmienione. To ręczny podgląd czasu, bez zegara systemowego, zapisu preferencji, API i kalibracji ekranu. Nie deklaruje się akceptacji A/B/C ani gotowości integracji niezaakceptowanego końca skali z 93abda5.

## Zapis wybranego B w tokenach — 30.10.2026

Właściciel wybrał B z porównania b8c303b. Przeniesiono wartości B do produkcyjnego CSS, zastępując błękit. Dodano presety świtu i wieczoru; domyślna jasna paleta to poranek, cool oznacza neutralne południe, a noc zachowuje dotychczasowe barwy.

Build Webpack z TypeScript i 20/20 stron przeszedł. Kompilacja rendererów i lint repo również przeszły. W przeglądarce porównano pięć produkcyjnych presetów B z wybranymi wartościami: każda para tło/karta jest zgodna. W tych punktach panel nie używa inline background; kolor pochodzi z CSS aplikacji. Sprawdzono także przejście 13:15 z usunięciem poprzedniego tonu oraz przywrócono wcześniejszą godzinę użytkownika w podglądzie.

Wybrane **40 par tekstu: minimum 5,191:1**, **5 granic pola: minimum 3,452:1**. Dane i oczekiwane kolory są w selected-b-checks.json; obraz selected-b.jpg pokazuje status „Wybrany”. Nie wykonywano ponownego audytu wszystkich szerokości ani wszystkich stanów aplikacji; wcześniejsze wyniki opisano powyżej. Zegar, pogoda, preferencje i ograniczenie lokalnego Turbopack pozostają zgodne z dotychczasowym planem.

## Stopniowe przejście wieczór–noc — 31.10.2026

Usunięto skok o 20:00. Podgląd interpoluje powierzchnie od 18:00 do 22:30, z korektą kontrastu tekstu, akcentów i granic kontrolek. Pełna noc od 22:30 korzysta z dotychczasowych tokenów dark. Kod aplikacji i automatyczny zegar pozostają poza zakresem tej korekty.

W IAB sprawdzono 19 kolejnych stanów co 15 minut od 18:00 do 22:30 dla wszystkich trzech porównywanych palet. **456 par tekstu: minimum 4,568:1; 57 granic pól względem obu sąsiednich powierzchni: minimum 4,568:1.** Zachowano edytowaną nazwę rzeczy w całym cyklu, a po kontroli przywrócono dane przykładowe. Sprawdzono powrót do południa: usunięte nadpisania kontrastu, data-tone=cool, neutralna biel B. W sprawdzonym domyślnym oknie nie występuje poziome przewijanie. Dane: evening-transition-checks.json; obrazy: reference/screenshots/evening-21.jpg i night-2230.jpg.

Kompilacja TypeScript rendererów, składnia JS i lint zmienionych plików przeszły. Nie powtarzano builda aplikacji, testów backendu ani pełnego audytu responsywności: zmiany obejmują wyłącznie dokumentacyjny podgląd. Wcześniejsze wyniki builda i ograniczenie Turbopack opisano powyżej.

### Korekta po odrzuceniu szarooliwkowych odcieni 2600–2650 K

Nowa krzywa przyciemniania przesuwa wcześniejszy wygląd B / 2500 K z 20:45 na 19:15 (2650 K). Z computed styles potwierdzono zgodność tła rgb(97, 106, 94) z wcześniejszym pomiarem; tekst jest jasny. Pełna noc o 22:30 nadal ma rgb(18, 43, 41). Ponowna kontrola 19 stanów wszystkich trzech palet: **456 par tekstowych i 57 granic pól, oba minima 4,593:1**, bez poziomego przewijania w sprawdzonym oknie. Składnia JS i lint zmienionego skryptu przeszły. Dane: evening-warmth-correction-checks.json; obraz: reference/screenshots/evening-2600-corrected.jpg. Poprzedni raport i obrazy pozostają dowodem wcześniejszej wersji.
