# M4UX.1 - fundament wizualny HomeBack.app

Data: 2026-07-12
Status: zaimplementowano i zaakceptowano recznie

## 1. Cel

M4UX.1 porzadkuje podstawowy wyglad i ergonomie HomeBack.app. Etap obejmuje
wspolny shell, tokeny wizualne oraz pilotazowe odswiezenie Dashboardu i modulu
Pomieszczenia. Nie zmienia funkcji biznesowych ani przeplywow danych.

## 2. Wartosci marki

Interfejs komunikuje zaufanie, bezpieczenstwo, spokoj, domowy charakter,
porzadek i klarownosc. Powinien pozostac jasny, przyjazny rodzinom i czytelny
dla osob w szerokim przedziale wieku, bez charakteru technicznego panelu
administracyjnego.

## 3. Zasady uzycia logo

- Header zalogowanej aplikacji uzywa wylacznie wersji poziomej.
- Znak ma zachowane proporcje, `object-fit: contain` i co najmniej 8 px
  wolnej przestrzeni wokol.
- Header nie korzysta z filtrow CSS, przycinania ani zmiany kolorow logo.
- Wersja pionowa jest przeznaczona dla ekranow powitalnych i przyszlych
  zastosowan marketingowych; nie jest uzywana w headerze.
- Wersja icon pozostaje faviconem i ikona aplikacji. Istniejace
  `src/app/icon.png` oraz `src/app/apple-icon.png` maja ten sam hash jak
  dostarczony znak icon.
- Wersja monochromatyczna nie jest podstawowym znakiem jasnego UI.

## 4. Assety logo

Nieprzetworzone kopie dostarczonych plikow znajduja sie w:

- `public/brand/homeback-logo-horizontal.png`;
- `public/brand/homeback-logo-vertical.png`;
- `public/brand/homeback-icon.png`.

Komponent `BrandLogo` uzywa poziomego znaku w shellu, pionowego tam, gdzie
jest potrzebny branding ekranow Auth, oraz ikony dla malych zastosowan.
Plansze referencyjne nie sa renderowane w aplikacji.

## 5. Design tokens

Jeden system tokenow w `src/app/globals.css` obejmuje:

| Token | Wartosc | Zastosowanie |
|---|---|---|
| background | `#F5F5F5` | tlo aplikacji |
| surface | `#FFFFFF` | karty i formularze |
| surface-muted | `#F5F5F5` | zagniezdzone powierzchnie i puste stany |
| foreground | `#333333` | tekst glowny |
| muted | `#666666` | tresc pomocnicza |
| line | `#CCCCCC` | obramowania |
| primary | `#1B6F4D` | glowne CTA i akcent |
| primary-hover | `#0D5F47` | hover i aktywny akcent |
| success | `#27AE60` | powodzenie |
| warning | `#F39C12` | ostrzezenia |
| danger | `#E74C3C` | bledy i usuwanie |
| info | `#3498DB` | komunikaty informacyjne |

Tokeny obejmuja tez focus ring, opacity dla disabled, radius 8 px, subtelny
cien kart oraz limit szerokosci tresci 1280 px. Kolory semantyczne sa uzywane
tylko dla odpowiednich komunikatow i dzialan.

## 6. Typografia

Stosowany jest bezpieczny lokalny stack z preferowanym `Inter`, a nastepnie
systemowymi fontami. Nie dodano zaleznosci ani zewnetrznego pobierania fontu.

- H1: 32 px na mobile i 40 px na wiekszych ekranach, waga 700.
- H2: 24 px, waga 600.
- H3: 18 px, waga 600.
- Tekst podstawowy: 16 px, line-height 1.6.
- Tekst pomocniczy: 14 px, line-height 1.5.
- Etykiety i przyciski: 14 px lub wiecej, wagi 500-700.

## 7. Wspolne komponenty

Minimalny zestaw wspolnych komponentow obejmuje:

