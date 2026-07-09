-- Cel:
-- Utworzenie poczatkowego schematu danych HomeBack.app zgodnego z MVP.
--
-- Wplyw na dane:
-- Pierwsza migracja. Nie modyfikuje istniejacych danych uzytkownika.
--
-- Cofniecie:
-- Przed wdrozeniem: usunac migracje i wykonac `supabase db reset`.
-- Po wdrozeniu: przygotowac osobna zatwierdzona migracje usuwajaca obiekty
-- w odwrotnej kolejnosci zaleznosci.
--
-- RLS:
-- RLS jest wlaczane od razu. Polityki i granty sa dodawane w migracji 0002.
--
-- Test:
-- `supabase db reset` oraz `supabase test db`.

create type public.household_type as enum (
  'dom',
  'mieszkanie',
  'garaż'
);

create type public.profile_role as enum (
  'admin',
  'domownik',
  'dziecko',
  'gość'
);

create type public.profile_status as enum (
  'aktywny',
  'zaproszony',
  'nieaktywny'
);

create type public.room_type as enum (
  'salon',
  'sypialnia',
  'kuchnia',
  'garaż',
  'piwnica',
  'biuro'
);

create type public.storage_location_type as enum (
  'szafa',
  'komoda',
  'regał',
  'półka',
  'szuflada',
  'pudełko',
  'pojemnik'
);

create type public.item_type as enum (
  'unikalny',
  'zapas',
  'zestaw'
);

create type public.item_status as enum (
  'w domu',
  'zużyte',
  'pożyczone',
  'archiwalne'
);

create type public.file_type as enum (
  'zdjecie',
  'skan',
  'pdf',
  'dokument'
);

create type public.log_action as enum (
  'DODANO',
  'EDYTOWANO',
  'PRZESUNIĘTO',
  'USUNIĘTO',
  'ZMIENIONO_ILOŚĆ'
);

create type public.log_object_type as enum (
  'ITEM',
  'ROOM',
  'CATEGORY',
  'PROFILE'
);

create table public.household (
  id uuid primary key default gen_random_uuid(),
  nazwa text not null,
  typ public.household_type not null,
  kod_zaproszenia text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile (
  id uuid primary key references auth.users (id),
  household_id uuid not null references public.household (id),
  imie text not null,
  email text not null,
  rola public.profile_role not null,
  avatar_url text,
  status public.profile_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.room (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id),
  nazwa text not null,
  typ public.room_type not null,
  ikona text,
  opis text,
  "kolejność" integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.storage_location_l2 (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.room (id),
  nazwa text not null,
  typ public.storage_location_type not null,
  opis text,
  "kolejność" integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.storage_location_l3 (
  id uuid primary key default gen_random_uuid(),
  storage_location_l2_id uuid not null references public.storage_location_l2 (id),
  nazwa text not null,
  opis text,
  kod_lokalizacji text not null,
  identyfikator_qr text,
  identyfikator_nfc text,
  "kolejność" integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.category (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.household (id),
  key text,
  nazwa text not null,
  ikona text,
  kolor text,
  czy_systemowa boolean not null,
  widoczna_dla_dzieci boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_scope_check check (
    (
      czy_systemowa
      and household_id is null
      and key is not null
    )
    or
    (
      not czy_systemowa
      and household_id is not null
      and key is null
    )
  )
);

create unique index category_key_unique
  on public.category (key)
  where key is not null;

create table public.item (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id),
  category_id uuid not null references public.category (id),
  nazwa text not null,
  opis text,
  typ public.item_type not null,
  ilosc numeric,
  jednostka text,
  termin_waznosci date,
  opiekun_id uuid references public.profile (id),
  status public.item_status not null,
  przechowywany_w_sejfie boolean not null default false,
  miniatura_url text,
  notatki text,
  created_by_id uuid not null references public.profile (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_location (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.item (id),
  storage_location_l3_id uuid not null references public.storage_location_l3 (id),
  czy_glowna boolean not null,
  notatka text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.file (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.item (id),
  household_id uuid references public.household (id),
  nazwa text not null,
  plik_url text not null,
  typ public.file_type not null,
  rozmiar_kb integer not null,
  czy_zaszyfrowany boolean not null,
  created_by_id uuid not null references public.profile (id),
  created_at timestamptz not null default now()
);

create table public.log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id),
  profil_id uuid not null references public.profile (id),
  akcja public.log_action not null,
  typ_obiektu public.log_object_type not null,
  obiekt_id uuid not null,
  zmiana_przed jsonb,
  zmiana_po jsonb,
  szczegoly text,
  "timestamp" timestamptz not null default now()
);

create index profile_household_id_idx on public.profile (household_id);
create index room_household_id_idx on public.room (household_id);
create index storage_location_l2_room_id_idx on public.storage_location_l2 (room_id);
create index storage_location_l3_l2_id_idx
  on public.storage_location_l3 (storage_location_l2_id);
create index category_household_id_idx on public.category (household_id);
create index item_household_id_idx on public.item (household_id);
create index item_category_id_idx on public.item (category_id);
create index item_opiekun_id_idx on public.item (opiekun_id);
create index item_created_by_id_idx on public.item (created_by_id);
create index item_location_item_id_idx on public.item_location (item_id);
create index item_location_l3_id_idx
  on public.item_location (storage_location_l3_id);
create index file_household_id_idx on public.file (household_id);
create index file_item_id_idx on public.file (item_id);
create index log_household_id_idx on public.log (household_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger household_set_updated_at
before update on public.household
for each row execute function public.set_updated_at();

create trigger profile_set_updated_at
before update on public.profile
for each row execute function public.set_updated_at();

create trigger room_set_updated_at
before update on public.room
for each row execute function public.set_updated_at();

create trigger storage_location_l2_set_updated_at
before update on public.storage_location_l2
for each row execute function public.set_updated_at();

create trigger storage_location_l3_set_updated_at
before update on public.storage_location_l3
for each row execute function public.set_updated_at();

create trigger category_set_updated_at
before update on public.category
for each row execute function public.set_updated_at();

create trigger item_set_updated_at
before update on public.item
for each row execute function public.set_updated_at();

create trigger item_location_set_updated_at
before update on public.item_location
for each row execute function public.set_updated_at();

alter table public.household enable row level security;
alter table public.profile enable row level security;
alter table public.room enable row level security;
alter table public.storage_location_l2 enable row level security;
alter table public.storage_location_l3 enable row level security;
alter table public.category enable row level security;
alter table public.item enable row level security;
alter table public.item_location enable row level security;
alter table public.file enable row level security;
alter table public.log enable row level security;

revoke all on table public.household from anon, authenticated;
revoke all on table public.profile from anon, authenticated;
revoke all on table public.room from anon, authenticated;
revoke all on table public.storage_location_l2 from anon, authenticated;
revoke all on table public.storage_location_l3 from anon, authenticated;
revoke all on table public.category from anon, authenticated;
revoke all on table public.item from anon, authenticated;
revoke all on table public.item_location from anon, authenticated;
revoke all on table public.file from anon, authenticated;
revoke all on table public.log from anon, authenticated;

insert into public.category (
  key,
  nazwa,
  czy_systemowa,
  widoczna_dla_dzieci
)
values
  ('medicines', 'Leki', true, false),
  ('food', 'Żywność', true, true),
  ('documents', 'Dokumenty', true, false),
  ('winter_clothes', 'Ubrania zimowe', true, true),
  ('electronics', 'Elektronika', true, true),
  ('tools', 'Narzędzia', true, true),
  ('books', 'Książki', true, true),
  ('spare_parts', 'Części zapasowe', true, true);

