# M4D.2 - location dependency summary before deletion

Date: 2026-07-14
Status: Zaimplementowano, utwardzono testami i zaakceptowano technicznie.

## 1. Current state

Stable baseline is `db9dfa5` with tag `m4-items-creation-layout-stable`.
M4D.1 provides the `all`, `unlocated`, and `archived` item views. It does not
change location data.

Current locations form one strict hierarchy:

```text
household -> room (L1) -> storage_location_l2 (L2) -> storage_location_l3 (L3)
item -> item_location -> storage_location_l3
```

`room` owns `household_id`. L2 and L3 inherit household scope through their
parents. `item` owns `household_id`. `item_location` has only `item_id`,
`storage_location_l3_id`, and `czy_glowna`; it has no room or L2 reference.

Consequences confirmed from the schema:

- an Item can be assigned directly only to L3;
- direct assignments to L1 and L2 cannot exist in the current model;
- a partial unique index permits at most one primary location per Item, but
  non-primary `item_location` rows can still exist;
- deletion of L3 is blocked by any `item_location` row, primary or not;
- deletion of L2 and L1 is blocked by child foreign keys;
- existing Home server actions only delete an empty direct child scope;
- `set_item_primary_location` is the existing `security invoker` reference
  RPC for an atomic single-Item location change.

## 2. Problem

Before a future deletion of L1, L2, or L3, an administrator needs a read-only,
exact, household-isolated summary of the structural descendants and the Items
whose location links block deletion. The summary must not itself delete,
detach, move, archive, or update data.

The existing count checks in `deleteRoom`, `deleteStorageLocationL2`, and
`deleteStorageLocationL3` are insufficient for the later stepped deletion
flow: they return only a binary error and cannot distinguish descendants,
unique Items, archived Items, or non-primary blocking links.

## 3. Goals and non-goals

M4D.2 will prepare a read contract for a future dialog. It will:

- resolve an L1, L2, or L3 only within the active household;
- return structural counts and location-link counts;
- return distinct active and archived Item counts;
- state whether current direct deletion is possible and whether a future
  operation must resolve Item locations;
- be available only to an active household administrator;
- preserve RLS and household isolation.

M4D.2 will not:

- delete L1, L2, L3, `item_location`, or `item` records;
- detach or move Items;
- modify existing deletion actions;
- add a deletion dialog, route, filter, field, table, or dependency;
- implement M4D.3, M4D.4, M4D.5+, M4B, M4C, or M4UX.2.

## 4. Existing security model

RLS is enabled for all relevant tables. Current select policies scope L1 by
`current_household_id()` and scope L2/L3 through their parent chain.
`item_location` select is scoped through `item.household_id`. Writes to
structure, Item, and Item location records require
`is_household_admin(...)`.

The project uses:

- `current_household_id()` only for an active profile;
- `current_profile_role()` only for an active profile;
- `is_household_admin(household_id)` for admin authority;
- authenticated Supabase clients, never a service role, from server actions.

Recommendation: the dependency summary is admin-only. It exists solely to
support a destructive workflow that only admins may complete. Giving counts to
other roles adds no approved workflow and needlessly exposes deletion-scope
metadata.

## 5. Architecture options

### Option A - Supabase queries in a server action

A server action resolves the target, loads descendants, loads links, and
aggregates in TypeScript.

- Security: table RLS applies, and the action can check the role.
- Atomicity: no single database snapshot across several round-trips.
- Round-trips: at least three to five queries by entity level.
- Testing: unit tests are straightforward; pgTAP cannot test aggregation logic
  implemented in TypeScript.
- Race conditions: a child or link may change between reads.
- Extension cost: M4D.3/M4D.4 still need database-side revalidation and would
  duplicate scope logic.

Verdict: reject. It is acceptable for a display-only list, not for a summary
that precedes a destructive operation.

### Option B - one generic SQL RPC

One RPC receives `entity_type` plus `entity_id` and returns one common row.

