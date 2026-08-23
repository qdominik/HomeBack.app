# Faza 3 — Personalizacja Dashboardu (preferencje widoczności modułów)

## Decyzja

Użytkownik może wybrać, które istniejące moduły Dashboardu są dla niego
widoczne. Zakres celowo wąski: widoczność istniejących modułów z rejestru,
bez redesignu, bez nowych modułów biznesowych i bez systemu konfiguracji.

## Model preferencji

- Nowa tabela `public.profile_dashboard_preferences` (migracja `0022`):
  - `profil_id uuid primary key references public.profile (id) on delete cascade`,
  - `visible_modules text[] not null default '{}'`,
  - `created_at` / `updated_at` (trigger `set_updated_at`).
- Preferencje są **per użytkownik (profil)**, nie per gospodarstwo. RLS
  ogranicza select/insert/update do `profil_id = auth.uid()`; anon nie ma
  dostępu. Nie umieszczaliśmy preferencji w tabeli `profile`, bo jej polityka
  `profile_update_admin` pozwala na aktualizację wyłącznie administratorowi
  gospodarstwa — domownik/dziecko nie mógłby zapisać własnych preferencji.
- Zapis odbywa się przez Server Action `saveDashboardPreferences`
  (`src/app/(app)/settings/actions.ts`) zgodnie z istniejącym wzorcem
  redirect ze statusem w query param. Payload z klienta nie jest ufany:
  akceptowane są wyłącznie znane klucze z rejestru, duplikaty są deduplikowane,
  nieznane identyfikatory są odrzucane/nie zapisywane, a niepoprawny typ
  payloadu kończy się czytelnym błędem.
- Brak zapisu preferencji nie psuje Dashboardu: brak wiersza, brak profilu,
  brak migracji lub błąd odczytu oznaczają fallback do `defaultVisible`.

## Fallback do `defaultVisible`

Punkt wejścia `resolveVisibleDashboardModules`
(`src/lib/dashboard/dashboard-preferences.ts`):

- `null/undefined` → rejestr filtrowany po `defaultVisible` (stan sprzed fazy 3);
- istniejąca lista → tylko wskazane moduły nadal obecne w rejestrze;
- identyfikatory usuniętych modułów ignorowane bez błędu;
- kolejność zawsze wynika z rejestru, nie z zapisanej listy.

Gdy użytkownik raz zapisze preferencje, przejmuje pełną kontrolę: nowy moduł
dodany później do rejestru **nie** pojawi się automatycznie — użytkownik musi
go włączyć w Ustawieniach. To zamierzone i przewidywalne.

## Zasady dla modułów `soon`

- Moduły ze statusem `soon` (np. „Osoby”, „Dokumenty”) są widoczne w
  konfiguracji i można sterować ich widocznością na Dashboardzie.
- Status `soon` nadal wymusza stan nieaktywny funkcjonalnie
  (`DashboardModuleCard` renderuje `StatusBadge` i opis „Wkrótce”),
  niezależnie od preferencji.
- Widoczność ≠ aktywacja: komunikat w Ustawieniach mówi wprost, że
  przełącznik steruje tylko tym, co widać na Dashboardzie.

## Czego nie wdrażamy teraz

- Drag-and-drop oraz zmiana kolejności modułów.
- Per-modułowa konfiguracja treści, limity, sekcje niestandardowe.
- Preferencje per gospodarstwo albo udostępnianie ustawień między członkami.
- Optimistic UI (świadomie: zwykły formularz + komunikat statusu).
- Nowe moduły funkcjonalne.

## Przygotowanie pod przyszłe moduły

Rejestr `dashboardModuleDefinitions` pozostaje jedynym źródłem prawdy. Przyszłe
moduły, np. „Plan lekcji ze zdjęcia” albo „Lista zakupów z podziałem na sklepy”,
dostaną wpis w rejestrze (klucz, status, tytuł PL/EN, opis PL/EN,
`defaultVisible`). Od tego momentu pojawią się automatycznie:

- w Ustawieniach (lista personalizacji),
- na Dashboardie użytkowników bez zapisanych preferencji (fallback),
- na Dashboardie użytkowników z preferencjami dopiero po ich włączeniu.

Żadna zmiana schematu danych nie będzie potrzebna — wystarczy wpis w rejestrze
i decyzja produktowa opisana w Fazie 2.

## Migracja i środowiska

Migracja `0022_profile_dashboard_preferences.sql` jest wymagana przed
wdrożeniem na Preview/Production. Bez niej zapis preferencji kończy się
czytelnym błędem, a Dashboard działa jak wcześniej (fallback). Uruchomienie
migracji na Production to osobna decyzja właściciela.
