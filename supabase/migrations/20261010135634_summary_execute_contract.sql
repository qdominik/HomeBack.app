-- Migration 0007 removes PostgreSQL's PUBLIC default but leaves direct anon
-- grants installed by Supabase's legacy default privileges. Make the existing
-- summary API contract explicit for databases created with either bootstrap.
revoke execute on function public.get_room_location_dependency_summary(uuid)
  from public, anon;
revoke execute on function public.get_storage_location_l2_dependency_summary(uuid)
  from public, anon;
revoke execute on function public.get_storage_location_l3_dependency_summary(uuid)
  from public, anon;
