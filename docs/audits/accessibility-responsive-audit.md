# Audyt dostępności i responsywności — HomeBack.app

Data audytu: 2026-07-25  
Zakres kodu: `a04203b066acf7c63f12f7f60e4e78a8497cfd8a` (`audit/accessibility-responsive`)  
Uruchomienie: lokalnie, `http://127.0.0.1:3002`  
Zmiany produkcyjne: brak

## Metoda i ograniczenia

- Sprawdzono odpowiedzi działającej aplikacji dla: `/login`, `/register`, `/dashboard`, `/home`, `/items`, `/categories`, `/documents`, `/family`, `/settings`.
- `/login` i `/register` zwracają `200`; trasy chronione zwracają `307` do `/login` dla niezalogowanej osoby. To potwierdza działanie ochrony tras, ale nie pozwala obejrzeć danych gospodarstwa bez konta testowego.
- Serwer uruchomiono na porcie 3002 bez resetowania Supabase. Kod audytowany w worktree i katalog z zależnościami lokalnymi mają ten sam commit `a04203b`.
- Inspekcja interakcji w przeglądarce została zablokowana przez sandbox środowiska (proces kontroli przeglądarki nie uruchamia się). Wnioski oznaczone jako **fakt** pochodzą z uruchomionej aplikacji lub jednoznacznej inspekcji kodu/arkuszy stylów; **hipotezy** wymagają krótkiej weryfikacji ręcznej po zalogowaniu. Nie są to wyniki automatycznego testu czytnikiem ekranu ani zrzuty z fizycznych viewportów.

## Podsumowanie

| Priorytet | Liczba | Znaczenie |
| --- | ---: | --- |
| P0 | 0 | Blokada krytycznej czynności |
| P1 | 3 | Istotna bariera dostępności lub podstawowej użyteczności |
| P2 | 3 | Poważna niedogodność / niespełnione dobre praktyki |
| P3 | 2 | Usprawnienie lub kwestia estetyczna |

## Ustalenia

### P1 — focus klawiaturowy jest celowo usunięty dla współdzielonych przycisków i nawigacji

**Fakt.** Globalny selektor `:focus-visible` definiuje obrys, lecz `buttonClassName()` i linki głównej nawigacji dodają klasę `focus-visible:outline-none`. Ta klasa ma większą swoistość i usuwa jedyny wskaźnik focusu. Dotyczy to m.in. przycisków dialogów usuwania, akcji w strukturze domu, przycisków kart Rzeczy i odnośników w menu. Osoba poruszająca się klawiaturą może nie widzieć aktualnej pozycji focusu.

**Rekomendacja:** zachować obrys albo dodać równoważny wskaźnik (`focus-visible:ring-2`, kontrastujący pierścień i `ring-offset`). Sprawdzić pełną sekwencję Tab/Shift+Tab w `/home`, `/items` i menu.

### P1 — komunikaty błędów po przekierowaniu nie są ogłaszane technologiom asystującym

**Fakt.** Ekrany logowania i rejestracji renderują błąd jako zwykły element `p`; analogicznie błędy, sukcesy i błędy odczytu w `/items` są zwykłymi `p`. Nie mają `role="alert"`, `role="status"` ani `aria-live`. Po błędzie akcji serwerowej focus także nie jest kierowany na komunikat lub nagłówek błędu.

**Wpływ:** użytkownik czytnika ekranowego może nie dowiedzieć się, że operacja się nie udała, zwłaszcza po przekierowaniu.

**Rekomendacja:** użyć wspólnego komponentu alertu z właściwą żywą strefą (`alert` dla błędów, `status` dla sukcesów) i po powrocie z akcji ustawić focus na komunikacie albo na `h1` z informacją o błędzie.

### P1 — komponent filtrów Rzeczy nie jest renderowany na stronie `/items`

**Fakt.** `src/components/items/item-filters.tsx` udostępnia wyszukiwanie i filtry kategorii, statusu oraz lokalizacji, lecz `src/app/(app)/items/page.tsx` go nie importuje ani nie renderuje. Widoczne są tylko trzy przełączniki widoku (wszystkie / bez lokalizacji / archiwalne). Nie ma też obsługi parametrów tych filtrów w typie `searchParams` strony.

**Wpływ:** podstawowe odnajdywanie rzeczy przez filtry nie jest dostępne w module Rzeczy; przy większym zbiorze danych istotnie pogarsza to obsługę klawiaturą, dotykiem i ogólną użyteczność.

**Rekomendacja:** zdecydować, czy filtry są funkcją MVP. Jeśli tak, wyrenderować formularz, obsłużyć jego parametry po stronie serwera i zachować etykiety formularza oraz przycisk czyszczenia.

### P2 — kontrast tekstu zastępczego nie spełnia poziomu AA

**Fakt.** Zmienna `--placeholder: #999999` jest stosowana na białym tle kontrolek. Jej kontrast względem `#ffffff` wynosi około **2.85:1**, poniżej wymaganego dla zwykłego tekstu **4.5:1**. Placeholder nie zastępuje etykiety, ale gdy jest widoczny, powinien pozostać czytelny.

**Rekomendacja:** zastosować ciemniejszy kolor, co najmniej odpowiadający kontrastowi 4.5:1, i zweryfikować w stanach focus oraz disabled.

### P2 — brak skrótu „przejdź do treści” przed długą nawigacją

