# Raport PL: Obsluga bledow zdjec w formularzu Rzeczy

## 1. Status

Naprawa zakonczona. `npm run lint` PASS, `npm run test:logic` **222/222 PASS**,
`npm run build` PASS. Repo czyste poza celowa poprawka (git status short w sekcji 7).

## 2. Cel

W formularzu Rzeczy (item-form) nieobslugiwane bledy zdjec crashowaly strone
("this page couldn't load"). Nalezy obslugiwac bez crasha:

- plik wiekszy niz 2 MB,
- nieobslugiwany format (np. PNG),
- blad zapisu do Storage,
- blad analizy AI,
- brak pewnego rozpoznania przez AI,
- i pokazywac przyjazne komunikaty (PL i EN).

## 3. Root cause

- `next.config.ts` nie ustawial limitu body server actions. Domyślny limit w
  Next.js to **1 MB**, a walidacja zdjec pozwala na **2 MB**. Pliki 1-2 MB
  przekraczaly limit body server action `uploadItemPhotoDraft` -> nieprzewidziany
  wyjatek -> crash strony. Brak tez plikow `error.tsx` / `global-error.tsx` w
  `src/app/`.
- `actions.ts` zwraca typowane rezultaty, ale server actions nie mialy
  `try/catch` po stronie formularza, wiec nieprzewidziany wyjatek (np. limit
  body) rzucal na zewnatrz.
- Walidacja rozmiaru/typu istniala tylko na serwerze
  (`validateItemPhotoFile` / `validateItemPhotoMetadata`), nie na kliencie przed
  wyslaniem pliku.
- AI moglo nadpisac wpisana przez uzytkownika nazwe sugestia
  typu "Nieznany przedmiot" (niewiarygodne rozpoznanie).

## 4. Zmiany

### 4.1. `next.config.ts`

Dodane (zgodnie z dokumentacja Next.js 16, opcja jest pod `experimental`):

```ts
experimental: {
  serverActions: {
    bodySizeLimit: "3mb",
  },
},
```

3 MB pozostawia zapas na narzuty multipart (granice i naglowki) przy plikach do 2 MB.

### 4.2. `src/lib/items/item-photo-ai/apply-suggestion.ts` (nowy)

Pomocnicze funkcje decyzyjne (czysta logika, testowalna):

- `isItemPhotoUnknownName(name)` - czy nazwa to placeholder typu
  "Nieznany przedmiot" / "unknown item" (normalizacja PL, diakrytyka).
- `isItemPhotoWeakSuggestion(suggestion)` - sugestia jest slaba, gdy
  `categoryConfidence === "none"`, nazwa pusta albo nieznany przedmiot.
- `shouldApplyItemPhotoSuggestionName(currentName, suggestionName)` -
  nie nadpisuje wpisanej przez uzytkownika nazwy sugestia "nieznany przedmiot";
  pusta nazwa pola jest zawsze uzupelniana.

### 4.3. `src/lib/items/item-photo-ai/index.ts`

Dodane eksporty trzech funkcji z `apply-suggestion`.

### 4.4. i18n (`src/lib/i18n/types.ts`, `locales/pl.ts`, `locales/en.ts`)

- Nowy klucz `photo.noConfidentMatch`:
  PL: "Nie rozpoznałem przedmiotu na zdjeciu. Możesz wpisac nazwe recznie."
  EN: "I couldn't recognize the item in the photo. You can enter the name manually."
- Przyjazne tresci bledow PL/EN: `fileTooLarge` (max 2 MB), `unsupportedFileType`
  (JPEG/WebP), `uploadFailed` ("sprobuj ponownie"), `analysisFailed`
  ("zdjecie zapisane, ale analiza sie nie powiodla - uzupelnij nazwe recznie").

### 4.5. `src/components/items/item-form.tsx`

- Importy: `isItemPhotoWeakSuggestion`, `shouldApplyItemPhotoSuggestionName`
  (z `apply-suggestion`), `validateItemPhotoFile` (z `item-photo-storage`).
- Walidacja client-side przed wysylka: zly rozmiar/format -> komunikat
  `photoErrorMessages[selection.code]`, input czyszczony, brak wywolania serwera.
