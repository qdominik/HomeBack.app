# UI-03 — integracja powłoki „Rytmu domu”

UI-01 (paleta B) i UI-02 są już zintegrowane. Ta zmiana przenosi wzorzec powłoki UI-03 z lokalnego `feature/team-a-rhythm-shell-20261031`: pasek boczny na desktopie, poziome skróty na tablecie, dolne skróty na telefonie oraz link pomijający nawigację. Istniejące menu pozostaje pełną listą modułów; wyszukiwanie, dodawanie, role i personalizacja dashboardu nie są przepisywane.

Praca źródłowa obejmuje również prototyp automatycznego zegara, ustawienia wyglądu i sceny pogody. Według decyzji UI-00 są to etapy 6A, 6B i 7, a zgodnie z ustaloną kolejnością prac nie wchodzą do tego PR. Karta z dekoracyjną sceną i licznikiem bez lokalizacji jest częścią 6A; do tego czasu dashboard zachowuje istniejące moduły i dane. UI-04, WeatherAPI i rebranding pozostają osobnymi etapami.

Lokalny materiał źródłowy, w tym nieśledzone pliki, pozostał bez zmian. Przed integracją zapisano kopię potrzebnych fragmentów i dokumentacji w `HomeBack.worktrees/output/ui03-source-snapshot-20261115` poza repozytorium.