- `Button`: primary, secondary, ghost i danger;
- `Card`;
- `PageHeader`;
- `SectionHeader`;
- `Badge`;
- `Alert`: info, success, warning i danger;
- `EmptyState`;
- `StatCard`.

Formularze Pomieszczen i wspolny wybor szablonu korzystaja ze wspolnych klas
kontrolek: etykieta nad polem, wysokosc co najmniej 44 px, helper text, focus,
hover, disabled i read-only. Natywne selecty pozostaja natywne.

## 8. Shell i nawigacja

Zalogowana czesc aplikacji ma kompaktowy header z poziomym logo, uporzadkowana
informacja o uzytkowniku, gospodarstwie i roli na desktopie oraz zachowanym
wylogowaniem. Nawigacja pozostaje pozioma na desktopie i przewijana w swoim
kontenerze na mobile, bez poziomego scrolla calej strony.

Aktywna trasa ma `aria-current`, wypelnione tla, stala ramke i widoczny znacznik,
wiec nie jest rozpoznawana wylacznie po kolorze.

## 9. Nazwa Pomieszczenia

Widoczna nazwa modulu zmienila sie z `Dom` na `Pomieszczenia` w menu, tytule,
opisie i slownikach PL oraz EN. Trasa `/home`, foldery, server actions, tabele
i identyfikatory techniczne pozostaly bez zmian.

## 10. Dashboard

Dashboard otrzymal wspolny `PageHeader`, powitanie z istniejacych danych profilu,
primary CTA `Dodaj rzecz` i dwukolumnowy na wiekszych ekranach uklad czterech
istniejacych sekcji: ostatnio dodane, terminy waznosci, rzeczy wedlug kategorii
i ostatnia aktywnosc. Nie dodano zapytan, wykresow ani sztucznych statystyk.

## 11. Pomieszczenia

Modul `/home` otrzymal:

- naglowek z nazwa gospodarstwa i CTA administratora;
- osobna karte wyszukiwarki;
- zwarte kafelki statystyk Pomieszczen, Schowkow i Pozycji przeniesione do naglowka;
- semantyczne alerty dla sukcesu, informacji, ostrzezen i bledow;
- karty Pomieszczen z badge rodzaju, liczba Schowkow i Pozycji oraz kolejnoscia;
- zagniezdzone karty Schowkow i zwarte wiersze Pozycji;
- czytelne primary, secondary, ghost, danger i disabled dla istniejacych akcji;
- zwarte puste stany.

Tworzenie, edycja, usuwanie, blokady zaleznosci, wyszukiwanie i server actions
pozostaja niezmienione funkcjonalnie.

## 12. Responsywnosc

- 375 px: jedna kolumna, brak poziomego scrolla strony, nawigacja przewijana
  tylko w swoim kontenerze, formularze i akcje ukladaja sie pionowo.
- 768 px: formularze i naglowki maja wiecej miejsca, statystyki pozostaja
  czytelne w trzech kolumnach.
- 1280 i 1440 px: tresc ma limit 1280 px, Dashboard ma dwie kolumny, shell i
  akcje nie zmieniaja szerokosci podczas aktywacji tras.

## 13. Dostepnosc

- Kontrast tekstu i powierzchni opiera sie na zestawieniach brand guidelines.
- Focus jest widoczny niezaleznie od przegladarki.
- Alerty zawieraja tekst i role semantyczne.
- Formularze zachowuja natywne `label`, `input`, `select` i `textarea`.
- Kontrolki i przyciski maja minimalna wysokosc okolo 44 px.
- `prefers-reduced-motion` ogranicza przejscia.

## 14. Poza zakresem

M4UX.1 nie zmienia:

- modelu danych, migracji, RLS ani RPC;
- household isolation, Auth, rol, routingu ani logiki CRUD;
- filtrowania M4D.1;
- zaleznosci projektu;
- M4D.2-M4D.7, M4B i M4C;
- zdjec, Storage, QR, NFC, AI, Home Assistant, dark mode ani biblioteki UI.

