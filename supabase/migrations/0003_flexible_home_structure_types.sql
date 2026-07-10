-- Cel:
-- Uelastycznienie pola rodzaju w module Dom / Structure bez zmiany tabel,
-- relacji ani polityk RLS.
--
-- Wplyw na dane:
-- Istniejace wartosci enum zostaja zachowane przez rzutowanie do text.
--
-- Cofniecie:
-- Wymaga osobnej zatwierdzonej migracji przywracajacej enumy i mapowanie
-- danych do zamknietej listy wartosci.
--
-- RLS:
-- Brak zmian. Polityki pozostaja bez zmian i nadal chronia zapis struktury.
--
-- Test:
-- `supabase db reset` oraz `supabase test db`.

alter table public.room
  alter column typ type text
  using typ::text;

alter table public.storage_location_l2
  alter column typ type text
  using typ::text;
