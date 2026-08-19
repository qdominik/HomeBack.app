-- Cel:
-- Dodanie opcjonalnych, stabilnych identyfikatorow ikon do istniejacych
-- poziomow struktury domu: mebli (L2) i schowkow (L3).
--
-- Wplyw na dane:
-- Brak backfillu. Istniejace rekordy maja NULL i korzystaja z fallbacku UI.
--
-- Cofniecie:
-- Osobna zatwierdzona migracja: ALTER TABLE ... DROP COLUMN ikona.
--
-- RLS:
-- Bez zmian. Istniejace polityki INSERT/UPDATE kontroluja przynaleznosc przez
-- relacje L2 -> room -> household oraz L3 -> L2 -> room -> household.
--
-- Test:
-- supabase test db

alter table public.storage_location_l2
  add column ikona text;

alter table public.storage_location_l3
  add column ikona text;