- Security: can use `security invoker` and explicit active-admin checks.
- Atomicity: one SQL statement obtains one MVCC statement snapshot.
- Round-trips: one database RPC.
- Testing: strong pgTAP coverage is possible.
- Race conditions: summary can still become stale before a later write, but
  later M4D operations can rerun the same scope logic transactionally.
- Extension cost: compact public surface, but a client-controlled entity type
  becomes another validation and error-mapping boundary.

Verdict: workable, but less explicit and easier to misuse from a future UI.

### Option C - three narrow SQL RPCs for L1, L2, and L3

Three public RPCs each accept only a UUID for their own entity level and return
the same summary shape:

- `get_room_location_dependency_summary(p_room_id uuid)`;
- `get_storage_location_l2_dependency_summary(p_storage_location_l2_id uuid)`;
- `get_storage_location_l3_dependency_summary(p_storage_location_l3_id uuid)`.

- Security: each function checks authentication, active household, and admin
  role before resolving a target; no client-supplied entity type is trusted.
- Atomicity: each summary uses one SQL statement / statement snapshot.
- Round-trips: one RPC after the server action dispatches the known level.
- Testing: direct, isolated pgTAP cases for every hierarchy level.
- Race conditions: the answer is advisory; later write stages must recalculate
  inside their own transaction.
- Extension cost: the scope queries can be reused conceptually by M4D.3/M4D.4
  without enlarging a generic public contract.

Verdict: recommended.

## 6. Recommended solution

M4D.2 should add the three `security invoker` read-only RPCs above in one
approved migration. A small server action may expose a closed runtime union
`room | storage | position`, validate a UUID before calling Supabase, and map
RPC errors to one UI-safe result. The browser must not call a generic SQL RPC
with arbitrary entity type or household ID.

The three functions should use the same query pattern:

1. require `auth.uid()`;
2. resolve `current_household_id()` and reject a missing active profile;
3. require `is_household_admin(current_household_id())` before target lookup;
4. resolve the target through the correct parent path and require its household
   to equal the current household;
5. create a `scoped_positions` CTE with exactly the L3 IDs covered by the
   target;
6. create `scoped_links` from every `item_location` pointing to those L3 IDs;
7. join Items only through `item_id` and aggregate from that relation;
8. return one summary row without writing data.

The functions must use `COUNT(DISTINCT item_id)` for Item counts and separate
plain link counts. This avoids double-counting one Item linked to more than one
position in the scope, while still reporting all rows that would block a
foreign-key deletion.

No transaction or lock is needed for the read itself beyond its one-statement
snapshot. The summary must not be treated as an authorization or concurrency
token. M4D.3/M4D.4 must re-resolve scope and links inside their own atomic
write transaction.

## 7. Proposed data contract

The SQL RPCs should each return one row with this stable shape. Names remain
proposed until migration review.

```ts
type LocationDependencySummary = {
  entityType: "room" | "storage" | "position";
  entityId: string;
  storageCount: number;
  positionCount: number;

  // Distinct Items, grouped by Item.status.
  activeDirectItemsCount: number;
  activeNestedItemsCount: number;
  activeItemsCount: number;
  archivedDirectItemsCount: number;
  archivedNestedItemsCount: number;
  archivedItemsCount: number;
  totalDistinctItemsCount: number;

  // Rows that currently block L3 deletion by foreign key.
  primaryLocationLinksCount: number;
  nonPrimaryLocationLinksCount: number;
  totalLocationLinksCount: number;

  requiresItemResolution: boolean;
  requiresSubtreeDeletion: boolean;
  canDeleteImmediately: boolean;
};
```

Interpretation by level:

| Level | storageCount | positionCount | direct Item count | nested Item count |
|---|---:|---:|---:|---:|
| room | direct L2 count | all descendant L3 count | always 0 | distinct Items on descendant L3 |
| storage | 0 | direct L3 count | always 0 | distinct Items on descendant L3 |
| position | 0 | 0 | distinct Items linked to this L3 | 0 |

`activeItemsCount` and `archivedItemsCount` are the sums of their direct and
nested values. `totalDistinctItemsCount` is distinct across the complete
scope, not the arithmetic sum of repeated per-position counts.

