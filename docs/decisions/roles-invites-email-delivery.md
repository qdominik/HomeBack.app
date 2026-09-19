# Roles & Invites — dostarczanie zaproszeń przez SeoHost SMTP

Data decyzji: 2026-09-19  
Status: zatwierdzone przez właściciela projektu  
Zakres: Users & Roles / Auth / Security

## Decyzja

Zaproszenia HomeBack są wysyłane przez istniejącą, własną pocztę SMTP na
SeoHost. Nadawcą jest `HomeBack <noreply@homeback.app>`. Skrzynka
`noreply@homeback.app` już istnieje i jest używana przez przepływ zakładania
konta obsługiwany przez Supabase Auth.

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

`SMTP_FROM` ma wartość `HomeBack <noreply@homeback.app>`. `APP_BASE_URL` jest
jawnym, zaufanym adresem danego środowiska i jest jedyną podstawą linku
zaproszenia. Nagłówek `Host` lub `Origin` żądania nie może budować tego linku.

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

Kontrola DNS z 2026-09-19 potwierdziła SPF przekierowany do
`_spf-h61.microhost.pl` oraz DMARC `p=quarantine`. Nie znaleziono publicznego
rekordu dla typowych selektorów DKIM (`default`, `mail`, `dkim`); właściwy
selektor należy potwierdzić w panelu SeoHost przed prawdziwą wysyłką.

## Referencje

- https://seohost.pl/pomoc/konfiguracja-poczty-program-pocztowy
- https://seohost.pl/pomoc/jakich-portow-uzywac-poczta-e-mail
- https://seohost.pl/pomoc/uwierzytelnianie-emaili-spf-dkim-dmarc

