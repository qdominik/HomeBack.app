# Faza 4 — polish wizualny Dashboardu i Ustawień

## Decyzja

Po Fazie 3 (funkcjonalna personalizacja) porządkujemy warstwę wizualną dwóch
ekranów, na których użytkownik najczęściej pracuje: Dashboard oraz Ustawienia
z naciskiem na „Personalizację Dashboardu". To świadomie wąski polish, nie
redesign aplikacji.

## Co poprawiono wizualnie

- **Karta modułu Dashboardu**: tytuł, opis i status tworzą jedną hierarchię
  (opis przylega do tytułu, `mt-2` zamiast `mt-5`); stan „Wkrótce" dostaje
  wyraźny, ale spokojny placeholder z przerywaną ramką zamiast trzeciego
  akapitu dublującego badge; karty rozciągają placeholder do wspólnej linii
  dolnej (`mt-auto`), co porządkuje siatkę 2-kolumnową.
- **StatusBadge „Wkrótce"**: mniejszy pill (h-6, zaokrąglony, z borderem),
  z subtelną kropką statusu; widoczny, ale nie dominuje nad tytułami; struktura
  `statusStyles` przygotowana pod kolejne statusy bez rozbudowy.
- **Dashboard — empty state**: ukrycie wszystkich modułów pokazuje teraz
  kartę z przerywaną ramką, krótkim tytułem, wyjaśnieniem i przyciskiem
  prowadzącym do personalizacji, zamiast dwóch nagich paragrafów.
- **Personalizacja Dashboardu**: pojedyncza lista z `rounded-control`,
  hover feedback na wierszach, przełączniki z jaśniejszym trackiem; komunikat
  o zakresie (widoczność, nie aktywacja) przeniesiony do stopki formularza
  obok przycisku zapisu — jeden spójny blok akcji zamiast Alertu nad listą.
- **Ustawienia**: ujednolicenie radiusu na token `rounded-control` (8px)
  w zakładkach i kartach zamiast mieszanki `rounded-md`/`rounded-control`.

## Czego świadomie nie ruszano

- logiki preferencji, rejestru modułów i fallbacku `defaultVisible`;
- server actions, auth, RLS, Supabase, modelu danych i migracji;
- item-photo, icon search, nawigacji (AppShell poza zmianą wyglądu badge'a
  dziedziczoną automatycznie);
- innych modułów aplikacji (Items, Home, Categories) — ich polish to osobne
  etapy;
- nowych zależności UI i nowych tokenów kolorystycznych.

## Zasady dla kolejnych etapów redesignu

- spokojny, domowy, narzędziowy charakter: bez gradientów, bez dekoracyjnych
  efektów, bez marketingowych hero;
- jeden token radiusu (`rounded-control`) i jeden cień (`shadow-card`);
- status komunikujemy pill badge'em + stanem kontenera, nigdy kolorem samym;
- puste stany są pełnoprawnymi kartami z jedną jasną akcją;
- teksty wyłącznie z i18n (PL/EN), bez hardcoded copy.

## Dlaczego Dashboard i Ustawienia

Dashboard jest ekranem startowym i wizytówką aplikacji, a Ustawienia z
personalizacją to najnowszy przepływ (Faza 3), który jako pierwszy zebrał
uwagi o czytelności. Polish tych dwóch ekranów daje największy efekt
użytkownikowi przy najmniejszym ryzyku regresji.

## Walidacja

`test:logic`, `lint`, `build`, `git diff --check`; smoke lokalny Dashboardu,
personalizacji, empty state oraz mobile 390×844 bez poziomego overflow.