## 15. Reczne kryteria akceptacji

1. Sprawdz proporcje, czytelnosc i clear space poziomego logo.
2. Sprawdz header desktopowy i mobilny, profil, wylogowanie oraz aktywna trase.
3. Potwierdz widoczna nazwe `Pomieszczenia` przy zachowaniu adresu `/home`.
4. Sprawdz Dashboard, CTA oraz cztery puste sekcje bez falszywych danych.
5. Sprawdz wyszukiwarke, statystyki i puste stany Pomieszczen.
6. Sprawdz karty Pomieszczen, Schowkow i Pozycji, wraz z tworzeniem i edycja.
7. Potwierdz blokade usuniecia Pozycji uzywanej przez Rzecz jako alert.
8. Sprawdz danger, disabled i focus klawiatury.
9. Sprawdz widoki 375, 768, 1280 i 1440 px, bez poziomego scrolla.
10. Potwierdz brak regresji istniejacego CRUD.

## 16. Korekty po kontroli wlasciciela

Po recznej kontroli M4UX.1 wykonano waska runde korekt bez zmian logiki
biznesowej, bazy danych, RLS, RPC, Auth ani routingu:

- poziomy asset logo zostal przygotowany jako webowy wariant z mniejszym
  bialym plotnem i bez zmiany proporcji, kolorow, filtrow ani przyciecia znaku;
- header uzywa wiekszego, czytelniejszego kontenera logo z co najmniej 8 px
  wolnej przestrzeni wokol grafiki;
- aktywna nawigacja nie uzywa tekstowej kropki; stan aktywny jest oznaczony
  wypelnieniem primary, bialym tekstem, ramka, `aria-current` i stala dolna
  linia wewnatrz elementu;
- wyszukiwarka Pomieszczen dostala wiekszy padding karty, czytelny odstep
  label-control, wyrazniejsze odstepy miedzy inputem, zakresem i akcjami oraz
  pionowy uklad pelnej szerokosci na mobile;
- karty Rzeczy zostaly zageszczone: nazwa i status sa w headerze, kategoria,
  typ oraz ilosc tworza meta-informacje, lokalizacja jest jednym czytelnym
  blokiem, kod lokalizacji jest mniejszy i monospace, a opis nie rezerwuje
  miejsca, gdy go nie ma;
- formularz edycji Rzeczy pozostaje zwijany w `details`, a archiwizacja i
  edycja zachowuja dotychczasowe server actions;
- statystyki Pomieszczen zostaly przeniesione do zwartej grupy w naglowku,
  szeroki rzad kart statystyk pod wyszukiwarka zostal usuniety, a CTA
  `Dodaj pomieszczenie` znajduje sie w prawym obszarze naglowka.

## 17. Kierunek przyszlego M4UX.2

Obecna paleta jest spojna, spokojna i swiadomie ograniczona do brand colors
oraz podstawowych kolorow semantycznych. Kolejny etap M4UX.2 moze wprowadzic
bardziej wspolczesny jezyk wizualny bez odchodzenia od HomeBack.app:

- subtelnie barwione powierzchnie;
- bardziej nowoczesne badge;
- delikatne akcenty kategorii;
- ikony liniowe;
- lepsze hover states;
- warstwowe powierzchnie;
- zachowanie brand colors i WCAG AA.

Widoki waskie i tabletowe nadal marnuja zbyt duzo przestrzeni, co utrudnia
nawigacje i operowanie. Calosciowa optymalizacja zostaje odlozona do M4UX.2.

Te elementy nie sa implementowane w M4UX.1 i wymagaja osobnego zakresu.

## 18. Pozostawione do kolejnych etapow

Pozostaja bez implementacji, ale zachowuja zatwierdzony status:

- systemowa kategoria `Inne`;
- domyslny wybor `Inne` przy dodawaniu Rzeczy;
- rodzaj Schowka `Polka`.

Kolejne odswiezenia pozostalych modulow oraz M4D.2+ wymagaja osobnych etapow.
