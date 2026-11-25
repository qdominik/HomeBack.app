# UI-06A — scena i zegar Rytmu domu

Wzorzec sceny UI-00 R2 zaakceptowany przez właściciela: commit `4673342` (źródło i zapis odbioru w lokalnym `feature/team-a-rhythm-shell-20261031`, `docs/decisions/ui00-adaptive-atmosphere.md`). Paleta B i skorygowany wieczór zostały następnie zaakceptowane przy `46a859b`; szczegóły i zdjęcie referencji zawiera `docs/decisions/ui01-foundation.md`.

Ta integracja bazuje na `fd4071e502a7e25e6f0fb141874a47748bddb4b8`. Wykorzystuje neutralną scenę domu i istniejący licznik rzeczy bez lokalizacji. Nie dodaje usług pogodowych, fałszywych danych pogodowych, ustawień wyglądu, zależności, tras ani zmian bazy, RLS lub uprawnień. Istniejący rejestr i personalizacja modułów dashboardu pozostają bez zmian; błąd danych nie jest pokazywany jako zero.

Zgodnie z kontraktem UI-00, przed integracją 6B czas pochodzi z zegara i strefy urządzenia. Co minutę oraz po powrocie do karty/przeglądarki aplikacja przelicza porę i tokeny. Zegar nie zakłada Warszawy ani strefy wynikającej z języka. Zmiana na czas letni i podróż korzystają z aktualnych ustawień systemu. Docelowa astronomia lokalizacji gospodarstwa należy do 6B.

Przed pierwszym wyświetleniem uruchamiany jest ten sam resolver co po hydratacji; nie jest odczytywany stan serwera ani zapisywane preferencje. Fazy sceny to świt 05:00, ranek 07:00, dzień 11:00, wieczór 16:00 i noc 22:30. Zatwierdzona korekta UI-01 zastępuje wcześniejszą godzinę pełnej nocy 20:00: od 18:00 przejście stopniowo przyciemnia powierzchnie, przy 19:15 osiągając wzorzec poprzedniego 20:45, a o 22:30 osiąga pełną noc. Kolory tekstu są dobierane atomowo dla kontrastu, bez filtra na zdjęciach.

Scena jest dekoracyjna i ukryta przed technologiami asystującymi. Animacja zatrzymuje się poza widokiem i w ukrytej karcie oraz jest wyłączana przy `prefers-reduced-motion`. Tekst, działanie linku i błędy są zwykłym HTML. Sterowanie motywem i ruchem przez użytkownika pozostaje w późniejszym etapie.
