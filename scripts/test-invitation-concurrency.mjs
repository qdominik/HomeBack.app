// Real independent PostgreSQL sessions, with pgTAP assertions on their results.
// Requires scripts/prepare-invitation-test-db.mjs; never uses the user's database.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const container = process.env.INVITATION_TEST_CONTAINER ?? 'supabase_db_Homeback.app';
const database = 'homeback_roles_invites_test';
function query(input, user = 'postgres', onData) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', ['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1',
      '-U', user, '-d', database, '-At']);
    let stdout = ''; let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; onData?.(stdout); });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => resolve({ code, stdout, stderr }));
    child.stdin.end(input);
  });
}
async function checked(sql, user) {
  const result = await query(sql, user);
  assert.equal(result.code, 0, 'Fixture or assertion query failed');
  return result.stdout.trim();
}
const actor = '95000000-0000-0000-0000-000000000001';
const household = '96000000-0000-0000-0000-000000000001';
const householdB = '96000000-0000-0000-0000-000000000002';
const claims = id => `set local role authenticated; set local "request.jwt.claims"='{"sub":"${id}","role":"authenticated"}';`;
async function race(id, first, second) {
  let ready;
  const started = new Promise(resolve => { ready = resolve; });
  const firstCall = query(`begin; ${claims(id)} select ${first}; select 'INVITATION_RACE_READY'; select pg_sleep(3); commit;`, 'postgres',
    output => { if (output.includes('INVITATION_RACE_READY')) ready(); });
  // If the winner fails, reject immediately instead of waiting indefinitely.
  await Promise.race([started, firstCall.then(r => { throw new Error(`First concurrent operation failed (${r.code})`); })]);
  const secondCall = query(`begin; set local application_name='homeback_invite_race_loser'; ${claims(id)} select ${second}; commit;`);
  let blocked = false;
  for (let attempt = 0; attempt < 15; attempt++) {
    blocked = (await checked("select exists(select 1 from pg_stat_activity where application_name='homeback_invite_race_loser' and wait_event_type='Lock');")) === 't';
    if (blocked) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const [winner, loser] = await Promise.all([firstCall, secondCall]);
  assert.equal(blocked, true, 'Independent PostgreSQL sessions did not actually contend on a lock');
  assert.equal(winner.code, 0, 'First concurrent operation failed');
  assert.notEqual(loser.code, 0, 'Second concurrent operation unexpectedly succeeded');
  return loser.stderr;
}
try {
  await checked(`begin;
    insert into auth.users(id,email,email_confirmed_at) values
      ('${actor}','concurrency-admin@invites.test',now()),
      ('95000000-0000-0000-0000-000000000002','concurrency-join@invites.test',now()),
      ('95000000-0000-0000-0000-000000000003','concurrency-two@invites.test',now()),
      ('95000000-0000-0000-0000-000000000004','concurrency-onboard@invites.test',now());
    insert into public.household(id,nazwa,typ) values ('${household}','Concurrency A','dom'),('${householdB}','Concurrency B','dom');
    insert into public.profile(id,household_id,imie,email,rola,status) values ('${actor}','${household}','Admin','concurrency-admin@invites.test','admin','aktywny');
    insert into public.household_invitation(id,household_id,email,target_role,token_hash,created_by) values
      ('97000000-0000-0000-0000-000000000001','${household}','concurrency-join@invites.test','dorosły',extensions.digest(repeat('a',64),'sha256'),'${actor}'),
      ('97000000-0000-0000-0000-000000000002','${household}','concurrency-two@invites.test','dziecko',extensions.digest(repeat('b',64),'sha256'),'${actor}'),
      ('97000000-0000-0000-0000-000000000003','${householdB}','concurrency-two@invites.test','dorosły',extensions.digest(repeat('c',64),'sha256'),'${actor}'),
      ('97000000-0000-0000-0000-000000000004','${household}','concurrency-onboard@invites.test','dorosły',extensions.digest(repeat('d',64),'sha256'),'${actor}');
    commit;`);
  const same = await race('95000000-0000-0000-0000-000000000002',
    "public.accept_household_invitation(repeat('a',64),'Concurrent adult')",
    "public.accept_household_invitation(repeat('a',64),'Concurrent adult')");
  assert.match(same, /INVITATION_INVALID/, 'Reused token did not produce controlled rejection');
  const alternative = await race('95000000-0000-0000-0000-000000000003',
    "public.accept_household_invitation(repeat('b',64),'Concurrent child')",
    "public.accept_household_invitation(repeat('c',64),'Concurrent child')");
  assert.match(alternative, /INVITATION_INVALID/, 'Alternative invitation was not revoked');
  const onboarding = await race('95000000-0000-0000-0000-000000000004',
    "public.accept_household_invitation(repeat('d',64),'Concurrent onboard')",
    "public.create_household_with_admin('Forbidden second household','dom','Concurrent onboard')");
  assert.match(onboarding, /PROFILE_ALREADY_EXISTS/, 'Onboarding did not reject existing membership');
  const tap = await checked(`begin;
    set search_path=extensions,public;
    select plan(7);
    select is((select count(*)::int from public.profile where id='95000000-0000-0000-0000-000000000002'),1,'concurrent same-token acceptance creates one profile');
    select is((select count(*)::int from public.household_invitation_event where invitation_id='97000000-0000-0000-0000-000000000001' and event='accepted'),1,'concurrent acceptance creates one audit event');
    select is((select status from public.household_invitation where id='97000000-0000-0000-0000-000000000001'),'accepted','winner commits accepted state');
    select is((select household_id from public.profile where id='95000000-0000-0000-0000-000000000003'),'${household}'::uuid,'concurrent alternative tokens produce one household');
    select is((select status from public.household_invitation where id='97000000-0000-0000-0000-000000000003'),'revoked','concurrent alternative invitation is revoked');
    select is((select rola::text from public.profile where id='95000000-0000-0000-0000-000000000003'),'dziecko','concurrent child acceptance assigns requested role');
    select is((select count(*)::int from public.household where nazwa='Forbidden second household'),0,'concurrent onboarding creates no orphan household');
    select * from finish(); rollback;`);
  console.log(tap);
  assert.doesNotMatch(tap, /not ok|Looks like you failed/);
  console.log('PASS: same token, alternative-household tokens, and acceptance/onboarding races.');
} finally {
  // Privileged fixture cleanup is confined to the dedicated disposable database.
  await checked(`begin; set local session_replication_role=replica;
    delete from public.household_invitation_event where household_id in ('${household}','${householdB}');
    delete from public.household_invitation where household_id in ('${household}','${householdB}');
    delete from public.profile where household_id in ('${household}','${householdB}');
    delete from public.household where id in ('${household}','${householdB}');
    delete from auth.users where id in ('${actor}','95000000-0000-0000-0000-000000000002','95000000-0000-0000-0000-000000000003','95000000-0000-0000-0000-000000000004');
    commit;`, 'supabase_admin');
}
