-- Purpose:
-- RPC generate_test_data(p_dataset_type) to insert development/test data
-- into the current household. Three dataset types: small, medium, deletion_test.
--
-- Data impact:
-- Inserts rows into room, storage_location_l2, storage_location_l3,
-- item, and item_location tables. Does NOT modify or delete existing data.
-- All names are suffixed with a random 8-char hex tag to avoid collisions.
--
-- Rollback:
-- Manually DELETE rows where nazwa LIKE '% (test-<suffix>)'. The RPC returns
-- the suffix so the UI can offer a targeted clean-up in the future.
--
-- RLS:
-- The function is security invoker. It checks auth.uid() and admin role via
-- existing helper functions. All inserted rows carry the caller's household_id.
--
-- Test:
-- Call each dataset type from an admin account and verify row counts.

-- Helper: generate location code segment from a name
create function public._test_data_code_segment(p_name text, p_order int)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_clean text;
begin
  v_clean := trim(
    regexp_replace(
      regexp_replace(
        translate(lower(p_name), 'ąćęłńóśźż', 'acelnoszz'),
      '[^a-z0-9]', '', 'g'),
    '\s+', ' ', 'g')
  );
  return upper(left(v_clean, 3)) || p_order::text;
end;
$$;

create function public.generate_test_data(p_dataset_type text)
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_profile_id uuid;
  v_profile_role text;
  v_suffix text;
  v_room_order int := 0;
  v_l2_order int := 0;
  v_l3_order int := 0;

  -- room ids
  v_salon_id uuid;
  v_kuchnia_id uuid;
  v_garaz_id uuid;

  -- l2 ids (salon)
  v_komoda_id uuid;
  v_regal_id uuid;
  v_rtv_id uuid;

  -- l2 ids (kuchnia)
  v_szafka_id uuid;
  v_lodowka_id uuid;

  -- l2 ids (garaz)
  v_garaz_regal_id uuid;

  -- l3 ids (salon > komoda)
  v_gor_szuflada_id uuid;
  v_dol_szuflada_id uuid;

  -- l3 ids (salon > regal)
  v_srodkowa_polka_id uuid;
  v_gor_polka_id uuid;

  -- l3 ids (salon > rtv)
  v_rtv_polka1_id uuid;
  v_rtv_polka2_id uuid;

  -- l3 ids (kuchnia > szafka)
  v_szafka_gora_id uuid;
  v_szafka_dol_id uuid;

  -- l3 ids (kuchnia > lodowka)
  v_lodowka_polka1_id uuid;
  v_lodowka_polka2_id uuid;

  -- l3 ids (garaz > regal)
  v_garaz_polka1_id uuid;
  v_garaz_polka2_id uuid;
  v_garaz_polka3_id uuid;

  -- category ids
  v_cat_electronics uuid;
  v_cat_documents uuid;
  v_cat_books uuid;
  v_cat_food uuid;
  v_cat_tools uuid;
  v_cat_spare_parts uuid;
  v_cat_other uuid;

  -- counters for summary
  v_rooms_created int := 0;
  v_l2_created int := 0;
  v_l3_created int := 0;
  v_last_item_id uuid;
  v_items_created int := 0;
  v_locations_created int := 0;
