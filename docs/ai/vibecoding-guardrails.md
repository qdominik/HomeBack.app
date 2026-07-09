# HomeBack.app AI Guardrails

Ten plik jest krotkim skrotem roboczym. Pelne i wiazace zrodlo prawdy pozostaje tutaj:

- `docs/product/homebase-product-spec.md`

## Zasady Obowiazkowe

1. Nie tworz nowych modulow bez wyraznej zgody wlasciciela projektu.
2. Nie rozszerzaj MVP poza: Rzeczy, Dom, Rodzina, Dashboard, Dokumenty, Kategorie, Ustawienia.
3. Nie dodawaj AI, Home Assistant, QR/NFC, Sejfu, platnosci, multi-household, mapy 2D ani aplikacji mobilnej native w MVP.
4. Nie zmieniaj modelu danych, nazw tabel, pol, relacji, RLS, routingu, stacku ani zaleznosci bez potwierdzenia.
5. Przed wieksza zmiana przygotuj plan: cel, zakres, pliki, wplyw na baze, wplyw na RLS, ryzyka, testy.
6. Jezeli czegos nie ma w dokumencie produktu, oznacz to jako `[WYMAGA DECYZJI]` i nie implementuj na podstawie domyslu.
7. Kazda funkcja odczytu i zapisu danych musi respektowac `household_id` oraz RLS.
8. Nie wylaczaj zabezpieczen tymczasowo. Nie tworz publicznych bucketow dla danych uzytkownikow. Nie zapisuj sekretow w kodzie.
9. Po kazdej zmianie przygotuj raport: zmiany, pliki, zgodnosc z MVP, baza danych, bezpieczenstwo, testy i otwarte decyzje.

Domyslna zasada: gdy nie masz pewnosci, zatrzymaj sie, wskaz problem i popros o decyzje zamiast zgadywac.
