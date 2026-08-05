-- Cel:
-- Dodanie prywatnego bucketu Supabase Storage dla jednego glownego zdjecia
-- Rzeczy oraz polityk izolujacych sciezki po aktywnym household_id.
--
-- Wplyw na dane:
-- Tworzy bucket `item-photos`, helper parsujacy household_id ze sciezki
-- Storage oraz polityki dla storage.objects. Nie zmienia istniejacych rekordow
-- aplikacyjnych.
--
-- Cofniecie:
-- Usunac polityki Storage, funkcje public.item_photo_storage_household_id(text)
-- oraz bucket `item-photos` w osobnej zatwierdzonej migracji po upewnieniu sie,
-- ze nie zawiera potrzebnych obiektow.
--
-- RLS:
-- Bucket jest prywatny. Obiekty musza miec sciezke
-- `households/{household_id}/...`. Odczyt jest ograniczony do aktywnych
-- adminow i domownikow danego gospodarstwa, a zapis, aktualizacja i usuwanie
-- do aktywnych administratorow.
--
-- Test:
-- `supabase db reset` oraz `supabase test db`.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'item-photos',
  'item-photos',
  false,
  2097152,
  array['image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function public.item_photo_storage_household_id(object_name text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when object_name ~ '^households/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/'
      then split_part(object_name, '/', 2)::uuid
    else null
  end;
$$;

revoke all on function public.item_photo_storage_household_id(text) from public;
revoke all on function public.item_photo_storage_household_id(text) from anon;
grant execute on function public.item_photo_storage_household_id(text)
  to authenticated;

create policy item_photos_select_household_adult
on storage.objects
for select
to authenticated
using (
  bucket_id = 'item-photos'
  and public.item_photo_storage_household_id(name) = public.current_household_id()
  and public.current_profile_role() in ('admin', 'domownik')
);

create policy item_photos_insert_admin
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'item-photos'
  and public.item_photo_storage_household_id(name) = public.current_household_id()
  and public.is_household_admin(public.current_household_id())
);

create policy item_photos_update_admin
on storage.objects
for update
to authenticated
using (
  bucket_id = 'item-photos'
  and public.item_photo_storage_household_id(name) = public.current_household_id()
  and public.is_household_admin(public.current_household_id())
)
with check (
  bucket_id = 'item-photos'
  and public.item_photo_storage_household_id(name) = public.current_household_id()
  and public.is_household_admin(public.current_household_id())
);

create policy item_photos_delete_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'item-photos'
  and public.item_photo_storage_household_id(name) = public.current_household_id()
  and public.is_household_admin(public.current_household_id())
);
