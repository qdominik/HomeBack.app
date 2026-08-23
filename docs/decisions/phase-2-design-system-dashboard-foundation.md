# Faza 2 — fundament design systemu i Dashboardu

## Decyzja

Zaczynamy Fazę 2 od małego, wspólnego fundamentu UI oraz od przygotowania
Dashboardu do przyszłego wyboru modułów przez użytkownika. Nie wykonujemy
pełnego redesignu aplikacji.

## Dlaczego minimalny design system

HomeBack ma już działające tokeny w `globals.css` (kolory, umiarkowany radius,
cień karty i focus). Utrwalamy ten język przez małe komponenty i helper klas,
zamiast wprowadzać nową warstwę wizualną, zależności albo dekoracyjne efekty.
Efektem ma być spokojny, czytelny i praktyczny interfejs domowy.

## Zakres Fazy 2

- wspólny `StatusBadge` dla statusu `soon` z istniejącego i18n;
- `DashboardModuleCard` renderujący definicję z rejestru;
- filtrowanie Dashboardu po `defaultVisible` pozostawione jako punkt wejścia
  pod przyszłe preferencje;
- widoczna kategoria „Personalizacja Dashboardu” w Ustawieniach jako
  placeholder bez zapisu danych;
- brak zmian w logice danych, autoryzacji i routingu.

## Poza zakresem

Nie wdrażamy zapisu preferencji użytkownika, drag-and-drop, kolejności modułów,
nowych modułów biznesowych, pełnego redesignu, zmian auth/RLS/Supabase,
migracji, server actions ani zmian w obsłudze zdjęć Rzeczy.

## Przygotowanie pod personalizację

Rejestr dashboardu pozostaje jedynym źródłem statusu, tytułu, opisu i wartości
`defaultVisible`. Przyszła personalizacja powinna dostarczać preferowaną listę
kluczy modułów do warstwy widoku, z bezpiecznym fallbackiem do `defaultVisible`.
Nie należy duplikować statusów ani opisów w komponentach.

## Dodawanie przyszłych modułów

Nowy moduł, np. „Plan lekcji ze zdjęcia” albo „Lista zakupów z podziałem na
sklepy”, najpierw otrzymuje decyzję produktową i definicję w rejestrze. Wpis
powinien określać klucz, status, tytuł PL/EN, opis PL/EN oraz domyślną
widoczność. Dopiero po zatwierdzeniu implementuje się jego działanie i ewentualne
odczyty/zapisy zgodne z `household_id` oraz RLS.

## Wymaga decyzji właściciela

Przed implementacją pełnej personalizacji trzeba ustalić, czy preferencje są
per-użytkownik czy per-gospodarstwo, czy użytkownik może zmieniać kolejność
oraz jak obsługiwane są moduły wycofane lub niedostępne.
