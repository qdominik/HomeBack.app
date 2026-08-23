# Faza 4b — runtime registry modułów Dashboardu

## Decyzja

Dashboard przestaje mieć karty wpisane na stałe. Każdy moduł opisuje
typowana definicja w rejestrze (`src/lib/dashboard/module-registry.ts`),
a wspólny mechanizm renderowania (`src/components/dashboard/module-runtime.tsx`)
dokleja do definicji renderer. Nowy moduł = wpis w rejestrze + wpis w
słowniku + (docelowo) komponent renderera — bez przebudowy Dashboardu
ani Ustawień.

## Struktura DashboardModuleDefinition

- `key: DashboardModuleKey` — union ośmiu znanych modułów, nie luźny string;
- `status: "available" | "soon"`;
- `titleKey` / `descriptionKey` — klucze do `t.dashboardModules` (PL/EN w
  słownikach, zero duplikacji tekstów w rejestrze i komponentach);
- `icon: EntityIconKey` — istniejący katalog ikon semantycznych;
- `defaultVisible` — fallback personalizacji;
- `requiredRoles?: DashboardModuleRole[]` — opcjonalne, oparte o realny typ
  `profile_role` (admin/domownik/dziecko/gość); brak pola = moduł dla
  wszystkich ról.

Warstwy są rozdzielone celowo: metadane (czysty TS, testowalny w
`test:logic`) są osobno od rendererów (React, tylko w buildzie aplikacji).
`dashboard-preferences.ts` nadal działa na samych metadanych.

## Zasady statusu soon

- moduły soon mają wyłącznie placeholder (`SoonModuleBody`) i nigdy treści
  funkcjonalnej;
- renderer soon modułu to nazwany komponent delegujący do placeholdera —
  to miejsce, w którym docelowo ląduje prawdziwa implementacja;
- przejście soon → available = zmiana statusu + podmiana renderera, bez
  zmian w Dashboardzie, Ustawieniach i preferencjach.

## Zasady personalizacji

- Ustawienia i Dashboard czytają ten sam rejestr (jedno źródło prawdy);
- toggles zapisują wyłącznie `module.key`; payload nadal walidowany względem
  rejestru; fallback `defaultVisible` bez zmian;
- kolejność modułów zawsze wynika z kolejności w rejestrze.

## Role / dostęp

Helper `filterDashboardModulesForRole` (`module-access.ts`) filtruje moduły
po roli profilu: brak `requiredRoles` = wszyscy; ustawione = rola musi być
w liście; brak roli = moduły ograniczone ukryte. Żaden bieżący moduł nie
ogranacza ról — pole jest przygotowaniem pod przyszłe moduły (np. Plan
lekcji dla rodzica/dziecka) i pokryte testami.

## Nowe wpisy w rejestrze

`rooms`, `documents`, `school-schedule`, `shopping-list` — status `soon`,
`defaultVisible: false` (nie zmieniają Dashboardu bez świadomej decyzji
użytkownika), z tekstami PL/EN w słownikach. Żadna funkcjonalność nie jest
implementowana.

## Czego nie wdrażamy teraz

- funkcji Planu lekcji i Listy zakupów (ani OCR/AI/zdjęć);
- tabel domenowych i migracji;
- zmian modelu preferencji, auth/RLS/server actions;
- per-user kolejności modułów i drag-and-drop;
- redesignu pozostałych ekranów aplikacji.
