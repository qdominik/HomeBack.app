# Auth signup existing-user regression fix

**Status:** Zaimplementowano, zweryfikowano automatycznie, zaakceptowano ręcznie i zapisano jako stabilny checkpoint.

## Objaw

Nowe adresy e-mail mogły zostać błędnie potraktowane jako istniejące konto,
ponieważ brak sesji występuje również przy rejestracji wymagającej
potwierdzenia e-maila.

## Przyczyna

`session === null` nie jest sygnałem istnienia konta. Nowa rejestracja przy
włączonym potwierdzaniu e-maila zwraca użytkownika bez aktywnej sesji.

## Klasyfikacja

Jawne kody `user_already_exists` i `email_exists` oraz kontrolowany tekst
`User already registered` prowadzą do `email_already_registered`. Zamaskowana
odpowiedź bez błędu jest rozpoznawana jako istniejące konto wyłącznie wtedy,
gdy `user.identities` jest tablicą pustą. Nowy użytkownik z niepustą tablicą
tożsamości jest prawidłowym signupem wymagającym potwierdzenia e-maila,
niezależnie od `session === null`.

Pozostałe błędy i brak użytkownika bez błędu prowadzą do bezpiecznego
`signup_failed`.

## Bezpieczeństwo i zakres

Nie dodano service role, Admin API, publicznego sprawdzania e-maila, tabeli,
RPC, migracji ani zmian RLS. Surowe błędy Supabase nie są pokazywane w UI.
Nie zmieniono pól formularza, layoutu, sesji ani onboardingu gospodarstwa.
Hotfix nie usuwa ani nie zmienia haseł ani rekordów `auth.users`.

## Wyniki testów

Automatycznie: `npm.cmd run test:logic` — 128/128, `npm.cmd run lint` — sukces,
`npm.cmd run build` — sukces, `git diff --check` — sukces.

Ręcznie zaakceptowano: nowy unikalny adres, wiadomość potwierdzającą, potwierdzenie
konta, logowanie nowym kontem, ponowną rejestrację istniejącego adresu, brak
fałszywego komunikatu dla nowego adresu oraz brak ujawniania surowych błędów
Supabase.

## Notatka operacyjna: Supabase Studio i hasła

Supabase Studio nie pokazuje jawnych haseł użytkowników. Brak widocznego hasła
nie oznacza, że konto go nie ma. Starszy użytkownik może nie móc się zalogować
z powodu nieznanego hasła, niepotwierdzonego e-maila albo utworzenia konta inną
metodą logowania. Nie diagnozujemy braku hasła wyłącznie na podstawie widoku
Studio i nie dodajemy do aplikacji funkcji odczytywania ani sprawdzania haseł.

## Zmienione pliki

- `src/app/(auth)/actions.ts`
- `src/lib/auth/classify-signup-result.ts`
- `tests/unit/auth-signup.test.ts`
- `package.json` — dopisanie testu do istniejącego `test:logic`
- `docs/decisions/auth-signup-existing-user-regression-fix.md`
- `docs/decisions/decision-log.md`

M4N.2, dokumenty wdrożeniowe, baza, migracje i RLS pozostają poza zakresem.
