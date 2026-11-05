# Publikacja — wymagane dowody

Przegląd repozytorium: 2026-10-12, main
`77313919c50b743fe58252dace643fc7d8cc58d1`. Źródło pozostałego zakresu:
[PR #19](https://github.com/qdominik/HomeBack.app/pull/19).
Ta checklista nie potwierdza gotowości produkcyjnej ani stanu hosted usług.

## Zakres już zastąpiony

- `SECURITY.md`, `.github/dependabot.yml` oraz placeholdery projektu w
  `preview-deployment-contract-2026-08-02.md` są już w main; bez zmian tutaj.
- Rejestracja korzysta z zaufanego `getAppBaseUrl()` w
  `src/lib/email/config.ts`, bez fallbacku do nagłówka `Origin`.
  `next.config.ts` nie zawiera już stałego adresu LAN.
- Stary postulat limitu Server Actions 3 MB zastąpił kontrakt kompresji:
  [obsługa zdjęć](../decisions/item-photo-flow-recovery.md).
- Hasło lokalnych fixture'ów E2E jest danymi syntetycznymi jednorazowej bazy
  CI, a nie poświadczeniem hosted. Nie używać go do hosted smoke.

Nie przenosimy sierpniowych wyników skanowania, audytu npm, ustawień GitHub,
smoke, listy otwartych PR-ów ani twierdzenia o prywatnym repo jako aktualnych
faktów. Repo jest obecnie publiczne; archiwalne raporty pozostają snapshotami.

## Przed dopuszczeniem zewnętrznych użytkowników

- [ ] Właściciel zapisuje aktualny SHA, wyniki wymaganych CI, audytu zależności
  i kontroli sekretów. Zielone historyczne CI nie jest dowodem bieżącej gotowości.
- [ ] Właściciel potwierdza aktualną ochronę main, uprawnienia Actions,
  Secret Scanning/Push Protection i decyzję o CodeQL. Raport
  [Priorytet 1](priority-1-completion-2026-09-12.md) opisuje tylko swój checkpoint.
- [ ] Osobna decyzja i weryfikacja nagłówków bezpieczeństwa, w tym CSP:
  `next.config.ts` nie definiuje `headers()`. Nie deklarujemy tu braku
  nagłówków dostawcy hostingu ani gotowej polityki CSP.
- [ ] Właściciel sprawdza hosted password policy, confirmation, rate limits
  i potrzebę CAPTCHA. Lokalny `supabase/config.toml` nadal ma minimalną długość
  6; formularz rejestracji wymaga 8. To nie jest odczyt konfiguracji hosted.
- [ ] Osobno potwierdzone zaufane URL aplikacji, Auth redirects, SMTP,
  izolacja danych/sekretów, retencja i backup oraz historia migracji hosted.
  CI nie stosuje migracji na Preview ani Production. Punkty wyjścia:
  [kontrakt Vercel](vercel-environment-contract.md),
  [kontrakt Preview](preview-deployment-contract-2026-08-02.md),
  [role i zaproszenia](../decisions/roles-invites-deployment-readiness.md).
- [ ] Świeży smoke właściwego deploymentu: Auth, dane gospodarstwa i zdjęcia,
  cookies/HTTPS, originy oraz izolacja Storage; wyłącznie zatwierdzone dane
  testowe. Stare rekordy PASS nie zastępują tego odbioru.

Operacje hosted, zmiany konfiguracji i historii Git wymagają osobnego zakresu
i akceptacji właściciela. Ta aktualizacja wykonuje wyłącznie pracę dokumentacyjną.
