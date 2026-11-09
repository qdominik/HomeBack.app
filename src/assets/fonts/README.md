# Lokalne fonty UI-01

Inter i Fraunces pochodzą z zatwierdzonych TTF w docs/design/ui00/reference/assets. Pełne informacje autorskie i licencje OFL są w INTER-OFL.txt i FRAUNCES-OFL.txt. Nie zmieniono ich treści.

WOFF2 przygotowuje scripts/prepare-ui-fonts.py z fontTools 4.60.2 oraz brotli 1.2.1 / zopfli 0.4.3, zainstalowanymi poza zależnościami aplikacji. Skrypt zachowuje zakres Latin/Latin Extended, polskie glify i osie wght/opsz. SOFT=0 i WONK=1 we Fraunces to wartości domyślne przyjętej referencji. Pozostałe alfabety korzystają z systemowego fallbacku; dane użytkownika nie są tłumaczone.

Manifest: [źródła, SHA-256, rozmiary i osie](../../../docs/design/ui01/font-manifest.json). Łącznie 431 752 B: Inter 200 700 B, Fraunces regular 105 792 B, italic 125 260 B. next/font/local preloaduje tylko Inter; Fraunces pobiera się przy użyciu. Fonty mają display swap i fallback z korektą metryk. Aplikacja nie pobiera fontów z zewnętrznego CDN.
