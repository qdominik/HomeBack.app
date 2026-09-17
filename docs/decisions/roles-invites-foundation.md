# Roles & Invites — database foundation

Date: 2026-09-17. Status: approved scope from the owner's implementation request;
implementation remains subject to PR review. MVP module: Users & Roles.
This separate ADR does not modify the product-spec changes in reference PR #83.
The owner's current Team B assignment is Backend / Database / Security and
supersedes the older E2E-only team assignment in AGENTS.md for this request.

## Scope and implementation plan

Preserve `profile`, rename its existing member role, restrict raw profile access,
and add application invitations with transactional RPCs and security history.
Migration 0024 changes the enum label and replaces the existing `copy_item`
function and onboarding function. Migration 0025 creates invitations, their
events, role-aware reads and issuance/renewal/revocation/acceptance RPCs.
TypeScript role checks, dictionaries and fixtures must change together.
Existing item, category and structure permissions remain the same.

Validation covers all unit tests, pgTAP/RLS, populated migration replay,
independent concurrent PostgreSQL sessions, lint, typecheck, build and existing
E2E scenarios in CI. New schema/grants/RPCs are authorized by the owner's request;
no dependency or application route is added.

## One user, one household

`profile.id` remains the `auth.users.id` primary key and `household_id` remains
NOT NULL. A user without a profile has no membership; invitation issuance never
creates a placeholder profile. Acceptance creates the complete active profile.
Any existing profile, including an inactive one, blocks another acceptance.

This is deliberate MVP debt. Multi-household will require splitting personal
`user_profile` from `household_member`, and reviewing every dependent FK, RLS
helper, RPC and application query. That redesign is outside this PR.
The existing Polish profile status enum is retained; no member lifecycle or new
status field is required. The unused legacy `gość` enum value is retained to
avoid deleting or reclassifying existing data; no invitation can assign it.
Supported application roles are `admin`, `dorosły` and `dziecko`.

## Non-destructive role migration

`ALTER TYPE ... RENAME VALUE` preserves enum OIDs and every profile field.
Policies with already-parsed enum constants retain their meaning, including file
and photo visibility. The existing PL/pgSQL `copy_item` source must be replaced
because its old literal is parsed when the function executes. Applied historical
migrations are intentionally unchanged. Current fixtures and TypeScript use the
new label. A schema-only isolated database replay inserts a populated legacy
profile before migration 0024 and verifies its fields and enum OID afterward.

Deploy the database and matching application version together. Older application
versions that still check `domownik` are incompatible with the renamed value.
Rollback requires a reviewed forward migration plus the matching application
deployment; it must preserve and archive invitation history before removing any
foundation objects. Do not reset a live database.

## Membership privacy and RLS

Raw `profile` SELECT permits only the user's own record or an active
administrator's household records. Adults cannot fetch another member's email
through a direct table query. Children can fetch only their own raw record.
`get_household_members()` takes no caller-selected household: it derives the
active household from the current profile. Administrators receive names, avatars,
roles, emails, status and creation time. Adults receive names, avatars and roles;
email/status/creation-time columns are NULL. Children receive only their own row,
also with the administrative columns NULL. No account-authentication metadata is
joined or exposed.

Historical `log` rows with `typ_obiektu = 'PROFILE'` are administrator-only too:
their JSON before/after payloads may contain peer emails and administrative account
changes. Existing inventory/structure/category activity permissions are retained.

Table-level profile UPDATE and DELETE grants are removed. Only `imie` and
`avatar_url` updates remain available under the existing administrator RLS policy.
Clients cannot modify role, household, status, identity or email, including an
administrator changing their own membership. No new role-management operation
is added. The pre-existing last-admin trigger remains unchanged and unreachable
through direct client deletion/role mutation; this PR neither adds nor extends it.

Invitation metadata and event SELECT require an active administrator of the
invitation's household. No INSERT/UPDATE/DELETE is granted to clients. The
`token_hash` column has no authenticated SELECT grant; callers must select the
explicit metadata columns, never `SELECT *`. All new exposed RPCs require an
authenticated session, enforce their own role/household checks and use
`SECURITY DEFINER SET search_path = ''` with schema-qualified application objects.
PUBLIC and anon execution is revoked. The internal revocation helper is revoked
from authenticated as well. No service-role key or client bypass is introduced.

## Tokens, expiry and transitions

An invitation stores normalized `lower(btrim(email))`, household, target adult or
child role, `pending`/`accepted`/`revoked` status and a fixed 48-hour validity.
Expiry is derived: pending and `expires_at <= current time`; no expired status.
Issuance uses the existing pgcrypto extension: 32 cryptographically random bytes,
hex encoded, with only SHA-256 stored as bytea. A unique hash index identifies
tokens. High entropy makes password-style slow hashing unnecessary here.

