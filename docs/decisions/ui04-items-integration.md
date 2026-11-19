# UI-04 — ekran Rzeczy

Zatwierdzony wariant UI-04 z lokalnej decyzji `ui04-items-screen.md` (korekta 4.11.2026) zastępuje wielowierszowy panel zwartych filtrów polem wyszukiwania z lupą i przyciskiem „Filtry”. Pod nimi pozostaje przewijany w poziomie pasek Wszystkie / Bez lokalizacji / pomieszczenia z ikonami; archiwum wybiera się w dodatkowych filtrach. Wybór skrótu zachowuje niezależne wyszukiwanie, kategorię, daty i sortowanie, a usuwa sprzeczne lokalizacje oraz widok/status. Zachowano kolejkę nawigacji, adresy URL i istniejące zapytania ograniczone gospodarstwem.

Względem prototypu zachowano później przyjęte w #141 i #144 miniatury 72 × 72 px, ochronę kolorów zdjęć w wymuszonym trybie ciemnym Chromium i kompaktowe akcje kart z nazwami dostępnymi dla technologii wspomagających. Starsza makieta pokazywała miniatury 80 px i menu „⋯”; nie przywracamy ich. Zachowano istniejący formularz dodawania, obsługę pustych stanów, archiwum, linków `focus` i uprawnienia akcji. Praca nad formularzem #142, dashboardem 6A, pogodą i rebrandingiem pozostaje poza zakresem.

W obecnej bazie wyniki wyszukiwarki globalnej używały samej kotwicy `#item-…`; po zmianie filtrów taki link mógł nie wskazywać żadnej widocznej karty. Do linku wyniku Rzeczy dodano istniejący parametr `?focus=…`, zachowując kotwicę i weryfikację dostępu po stronie serwera.

Materiał źródłowy UI-04 pochodzi z niecommitowanych zmian w `team-a-weatherapi-20261101`, którego stan zachowano; potrzebne pliki i patch zapisano w `HomeBack.worktrees/output/ui04-source-snapshot-20261115` poza repozytorium.