`requiresItemResolution` is true when `totalLocationLinksCount > 0`.
`requiresSubtreeDeletion` is true for a room with L2 descendants or an L2 with
L3 descendants. `canDeleteImmediately` means the current direct deletion
action can succeed without a later M4D decision: no descendants and no
location links. It is therefore normally possible only for an empty L3, empty
L2, or empty room.

The contract intentionally returns both distinct Item and link counts. A
non-primary historical link can block deletion even when the Item already has
another primary location.

### Server-action result

The future server action should return a discriminated result, not raw database
errors:

```ts
type LocationDependencySummaryResult =
  | { ok: true; summary: LocationDependencySummary }
  | {
      ok: false;
      code:
        | "invalid_location_id"
        | "auth_required"
        | "active_profile_required"
        | "admin_required"
        | "location_not_available"
        | "summary_unavailable";
    };
```

Input is `{ entityType, entityId }`, where `entityType` is parsed through a
closed allowlist in the server action and `entityId` is validated as a UUID.
The active household is always discovered server-side; it is never accepted
from the browser.

The UI maps `location_not_available` for both non-existent and foreign targets
to one message. This avoids a household-existence leak. Database or unexpected
PostgREST errors map to `summary_unavailable` and are logged server-side only.

## 8. Archived and inconsistent data

Archived Items must be counted separately and included in
`totalDistinctItemsCount` and `totalLocationLinksCount`. An archived Item still
has an `item_location` row and therefore still blocks deletion by its foreign
key. Omitting it would produce a misleading safe-to-delete result.

Decision for M4D.3/M4D.4: archived Items are handled together with active
Items. Both types are dependencies, both may retain blocking
`item_location` rows, and future operations must include both in one atomic
workflow. The future UI will show active and archived counts separately and
will not offer a switch to omit archived Items. M4D.2 only reports both
counts; it changes no state.

No orphaned parent chain can be created through normal writes because the
foreign keys are restrictive. However, privileged historical imports could
have produced an Item-to-location household mismatch because the schema has no
cross-table household constraint. A `security invoker` summary must not expose
foreign rows hidden by RLS. If an unexpected FK failure occurs in a later
write stage, the UI returns a generic failure and the project should use a
separate admin data-repair plan. M4D.2 must not weaken RLS or use a service
role to inspect foreign data.

## 9. Future UI use only

M4D.2 does not add a dialog. M4D.5+ will request this contract immediately
after an admin chooses a deletion action and before presenting move, detach,
or cancel. It will display:

- L1: L2 count, L3 count, active Item count, archived Item count;
- L2: L3 count, active Item count, archived Item count;
- L3: active Item count and archived Item count;
- a neutral message when a new summary is needed after data changes.

The dialog must not infer safety from cached client state; it uses the returned
booleans and later destructive operations revalidate independently.

## 10. Test plan

### pgTAP

Add a dedicated `0008_location_dependency_summary.test.sql` after the approved
migration. Each test uses JWT claims for an active admin, adult member, child,
and a second household.

1. Empty room: `storageCount=0`, `positionCount=0`, all Item/link counts zero,
   `canDeleteImmediately=true`.
2. Room with one empty L2: `storageCount=1`, `positionCount=0`, no items,
   `requiresSubtreeDeletion=true`, `canDeleteImmediately=false`.
3. Full L1 -> L2 -> two L3 tree: correct L2/L3 counts and summary of all
   scoped links.
4. L3 Item: L3 direct count is one, nested count is zero.
5. L2 and L1 Item fields: direct counts remain zero because the schema cannot
   store direct L1/L2 assignments; nested count contains the L3-linked Item.
6. Same Item linked to two scoped positions: distinct Item count is one while
   total link count is two.
7. Mixed primary/non-primary links: primary and non-primary counts are
   separate and their sum is the blocker count.
8. Archived Item with a link: archived count and blocker count include it;
   summary is not safe to delete.
9. Item without a location: it is absent from all location summaries.
10. Other household target: return the same unavailable/not-found result as a
    missing target and reveal no counts.