`create_household_invitation(email, role)` returns `{invitation_id, token,
expires_at}` exactly once. `renew_household_invitation(id)` revokes the pending
predecessor, creates a fresh token and links `replaces_id`, all in one transaction.
Repeated issuance for a live normalized household/email pair is rejected rather
than redisclosing a token. Renewing a non-pending invitation is rejected.
`revoke_household_invitation(id)` rejects foreign or non-pending invitations.
No read or acceptance operation returns a token. A lost issuance response must
be recovered by renewal; the previous raw token cannot be retrieved.

These RPCs are database primitives. The future email adapter must call issuance
from an authenticated server context, consume its one-time response without
logging it, and send it to the selected delivery provider. Never log RPC request
bodies, token responses, acceptance URLs or SQL bind parameters containing tokens.
Use IDs and controlled error codes in diagnostics. No mail transport, token URL
route, browser storage, logging sink or UI is added in this PR. Application audit
rows contain neither the raw token nor its hash.

## Transactions and concurrency

`accept_household_invitation(token, imie)` checks the authenticated identity,
authoritative `auth.users.email_confirmed_at`, normalized current auth email,
hash match, pending state, real-time expiry, role allowlist and absence of any
existing profile. Incorrect email, token, state and expiry share the controlled
`INVITATION_INVALID` error. It does not trust JWT email or user-editable metadata.

Lock ordering is `auth.users` row (acceptance/onboarding), normalized email's
transaction advisory lock, then invitation row. Every invitation mutation shares
the email lock, including renewal, revocation and creation in other households.
Acceptance creates a complete profile, marks accepted, records acceptance and
revokes all other live pending invitations for that address in one transaction.
The existing onboarding RPC now locks the same auth row before checking for a
profile, preventing a race with joining an invitation.

A partial unique index on `(household_id,email) WHERE status='pending'` provides
a database backstop. A time predicate cannot be used in an immutable index;
issuance lazily revokes an expired predecessor with `expired_replaced` history
before inserting its successor. The email may have invitations in many
households until acceptance revokes alternatives. Expired alternatives may remain
pending because they are already unusable.

## Security history

The existing `log` requires its fixed object enum and has client write grants.
Invitation history therefore uses `household_invitation_event`, matching the
existing household/`profil_id`/timestamp convention but permitting only RPC writes.
It records creation, acceptance and revocation, with reasons for manual revocation,
renewal, expired replacement and alternative acceptance. All writes share the
mutation transaction. An audit insert failure rolls back profile creation and
invitation state changes, verified by pgTAP. Adults/children cannot read this
administrative history, including events in their own household.

## Validation and operating instructions

Local tests use an already-running Supabase container without restarting Docker,
starting/stopping Supabase or resetting the user's database:

1. `node scripts/prepare-invitation-test-db.mjs` creates only the dedicated
   `homeback_roles_invites_test` database, copies schema without user data, replays
   all migrations and checks populated role migration preservation. It fails if
   that database already exists. Container name can be overridden by
   `INVITATION_TEST_CONTAINER`.
2. `npx supabase test db --db-url postgresql://postgres:postgres@127.0.0.1:54322/homeback_roles_invites_test`
   runs the complete SQL suite, including roles, privacy, rejected tokens,
   transactional rollback and successful acceptance.
3. `node scripts/test-invitation-concurrency.mjs` runs independent sessions for
   same-token acceptance, alternative-household acceptance and joining versus
   onboarding, with pgTAP assertions. Elevated fixture cleanup is confined to
   this disposable database and happens after assertions.
4. Remove only this database after verification:
   `docker exec supabase_db_Homeback.app dropdb -U postgres homeback_roles_invites_test`.

CI starts its own ephemeral Supabase, runs the existing pgTAP suite, verifies
populated migration replay and the real concurrency tests. Its existing E2E job
tests the matching schema/application version. Local browser E2E should not use
an old shared database after the application role rename.

## Deferred decisions and next two PRs

1. **Member-list UI and invitation management — medium effort.** Consume the
   controlled directory and administrator metadata; add pending/expired labels,
   creation, revocation and renewal flows, PL/EN strings and role-based browser
   coverage. Resolve how issuance is presented until delivery is integrated,
   without persisting or logging token responses.
2. **Email, registration, login and complete acceptance flow — high effort.**
   Choose delivery provider, add server-only issuance delivery, invitation links,
   verification/signup/login return paths, acceptance page, controlled errors and
   end-to-end coverage across mail, authentication and membership creation.

Both are future PRs. Ownership versus administration, co-ownership, administrator
promotion/demotion/removal, last-administrator product rules, quorum, recovery
codes, member departure/suspension/removal/restoration, adult-child role changes,
account deletion and multi-household remain deferred. Inventory/category/structure
permission redesign, avatars and email-provider setup are also outside this PR.

## PostgreSQL references

- [ALTER TYPE / RENAME VALUE](https://www.postgresql.org/docs/current/sql-altertype.html)
- [Row and transaction advisory locks](https://www.postgresql.org/docs/current/explicit-locking.html)
- [pgcrypto random bytes and digest](https://www.postgresql.org/docs/current/pgcrypto.html)