begin
  -- === AUTH GUARD ===
  if auth.uid() is null then
    return json_build_object('status', 'error', 'code', 'AUTH_REQUIRED');
  end if;

  v_household_id := public.current_household_id();

  if v_household_id is null then
    return json_build_object('status', 'error', 'code', 'ACTIVE_PROFILE_REQUIRED');
  end if;

  v_profile_role := public.current_profile_role();

  if v_profile_role <> 'admin' or not public.is_household_admin(v_household_id) then
    return json_build_object('status', 'error', 'code', 'ADMIN_REQUIRED');
  end if;

  -- === VALIDATE DATASET TYPE ===
  if p_dataset_type is null or p_dataset_type not in ('small', 'medium', 'deletion_test') then
    return json_build_object('status', 'error', 'code', 'INVALID_DATASET');
  end if;

  -- === GET CURRENT PROFILE ID ===
  select id into v_profile_id
  from public.profile
  where id = auth.uid() and household_id = v_household_id;

  if v_profile_id is null then
    return json_build_object('status', 'error', 'code', 'ACTIVE_PROFILE_REQUIRED');
  end if;

  -- === CREATE UNIQUE SUFFIX ===
  v_suffix := substr(gen_random_uuid()::text, 1, 8);

  -- === LOOK UP SYSTEM CATEGORIES ===
  select id into v_cat_electronics from public.category where key = 'electronics' and household_id is null;
  select id into v_cat_documents from public.category where key = 'documents' and household_id is null;
  select id into v_cat_books from public.category where key = 'books' and household_id is null;
  select id into v_cat_food from public.category where key = 'food' and household_id is null;
  select id into v_cat_tools from public.category where key = 'tools' and household_id is null;
  select id into v_cat_spare_parts from public.category where key = 'spare_parts' and household_id is null;
  select id into v_cat_other from public.category where key = 'other' and household_id is null;

  -- === SHARED STRUCTURE (Salon with Komoda + Regał, used by all datasets) ===
  v_room_order := 1;
  insert into public.room (household_id, nazwa, typ, kolejność)
  values (v_household_id, 'Salon (test-' || v_suffix || ')', 'Salon', v_room_order)
  returning id into v_salon_id;
  v_rooms_created := v_rooms_created + 1;

  -- Komoda
  v_l2_order := 1;
  insert into public.storage_location_l2 (room_id, nazwa, typ, kolejność)
  values (v_salon_id, 'Komoda (test-' || v_suffix || ')', 'Komoda', v_l2_order)
  returning id into v_komoda_id;
  v_l2_created := v_l2_created + 1;

  v_l3_order := 1;
  insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
  values (v_komoda_id, 'Górna szuflada (test-' || v_suffix || ')',
          public._test_data_code_segment('Górna szuflada', v_l3_order), v_l3_order)
  returning id into v_gor_szuflada_id;
  v_l3_created := v_l3_created + 1;

  v_l3_order := 2;
  insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
  values (v_komoda_id, 'Dolna szuflada (test-' || v_suffix || ')',
          public._test_data_code_segment('Dolna szuflada', v_l3_order), v_l3_order)
  returning id into v_dol_szuflada_id;
  v_l3_created := v_l3_created + 1;

  -- Regał
  v_l2_order := 2;
  insert into public.storage_location_l2 (room_id, nazwa, typ, kolejność)
  values (v_salon_id, 'Regał (test-' || v_suffix || ')', 'Regał', v_l2_order)
  returning id into v_regal_id;
  v_l2_created := v_l2_created + 1;

  v_l3_order := 1;
  insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
  values (v_regal_id, 'Środkowa półka (test-' || v_suffix || ')',
          public._test_data_code_segment('Środkowa półka', v_l3_order), v_l3_order)
  returning id into v_srodkowa_polka_id;
  v_l3_created := v_l3_created + 1;

  -- === COMMON ITEMS (added for all datasets) ===
  -- Items in Górna szuflada
  insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
  values (v_household_id, v_cat_electronics, 'Ładowarka USB-C (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id)
  returning id into v_last_item_id;

  insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
  values (v_last_item_id, v_gor_szuflada_id, true);
  v_locations_created := v_locations_created + 1;

  insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
  values (v_household_id, v_cat_electronics, 'Pilot do telewizora (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;

  insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
  values (v_last_item_id, v_gor_szuflada_id, true);
  v_locations_created := v_locations_created + 1;

  -- Items in Dolna szuflada
  insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
  values (v_household_id, v_cat_documents, 'Dokumenty gwarancyjne (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;

  insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
  values (v_last_item_id, v_dol_szuflada_id, true);
  v_locations_created := v_locations_created + 1;

  -- Items in Środkowa półka
  insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
  values (v_household_id, v_cat_books, 'Album rodzinny (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;

  insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
  values (v_last_item_id, v_srodkowa_polka_id, true);
  v_locations_created := v_locations_created + 1;

  -- === DATASET-SPECIFIC DATA ===
  if p_dataset_type = 'small' then
    -- Small set is exactly the common structure above, nothing extra
    null;

  elsif p_dataset_type = 'medium' then
    -- === MEDIUM SET: add more rooms, furniture, storage, items ===

    -- RTV in Salon
    v_l2_order := 3;
    insert into public.storage_location_l2 (room_id, nazwa, typ, kolejność)
    values (v_salon_id, 'Szafka RTV (test-' || v_suffix || ')', 'RTV', v_l2_order)
    returning id into v_rtv_id;
    v_l2_created := v_l2_created + 1;

    v_l3_order := 1;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_rtv_id, 'Półka 1 (test-' || v_suffix || ')',
            public._test_data_code_segment('Półka 1', v_l3_order), v_l3_order)
    returning id into v_rtv_polka1_id;
    v_l3_created := v_l3_created + 1;

    v_l3_order := 2;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_rtv_id, 'Półka 2 (test-' || v_suffix || ')',
            public._test_data_code_segment('Półka 2', v_l3_order), v_l3_order)
    returning id into v_rtv_polka2_id;
    v_l3_created := v_l3_created + 1;

    -- Items in RTV
    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_electronics, 'Kabel HDMI (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_rtv_polka1_id, true);
    v_locations_created := v_locations_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_electronics, 'Router Wi-Fi (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_rtv_polka2_id, true);
    v_locations_created := v_locations_created + 1;

    -- Regal: add Górna półka
    v_l3_order := 2;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_regal_id, 'Górna półka (test-' || v_suffix || ')',
            public._test_data_code_segment('Górna półka', v_l3_order), v_l3_order)
    returning id into v_gor_polka_id;
    v_l3_created := v_l3_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_other, 'Dekoracja stołu (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_gor_polka_id, true);
    v_locations_created := v_locations_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_books, 'Książka kucharska (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_gor_polka_id, true);
    v_locations_created := v_locations_created + 1;

    -- Kuchnia
    v_room_order := 2;
    insert into public.room (household_id, nazwa, typ, kolejność)
    values (v_household_id, 'Kuchnia (test-' || v_suffix || ')', 'Kuchnia', v_room_order)
    returning id into v_kuchnia_id;
    v_rooms_created := v_rooms_created + 1;

    v_l2_order := 1;
    insert into public.storage_location_l2 (room_id, nazwa, typ, kolejność)
    values (v_kuchnia_id, 'Szafka kuchenna (test-' || v_suffix || ')', 'Szafka', v_l2_order)
    returning id into v_szafka_id;
    v_l2_created := v_l2_created + 1;

    v_l3_order := 1;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_szafka_id, 'Górna półka (test-' || v_suffix || ')',
            public._test_data_code_segment('Górna półka', v_l3_order), v_l3_order)
    returning id into v_szafka_gora_id;
    v_l3_created := v_l3_created + 1;

    v_l3_order := 2;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_szafka_id, 'Dolna półka (test-' || v_suffix || ')',
            public._test_data_code_segment('Dolna półka', v_l3_order), v_l3_order)
    returning id into v_szafka_dol_id;
    v_l3_created := v_l3_created + 1;

    -- Items in kuchnia
    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_food, 'Makaron spaghetti (test-' || v_suffix || ')', 'zapas', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_szafka_gora_id, true);
    v_locations_created := v_locations_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_food, 'Oliwa z oliwek (test-' || v_suffix || ')', 'zapas', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_szafka_gora_id, true);
    v_locations_created := v_locations_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_tools, 'Zestaw noży kuchennych (test-' || v_suffix || ')', 'zestaw', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_szafka_dol_id, true);
    v_locations_created := v_locations_created + 1;

    v_l2_order := 2;
    insert into public.storage_location_l2 (room_id, nazwa, typ, kolejność)
    values (v_kuchnia_id, 'Lodówka (test-' || v_suffix || ')', 'Lodówka', v_l2_order)
    returning id into v_lodowka_id;
    v_l2_created := v_l2_created + 1;

    v_l3_order := 1;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_lodowka_id, 'Półka 1 (test-' || v_suffix || ')',
            public._test_data_code_segment('Półka 1', v_l3_order), v_l3_order)
    returning id into v_lodowka_polka1_id;
    v_l3_created := v_l3_created + 1;

    v_l3_order := 2;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_lodowka_id, 'Półka 2 (test-' || v_suffix || ')',
            public._test_data_code_segment('Półka 2', v_l3_order), v_l3_order)
    returning id into v_lodowka_polka2_id;
    v_l3_created := v_l3_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_food, 'Masło orzechowe (test-' || v_suffix || ')', 'zapas', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_lodowka_polka1_id, true);
    v_locations_created := v_locations_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_food, 'Mleko migdałowe (test-' || v_suffix || ')', 'zapas', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_lodowka_polka1_id, true);
    v_locations_created := v_locations_created + 1;

    -- Garaż
    v_room_order := 3;
    insert into public.room (household_id, nazwa, typ, kolejność)
    values (v_household_id, 'Garaż (test-' || v_suffix || ')', 'Garaż', v_room_order)
    returning id into v_garaz_id;
    v_rooms_created := v_rooms_created + 1;

    v_l2_order := 1;
    insert into public.storage_location_l2 (room_id, nazwa, typ, kolejność)
    values (v_garaz_id, 'Regał warsztatowy (test-' || v_suffix || ')', 'Regał', v_l2_order)
    returning id into v_garaz_regal_id;
    v_l2_created := v_l2_created + 1;

    v_l3_order := 1;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_garaz_regal_id, 'Półka 1 (test-' || v_suffix || ')',
            public._test_data_code_segment('Półka 1', v_l3_order), v_l3_order)
    returning id into v_garaz_polka1_id;
    v_l3_created := v_l3_created + 1;

    v_l3_order := 2;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_garaz_regal_id, 'Półka 2 (test-' || v_suffix || ')',
            public._test_data_code_segment('Półka 2', v_l3_order), v_l3_order)
    returning id into v_garaz_polka2_id;
    v_l3_created := v_l3_created + 1;

    v_l3_order := 3;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_garaz_regal_id, 'Półka 3 (test-' || v_suffix || ')',
            public._test_data_code_segment('Półka 3', v_l3_order), v_l3_order)
    returning id into v_garaz_polka3_id;
    v_l3_created := v_l3_created + 1;

    -- Items in garaz
    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_tools, 'Młotek (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_garaz_polka1_id, true);
    v_locations_created := v_locations_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_tools, 'Śrubokręt krzyżakowy (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_garaz_polka1_id, true);
    v_locations_created := v_locations_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_spare_parts, 'Żarówka LED (test-' || v_suffix || ')', 'zapas', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_garaz_polka2_id, true);
    v_locations_created := v_locations_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_spare_parts, 'Baterie AA (test-' || v_suffix || ')', 'zapas', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_garaz_polka3_id, true);
    v_locations_created := v_locations_created + 1;

    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_tools, 'Taśma izolacyjna (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_garaz_polka3_id, true);
    v_locations_created := v_locations_created + 1;

  elsif p_dataset_type = 'deletion_test' then
    -- === DELETION TEST DATA ===
    -- Add extra L3 to Komoda for multi-location testing
    v_l3_order := 3;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_komoda_id, 'Szuflada boczna (test-' || v_suffix || ')',
            public._test_data_code_segment('Szuflada boczna', v_l3_order), v_l3_order);
    v_l3_created := v_l3_created + 1;

    -- Item with multiple locations (primary + additional)
    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_electronics, 'Przedłużacz (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_gor_szuflada_id, true);
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_srodkowa_polka_id, false);
    v_locations_created := v_locations_created + 2;

    -- Another item shared across two L3s within same L2
    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id)
    values (v_household_id, v_cat_other, 'Pudełko na biżuterię (test-' || v_suffix || ')', 'unikalny', 'w domu', v_profile_id) returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_dol_szuflada_id, true);
    v_locations_created := v_locations_created + 1;

    -- Empty L3 (for testing empty deletion)
    v_l3_order := 2;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_regal_id, 'Dolna półka (pusta) (test-' || v_suffix || ')',
            public._test_data_code_segment('Dolna półka', v_l3_order), v_l3_order);
    v_l3_created := v_l3_created + 1;

    -- Add Kuchnia with an empty Szafka (no items) for empty L2 deletion testing
    v_room_order := 2;
    insert into public.room (household_id, nazwa, typ, kolejność)
    values (v_household_id, 'Kuchnia (test-' || v_suffix || ')', 'Kuchnia', v_room_order)
    returning id into v_kuchnia_id;
    v_rooms_created := v_rooms_created + 1;

    v_l2_order := 1;
    insert into public.storage_location_l2 (room_id, nazwa, typ, kolejność)
    values (v_kuchnia_id, 'Pusta szafka (test-' || v_suffix || ')', 'Szafka', v_l2_order)
    returning id into v_szafka_id;
    v_l2_created := v_l2_created + 1;

    -- Empty L3 inside empty L2
    v_l3_order := 1;
    insert into public.storage_location_l3 (storage_location_l2_id, nazwa, kod_lokalizacji, kolejność)
    values (v_szafka_id, 'Pusta półka (test-' || v_suffix || ')',
            public._test_data_code_segment('Pusta półka', v_l3_order), v_l3_order);
    v_l3_created := v_l3_created + 1;

    -- Add archived items for archive-related tests
    insert into public.item (household_id, category_id, nazwa, typ, status, created_by_id, archived_at, status_before_archive)
    values (v_household_id, v_cat_documents, 'Stary dokument (test-' || v_suffix || ')', 'unikalny', 'archiwalne', v_profile_id, now(), 'w domu')
    returning id into v_last_item_id;
    insert into public.item_location (item_id, storage_location_l3_id, czy_glowna)
    values (v_last_item_id, v_dol_szuflada_id, true);
    v_locations_created := v_locations_created + 1;
  end if;

  -- Count items properly (COALESCE needed for correct count)
  select count(*) into v_items_created
  from public.item
  where household_id = v_household_id
    and nazwa like '%(test-' || v_suffix || ')%';

  select count(*) into v_locations_created
  from public.item_location il
  join public.item i on i.id = il.item_id
  where i.household_id = v_household_id
    and i.nazwa like '%(test-' || v_suffix || ')%';

  return json_build_object(
    'status', 'success',
    'suffix', v_suffix,
    'dataset_type', p_dataset_type,
    'rooms_created', v_rooms_created,
    'storage_l2_created', v_l2_created,
    'storage_l3_created', v_l3_created,
    'items_created', v_items_created,
    'locations_created', v_locations_created
  );
end;
$$;

-- Revoke PUBLIC and grant to authenticated only
revoke all on function public.generate_test_data(text) from public, anon;
revoke all on function public._test_data_code_segment(text, int) from public, anon;

grant execute on function public.generate_test_data(text) to authenticated;
grant execute on function public._test_data_code_segment(text, int) to authenticated;