11. Adult member and child: receive `ADMIN_REQUIRED` before any target detail.
12. Missing active profile and anonymous call: receive their explicit safe
    authorization errors.
13. Invalid UUID: server action rejects before RPC; direct RPC binding returns
    a database UUID-input error that is never exposed as UI detail.
14. Large scope: seed many L3 and links; returned counts remain exact and the
    query plan uses existing L2, L3, and item_location indexes.

### Logic tests

Add pure tests for the server-action result mapper and UI-ready labels:

- closed entity-type allowlist;
- UUID rejection;
- mapping every RPC error to a safe result;
- L1/L2 direct count is shown as zero or omitted from prose;
- active and archived counts remain distinct;
- no cached summary is treated as permission to write.

### Concurrency scenario

A pgTAP transaction alone cannot coordinate two independent sessions
reliably. Add an integration test or controlled two-session SQL harness during
M4D.3/M4D.4: fetch summary, modify one scoped link in another session, then
verify that the later write RPC recalculates and rejects or applies to the
current scope atomically. For M4D.2 the expected result is only a consistent
single-statement snapshot, never a reservation.

## 11. Anticipated files for implementation

The following list is a plan, not current changes:

- `supabase/migrations/0007_location_dependency_summary.sql`;
- `supabase/tests/0008_location_dependency_summary.test.sql`;
- `src/app/(app)/home/actions.ts` for a read-only dispatcher, only if the
  dialog needs a server-action boundary in the same stage;
- `src/lib/home/location-dependency-summary.ts` for runtime input validation,
  response types, and safe error mapping;
- `tests/unit/location-dependency-summary.test.ts`;
- `tsconfig.test.json` to include the new logic test;
- `src/lib/i18n/types.ts`, `src/lib/i18n/locales/pl.ts`, and
  `src/lib/i18n/locales/en.ts` only if UI-facing errors are introduced in
  M4D.2;
- `docs/decisions/milestone-04a-items-admin-crud.md` and this plan after the
  implementation review.

No table, column, relationship, RLS-policy, route, HTTP method, or dependency
change is planned for M4D.2. A migration is needed only to add the approved
read-only SQL functions and grants.

## 12. Implementation order

1. The archived-Item action decision for M4D.3/M4D.4 is already closed: both active and archived Items are included.
2. Draft migration with three security-invoker read RPCs, explicit auth/profile/
   admin checks, revokes, and `authenticated` grants.
3. Add pgTAP fixture data for L1/L2/L3, active/archived Items, and multiple
   links for one Item.
4. Add the functions and execute database reset plus pgTAP tests.
5. Add a read-only server-action dispatcher and pure TypeScript mapper only if
   an approved UI consumer is part of M4D.2.
6. Add logic tests and i18n only for returned result codes.
7. Run `supabase db reset`, `supabase test db`, `npm run test:logic`, lint,
   build, and audit as appropriate.
8. Do not alter existing deletion actions until a separately approved M4D.3+
   stage.

## 13. Risks and mitigations

- Stale summary: later write RPCs must recalculate scope transactionally.
- Double counting: use distinct Item IDs and separate link counts.
- Hidden archived blockers: return archived counts separately and include all
  links in deletion safety.
- Cross-household inference: admin check precedes target resolution and foreign
  or missing targets share one UI result.
- Client misuse: no household input; closed entity type dispatch; UUID checks.
- Legacy inconsistency: no foreign-row inspection or service role in M4D.2;
  handle repair only in a separate approved plan.
- Performance: use one scoped CTE query and existing indexes; measure the
  large-scope test before considering new indexes.

## 14. Acceptance criteria

M4D.2 is complete only when:

- each L1/L2/L3 RPC returns exact counts for its scope;
- a normal user cannot learn a foreign household summary;
- only an active admin receives a summary;
- archived and non-primary links cannot be hidden from deletion safety;
- one Item is never double-counted across scoped locations;
- no read operation changes any row;
- pgTAP and logic tests cover the cases above;
- M4D.3/M4D.4 remain unimplemented.

