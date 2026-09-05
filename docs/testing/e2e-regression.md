# Fundament regresji E2E

## Cel i zakres

Testy Playwright chronia podstawowa sciezke dostepu do aplikacji w lokalnym
Supabase: rejestracje, odbior i uzycie wiadomosci potwierdzajacej z Mailpit,
utworzenie gospodarstwa, wejscie do dashboardu, wylogowanie, ochrone trasy
oraz ponowne logowanie. Kazdy scenariusz tworzy unikalne konto i gospodarstwo;
testy nie resetuja bazy ani nie usuwaja cudzych danych.

Aktualny fundament uruchamia Chromium sekwencyjnie. To celowe: wspolne lokalne
Supabase i Mailpit sa zasobami wspoldzielonymi, a pojedynczy worker ogranicza
wyscigi pomiedzy wiadomosciami i limitami Auth.

## Wymagania lokalne

1. Uruchom lokalne Supabase zgodnie z README. Musza byc dostepne API na porcie
   `54321` i Mailpit na porcie `54324`.
2. Jednorazowo pobierz przegladarke testowa:

   ```powershell
   npx.cmd playwright install chromium
   ```

3. Uruchom testy:

   ```powershell
   npm.cmd run test:e2e
   ```

Konfiguracja Playwright uruchamia aplikacje na `http://127.0.0.1:3001`; nie
uzywa portu deweloperskiego `3000`. Jezeli na `3001` dziala juz wlasciwa,
lokalna instancja, Playwright ja wykorzysta.

Podczas uruchamiania zarzadzanej instancji Next.js Playwright przekazuje
`NEXT_PUBLIC_SITE_URL` zgodny z adresem testowym, domyslnie
`http://127.0.0.1:3001`. Dzieki temu akcje auth, w tym wylogowanie, nie
przekierowuja przegladarki testowej na port deweloperski `3000`. Jawnie
ustawiony `NEXT_PUBLIC_SITE_URL` nadal ma pierwszenstwo.

Lokalny szablon wiadomosci Supabase moze wystawic link z portem `3000`, poniewaz
jest to wartosc `site_url` srodowiska Auth. Pomocnik E2E odczytuje link wylacznie
z Mailpit, kieruje jego token do aplikacji na `3001` i potwierdza go przez
kontekst przegladarki. Dzieki temu test obejmuje prawdziwy e-mail i endpoint
potwierdzenia bez zmiany konfiguracji Supabase lub aplikacji.

## Automatycznie objete

- rejestracja nowego uzytkownika z unikalnym adresem;
- pojawienie sie wiadomosci potwierdzajacej w Mailpit i potwierdzenie tokenu;
- utworzenie gospodarstwa przez potwierdzonego administratora;
- wejscie do dashboardu zalogowanego gospodarstwa;
- wylogowanie i przekierowanie niezalogowanego uzytkownika z `/dashboard`;
- ponowne logowanie tym samym kontem.

W tej fazie `test:e2e` uruchamia tylko fundament auth wskazany w
`playwright.config.ts`. Istniejacy niezalezny scenariusz M3 pozostaje w
repozytorium, ale wymaga osobnej migracji na wspolny przeplyw Mailpit dla portu
3001, zanim zostanie dolaczony do tej komendy.

## Nadal recznie

- tresc, wyglad i dostepnosc e-maila w rzeczywistym kliencie pocztowym;
- dostarczalnosc, limity i konfiguracja SMTP produkcyjnego Supabase;
- przeplywy OAuth, resetu hasla, zmiany e-maila i zaproszen;
- zachowanie na urzadzeniach mobilnych oraz w przegladarkach innych niz Chromium;
- kompletna kontrola RLS i izolacji danych gospodarstw (nalezy do testow bazy).
