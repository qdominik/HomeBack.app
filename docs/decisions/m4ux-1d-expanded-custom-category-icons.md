# M4UX.1D - Rozszerzony Kontrolowany Katalog Ikon Kategorii

## Status

Zaimplementowano, przetestowano i zaakceptowano recznie.

## Decyzja

Wlasne Kategorie moga wybierac ikony z rozszerzonego, ale skonczonego katalogu
Phosphor. Katalog pozostaje jawnie opisany w rejestrze ikon encji: kazdy klucz,
komponent, etykieta PL/EN i alias wyszukiwania sa zapisane w kodzie.

Picker korzysta z istniejacego dialogu, wyszukiwania i siatki ikon. Nie laduje
komponentow dynamicznie i nie przyjmuje dowolnych nazw z biblioteki Phosphor.
Istniejace ikony domyslne pozostaja dostepne.

## Walidacja I Dane

Do `category.ikona` trafia tylko stabilny klucz dozwolony dla grupy `category`
lub istniejacy fallback `other`. Pusta, obca albo techniczna nazwa komponentu
React jest normalizowana do `other` po stronie serwera.

Etap nie zmienia modelu danych, bazy, migracji, RLS, RPC, routingu ani metod
HTTP.

## Zakres Katalogu I Weryfikacja

Katalog zawiera 15 dodatkowych, jawnie importowanych ikon Phosphor, w tym
heart, leaf, paw-print, car, icycle, camera, gift i star.
Kazda pozycja ma stabilny klucz, etykiete PL/EN oraz aliasy wyszukiwania.
Nie istnieje dynamiczny katalog eksportow ani zapis nazwy komponentu React.

Walidacja dopuszcza wylacznie klucze grup category i generic; pozostale
wartosci przechodza na fallback other. Testy logiki 70/70 oraz reczne testy
pickera na mobile i desktopie zostaly zaakceptowane.