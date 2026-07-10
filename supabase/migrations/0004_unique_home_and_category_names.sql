-- Purpose:
-- Prevent ambiguous duplicate names in the Home structure and custom categories.
--
-- Data impact:
-- Existing data is retained. The migration will stop if existing normalized
-- duplicates must first be resolved manually.
--
-- Rollback:
-- Drop the four indexes in a separate approved migration.
--
-- RLS:
-- No changes. The indexes complement, but do not replace, application
-- validation and existing RLS policies.
--
-- Test:
-- supabase db reset and supabase test db.

create unique index room_household_normalized_name_unique
  on public.room (household_id, lower(btrim(nazwa)));

create unique index storage_location_l2_room_normalized_name_unique
  on public.storage_location_l2 (room_id, lower(btrim(nazwa)));

create unique index storage_location_l3_l2_normalized_name_unique
  on public.storage_location_l3 (
    storage_location_l2_id,
    lower(btrim(nazwa))
  );

create unique index category_household_custom_normalized_name_unique
  on public.category (household_id, lower(btrim(nazwa)))
  where czy_systemowa = false;