- `try/catch` wokol wszystkich wywolan server actions:
  `uploadItemPhotoDraft` (catch -> `uploadFailed`), `analyzeItemPhotoDraft`
  (catch -> `analysisFailed`), `cleanupItemPhotoDraft` (catch -> `cleanupFailed`
  lub pomijane w tle przy podmianie zdjecia), `createQuickCustomCategory`
  (catch -> `actionFailed`).
- Guard nazwy: AI nie nadpisuje wpisanej nazwy slaba sugestia
  (`shouldApplyItemPhotoSuggestionName`); przy slabej sugestii komunikat
  `noConfidentMatch` zamiast sugerowania, ze wszystko zastosowano.

### 4.6. Testy

- Nowy `tests/unit/item-photo-suggestion-apply.test.ts`: walidacja klienta
  (rozmiar/typ), guard nazwy, weak suggestion, normalizacja "nieznany przedmiot",
  testy zrodlowe item-form.tsx (walidacja przed wysylka, try/catch, guard),
  test zrodlowy next.config.ts (bodySizeLimit pod `experimental`).
- `tests/unit/item-form-values.test.ts`: aktualizacja asercji o nowy guard
  (`shouldApplyItemPhotoSuggestionName(itemName, suggestionName)` +
  `setItemName(suggestionName)`).
- `package.json`: nowy plik dopisany do skryptu `test:logic`.

## 5. Zachowanie po naprawie

1. Plik > 2 MB: od razu komunikat "Zdjęcie jest za duże. Maksymalny rozmiar
   pliku to 2 MB." - bez wysylki do serwera, bez crasha.
2. Zly format (np. PNG): "Nieobslugiwany format zdjecia. Wgraj plik JPEG lub WebP."
3. Blad Storage przy zapisie draftu: "Nie udalo sie zapisac zdjecia. Sprobuj ponownie."
4. Blad analizy AI: zdjecie zapisane, komunikat o nieudanej analizie, formularz
   do recznego uzupelnienia.
5. Slaba sugestia AI ("Nieznany przedmiot", `categoryConfidence === "none"`):
   wpisana nazwa uzytkownika nie jest nadpisywana; komunikat
   "Nie rozpoznałem przedmiotu na zdjeciu...".
6. Kazdy nieprzewidziany wyjatek server action jest lapany i tlumaczony na
   kontrolowany komunikat.

## 6. Testy (regresja)

- `npm run lint` - PASS (0 bledow).
- `npm run test:logic` - **222/222 PASS** (wczesniej 214, dodano 8 nowych asercji/testow).
- `npm run build` - PASS (Next 16.2.12, TS check PASS).
- E2E: nie uruchamiane - brak testow Playwright dla item-photo w repo i wymagane
  srodowisko (Supabase + Mailpit). Scenariusz E2E przygotowany (patrz sekcja 8).

## 7. Git status (przed ewentualnym commitem)

```text
M next.config.ts
M package.json
M src/components/items/item-form.tsx
M src/lib/i18n/locales/en.ts
M src/lib/i18n/locales/pl.ts
M src/lib/i18n/types.ts
M src/lib/items/item-photo-ai/index.ts
M tests/unit/item-form-values.test.ts
?? src/lib/items/item-photo-ai/apply-suggestion.ts
?? tests/unit/item-photo-suggestion-apply.test.ts
```

## 8. Uwagi

- **SMTP niezmienione.** Adres `noreplay@homeback.app` (celowa literowka
  testowa) pozostaje nietkniety; nie ruszano zadnych plikow konfiguracji SMTP.
- Nie dodano zadnych zaleznosci, tabel, rout, pol, relacji ani zmian RLS.
  Zmiana konfiguracyjna bodySizeLimit dotyczy tylko nasluchu body server actions.
- Scenariusz E2E (przygotowany, do uruchomienia za zgoda wlasciciela i na
  srodowisku z Supabase):
  1. Nowe konto testowe -> utworzenie gospodarstwa.
  2. /items -> nowa Rzecz -> wybor pliku PNG -> oczekiwany komunikat o formacie,
     brak wysylki.
  3. Wybor pliku JPEG > 2 MB -> komunikat o rozmiarze.
  4. Wybor malego JPEG -> podglad, komunikat o analizie lub uzupelnienie pol.
  5. Zatwierdzenie formularza -> Rzecz utworzona ze zdjeciem.
  6. Konta testowe usunac po zakonczeniu.
