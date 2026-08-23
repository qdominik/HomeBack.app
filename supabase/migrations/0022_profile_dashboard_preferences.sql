-- Faza 3: Personalizacja Dashboardu.
--
-- Per-user visibility preferences for Dashboard modules. One row per profile;
-- the absence of a row means "use registry defaults" (defaultVisible).
-- visible_modules stores known dashboard module keys; unknown keys are
-- ignored by the application layer, never written by the Server Action.
--
-- RLS:
-- RLS jest wlaczane od razu. Uzytkownik moze czytac i zapisywac wylacznie
-- wlasny wiersz (profil_id = auth.uid()). Anon nie otrzymuje dostepu.

create table public.profile_dashboard_preferences (
  profil_id uuid not null primary key references public.profile (id) on delete cascade,
  visible_modules text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_dashboard_preferences enable row level security;

revoke all on table public.profile_dashboard_preferences from anon, authenticated;

grant select, insert, update on table public.profile_dashboard_preferences to authenticated;

create policy dashboard_preferences_select_own
on public.profile_dashboard_preferences
for select
to authenticated
using (profil_id = auth.uid());

create policy dashboard_preferences_insert_own
on public.profile_dashboard_preferences
for insert
to authenticated
with check (profil_id = auth.uid());

create policy dashboard_preferences_update_own
on public.profile_dashboard_preferences
for update
to authenticated
using (profil_id = auth.uid())
with check (profil_id = auth.uid());

create trigger profile_dashboard_preferences_set_updated_at
before update on public.profile_dashboard_preferences
for each row execute function public.set_updated_at();
