// Replay migrations against a schema-only copy in an already-running local
// Supabase container. Never resets/stops Supabase or copies user data.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const container = process.env.INVITATION_TEST_CONTAINER ?? 'supabase_db_Homeback.app';
const database = 'homeback_roles_invites_test';
function docker(args, input) {
  const result = spawnSync('docker', ['exec', ...(input ? ['-i'] : []), container, ...args],
    { input, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || 'Docker command failed');
  return result.stdout;
}
function sql(input) {
  return docker(['psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database, '-At'], input);
}
// createdb deliberately fails if this named database already exists.
docker(['createdb', '-U', 'postgres', database]);
const schema = docker(['pg_dump', '--schema-only', '-U', 'postgres', '-d', 'postgres']);
docker(['psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', database], schema);
sql('drop schema public cascade; create schema public; grant usage on schema public to anon, authenticated, service_role;');
const migrations = readdirSync('supabase/migrations').filter(x => x.endsWith('.sql')).sort();
for (const name of migrations) {
  if (name.startsWith('0024')) {
    sql(`insert into auth.users(id,email,email_confirmed_at) values ('93000000-0000-0000-0000-000000000001','migration@invites.test',now());
      insert into public.household(id,nazwa,typ) values ('94000000-0000-0000-0000-000000000001','Migration preservation','dom');
      insert into public.profile(id,household_id,imie,email,rola,status,avatar_url)
      values ('93000000-0000-0000-0000-000000000001','94000000-0000-0000-0000-000000000001','Existing adult','migration@invites.test','domownik','aktywny','https://example.test/avatar');
      create table public.invitation_migration_snapshot as select to_jsonb(p)-'rola' as fields,
        (select oid from pg_enum where enumtypid='public.profile_role'::regtype and enumlabel='domownik') as enum_oid from public.profile p;`);
  }
  sql(`begin;\n${readFileSync(`supabase/migrations/${name}`, 'utf8')}\ncommit;`);
}
const preserved = sql(`create extension if not exists pgtap with schema extensions;
  begin; set search_path=extensions,public;
  select plan(3);
  select is((select rola::text from public.profile where id='93000000-0000-0000-0000-000000000001'),'dorosły','existing member role is migrated');
  select is((select count(*)::int from public.profile p join public.invitation_migration_snapshot s on s.fields=to_jsonb(p)-'rola'),1,'all existing profile fields are preserved');
  select is((select oid from pg_enum where enumtypid='public.profile_role'::regtype and enumlabel='dorosły'),(select enum_oid from public.invitation_migration_snapshot),'existing enum OID is preserved');
  select * from finish(); rollback;`);
console.log(preserved.trim());
if (/not ok|Looks like you failed/.test(preserved)) throw new Error('Existing profile fields or enum OID changed during migration');
sql(`delete from public.profile where id='93000000-0000-0000-0000-000000000001';
  delete from public.household where id='94000000-0000-0000-0000-000000000001';
  delete from auth.users where id='93000000-0000-0000-0000-000000000001'; drop table public.invitation_migration_snapshot;`);
console.log('PASS: all migrations replayed; existing profile fields and role enum OID preserved.');
console.log(`Test URL: postgresql://postgres:postgres@127.0.0.1:54322/${database}`);
console.log(`Cleanup after tests: docker exec ${container} dropdb -U postgres ${database}`);