**Fakt.** `AppShell` renderuje siedem linków nawigacyjnych przed `main`; nie ma odnośnika pomijającego nagłówek. Na każdej trasie aplikacyjnej osoba korzystająca z klawiatury musi przejść przez logo, wylogowanie i wszystkie pozycje menu, aby dotrzeć do treści.

**Rekomendacja:** dodać pierwszy, widoczny po focusie link do unikalnego `id` na `main`.

### P2 — „Zapisz kategorię” raportuje wynik tylko wizualnie

**Fakt.** `ItemForm` wyświetla `quickCategoryFeedback` jako zwykły `p` bez `role` lub `aria-live`; po dodaniu kategorii nie przenosi focusu do nowo wybranej opcji ani nie ogłasza sukcesu/błędu. Dotyczy zarówno komunikatu o brakującej nazwie, jak i wyniku operacji asynchronicznej.

**Rekomendacja:** zastosować `role="status"` dla sukcesu i `role="alert"` dla błędu; po sukcesie pozostawić focus w przewidywalnym miejscu i potwierdzić nowy wybór.

### P3 — pojedyncza kolumna kart Rzeczy na tablecie wykorzystuje przestrzeń słabo

**Fakt.** Siatka kart na `/items` przełącza się na dwie kolumny dopiero od `lg` (1024 px); przy 768 px pozostaje jedną kolumną w kontenerze o szerokości około 720 px. Karty mają mało treści i w tym zakresie pozostaje dużo niewykorzystanej przestrzeni.

**Kwestia estetyczna / użyteczność, nie błąd dostępności.** Rozważyć dwie kolumny od `md` po ręcznej kontroli długości nazw i formularza edycji.

### P3 — filtr w nieużywanym komponencie ma niespójny zapis wartości statusu

**Fakt.** W `item-filters.tsx` wartość opcji „zużyte” jest zapisana jako `"zuĹĽyte"`, podczas gdy statusy w modelu i pozostałych komponentach używają `"zużyte"`. Ponieważ filtr nie jest dziś renderowany, użytkownik nie odczuwa tego bezpośrednio.

**Hipoteza do potwierdzenia po włączeniu filtrów:** parametr tej opcji nie dopasuje rekordów o statusie „zużyte”. Należy poprawić kodowanie/wartość i dodać test filtrowania.

## Ocena obszarów objętych audytem

| Obszar | Fakty potwierdzone | Hipotezy / dalsza walidacja |
| --- | --- | --- |
| Klawiatura i focus | Semantyczne `button`, `a`, `summary`, `select` i natywny `dialog` są szeroko używane. Focus jest jednak ukryty w części wspólnych akcji (P1). Dialogi zwracają focus do przycisku wyzwalającego po zamknięciu. | Ręcznie przetestować kolejność focusu, Escape i pułapkę focusu we wszystkich wariantach usuwania po zalogowaniu. |
| Formularze i błędy | Etykiety są prawidłowo powiązane przez zagnieżdżenie pól w `label`; pola wymagane używają natywnego `required`/`minLength`. Błędy przekierowań i szybkie tworzenie kategorii nie są ogłaszane (P1/P2). | Sprawdzić teksty błędów walidacji przeglądarki w języku użytkownika i focus po błędzie serwera. |
| Dialogi | Dialogi L2/L3 mają `showModal`, `aria-labelledby`, `aria-describedby`, blokują Escape w trakcie wysyłania i przywracają focus do triggera. | Na realnych danych sprawdzić, czy focus po otwarciu trafia na oczekiwany element i czy długi dialog nie ukrywa akcji przy 320 px. |
| Semantyka / czytniki | Ustawiono `lang="pl"`, landmarki `header`/`nav`/`main`, nazwy nawigacji i `aria-current`. Brakuje skip linku (P2) i żywych regionów w częściach formularzy (P1/P2). | Przejść NVDA + Firefox przez stronę logowania, strukturę domu i kartę Rzeczy po utworzeniu danych testowych. |
| Kontrast i stany | Widoczny placeholder ma zbyt niski kontrast (P2); disabled jest oznaczony przez `disabled`, zmianę kursora i opacity. Globalny focus ma prawidłową intencję, ale jest nadpisany w części komponentów (P1). | Zmierzyć kontrast tekstu na kolorach statusów i disabled w renderowanych komponentach. |
| 320/375/768/1024 px | Kod stosuje płynne szerokości, `px-4`, zawijanie nagłówka, przewijaną poziomo nawigację oraz pełnoekranowo bezpieczne dialogi (`w-[calc(100%-2rem)]`, przewijanie pionowe). Karty Rzeczy są 1 kolumną do 1024 px (P3). | Zweryfikować wizualnie bez poziomego overflow na 320 i 375 oraz komfort gęstości treści na 768 i 1024. |

## Priorytety napraw

1. Przywrócić wyraźny wskaźnik `:focus-visible` we wspólnym przycisku i menu.
2. Ujednolicić błędy oraz sukcesy jako dostępne komunikaty dynamiczne z zarządzaniem focusem po akcji.
3. Podjąć decyzję i przywrócić kompletny, dostępny interfejs filtrów Rzeczy.
4. Dodać skip link i podnieść kontrast placeholderów.
5. Po uzyskaniu konta testowego wykonać ręczny przebieg z klawiaturą, NVDA i czterema viewportami; nie klasyfikować hipotez jako potwierdzonych bez tego kroku.
