# UI-01 — fundament kolorów i typografii

Data: 30.10.2026. Team A. Etap 0: zaakceptowany wizualnie przez właściciela w rozmowie („Akceptuję”), ze zleceniem kolejnego etapu; wzorzec Git 4673342.

## Zakres i baza

Implementacja etapu 1 opiera się na origin/main a2bb29c oraz zaakceptowanym Rytmie domu UI-00 R2 (lokalna referencja 4673342). Gałąź: feature/ui01-tokens-typography-20261030. Ponownie wykorzystano własny worktree etapu 0. Nowszy main zmienia Groq, kontrakt env, testy oraz zależności; nie zmienia tokenów ani wspólnych kontrolek. Zmiany main dołączono do własnej gałęzi, bez modyfikacji main.

Etap 1 obejmuje tokeny, lokalne fonty, wspólną skalę typografii i mapowanie istniejących kolorów. Powłoka, nawigacja, siatki ekranów, operacje, role i dane pozostają zakresem późniejszych etapów. Zegar, animowana pogoda i wybór wyglądu nie są jeszcze włączane w aplikacji; należą do 6A/6B/7. Nie dodaje się tras, ustawień użytkownika, flag środowiskowych, tabel ani zależności aplikacji.

## Inwentaryzacja przed zmianą

- Przejrzano 199 plików TS/TSX/CSS w src. 12 wartości koloru jest skupionych w globals.css; dodatkowe dopasowanie #039 to encja HTML, nie kolor. To dobra baza do rozwinięcia, nie powód do zastąpienia istniejącego systemu.
- uiTokens zawiera trzy skróty klas; @theme inline już mapuje semantyczne kolory Tailwind. Kontrolki używają var(--line), var(--radius) i min-height 44 px.
- Body deklaruje Inter, lecz nie ładuje fontu. Nagłówki i metryki używają systemowego sans. Brakuje lokalnych Fraunces/Inter oraz skali ról typograficznych.
- 13 plików ma połączenie bg-primary z text-white. Przed użyciem jasnego akcentu w ciemnej palecie trzeba zastąpić stałą biel rolą on-primary. Analogicznie dla przycisku destrukcyjnego. To mapowanie prezentacji, bez zmiany zachowania.
- Dotychczasowe statusy success/warning/danger/info pozostają odrębnymi rolami. Nie wolno zamienić wszystkich na jeden odcień zieleni ani mieszać ich z dekoracją pogody.
- Odstępy i obudowy nie są w tym etapie masowo przepisywane. Główne strony używają istniejących PageHeader/SectionHeader; ich typografia otrzyma wspólny token. Migracja reszty prymitywów to UI-02.

## Decyzje wykonawcze

1. Jedno źródło tokenów CSS: wartości bazowe → role semantyczne → aliasy kontrolek i typografii. Zachować nazwy istniejących ról i mapowanie Tailwind; dodawać brakujące, nie tworzyć konkurencyjnej palety.
2. Jasne powierzchnie mają skalę od ciepłej bieli do chłodnej zgodną z referencją. Ciemna paleta ma jasne teksty i akcent. Przygotować kontrakt CSS; nie dodawać jeszcze automatyki dnia ani zapisu preferencji.
3. Tło karty i tło kontrolki nie są jedną niezmienną wartością. Delikatny separator i rozpoznawalna granica pola są osobnymi rolami. Focus ma czytelną obwódkę również przy ciemnej palecie.
4. Kolor tekstu na akcji to on-primary/on-danger; nigdy założenie, że zawsze jest biały. Zdjęcia, logo i ikony nie otrzymują filtra barwnego.
5. Inter dla UI, Fraunces dla wybranych nagłówków i metryk. Fonty lokalne, WOFF2, polskie znaki, swap i metryczny fallback przez istniejące next/font/local. Nie pobierać fontów z CDN w czasie uruchomienia aplikacji.
6. Konwersja/subsetting z już zweryfikowanych TTF w UI-00 za pomocą fontTools 4.60.2; narzędzie tylko w odseparowanym katalogu roboczym. Zachować zmienne osie wght/opsz, informacje autorskie oraz OFL. Dekoracyjne osie Fraunces SOFT/WONK ustalono na zatwierdzonych wartościach domyślnych 0/1. Narzędzie nie jest zależnością aplikacji. Zakres znaków i sumy opisuje manifest fontów.
7. Reużywalne style typograficzne w uiTokens. Metadane 13–14 px, treść 16 px, etykieta 14 px, nagłówki strony 30–40 px i sekcji 22–24 px. Nie skalować całego interfejsu zależnie od urządzenia.

## Sprawdzenie i odbiór

Wymagane: lint, TypeScript, build, istniejące testy logiki/kontrolek, kontrast palet i stanów oraz oględziny rzeczywiście wyrenderowanych stylów. Potwierdzić pliki fontów i polskie glify. Nie deklarować pełnego odbioru modułów, których przebudowa jeszcze nie nastąpiła. Wyniki i ograniczenia zapisać w pakiecie UI-01.

