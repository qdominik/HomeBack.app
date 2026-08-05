# Prompt startowy brancha: Dodawanie Rzeczy na podstawie zdjecia

Branch roboczy:

```text
codex/item-photo-ai-create
```

## Decyzja wlasciciela

Wlasciciel zatwierdza wdrozenie na osobnym branchu funkcji dodawania Rzeczy na podstawie zdjecia, mimo ze funkcje AI byly poza pierwotnym zakresem MVP.

## Cel

Zbudowac pelny flow:

1. uzytkownik wybiera glowne zdjecie Rzeczy,
2. aplikacja uploaduje zdjecie do prywatnego Supabase Storage,
3. aplikacja wysyla zdjecie do analizy Vision,
4. AI zwraca sugestie pol formularza,
5. uzytkownik poprawia albo akceptuje sugestie,
6. dopiero zatwierdzenie formularza tworzy albo aktualizuje Rzecz.

AI nie moze samodzielnie tworzyc rekordu Rzeczy bez zatwierdzenia uzytkownika.

## Zakres funkcji

- Jedno glowne zdjecie Rzeczy.
- Maksymalny rozmiar pliku: 2 MB.
- Dozwolone formaty: JPEG i WebP.
- Brak kompresji i konwersji obrazow w pierwszym branchu.
- Prywatny bucket Supabase Storage: `item-photos`.
- W bazie zapisywac storage path, nie publiczny URL ani signed URL.
- `item.miniatura_url` przechowuje storage path glownego zdjecia.
- `file.plik_url` przechowuje ten sam storage path jako prywatna referencje pliku.
- Rekord `file` przechowuje metadane: `item_id`, `household_id`, `nazwa`, `plik_url`, `typ = 'zdjecie'`, `rozmiar_kb`, `czy_zaszyfrowany = false`, `created_by_id`.
- Przy wymianie zdjecia stare zdjecie i stary rekord `file` maja zostac usuniete.
- Dostep tylko dla admina, zgodnie z obecnym CRUD Rzeczy.

## Pola sugerowane przez AI

AI ma zwracac sugestie:

- `nazwa`,
- `opis`,
- `category_id` albo stabilny klucz/nazwa kategorii do dopasowania,
- `typ`,
- `ilosc`,
- `jednostka`.

AI nie zgaduje lokalizacji. Lokalizacja pozostaje recznym wyborem uzytkownika.

Jesli AI nie potrafi dopasowac kategorii, formularz ma wybrac kategorie `Inne`, jesli istnieje, oraz pokazac jasna informacje, ze kategorii nie udalo sie rozpoznac. Jesli kategoria `Inne` nie jest dostepna, pole kategorii zostaje do recznego wyboru z komunikatem.

## Provider AI

API do analizy zdjecia ma isc zawsze przez Groq API.

Model wizyjny nie jest zakodowany na stale. Moze to byc Qwen2.5, Qwen 3.x albo inny model wizyjny dostepny przez Groq, wybrany przez wlasciciela przed wdrozeniem albo zmieniony pozniej przez konfiguracje.

Nie zakladac w implementacji, testach ani dokumentacji, ze model wizyjny zawsze bedzie konkretnym wariantem Qwen. Stabilnym zalozeniem jest provider/API Groq oraz waski kontrakt helpera, nie nazwa modelu.

Implementacja powinna ukryc provider i model za waskim helperem serwerowym, np. `analyzeItemPhoto`, z prostym kontraktem wejscia i wyjscia. UI nie powinno znac szczegolow providera ani nazwy modelu.

Sekrety musza byc czytane z env vars. Nie wolno zapisywac kluczy API w kodzie.

Rekomendowane zmienne:

```env
GROQ_API_KEY=
ITEM_PHOTO_AI_PROVIDER=groq
ITEM_PHOTO_AI_MODEL=
```

Brak `GROQ_API_KEY` albo brak skonfigurowanego modelu ma zwracac kontrolowany blad konfiguracji dla akcji analizy zdjecia. Nie moze to psuc recznego dodawania Rzeczy.

