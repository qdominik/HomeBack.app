# Gotowość wdrożeniowa ról i zaproszeń

Ten dokument opisuje wdrożenie migracji `0024_rename_member_role.sql` i
`0025_roles_and_invitations.sql` z PR #84. Zakres obejmuje wyłącznie zgodność
aplikacji, bazy danych i bezpieczeństwa; nie dodaje interfejsu ani przepływu
akceptacji zaproszeń.

## Stan sprawdzony 17 września 2026

- PR #84 jest oparty o `feature/roles-invites-foundation`.
- Środowisko Supabase Production (`vtiygneyxyoxvsgafsnm`) oraz Preview
  (`yzewupqxkefyvljnfolk`) zgłaszają stan zdrowy.
- Vercel ma gotowe wdrożenie Production, ale narzędzie CLI nie ujawnia jego
  commitu źródłowego. Ten commit trzeba zapisać podczas operacyjnego preflightu.
- Zdalna historia migracji Production nie została odczytana: repozytorium nie
  jest połączone z projektem Supabase i preflight nie pobierał poświadczeń bazy.
  Nie wolno zakładać, że Production ma dokładnie migracje do `0023`.
- Testowa lokalna baza ma stan sprzed `0024` i `0025`; służy wyłącznie do
  walidacji migracji oraz testów, nie jest źródłem faktów o Production.

Vercel Preview potwierdza możliwość zbudowania aplikacji, ale nie potwierdza
wersji schematu ani danych bazy, do której podłączony jest Preview.

## Macierz zgodności

| Wariant | Wynik | Uzasadnienie |
| --- | --- | --- |
| A. Stara aplikacja + baza przed `0024`/`0025` | zgodny | Jest to obecny kontrakt: aplikacja odczytuje `domownik`, a enum i polityki używają tej wartości. |
| B. Stara aplikacja + baza po `0024`/`0025` | niezgodny, nie wdrażać | `0024` zmienia etykietę enumu na `dorosły`. Stary klient sprawdza tylko `domownik`, więc dorosły członek traci klientskie uprawnienia do zdjęć i kopiowania oraz widoczność modułów zależnych od roli. |
| C. Aplikacja z tego PR + baza przed `0024`/`0025` | zgodny | Warstwa odczytu rozpoznaje zarówno przejściowe `domownik`, jak i docelowe `dorosły`; nowe zapisy nadal używają wyłącznie docelowej wartości. |
| D. Aplikacja z tego PR + baza po `0024`/`0025` | zgodny | Docelowy enum, RPC, RLS i aplikacja używają `dorosły`; testy bazy i CI weryfikują ten kontrakt. |

Zgodność B jest celowo niedopuszczalna. Zmiana etykiety istniejącej wartości
PostgreSQL jest natychmiast widoczna dla klientów i nie daje okresu, w którym
stary klient mógłby nadal odczytać `domownik`. Z tego powodu migracji nie wolno
uruchomić przed wdrożeniem aplikacji zawierającej warstwę zgodności.

## Strategia expand/contract

1. **Expand aplikacji.** Zmergować i wdrożyć ten PR bez wykonywania `0024` i
   `0025`. Ta wersja aplikacji obsługuje oba odczyty enumu.
2. **Potwierdzenie propagacji.** Po gotowym wdrożeniu Production sprawdzić
   sesję administratora i istniejącego `domownik`: panel, gospodarstwo,
   listę/szczegóły rzeczy, wyszukiwanie i zdjęcia. Nie wykonywać jeszcze akcji
   zaproszeń z kolejnego PR.
3. **Expand bazy.** Po backupie wykonać kolejno `0024`, a następnie `0025`,
   przez zatwierdzony proces wydawniczy Supabase. Nie łączyć ich z przypadkowym
   automatycznym deployem aplikacji.
4. **Kontrakt.** Dopiero oddzielny, przyszły PR może usunąć obsługę odczytu
   `domownik`, gdy nie ma już starego wdrożenia aplikacji, a obserwacja
   Production potwierdzi brak tej wartości w odczytach.

## Runbook wdrożenia

### Warunki przed rozpoczęciem

Operator z dostępem do Production musi zapisać w wydaniu:

1. aktualny commit wdrożony na Production oraz plan powrotu do niego;
2. rzeczywistą historię migracji dla projektu Production i potwierdzenie, że
   `0024` oraz `0025` nie zostały już wykonane lub ich stan odpowiada planowi;
3. potwierdzenie aktualnego backupu/PITR oraz przetestowanej procedury restore;
4. właściciela wdrożenia, okno obserwacji i kanał eskalacji;
5. brak ruchu z jeszcze niewdrożonych ekranów lub klientów korzystających z
   RPC zaproszeń.

Jeżeli którykolwiek punkt jest nieznany, wdrożenie należy zatrzymać. Dane
dostępowe do bazy i tokeny zaproszeń nie mogą trafić do logów, komentarzy PR ani
artefaktów CI.

### Wykonanie

1. Zmergować PR #84 i poczekać na gotowy deployment Vercel Production.
2. Zweryfikować, że Production obsługuje aktualny, przedmigracyjny profil
   `domownik` w scenariuszach z kroku 2 strategii.
3. Utworzyć/zweryfikować backup według procesu Production i zanotować jego
   identyfikator w chronionym systemie operacyjnym.
4. Wykonać `0024_rename_member_role.sql`, sprawdzić zakończenie oraz kontrolne
   odczyty ról bez eksponowania danych osobowych.
5. Wykonać `0025_roles_and_invitations.sql`, sprawdzić zakończenie i status
   wymaganych funkcji/polityk.
6. Wykonać smoke testy: administrator i dorosły członek, izolacja dwóch
   gospodarstw, dashboard, rzeczy (lista, wyszukiwanie, dodanie i edycja),
   zdjęcia, `get_household_members`, `create_household_invitation` oraz
   `revoke_household_invitation`. Testy zaproszeń nie mogą wypisać surowego
   tokenu.
7. Obserwować błędy aplikacji i bazy przez ustalone okno. Zatrzymać dalsze
   wydania przy błędach enumu, RLS, nieautoryzowanym dostępie do gospodarstwa
   lub widocznym tokenie zaproszenia.

## Cofnięcie

Przed wykonaniem `0024` można wrócić do poprzedniego deployu aplikacji. Po
wdrożeniu warstwy zgodności powrót aplikacji nie jest potrzebny do obsługi
starej bazy, ponieważ bieżąca wersja obsługuje obie etykiety.

Po wykonaniu `0024` **nie wolno przywracać starego deployu aplikacji**: stary
klient nie interpretuje `dorosły`. Nie należy też ręcznie odwracać zmiany enumu
w Production po utworzeniu danych zaproszeń. Awarię po migracji należy
rozwiązać poprawką typu forward albo uruchomieniem zatwierdzonego restore z
backupu przez właściciela danych. Decyzję o restore podejmuje operator po
ocenie wpływu na dane od momentu backupu.

## Kryterium GO

GO jest możliwe wyłącznie po zielonym CI dla commitu PR, potwierdzeniu wdrożenia
kompatybilnej aplikacji na Production, zapisaniu faktów preflightu Production,
zweryfikowanym backupie i pomyślnych smoke testach po obu migracjach. Na dzień
sporządzenia dokumentu zdalna historia migracji i mechanizm backupu nie zostały
potwierdzone w trybie tylko do odczytu, dlatego nie ma bezwarunkowego GO do
wykonania migracji Production.
