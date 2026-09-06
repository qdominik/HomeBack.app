# HomeBack.app — trwały kontrakt środowisk Vercel i Supabase

## Decyzja środowiskowa

Nie tworzono nowego projektu stagingowego bez potwierdzenia właściciela.
Docelowe mapowanie jest następujące:

| Środowisko | Projekt Supabase | `NEXT_PUBLIC_SITE_URL` | Konto testowe |
| --- | --- | --- | --- |
| Local | lokalny Supabase | `http://127.0.0.1:3000` | lokalne |
| Preview | dedykowany staging/preview, do potwierdzenia właściciela | dokładny, nieprodukcyjny adres Preview | stagingowe, z potwierdzonym e-mailem |
| Production | produkcyjny Supabase | `https://my.homeback.app` | produkcyjne/testowe zgodnie z polityką |

Do czasu formalnego potwierdzenia projektu Preview nie wolno zgadywać project
ref ani przepinać Preview do Production. Istniejący dokument checkpointu Preview
pozostaje źródłem historii smoke testów; ten dokument opisuje bieżący kontrakt i
procedurę naprawczą.

## Zmienne aplikacji

Wszystkie trzy środowiska wymagają:

- `NEXT_PUBLIC_SITE_URL` — absolutny adres aplikacji danego środowiska;
- `NEXT_PUBLIC_SUPABASE_URL` — URL tego samego projektu Supabase;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publiczny klucz tego samego projektu.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` jest wyłącznie kompatybilnością wsteczną. Jeżeli
obie nazwy istnieją, wartości muszą być identyczne. Nie ustawiaj obu nazw jako
różnych kluczy. `NEXT_PUBLIC_DEV_ORIGIN` jest wymagane tylko lokalnie i nie
powinno być ustawiane w Vercel Preview/Production. `VERCEL_ENV` jest ustawiane
przez Vercel i rozróżnia `preview` oraz `production`.

Zmienne E2E są lokalne albo Preview-only:

- `E2E_BASE_URL` — dokładny adres testowanego deploymentu;
- `E2E_PASSWORD` — hasło syntetycznego konta testowego, poza repozytorium.

Zmienne `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY` i inne sekrety serwerowe
nie mogą mieć prefiksu `NEXT_PUBLIC_` ani być wpisywane do dokumentacji.

## Walidacja w kodzie

`src/lib/runtime/environment.ts` sprawdza obecność i oczywisty format URL-i,
public key, środowisko, lokalny origin oraz produkcyjny/preview site URL. Gdy
legacy i canonical key są różne, albo gdy JWT anon key zawiera project ref
inny niż URL, aplikacja odrzuca konfigurację bez ujawniania wartości.

Uruchom lokalnie:

```powershell
npm.cmd run check:env
```

CI sprawdza również, czy `.env.example` zawiera wszystkie nazwy:

```powershell
npm.cmd run check:env -- --example
```

## Stan audytu Vercel

Audyt metadanych projektu `homeback-app` wykazał:

- Preview: wpisy Supabase i `NEXT_PUBLIC_SITE_URL` są przypięte do konkretnych
  branchy; istnieje kilka wpisów `NEXT_PUBLIC_SITE_URL`, więc nie ma jednego
  jawnego globalnego kontraktu Preview;
- Production: istnieją równolegle canonical i legacy nazwy Supabase oraz
  automatyczne zmienne integracji; obecność nazw nie potwierdza jeszcze zgodności
  ich wartości;
- Development: brak zmiennych Vercel — Development pozostaje lokalnym
  `.env.local`.

Nie pobieramy pełnych `.env` z Vercela do repozytorium ani raportu. Zgodność
wartości URL/key, konto testowe, potwierdzenie e-maila i redeploy wymagają
kontroli właściciela w panelu Vercel/Supabase lub bezpiecznego smoke testu.

## Instrukcja konfiguracji Vercel

W projekcie `homeback-app`, w Settings → Environment Variables:

| Nazwa | Development | Preview | Production |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://127.0.0.1:3000` lokalnie | dokładny adres Preview | `https://my.homeback.app` |
| `NEXT_PUBLIC_DEV_ORIGIN` | `http://127.0.0.1:3000` lokalnie | usuń/nie ustawiaj | usuń/nie ustawiaj |
| `NEXT_PUBLIC_SUPABASE_URL` | lokalny URL | URL potwierdzonego stagingu | URL produkcyjny |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | lokalny public key | stagingowy public key | produkcyjny public key |
| `E2E_BASE_URL` | `http://127.0.0.1:3001` dla runnera | dokładny Preview, tylko do smoke | nie ustawiaj |
| `E2E_PASSWORD` | lokalny sekret testowy | stagingowy sekret testowy | nie ustawiaj |

Najpierw usuń nieużywane duplikaty branch-scoped i legacy entries po zapisaniu
ich wartości w menedżerze haseł. Nie nadpisuj Production bez potwierdzenia
właściciela. Po każdej zmianie Preview wykonaj nowy deployment/redeploy — stare
deploymenty zachowują poprzedni build-time environment.

## Supabase Auth URLs

W odpowiednim projekcie Supabase ustaw:

- Site URL zgodny z `NEXT_PUBLIC_SITE_URL` danego środowiska;
- Redirect URLs:
  - `http://127.0.0.1:3000/auth/confirm`;
  - `http://localhost:3000/auth/confirm`;
  - dokładny adres Preview + `/auth/confirm`;
  - `https://my.homeback.app/auth/confirm`.

Nie dodawaj wildcardów, adresu Production do projektu Preview ani adresu
Preview do projektu Production bez świadomej decyzji właściciela.

## Smoke test po zmianie

1. Otwórz `/login` na dokładnym URL deploymentu.
2. Zaloguj się kontem testowym właściwego projektu i sprawdź `/dashboard`.
3. Sprawdź błędne hasło — powinien pojawić się kontrolowany komunikat.
4. Wyloguj się i potwierdź powrót do `/login` w tym samym środowisku.
5. Otwórz `/dashboard` bez sesji i potwierdź przekierowanie do `/login`.
6. Sprawdź, że Preview nie używa produkcyjnego site URL ani danych produkcyjnych.

Jeśli logowanie kończy się `invalid_credentials`, najpierw porównaj projekt
Supabase, site URL, potwierdzenie e-maila konta testowego i deployment wykonany
po zmianie zmiennych. Nie zmieniaj haseł, RLS, migracji ani logiki logowania w
celu obejścia błędu konfiguracji.

## Checklist deploymentu

- [ ] Potwierdzono trzy project ref: local, Preview/staging i Production.
- [ ] Ustawiono `NEXT_PUBLIC_SITE_URL` w odpowiednim scope Vercel.
- [ ] Ustawiono URL i public key z tego samego projektu Supabase.
- [ ] Usunięto rozbieżne duplikaty legacy/canonical key.
- [ ] Skonfigurowano Site URL i redirect URLs w odpowiednim Supabase Auth.
- [ ] Utworzono lub potwierdzono konto testowe Preview z potwierdzonym e-mailem.
- [ ] Wykonano redeploy Preview po zmianie zmiennych.
- [ ] Przeszedł smoke test login/dashboard/logout/unauthenticated dashboard.
- [ ] Production nie został nadpisany bez potwierdzenia właściciela.
