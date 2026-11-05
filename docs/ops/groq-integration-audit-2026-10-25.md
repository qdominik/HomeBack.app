# Audyt integracji Groq — 2026-10-25

Data sprawdzenia źródeł: **25 października 2026**, Europe/Warsaw.
Zakres: istniejąca analiza zdjęcia Rzeczy, lokalny kod i testy bez połączeń z Groq.

## Stan wejściowy i izolacja pracy

Repozytorium źródłowe: `C:\Users\qdomi\Desktop\Homeback.app`.
Branch wejściowy: `local/start-local-dev-helper`, HEAD `5714a9a`.
Zastane zmiany pozostawiono nietknięte:

- `docs/decisions/local-supabase-dev-plan.md` (zmieniony),
- `scripts/start-local-dev.ps1` (nieśledzony).

Praca odbywa się w osobnym worktree
`C:\Users\qdomi\Desktop\HomeBack.worktrees\team-b-groq-api-audit-20261025`,
branch `fix/team-b-groq-api-audit-20261025`, utworzonym z tego samego HEAD.
Bez commita, PR, wdrożenia ani zmian zdalnych.
Przeczytano `AGENTS.md`, `SECURITY.md` oraz decyzje
`item-photo-ai-create-prompt.md` i `item-photo-ai-storage-and-vision.md`.
Obecne zlecenie upoważnia Team B do ograniczonej aktualizacji tej integracji;
decyzja projektu już dopuszcza analizę zdjęć mimo pierwotnego wyłączenia AI z MVP.

## Oficjalne źródła

