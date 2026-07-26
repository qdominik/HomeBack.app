# M4D.8 — finalna weryfikacja cyklu życia lokalizacji

Status: M4D.8 AUTOMATED AND E2E VERIFICATION PASS — READY FOR FINAL MANUAL ACCEPTANCE.

Data: 2026-07-26

## 1. Zakres

M4D.8 domyka regresję etapów M4D.1–M4D.7 bez dodawania nowej funkcji
produktowej. Weryfikacja obejmuje widok „Bez lokalizacji”, podsumowania
zależności oraz atomowe tryby `delete`, `detach` i `move` dla Schowka L3,
Mebla L2 i Pomieszczenia.

Trwałe usuwanie Rzeczy jest osobnym checkpointem Inventory. Nie jest czwartym
poziomem operacji usuwania struktury M4D.

## 2. Macierz pokrycia

| Encja | DELETE | DETACH | MOVE | Summary | Manual | Logic | pgTAP |
|---|---|---|---|---|---|---|---|
| Schowek L3 | M4D.5 | M4D.5 + M4D.3 | M4D.5 + M4D.4 | M4D.2 | PASS — finalna regresja E2E | parser, wynik, cele, submit i wspólny kontrakt dialogu | 73 asercje M4D.5 |
| Mebel L2 | M4D.6 | M4D.6 + M4D.3 | M4D.6 + M4D.4 | M4D.2 | PASS — finalna regresja E2E | parser, wynik, cele, submit i wspólny kontrakt dialogu | 101 asercji M4D.6 |
| Pomieszczenie | M4D.7 | M4D.7 | M4D.7 + M4D.4 | M4D.2 | PASS — finalna regresja E2E | parser, wynik, cele, trigger i wspólny kontrakt dialogu | 81 asercji M4D.7 |
| Rzeczy bez lokalizacji | nie dotyczy | wynik M4D.3/M4D.5–7 | nie dotyczy | filtr M4D.1 | PASS — finalna regresja E2E | rozdzielenie widoków aktywne / bez lokalizacji / archiwalne | RLS oraz zachowanie rekordów Rzeczy w testach M4D.3–7 |

Warstwy wspólne mają dodatkowo 64 asercje podsumowania M4D.2, 82 asercje
odpinania M4D.3 oraz 83 asercje przenoszenia M4D.4.

## 3. Zweryfikowane inwarianty

- operacje wymagają sesji, aktywnego profilu i administratora;
- gospodarstwo pochodzi z aktywnego profilu, nie z wejścia klienta;
- źródło i cel muszą należeć do aktywnego gospodarstwa;
- cel `move` nie może leżeć w usuwanym poddrzewie;
- `delete`, `detach`, `move` oraz finalne usunięcie poddrzewa są atomowe;
- rekordy Rzeczy, ich statusy i kategorie pozostają zachowane;
- `detach` usuwa linki źródłowe, a `move` przenosi główne linki do jednego celu;
- dodatkowe linki poza źródłem pozostają zachowane;
- snapshot zależności blokuje mutację po zmianie danych;
- RLS pozostaje aktywne, nie ma service role ani dynamicznego SQL;
- RPC są `security invoker`, mają pusty `search_path` i minimalne granty.

## 4. Wykryte luki

### P0/P1

Nie wykryto.

### P2

Brakowało jednego wspólnego testu integracyjnego triggera i cyklu dialogu dla
wszystkich trzech poziomów. M4D.7 miał własny test regresji triggera, lecz
M4D.5 i M4D.6 polegały na osobnych testach helperów i ręcznym odbiorze.

Dodano `tests/unit/m4d-lifecycle-final-verification.test.ts`, który pilnuje:

- klientowej granicy dialogu;
- aktywnego triggera `type="button"`;
- `onClick -> openDialog -> showModal -> loadContext`;
- braku mutacji przy otwarciu, anulowaniu, Escape i `onClose`;
- przywrócenia focusu;
- braku automatycznego wyboru `move` albo `detach`;
- blokady podwójnego submitu, loading state, retry i błędu.

### P3

Dokumentacja M4D.6 i M4D.7 zachowywała historyczny status sprzed zaakceptowania
i integracji checkpointów. M4D.8 zapisuje stan całego cyklu i finalną checklistę.

### M4D8-E2E-01 — zamknięte

Raport E2E wykazał, że mutacje `DELETE`, `DETACH` i `MOVE` kończyły się
poprawnie, lecz Server Actions zwracały `{ ok: true }` bez przekazania statusu
do strony. Dialog zamykał się i odświeżał dane, więc komunikat sukcesu nie
pojawiał się w DOM.