## 15. Ready implementation prompt

```text
Implement only M4D.2 from docs/decisions/m4d-2-location-dependency-summary-plan.md.

First read AGENTS.md, the product spec, the M4D plan, migrations 0001, 0002,
0005, Home actions, and existing pgTAP tests. Keep the current checkpoint
clean and do not start M4D.3, M4D.4, M4D.5+, M4B, M4C, or M4UX.2.

Add only the read-only dependency-summary layer described in the plan:
three narrow security-invoker RPCs for room, L2, and L3; explicit auth,
active-profile, active-admin, UUID, and household checks; safe no-leak errors;
and exact structural, distinct-Item, archived-Item, primary-link, and
non-primary-link counts. Do not accept household ID from the client. Do not
trust a client entity type in SQL. Do not use a service role. Do not change
RLS policies, tables, columns, relations, routes, HTTP methods, or existing
delete actions.

Add pgTAP and logic tests from the plan, update i18n only if the read result is
exposed by a server action, and update decision documentation. Run db reset,
database tests, logic tests, lint, build, and audit. Report every changed file,
security decision, test result, and any remaining owner decision about archived
Items. Do not commit or tag unless explicitly asked.
```

## 16. Implementation result

Status: Zaimplementowano, utwardzono testami i zaakceptowano technicznie.

Implemented RPCs:

- `get_room_location_dependency_summary(p_room_id uuid)`;
- `get_storage_location_l2_dependency_summary(p_storage_location_l2_id uuid)`;
- `get_storage_location_l3_dependency_summary(p_storage_location_l3_id uuid)`.

All three functions are `stable security invoker`, accept no household ID,
use the active profile household, require an active administrator, and map a
missing or foreign target to the same `LOCATION_NOT_AVAILABLE` database
error. Execute permission is revoked from `public` and granted only to
`authenticated`.

The application contract is `LocationDependencySummary` from
`src/lib/home/location-dependency-summary.ts`. It preserves the exact fields
approved in section 7 and separates distinct active/archived Items from primary
and non-primary `item_location` row counts. The read-only server dispatcher
validates the closed entity type and UUID, selects one explicit RPC, and maps
database errors to the approved safe result codes. It is not connected to any
visible UI or deletion action.

Created or updated files:

- `supabase/migrations/0007_location_dependency_summary.sql`;
- `supabase/tests/0009_location_dependency_summary.test.sql`;
- `src/lib/home/location-dependency-summary.ts`;
- `src/app/(app)/home/actions.ts`;
- `src/types/database.ts`;
- `tests/unit/location-dependency-summary.test.ts`;
- `tsconfig.test.json`;
- `package.json`;
- `docs/decisions/m4d-2-location-dependency-summary-plan.md`;
- `docs/decisions/decision-log.md`.

Implementation decisions:

- existing RLS policies are sufficient and remain unchanged;
- existing indexes cover every parent and location-link join, so no index was
  added;
- active Items are every status other than `archiwalne`;
- Item counts use `COUNT(DISTINCT item_id)`, while blocker counts use all
  matching `item_location` rows;
- L1 and L2 direct Item counts stay zero because the schema supports assignment
  only to L3;
- no i18n entry was added because M4D.2 has no visible UI.

Verification:

- local Supabase stop/start: passed;
- `supabase db reset`: passed with migration 0007;
- supabase test db: 207 tests passed across 9 files, including explicit PUBLIC/anon/authenticated execute grants, safe missing-versus-foreign L2/L3 errors, and an inactive administrator;
- npm run test:logic: 53/53 passed, including cross-field aggregate and entity-level invariant rejection for the RPC response mapper;
- `npm run lint`: passed;
- `npm run build`: passed after narrowing the error-mapper return type;
- no deletion, detach, move, archive, dialog, route, HTTP method, or UI change
  was implemented.

Difference from the approved plan: the pgTAP file is numbered `0009`, because
`0008_system_other_category.test.sql` already existed. The approved public
contract and security architecture did not change.