Akceptacja UI-00 nie jest publikacją, zgodą na merge ani akceptacją Production. Wydanie i ręczny odbiór gotowego produktu pozostają osobnymi operacjami.

## Korekta po opinii właściciela — 30.10.2026

Właściciel potwierdził kolory „Ciepłego światła” i „Wieczornego spokoju”, odrzucił mdłe tło „Światła dnia” oraz metaforyczne hasła w interfejsie.

- Historyczna propozycja 93abda5: błękit #dceafb, karty #fbfdff i powierzchnia przygaszona #e6eef8. Właściciel ocenił kolory jako bardzo dobre, ale odrzucił błękitne tło jako interpretację koncepcji temperatury bieli. Ta propozycja nie jest kierunkiem docelowym.
- Obowiązuje prosty, przyjazny język: nazwy rzeczy i miejsc, liczby, czynności oraz użyteczne notatki. Nagłówek planszy to „Rzeczy i ich miejsca”; przykład pokazuje nazwę latarki, ścieżkę lokalizacji i notatkę o zapasowych bateriach. Bez metaforycznych sloganów o pamięci lub języku domu. Przyjemną atmosferę budują kolory, czytelność i spokojny ton.
- Reguła dotyczy kolejnych etapów. Przykładowe notatki pozostają danymi syntetycznymi planszy; nie dodano pól do aplikacji. Usunięto również odrzucone hasło ze stopki działającego prototypu UI-00. Historyczne zrzuty UI-00 pozostają zapisem wcześniejszego wyglądu.

## Powrót do adaptacji temperatury bieli — 30.10.2026

Właściciel zlecił propozycje kolorystyki w swojej dotychczasowej koncepcji. Warianty A/B/C różnią się zakresem ocieplenia bieli w ciągu dnia; nie zmieniają marki, funkcji ani układu aplikacji. Południe jest najjaśniejszym i najbardziej neutralnym punktem. Pogoda pozostaje osobną dekoracją. Zaakceptowana paleta ciemna jest wspólna dla wszystkich wariantów.

Powstał dokumentacyjny podgląd z ręczną godziną, pięcioma scenariuszami i interpolacją jasnych powierzchni w Oklab. Zmiana motywu jasny/ciemny jest atomowa. Edytowalne pole zachowuje swoją wartość przy zmianie godziny. Nie uruchomiono automatyki czasu w aplikacji, nie zapisuje się ustawień i nie dodano zależności lub tras Next.

Wejściem na porcie 4187 stało się porównanie temperatury; poprzedni układ jest w foundation.html. Szczegóły zakresów zawiera [opis opcji](../design/ui01/temperature-options.md). W kroku porównawczym proponowano B i nie zmieniano jeszcze src/styles/ui-tokens.css.

## Wybór B przez właściciela — 30.10.2026

Właściciel wybrał „B · Wyraźna zmiana” z porównania b8c303b. To akceptacja zakresu kolorystyki. W kodzie zastąpiono roboczy błękit oraz przygotowano punkty B dla świtu, rana, południa i wieczoru; paleta nocna pozostaje zaakceptowaną głęboką zielenią. Domyślny jasny wariant to poranek B. Zegar i automatyka nie są włączane na tym etapie.

Dokumentacyjny podgląd oznacza B jako wybrany i w punktach porównawczych czyta jego barwy bezpośrednio z produkcyjnych presetów CSS. A/C pozostają materiałem porównawczym. Interpolacja jasnych powierzchni w podglądzie zachowuje wartość pól. Wyniki nowego builda i kontroli są w pakiecie UI-01. Akceptacja kolorystyki nie zastępuje testów integracji i odbioru Production.

## Akceptacja kolorystyki i przejścia wieczór–noc — 31.10.2026

Właściciel potwierdził „Akceptuję” po obejrzeniu korekty odcieni 2600–2650 K. Obowiązuje B · Wyraźna zmiana wraz ze stopniowym przyciemnianiem od 18:00, wcześniejszym pojawieniem się wyglądu analogicznego do poprzedniego B / 2500 K (ciemniejsza zieleń, jasny tekst) i pełną nocą od 22:30. To zatwierdzona referencja kolorystyki dla kolejnych etapów.

Wzorzec wizualny: [poprawiony wieczór](../design/ui01/reference/screenshots/evening-2600-corrected.jpg). Przebieg określa reference/temperature-options.js, opisuje go [kontrakt kolorystyki](../design/ui01/temperature-options.md), a pomiary zawiera evening-warmth-correction-checks.json w pakiecie UI-01. A/C pozostają porównaniami. Automatyczny zegar jest nadal zadaniem etapu 6A. Następny etap planu: UI-02 — wspólne komponenty, formularze i dialogi.