Naprawa używa istniejącego wzorca statusu `/home?status=...`: po zweryfikowaniu
wyniku RPC akcje wykonują odpowiednio `room_deleted`, `location_deleted` albo
`position_deleted`. Nie zmieniono RPC, SQL, RLS, kontraktu mutacji ani dialogów.
Pełny runner E2E po poprawce: 13 PASS, 2 jawne SKIP ról bez zatwierdzonego
fixture, 0 FAIL.

## 5. Testy bazy

Istniejące testy pgTAP pokrywają:

- `PUBLIC`, `anon` i `authenticated`;
- brak sesji i brak aktywnego profilu;
- administratora, domownika i dziecko;
- źródła i cele brakujące, obce oraz wewnątrz poddrzewa;
- puste struktury i struktury z aktywnymi oraz archiwalnymi Rzeczami;
- główne i dodatkowe `item_location`;
- `delete`, `detach`, `move`, snapshot i rollback;
- zachowanie Rzeczy oraz brak zmian w innym gospodarstwie.

Nie dodano migracji ani asercji pgTAP w M4D.8, ponieważ audyt nie wykazał
brakującego inwariantu bazy. Finalny pełny przebieg jest kryterium zamknięcia.

## 6. Finalna checklista ręczna

- [ ] usunięcie całkowicie pustego Pomieszczenia;
- [ ] usunięcie Pomieszczenia z pustymi Meblami i Schowkami;
- [ ] `detach` Pomieszczenia i widoczność Rzeczy w „Bez lokalizacji”;
- [ ] `move` Pomieszczenia do jednego Schowka w innym Pomieszczeniu;
- [ ] `delete`, `detach` i `move` Mebla;
- [ ] `delete`, `detach` i `move` Schowka;
- [ ] zachowanie aktywnych i archiwalnych Rzeczy oraz linków poza źródłem;
- [ ] poprawne liczniki zależności;
- [ ] anulowanie, Escape, ponowienie i powrót focusu;
- [ ] blokada podwójnego zatwierdzenia i czytelny loading/error state;
- [ ] 375 px, 768 px i desktop bez poziomego przewijania dialogu.

Do przygotowania scenariuszy można użyć generatora `deletion_test` w
Ustawieniach. Test należy wykonać na serwerze uruchomionym z worktree M4D.8.

## 7. Zakres E2E dla Zespołu B

Po synchronizacji brancha Zespołu B z `origin/main`:

1. Room `DELETE`, `DETACH`, `MOVE`;
2. Furniture `DELETE`, `DETACH`, `MOVE`;
3. Storage space `DELETE`, `DETACH`, `MOVE`;
4. zachowanie Rzeczy, statusu archiwalnego i linków poza źródłem;
5. widok „Bez lokalizacji” po `DETACH`;
6. anulowanie, Escape, ponowienie i blokada podwójnego submitu;
7. granice autoryzacji dla administratora, domownika i dziecka;
8. dialogi na 375 px, 768 px i desktop.

E2E nie może zmieniać zachowania aplikacji ani produkcyjnych RPC.

## 8. Otwarte ryzyka

- finalny odbiór ręczny M4D.8 pozostaje wymagany;
- E2E cyklu M4D jest zadaniem Zespołu B i nie jest częścią tego worktree;
- testy źródłowe pilnują kontraktu integracji dialogów, ale nie zastępują E2E
  w prawdziwej przeglądarce.

## 9. Kryteria zamknięcia M4D

Automatyczna i E2E weryfikacja M4D.8 zakończyła się PASS; 2 jawne SKIP dotyczą
wyłącznie braku legalnego fixture przeglądarkowego dla domownika i dziecka i nie
są nieudanymi testami. Formalne zamknięcie całego M4D wymaga jeszcze finalnego
ręcznego odbioru właściciela. Ręczny odbiór nie został jeszcze wykonany, a tag
zamykający M4D nie został utworzony.

- `test:logic`, lint, build, pgTAP i `git diff --check` przechodzą;
- finalny runner E2E zakończył się wynikiem 13 PASS / 2 SKIP / 0 FAIL;
- nie ma otwartego problemu P0/P1;
- zakres zmian pozostaje ograniczony do regresji i dokumentacji M4D;
- wynik test:logic to 158/158 PASS, lint i build są PASS, a pgTAP pozostaje 757/757 PASS;
- właściciel zaakceptuje checkpoint przed stabilnym tagiem.

Werdykt checkpointu: **M4D.8 AUTOMATED AND E2E VERIFICATION PASS — READY FOR FINAL MANUAL ACCEPTANCE**.