## Lokalnie vs Supabase

### Lokalnie

Lokalne dzialanie wymaga:

- uruchomionej lokalnej aplikacji Next.js,
- aktywnej konfiguracji Supabase uzywanej przez projekt,
- prywatnego bucketu `item-photos` w lokalnym albo zdalnym Supabase,
- sekretu `GROQ_API_KEY` w lokalnym `.env.local`,
- skonfigurowanego `ITEM_PHOTO_AI_MODEL`.

Flow lokalny:

1. przegladarka wysyla plik do server action / endpointu Next.js,
2. Next.js waliduje MIME i rozmiar,
3. Next.js zapisuje plik przez Supabase Storage client,
4. Next.js odczytuje plik albo tworzy signed URL tylko na potrzeby analizy,
5. Next.js wysyla obraz do Groq API,
6. odpowiedz AI jest walidowana i zwracana do klienta jako sugestie,
7. klient wypelnia formularz sugestiami,
8. uzytkownik zatwierdza zapis Rzeczy.

W trybie lokalnym bez klucza AI albo modelu funkcja powinna zwracac kontrolowany blad konfiguracji, a nie psuc zwyklego dodawania Rzeczy.

### Na Supabase / produkcyjnie

Supabase przechowuje:

- prywatny obiekt w Storage,
- rekord `file`,
- storage path w `item.miniatura_url`.

Supabase nie uruchamia modelu AI sam z siebie. Analiza AI powinna byc wykonywana po stronie serwera aplikacji Next.js albo przez osobno zatwierdzona Supabase Edge Function.

Rekomendacja dla pierwszego branchu:

- analiza AI w server action / route handler Next.js,
- Groq API jako zewnetrzny provider analizy Vision,
- Supabase tylko jako prywatny storage i baza metadanych,
- signed URL generowany tymczasowo tylko do odczytu albo wyswietlenia,
- signed URL nie jest zapisywany w bazie.

## Bezpieczenstwo i prywatnosc

- Nie tworzyc publicznego bucketu.
- Nie zapisywac signed URL w bazie.
- Nie logowac obrazow, signed URL ani surowych odpowiedzi zawierajacych dane uzytkownika.
- Kazdy zapis i odczyt musi respektowac aktywne `household_id`.
- Sciezka storage musi zawierac `household_id` i `draft_id` albo `item_id`, zalezenie od zatwierdzonej decyzji o lifecycle pliku.
- Server action ma potwierdzic aktywny profil i role `admin`.
- AI zwraca sugestie, nie podejmuje decyzji za uzytkownika.

## Oczekiwany kontrakt wyniku AI

```ts
type ItemPhotoAnalysisSuggestion = {
  nazwa: string | null;
  opis: string | null;
  categoryId: string | null;
  categoryConfidence: "high" | "medium" | "low" | "none";
  categoryFallbackUsed: boolean;
  typ: "unikalny" | "zapas" | "zestaw" | null;
  ilosc: number | null;
  jednostka: string | null;
  userMessage: string | null;
};
```

## Kryteria akceptacji

- Zwykle dodawanie Rzeczy bez zdjecia nadal dziala.
- Dodanie Rzeczy ze zdjeciem JPEG/WebP do 2 MB zapisuje prywatny plik, `file` i `item.miniatura_url`.
- Zdjecie jest widoczne jako miniatura/preview dla uprawnionego uzytkownika.
- Plik powyzej 2 MB jest odrzucany czytelnym bledem.
- PNG i inne typy poza JPEG/WebP sa odrzucane.
- AI uzupelnia pola tylko jako sugestie.
- Uzytkownik moze poprawic wszystkie sugestie przed zapisem.
- Brak klucza AI albo modelu nie psuje recznego dodawania Rzeczy.
- Dane innego gospodarstwa nie sa dostepne przez UI, server action ani Storage.
- Signed URL nie jest zapisywany w bazie.
