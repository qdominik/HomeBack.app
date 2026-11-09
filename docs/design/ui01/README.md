# HomeBack — etap 1: fundament aplikacji

## Integracja z main — 9.11.2026

Fundament przeniesiono na main `568ccf68ee89dc81bd8c554a39492ea47404f2bc`. Podgląd logowania pochodzi z aktualnego buildu aplikacji: [desktop](review/login-desktop.png), [telefon](review/login-phone.png). Do podglądu użyto lokalnych testowych wartości publicznej konfiguracji, bez logowania.

Poprawione przejście wariantu B pozostaje ręczną referencją kolorystyczną: [19:15](review/transition-19-25.png), [22:30](review/transition-22-5.png). W 19 punktach od 18:00 do 22:30 kolory tła i powierzchni są identyczne z zaakceptowanym zapisem [korekty](evening-warmth-correction-checks.json); [wynik porównania](review/checks.json). Automatyczny zegar i ustawienia motywu należą do kolejnego etapu, nie do tego PR.

Do odtwarzania lokalnych fontów dołączono ich źródła i licencje z UI-00; nie przeniesiono pozostałej implementacji UI-00. Poniższy opis zachowuje oryginalny kontekst decyzji i weryfikacji z października.

30.10.2026 · Team A · feature/ui01-tokens-typography-20261030.
Baza aplikacji: origin/main a2bb29c; zatwierdzona referencja UI-00: 4673342.

Etap 0 jest zaakceptowany wizualnie. Etap 1 został zaimplementowany w osobnej gałęzi i jest gotowy do oceny z ograniczeniem lokalnego Turbopack opisanym w [weryfikacji](verification.md). Nie jest to wydanie Production.

**Właściciel wybrał B · Wyraźna zmiana, 30.10.2026.** Tokeny aplikacji mają teraz ciepły krem rano i wieczorem, neutralną biel w południe i zaakceptowaną paletę ciemną nocą. Błękitne tło zostało zastąpione. [Opis wybranego zakresu](temperature-options.md). Teksty pokazują konkretne rzeczy, lokalizacje i notatki.

**31.10.2026 właściciel zaakceptował także przejście wieczór–noc po korekcie 2600–2650 K.** Obowiązuje ciemniejsza zieleń z jasnym tekstem, analogiczna do wcześniejszego B / 2500 K; pełna noc od 22:30. [Zaakceptowany widok](reference/screenshots/evening-2600-corrected.jpg), [pomiary końcowej korekty](evening-warmth-correction-checks.json). To referencja kolorystyczna dalszych etapów.

## Co działa w kodzie aplikacji

- Tokeny bazowe → role semantyczne → aliasy kontrolek i typografii w src/styles/ui-tokens.css. Palety: ciepła, chłodna i ciemna; powierzchnie, teksty, statusy, fokus, promienie i ruch.
- Inter dla interfejsu oraz Fraunces dla PageHeader, SectionHeader i StatCard. Lokalne zmienne WOFF2, polskie znaki, metryczny fallback i brak fontów z CDN. [Manifest fontów](font-manifest.json).
- Istniejące role kolorów Tailwind i uiTokens korzystają ze wspólnego źródła. Przyciski otrzymują on-primary/on-danger, dzięki czemu jasny akcent w ciemnej palecie ma ciemny tekst. Zmapowano także istniejące wywołania w 13 plikach.
- Pola wspólnego prymitywu mają osobną, kontrastową granicę; minimum 44 px i obsługa natywnych atrybutów pozostają zachowane. Reset fontu w warstwie base pozwala działać klasom typograficznym.

Domyślnie aplikacja używa porannej jasnej palety B. CSS przygotowuje data-theme=light/dark oraz data-tone=dawn/cool/evening (bez tonu: poranek). Przełączanie motywu, zegar, pogoda i zapamiętywanie preferencji należą do 6A/6B/7. Układy ekranów i dotychczasowe formularze będą migrowane w dalszych etapach; sam fundament nie jest pełną przebudową aplikacji.

## Podgląd i dowody

[Otwórz porównanie temperatury bieli](http://127.0.0.1:4187/temperature.html) — suwak godziny i pięć pór dnia aktualizują trzy zakresy adaptacji jednocześnie. Plansza importuje rzeczywiste komponenty i kopiuje CSS z builda aplikacji. Dane są syntetyczne, przyciski nie zapisują danych. Nie dodano trasy do aplikacji.

- [Wybrany wariant B](reference/screenshots/selected-b.jpg), [kontrola tokenów B](selected-b-checks.json).
- Wcześniejsze porównanie b8c303b: [południe](reference/screenshots/temperature-noon.jpg), [wieczór](reference/screenshots/temperature-evening.jpg), [noc](reference/screenshots/temperature-night.jpg).
- [Pomiary i próby podglądu temperatury](temperature-browser-checks.json).
- [Poprzedni układ porównania komponentów na aktualnych tokenach](reference/foundation.html); poniższe obrazy fundamentu pochodzą z wcześniejszej korekty 93abda5.

- [Plansza komputerowa](reference/screenshots/foundation-desktop.jpg)
- [Telefon](reference/screenshots/foundation-phone.jpg), [tablet](reference/screenshots/foundation-tablet.jpg), [320 px](reference/screenshots/foundation-small-phone.jpg)
- Rzeczywisty ekran aplikacji, wymuszony przykładowy błąd potwierdzenia i puste pola: [telefon](reference/screenshots/login-phone.jpg), [tablet](reference/screenshots/login-tablet.jpg), [komputer](reference/screenshots/login-desktop.jpg). Bez logowania i danych gospodarstwa.
- [Style i pomiary przeglądarki](browser-samples.json), [kontrast](contrast-result.json), [decyzja wykonawcza i inwentaryzacja](../../decisions/ui01-foundation.md).

## Odtworzenie

Po npm ci uruchom kolejno:

```powershell
npm run build -- --webpack
npx tsc docs/design/ui01/reference/render.tsx --outDir .test-build/ui01 --rootDir . --jsx react-jsx --module commonjs --moduleResolution node --target ES2022 --esModuleInterop --skipLibCheck
node .test-build/ui01/docs/design/ui01/reference/render.js
node docs/design/ui01/reference/serve.mjs
```

Serwer dokumentacyjny nasłuchuje wyłącznie na 127.0.0.1:4187. Regeneracja planszy wymaga gotowego builda; zapisane obrazy wymagają osobnego przejścia w przeglądarce. `node docs/design/ui01/verify-contrast.mjs` ponownie ocenia zapisane style, a nie wykonuje nowych screenshotów.

Kolejny etap 2: ujednolicenie komponentów, formularzy i dialogów zgodnie z zatwierdzonym kontraktem. Nawigacja i AppShell należą do etapu 3.
