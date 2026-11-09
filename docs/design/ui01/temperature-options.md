# Opcje adaptacji temperatury bieli

30.10.2026 · Team A · **właściciel wybrał B · Wyraźna zmiana**. A i C zachowano do porównania.

Jedna koncepcja: ciepłe powierzchnie rano, najjaśniejsza i najbardziej neutralna biel w południe, ponowne ocieplenie wieczorem. Ciemny motyw i zieleń marki pozostają rozpoznawalne. Temperatura bieli, jasność motywu i pogoda są odrębnymi wymiarami wyglądu. Kolor nieba nie staje się kolorem całej aplikacji.

| Wariant | Rano i wieczorem | Południe | Dla kogo |
| --- | --- | --- | --- |
| A · Delikatna zmiana | Lekkie ocieplenie bieli | Neutralna biel | Mała, spokojna różnica między porami dnia |
| B · Wyraźna zmiana — wybrany | Ciepły krem, mocniej widoczny wieczorem | Neutralna biel | Czytelna adaptacja do pory dnia |
| C · Cieplejszy zakres | Ciepły krem | Lekko ciepła, złamana biel | Zachowanie cieplejszego wyglądu także w środku dnia |

## Punkty porównawcze

Wartości K są orientacyjnymi indeksami projektu, nie fizycznym pomiarem ekranu. Tła i karty otrzymują odcienie bieli, zamiast osobnych kolorowych motywów na każdą porę dnia.

| Wariant | Świt 05:45 | Rano 08:00 | Południe 13:00 | Wieczór 18:00 | Noc 23:00 |
| --- | --- | --- | --- | --- | --- |
| A | 3300 K / #f7efdf | 4300 K / #f7f2e7 | 5200 K / #f7f7f4 | 3600 K / #f4e8d6 | 2300 K / #122b29 |
| B | 2500 K / #f4e4cb | 3700 K / #f6eddc | 5200 K / #f5f5f2 | 2800 K / #eedbbd | 2300 K / #122b29 |
| C | 2500 K / #f3e4cf | 3500 K / #f7efdf | 4500 K / #f8f4e9 | 2700 K / #efdfc5 | 2300 K / #122b29 |

Pełna konfiguracja teł, kart i powierzchni przygaszonych znajduje się w reference/temperature-palettes.ts. Karty nocą zachowują zaakceptowane #193431. Nie nakłada się filtra barwnego na logo ani zdjęcia.

## Oglądanie i granice

[Podgląd](http://127.0.0.1:4187/temperature.html) pokazuje cały cykl w próbkach i te same rzeczywiste komponenty dla wybranej godziny. Ręczny suwak ma krok 15 minut; zmienia barwy i etykiety, zachowując wpisany tekst.

Wybrany B jest zapisany w src/styles/ui-tokens.css: poranek jako domyślna jasna paleta, świt przez data-tone=dawn, południe przez data-tone=cool, wieczór przez data-tone=evening, noc przez data-theme=dark. Podgląd B używa tych produkcyjnych presetów w punktach porównawczych, a między nimi interpoluje biel w Oklab. Odrzucony błękit usunięto z tokenów; pozostaje jedynie w historii i wcześniejszych obrazach.

To nadal ręczny podgląd projektowy. Zegar, ustawienia i pogoda mają swoje etapy 6A/6B/7; wybór kolorystyki nie oznacza uruchomienia tych funkcji w aplikacji.

## Łagodny wieczór — 31.10.2026

Na życzenie właściciela usunięto skok do pełnej nocy o 20:00. Od 18:00 do 22:30 tła, karty i powierzchnie przygaszone stopniowo przechodzą w Oklab od ciepłego wieczoru do zaakceptowanej ciemnej zieleni. O 20:00 widoczny jest zmierzch, o 21:00 późny wieczór, a pełna noc zaczyna się o 22:30. Indeks K także zmienia się stopniowo. Próbki cyklu nadal przedstawiają pięć punktów odniesienia; dodatkowe przyciski pozwalają obejrzeć 20:00, 21:00 i 22:30.

Przy średniej jasności tekst otrzymuje kontrastowy odcień; nie interpoluje się go przez nieczytelne szarości. W krótkim odcinku, w którym tło i karta wymagałyby przeciwnych kolorów tekstu, ich barwy zbiegają się. Przyciski, fokus i obramowania dostosowują kontrast razem z powierzchniami. W podglądzie wyłączono osobne przejścia CSS kontrolek, aby kolor tekstu nie pozostawał w tyle za kolorem tła podczas obsługi suwaka. Powrót do dnia usuwa nadpisania.

Ta korekta dotyczy ręcznego podglądu i kontraktu przyszłego zegara. Nie uruchamia automatycznej adaptacji w aplikacji ani nie zmienia ustawień urządzenia.

### Korekta odcieni 2600–2650 K

Po kolejnej opinii właściciela przyspieszono początek krzywej przyciemniania: o 19:15 (B: 2650 K) powierzchnie osiągają wygląd wcześniejszego 20:45 (B: 2500 K), z jasnym tekstem i jaśniejszym zielonym przyciskiem. Przy 2600 K ten wygląd stopniowo się pogłębia. Krzywa ma dwa ciągłe odcinki: 18:00–19:15 i 19:15–22:30; pełna noc nadal zaczyna się o 22:30. Indeks temperatury bieli zachowuje swój dotychczasowy przebieg. Wspólna korekta krzywej obejmuje też porównania A/C.

**Akceptacja właściciela: 31.10.2026, „Akceptuję”.** Wybrany B wraz z tą korektą stanowi obowiązującą referencję kolorystyki i przejścia do nocy.
