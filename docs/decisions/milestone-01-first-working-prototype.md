# Milestone 01: Pierwszy działający prototyp

Data: 2026-07-09  
Status: wykonany i zweryfikowany lokalnie  
Projekt: HomeBack.app  
Adres lokalny: http://127.0.0.1:3000  

## 1. Nazwa milestone’u

**M1 — Pierwszy działający prototyp: Auth + Household + Dashboard**

To jest milestone fundamentu aplikacji, a nie zakończenie całego MVP.

## 2. Cel milestone’u

Celem było zbudowanie pierwszego pionowego przepływu HomeBack.app opartego na realnym Supabase Auth, PostgreSQL, migracjach i RLS.

Zakres obejmował:

1. rejestrację użytkownika przez e-mail i hasło,
2. potwierdzenie adresu e-mail,
3. utworzenie jednego gospodarstwa,
4. atomowe utworzenie profilu pierwszego administratora,
5. wejście na chroniony Dashboard,
6. wylogowanie,
7. ochronę tras aplikacji.

## 3. Zakres wykonany

W ramach milestone’u wykonano:

- początkowy schemat bazy danych MVP,
- migracje Supabase,
- polityki RLS,
- testy pgTAP,
- integrację Supabase Auth,
- obsługę sesji SSR w Next.js,
- rejestrację użytkownika,
- lokalne potwierdzenie e-mail,
- tworzenie gospodarstwa,
- przypisanie pierwszego administratora,
- Dashboard,
- wylogowanie,
- ochronę trasy `/dashboard`,
- konfigurację lokalnego środowiska developerskiego.

## 4. Baza danych

Zastosowano lokalnie migracje:

- `supabase/migrations/0001_initial_schema.sql`,
- `supabase/migrations/0002_initial_rls.sql`.

Utworzono początkowe encje MVP:

- `household`,
- `profile`,
- `room`,
- `storage_location_l2`,
- `storage_location_l3`,
- `category`,
- `item`,
- `item_location`,
- `file`,
- `log`.

Kategorie systemowe korzystają z pola `category.key`. Nie użyto `category.system_key`.

## 5. Bezpieczeństwo

Wykonane zabezpieczenia:

- RLS jest aktywne na tabelach publicznych MVP,
- dane są izolowane przez `household_id`,
- użytkownik nie widzi danych innego gospodarstwa,
- pierwszy użytkownik gospodarstwa zostaje administratorem,
- nie można usunąć ani zdegradować ostatniego aktywnego administratora,
- aplikacja nie używa klucza administracyjnego po stronie klienta,
- `.env.local` jest ignorowany przez Git,
- nie utworzono publicznych bucketów Storage.

## 6. Testy

Wykonane i zaliczone:

- `npx.cmd supabase db reset`,
- `npx.cmd supabase test db`,
- `npm.cmd run lint`,
- `npm.cmd run build`,
- test pełnego przepływu w przeglądarce.

Zweryfikowany przepływ:

1. użytkownik rejestruje konto,
2. otrzymuje lokalny e-mail potwierdzający,
3. potwierdza adres e-mail,
4. tworzy gospodarstwo,
5. zostaje pierwszym administratorem,
6. widzi Dashboard,
7. może się wylogować,
8. niezalogowany użytkownik nie ma dostępu do chronionej trasy.

## 7. Kryteria akceptacji

Milestone uznaję za zakończony, ponieważ:

- pełny przepływ działa lokalnie od rejestracji do Dashboardu,
- pierwszy użytkownik jest aktywnym administratorem,
- dane są izolowane per gospodarstwo,
- migracje dają się odtworzyć od zera,
- testy RLS przechodzą,
- lint i build przechodzą,
- nie ma sekretów w repozytorium,
- nie dodano funkcji spoza MVP.

## 8. Znane ograniczenia

To nie jest jeszcze kompletne MVP.

Nie wykonano jeszcze:

- modułu Dom w interfejsie użytkownika,
- CRUD przedmiotów,
- dokumentów,
- zaproszeń członków gospodarstwa,
- QR/NFC,
- Sejfu,
- deploymentu produkcyjnego,
- integracji z hosted Supabase,
- publikacji na Vercel.

## 9. Znane ostrzeżenia

`npm.cmd audit --omit=dev` zgłasza dwa ostrzeżenia `moderate` dotyczące PostCSS jako zależności dostarczanej przez Next.js.

Status:

- brak dostępnej bezpiecznej poprawki bez wymuszonej zmiany frameworka,
- nie wykonano `npm audit fix --force`,
- ostrzeżenie nie blokuje lokalnego prototypu,
- przed deploymentem należy ponownie uruchomić audyt zależności.

## 10. Decyzja projektowa

Milestone M1 zostaje zamknięty.

Następny etap powinien być realizowany jako osobny plan:

**M2 — Moduł Dom / Structure**

Zakres kolejnego etapu:

- trasa `/home`,
- pomieszczenia,
- miejsca przechowywania L2,
- miejsca przechowywania L3,
- widoki listy i szczegółów,
- formularze tworzenia i edycji,
- RLS zgodne z `household_id`,
- testy pgTAP,
- lint i build.

CRUD przedmiotów nie powinien być rozpoczynany przed zamknięciem planu modułu Dom.

## 11. Wpis do decision-log.md

Do `docs/decisions/decision-log.md` należy dopisać:

```md
| 2026-07-09 | Zamknąć milestone M1 — Pierwszy działający prototyp: Auth + Household + Dashboard. | Pełny pionowy przepływ rejestracja → e-mail → gospodarstwo → pierwszy administrator → Dashboard → wylogowanie został wykonany i zweryfikowany lokalnie. | Fundament modułów Rodzina i Dashboard gotowy. Nie oznacza ukończenia całego MVP. Następny etap: osobny plan modułu Dom. | Wykonane | Właściciel projektu |
```

## 12. Komendy Git

Commit wykonaj z katalogu głównego projektu:

```powershell
cd C:\Users\qdomi\Desktop\Homeback.app
git status --short
```

Dodaj raport i zmienione dokumenty:

```powershell
git add docs/decisions/milestone-01-first-working-prototype.md
git add docs/decisions/decision-log.md
git add docs/decisions/first-working-prototype-plan.md
git add README.md
```

Jeżeli `git status --short` pokazuje też zmiany implementacyjne z milestone’u, dodaj je świadomie, bez `.env.local`:

```powershell
git add src supabase scripts package.json package-lock.json .env.example
```

Sprawdź, co trafi do commita:

```powershell
git status --short
git diff --cached --stat
```

Commit:

```powershell
git commit -m "docs: close milestone 01 first working prototype"
```

Opcjonalny tag:

```powershell
git tag m1-first-working-prototype
```

## 13. Czego nie dodawać do Git

Nie dodawaj:

- `.env.local`,
- lokalnych danych testowych,
- dumpów bazy,
- plików z sekretami,
- plików tymczasowych z edytora,
- logów systemowych.
