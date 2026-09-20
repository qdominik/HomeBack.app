# Roles & Invites — dostarczanie zaproszeń przez SeoHost SMTP

Data decyzji: 2026-09-19
Ostatnia weryfikacja dostarczalności: 2026-09-20
Status: zatwierdzone przez właściciela projektu
Zakres: Users & Roles / Auth / Security

## Decyzja

Zaproszenia HomeBack są wysyłane przez istniejącą, własną pocztę SMTP na
SeoHost. Zatwierdzonym nadawcą jest `HomeBack <noreply@homeback.app>`.
Skrzynka `noreply@homeback.app` istnieje i jest kontem SMTP używanym przez
zaproszenia. Wiadomości zakładania konta pozostają poza zakresem tego PR:
obecnie mogą używać historycznego adresu `noreplay@homeback.app`; ich
ujednolicenie jest osobnym zadaniem backlogowym.

Wybór wykorzystuje istniejącą infrastrukturę, nie dodaje kolejnego procesora
danych ani płatnej usługi i zachowuje jeden spójny adres nadawcy. Aplikacja
Next.js otrzymuje własny, serwerowy zestaw poświadczeń SMTP; konfiguracja SMTP
Supabase Auth nie jest automatycznie dostępna dla aplikacji.

## Konfiguracja i środowiska

Sekrety SMTP pozostają wyłącznie w bezpiecznej konfiguracji środowiska i nigdy
nie trafiają do repozytorium, logów, artefaktów testowych ani opisu PR. Preview
i Production mają oddzielne zakresy konfiguracji. Preview używa jawnej,
serwerowej allowlisty zatwierdzonych adresów testowych.

Production pozostaje wyłączone do odrębnej decyzji rolloutowej:
`HOUSEHOLD_INVITATIONS_ENABLED` nie jest tam ustawiane, nie dodajemy sekretów
SMTP i nie wykonujemy prawdziwych wysyłek ani migracji Production w tym zadaniu.

Wymagane nazwy konfiguracji aplikacji:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `APP_BASE_URL`
- `INVITATION_EMAIL_ALLOWLIST` — wyłącznie po stronie serwera
- `INVITATION_EMAIL_TRANSPORT`
- `HOUSEHOLD_INVITATIONS_ENABLED`

`SMTP_FROM` ma wartość `HomeBack <noreply@homeback.app>`. `APP_BASE_URL` jest
jawnym, zaufanym adresem danego środowiska i jest jedyną podstawą linku
zaproszenia. Nagłówek `Host` lub `Origin` żądania nie może budować tego linku.

Zatwierdzona konfiguracja SMTP dla Preview to `h61.seohost.pl`, port `465`,
implicit SSL/TLS oraz `SMTP_SECURE=true`. `INVITATION_EMAIL_ALLOWLIST` używa
listy dokładnych adresów rozdzielonych przecinkami. `SMTP_PASSWORD` pozostaje
sekretem w konfiguracji środowiska; nie może trafić do repozytorium,
dokumentacji, logów ani raportów.

## Semantyka i ograniczenia SMTP

Pozytywna odpowiedź SMTP oznacza wyłącznie, że serwer przyjął wiadomość do
wysyłki (`accepted_by_smtp`). Nie potwierdza dostarczenia do skrzynki odbiorcy.
Interfejs używa komunikatu „Zaproszenie zostało przekazane do wysyłki”, nigdy
„wiadomość została doręczona”.

Publiczna dokumentacja SeoHost opisuje SMTP z uwierzytelnieniem na porcie 465
(implicit TLS) lub 587 (STARTTLS). Nie potwierdzono obsługi webhooków
delivery/bounce, DSN ani programowego logu wysyłki. Dopóki SeoHost nie udostępni
obsługiwanego mechanizmu, aplikacja nie tworzy sztucznego statusu `delivered`;
automatyczne delivery/bounce pozostaje długiem technologicznym.

Transport wymaga TLS i prawidłowego certyfikatu, ma jawne timeouty i wyłączone
logowanie protokołu oraz treści. Błąd synchronicznej wysyłki powoduje
transakcyjnie kontrolowane odwołanie nowo utworzonego zaproszenia i zapis
wyłącznie bezpiecznej klasy błędu. Błąd kompensacji jest raportowany jako
krytyczny bez tokenu, hasła SMTP, pełnej wiadomości ani pełnego adresu odbiorcy.

## Dane i prywatność

SMTP przetwarza minimalny zestaw danych wymagany do zaproszenia:

- adres odbiorcy;
- nazwę zapraszającego;
- nazwę gospodarstwa;
- proponowaną rolę;
- treść wiadomości;
- jednorazowy link.

Surowy token istnieje tylko w linku i pamięci procesu lub krótkotrwałym cookie
`HttpOnly`; baza przechowuje wyłącznie jego hash. Token i pełna treść wiadomości
nie są logowane. Domena `homeback.app` musi mieć poprawne SPF, DKIM i DMARC przed
prawdziwym testem Preview.

Kontrola DNS i dostarczalności z 2026-09-20 potwierdziła SPF, DKIM i DMARC jako
PASS dla domeny `homeback.app`. DKIM używa selektora `x` i rekordu
`x._domainkey.homeback.app`. Prawdziwa wiadomość kontrolna od
`noreply@homeback.app` została dostarczona do Gmaila w około sekundę, a
połączenie z serwerem odbiorcy użyło TLS 1.3.

Ta kontrola potwierdza konfigurację uwierzytelniania i dostarczenie wiadomości
kontrolnej, lecz status aplikacyjny `accepted_by_smtp` nadal oznacza wyłącznie
przyjęcie wiadomości przez serwer SeoHost. Automatyczna obsługa bounce i
potwierdzonego delivery nie jest zaimplementowana i pozostaje długiem
technicznym.

## Runbook: kontrola redirectu zaproszeń (Preview)

Przed każdym testem zaproszenia sprawdź zgodność trzech wartości: `APP_BASE_URL`
aktywnego deploymentu Vercel, Supabase Auth **Site URL** oraz Supabase Auth
**Redirect URLs**. Lista musi zawierać dokładny callback
`<APP_BASE_URL>/auth/confirm`.

Nie używaj starego aliasu deploymentu jako Site URL. Preferuj dokładny callback
zamiast wildcardu, gdy adres Preview jest znany. Po zmianie odczytaj konfigurację
ponownie i potwierdź, że `Confirm email` pozostaje włączone. Nie zapisuj w
raporcie tokenów, kodów, cookies ani sekretów.

## Referencje

- https://seohost.pl/pomoc/konfiguracja-poczty-program-pocztowy
- https://seohost.pl/pomoc/jakich-portow-uzywac-poczta-e-mail
- https://seohost.pl/pomoc/uwierzytelnianie-emaili-spf-dkim-dmarc