- [Groq API Reference](https://console.groq.com/docs/api-reference): kontrakt Chat Completions i parametry.
- [Groq Supported Models](https://console.groq.com/docs/models): bieżący wykaz i endpoint listowania modeli.
- [Groq Images and Vision](https://console.groq.com/docs/vision): wejście obrazowe i JSON mode.
- [Groq Rate Limits](https://console.groq.com/docs/rate-limits): HTTP 429, nagłówki i limity organizacji.
- [Groq Deprecations](https://console.groq.com/docs/deprecations): wycofania i zasady Preview.
- [Groq Qwen 3.8 27B](https://console.groq.com/docs/model/qwen/qwen3.8-27b): możliwości i status modelu.

Źródła pobrano narzędziem Firecrawl z oficjalnej domeny Groq.
Kopie robocze pozostają poza worktree aplikacji, w `.firecrawl/` katalogu nadrzędnego.

## Przepływ i zgodność API

`src/app/(app)/items/actions.ts` jest modułem `use server`.
`analyzeItemPhotoDraft` sprawdza aktywnego admina i przynależność ścieżki draftu
do gospodarstwa. Serwer pobiera prywatny obraz i koduje go jako data URL;
lista kategorii jest ograniczona do kategorii globalnych i bieżącego gospodarstwa.
Wywołuje `analyzeItemPhoto` z `src/lib/items/item-photo-ai/index.ts`, następnie
provider z `providers/groq.ts`. Sugestia nie zapisuje automatycznie Rzeczy.

Kontrakt zgodny z dokumentacją:

- `POST https://api.groq.com/openai/v1/chat/completions`, JSON, `Authorization: Bearer`;
- `model` pochodzi wyłącznie z `ITEM_PHOTO_AI_MODEL`, bez domyślnego modelu i fallbacku;
- wiadomość użytkownika zawiera tekst i `image_url.url` (URL lub data URL Base64);
- `response_format: { type: "json_object" }`, `temperature: 0`;
- prompt jawnie wymaga JSON; odpowiedź `choices[0].message.content` jest parsowana
  i walidowana do istniejącego kontraktu sugestii przed przekazaniem do UI.

Nie ma nieaktualnego parametru `max_tokens`; limit wyjścia nie był jawnie ustawiony.
Nie dodano nowego limitu ani parametrów właściwych wyłącznie jednemu modelowi.
Kod wysyła jedno zdjęcie JPEG/WebP do 2 MiB przed kodowaniem, zgodnie z obecnym
kontraktem aplikacji. Dokumentacja Qwen podaje do 3 obrazów; dla wejścia URL
opisuje limit żądania 20 MB. Nie rozszerzono limitów aplikacji.

`GROQ_API_KEY` czyta serwerowa konfiguracja; nie ma prefiksu `NEXT_PUBLIC_`.
Aktualny graf importów prowadzi do providera z server action, nie z komponentu
klienckiego. Formularz importuje jedynie osobny helper mapowania sugestii.
Nie odczytywano `.env.local`, sekretów Vercel ani rzeczywistego klucza.

## Dostępność modelu i nierozstrzygnięte ustawienie

Kod, README i `.env.example` nie narzucają identyfikatora modelu;
testy używają świadomie fikcyjnego `owner-selected-vision-model`.
Wartości środowisk lokalnego, Preview i Production nie były odczytywane.
**Nie potwierdzono więc, jaki model jest faktycznie skonfigurowany ani czy konto ma do niego dostęp.**

Aktualne strony Vision i Models wymieniają `qwen/qwen3.8-27b` (obraz + tekst,
JSON mode, Preview) oraz `meta-models/muse-spark-open` (obraz + tekst,
JSON mode, ograniczony Preview wymagający dostępu). Groq odradza Preview
w Production. W bieżącym wykazie nie potwierdzono modelu Vision o statusie Production.

Nie wolno wybierać zamiennika wyłącznie na podstawie tabeli wycofań: przykładowo
wpis Llama 4 Scout wskazuje też tekstowy GPT-OSS. Wymagane są jednocześnie
aktualny wykaz, Vision, JSON mode i dostęp organizacji.
Wycofanie Llama 4 Scout z 17 lipca 2026 oraz Qwen 3.6 z 14 września 2026
dotyczy free/developer; dokumentacja opisuje wyjątek dla umów enterprise.

Zmiana `ITEM_PHOTO_AI_MODEL` pozostaje przed decyzją właściciela, zgodnie
z decyzją projektu. Nie zmieniono jej wartości ani nie zaszyto modelu w kodzie.
Kolejny krok: właściciel porównuje swój niejawny identyfikator z oficjalnymi
źródłami i sprawdza dostęp przez `GET /openai/v1/models` we własnym bezpiecznym
środowisku (bez drukowania klucza). Samo listowanie nie potwierdza jakości analizy.
Po wyborze modelu potrzebny jest osobno zatwierdzony test na sztucznym obrazie
z kluczem testowym. Brak takiego testu w repozytorium; nie wykonywano go tutaj.

## Problemy i lokalne poprawki

Przed zmianą: dwie próby przy HTTP 429/5xx i błędach sieci, stałe 250 ms między
próbami, bez aktywnego timeoutu. Nazwa wyjątku i `Content-Type` były logowane
bez filtrowania; nie logowano treści żądań ani odpowiedzi.

W `src/lib/items/item-photo-ai/providers/groq.ts`:

- ustawiono `AbortSignal.timeout(30_000)` osobno na każdą próbę; sygnał fetch
  obejmuje też odczyt body. Timeout odczytu body zwraca `provider_timeout`
  bez ponawiania ukończonego już wywołania;
- zachowano najwyżej jedno retry przy 429/5xx i błędach transportu;
- `Retry-After` jako liczba sekund (tak dokumentuje Groq) określa opóźnienie.
  Powyżej 5 s zwracany jest dotychczasowy kontrolowany błąd, bez skracania
  wymaganego oczekiwania. Brak/błędny nagłówek zachowuje 250 ms;
- timeouty i limit oczekiwania są lokalną polityką aplikacji, nie wymogiem Groq;
- odpowiedzi błędów są anulowane bez odczytywania/logowania ich treści;
- wyłączono cache i podążanie za przekierowaniami dla żądania z obrazem i kluczem;
- nazwy wyjątków ograniczono do znanych nazw, a typ odpowiedzi do znanych MIME
  bez parametrów. Nieznane wartości stają się `UnknownError` / `unknown`;
- usunięto nieużywany import typu.

Zachowano kody 400/422, 401, 403, 404, 413, 429, 5xx, walidację JSON i schematu
oraz korelację diagnostyki przez losowy request ID. Logi zawierają metadane
(model, etap, rozmiar/MIME, czas, status i klasyfikację), bez promptu, obrazu,
ścieżki, signed URL, surowej odpowiedzi, klucza ani hasła.
Rzeczywiste limity zależą od organizacji; nie wpisano limitów planu do kodu.

Alerty Groq nie są zaimplementowane w badanym HEAD. `docs/decisions/decision-log.md`
przechowuje backlog obejmujący kanał, deduplikację i recovery. Nie dodano monitoringu
ani nie użyto SMTP zaproszeń. Istniejąca diagnostyka działa dalej.

Pozostałe pliki:

- `tests/unit/item-form-values.test.ts`: kontrakt URL/Bearer/JSON, inline image,
  retry i jego granice, rzeczywiste przerwanie atrapy fetch przez sygnał,
  timeout strumienia odpowiedzi, brak danych wrażliwych w diagnostyce;
- `scripts/check-env-contract.mjs`: sprawdzanie obecności trzech istniejących
  nazw Groq w `.env.example` w trybie `--example`, bez czytania lokalnych sekretów;
- `README.md`: odsyłacz do tego audytu;
- niniejszy dokument: stan integracji, źródła i granice weryfikacji.

## Potwierdzenie właściciela przy finalizacji

Właściciel potwierdził poprawną konfigurację Vercel:
`ITEM_PHOTO_AI_MODEL` i `ITEM_PHOTO_AI_PROVIDER` mają poprawne wartości,
a `GROQ_API_KEY` jest skonfigurowany. Wartości nie były odczytywane ani zmieniane.
Wcześniejsze zastrzeżenia o niepotwierdzonym ustawieniu opisują etap audytu
przed tym potwierdzeniem i nie stanowią otwartej blokady konfiguracji.
Nie wykonano rzeczywistego wywołania Groq; testy nadal korzystają wyłącznie z atrap.

Finalizacja Git (commit, push i PR do `main`) jest osobnym, zatwierdzonym krokiem.
Wzmianki o braku commita i PR opisują stan po wykonaniu audytu, przed finalizacją.
Nie zlecono ręcznego wdrożenia ani zmian konfiguracji Vercel lub Supabase.
Standardowa automatyzacja repozytorium po push/PR może utworzyć Preview.
Alerty Groq pozostają osobnym zadaniem backlogowym.

## Kontrole

- `npm ci --ignore-scripts`: zakończone; bez zmian lockfile i zależności.
  Runtime: Node 24.20.0 / npm 12.0.2; projekt deklaruje 24.18.0 / 11.16.0.
  npm zgłosił istniejące 2 podatności zależności; nie zmieniano ich w tym zadaniu.
- `npm run test:logic`: PASS, 12 testów adaptera ESLint + 390 testów logiki,
  kompilacja TypeScript testów poprawna. Pierwszy przebieg ujawnił błąd typu
  w nowej atrapie, poprawiony przed powyższym pełnym przebiegiem.
- `npm run lint`: PASS, bez ostrzeżeń.
- `npm run check:env -- --example`: PASS.
- `npm run build`: PASS, kompilacja, TypeScript i generowanie stron zakończone.
- Kontrola `.next/static`: 0 odwołań do `GROQ_API_KEY`, `ITEM_PHOTO_AI_MODEL`
  i endpointu Groq w zbudowanych plikach przeglądarki.
- `git diff --check`: PASS; staging pusty. Źródłowy checkout nadal zawiera
  wyłącznie dwie zastane zmiany wymienione powyżej.

Testy Groq są całkowicie lokalne: atrapy fetch, fikcyjne klucze, syntetyczne dane.
Nie uruchamiano E2E wymagających bazy ani testów na produkcyjnym sekrecie.

## Ręczna konfiguracja i potwierdzenia

Do sprawdzenia przez właściciela: `ITEM_PHOTO_AI_MODEL`, `ITEM_PHOTO_AI_PROVIDER`,
`GROQ_API_KEY` — wyłącznie po stronie serwera. Nie są potrzebne nowe zmienne,
sekrety, migracje, zmiany RLS ani nowe funkcje produktu.
Wybór modelu wymaga potwierdzenia jego statusu i uprawnień; audyt nie certyfikuje
działającej konfiguracji zdalnego środowiska.

Nie zmieniono ustawień Vercel, sekretów, danych ani środowisk Supabase.
Nie wdrożono Preview ani Production. Nie utworzono commita ani PR.
