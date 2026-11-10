# UI-02 — weryfikacja Preview

Podgląd pierwszego commita `880f5d47903d4c99930adc447e344fcfbdeb0dd4`: [Preview](https://homeback-hyu6rs8af-qdominiks-projects.vercel.app). Formularze rejestracji i logowania oraz dialog wyszukiwania sprawdzono na ekranach 390 × 844 i 1440 × 900 w odizolowanej sesji, bez logowania, wysyłania poprawnego formularza ani zapisu danych. Tekst na zrzutach jest syntetyczny.

- [Logowanie — telefon](login-validation-phone.png), [desktop](login-validation-desktop.png).
- [Rejestracja — telefon](register-validation-phone.png), [desktop](register-validation-desktop.png).
- [Wyszukiwarka — telefon](search-dialog-phone.png), [desktop](search-dialog-desktop.png).
- [Wyniki kontroli](checks.json): natywna walidacja i zachowanie wpisanej wartości, widoczny fokus klawiaturowy, początkowa kolejność Tab, Escape i powrót fokusu do wyzwalacza, brak poziomego przewijania.

To nie jest pełny odbiór widoków po zalogowaniu. Formularz dodawania rzeczy oraz dialogi kopiowania i usuwania wymagają sesji z dostępem do bezpiecznych danych testowych; ich ręczny przegląd na Preview pozostaje otwarty. Kolejny commit zmienia tylko implementację kontrolek zaproszeń oraz dołącza te dowody, dlatego dla pozostałych pokazanych widoków odpowiadają one poprzedniemu headowi.
