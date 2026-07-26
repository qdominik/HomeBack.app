# M4C.1 — Kopiowanie encji

M4C.1 dodaje atomowe kopiowanie pojedynczego Pomieszczenia, Mebla, Schowka lub Rzeczy w obrębie aktywnego gospodarstwa.

## Uprawnienia

- Pomieszczenie, Mebel i Schowek: wyłącznie aktywny administrator.
- Rzecz: aktywny administrator lub domownik.
- Dziecko i gość: brak kopiowania.
- `household_id` pochodzi z aktywnego profilu; klient nie przekazuje zaufanego gospodarstwa.

## Zakres kopii

Kopia Pomieszczenia może zawierać jego Meble i Schowki, ale nigdy Rzeczy ani `item_location`. Kopia Mebla może zawierać Schowki, ale nie Rzeczy. Kopia Schowka dotyczy tylko Schowka. Kopia Rzeczy obejmuje dane użytkowe i opcjonalną jedną główną lokalizację.

Nie kopiujemy identyfikatorów, dat technicznych, historii, logów, plików, zdjęć ani statusu archiwalnego. Nowa Rzecz ma status `w domu` i `created_by_id = auth.uid()`.

## Nazwy i kody

Domyślna nazwa to `<nazwa> — kopia`, a kolejne konflikty otrzymują numer `kopia 2`, `kopia 3` itd. Kody lokalizacji są nowe i zachowują format istniejącego kodu z bezkolizyjnym sufiksem kopii.

## Atomowość i bezpieczeństwo

Każda operacja jest pojedynczym RPC z pełnym rollbackiem. Funkcje mają pusty `search_path`, jawne granty wyłącznie dla `authenticated`, nie używają service role ani dynamicznego SQL i sprawdzają źródło oraz cel w aktywnym gospodarstwie.

## Testy i poza zakresem

Testy obejmują role, izolację gospodarstw, nowe UUID i kody, kolizje nazw, brak kopiowania Rzeczy w strukturze, lokalizacje Rzeczy i rollback. Poza zakresem pozostają kopiowanie masowe, między gospodarstwami, pliki/zdjęcia i historia.
