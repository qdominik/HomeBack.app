# UI foundation resumed — 2026-10-04

## Baseline and preservation

- Branch: `ui/design-system-foundation-current`.
- Base: `origin/main` at `1ef89d03ec605ec2565efa0234fadb7bebfc9a95`, including merged PRs #60 and #88.
- Original worktree HEAD: `fe8dfc2`. Its six modified files and four untracked files were preserved verbatim in commit `ab13eb5` before merging main; no reset, clean or stash was used.
- Local main was not checked out elsewhere and had no unique commits. A dedicated `main-integration` worktree was created, verified clean and fast-forwarded to the base.
- Merge commit `dadf419` retains both the UI test entry and the security glob regression tests, Next 16.3.8, lockfile, local fast-glob adapter and overrides from #88. The only merge conflict was in the test script in `package.json`.
- Historical PR #56 remains open on `ui/design-system-foundation`; the current branch had no existing PR. This implementation replaces #56 without modifying that PR or deleting either branch.

## Reconstructed scope

The existing local diff contained Input, Select, LoadingState, their adoption in global search and Items filters, invalid-state CSS and static markup tests. Label, Field, ControlGroup, Section, FormActions and a separate ui-control.css were absent from the inspected worktrees and historical PR. They were implemented as small native helpers here. Badge already existed; it now also accepts native span attributes, className and ref.

Changed forms:

- Global search, rendered in the shared search dialog (and the DashboardItemSearch adapter): native controlled Input, explicit label, status/error descriptions, Section and FormActions. Existing search action, query state, race protection and type filtering remain intact.
- `/items` GET filters: search, category, room, furniture, storage space, status, added-time and date range. Existing URL synchronization, defaults, handlers, reset key and specialized styling remain intact.
- `/items` loading: shared LoadingState with polite status semantics.

The historical `/home` search no longer exists after unified search. It is intentionally not reintroduced. Item create/edit, auth, family, settings, dialogs, server actions, migrations and RLS are outside this adoption scope. Existing create/edit and permission regression tests still run in CI.

## Native and accessibility contracts

Input and Select forward all native props including name, controlled/uncontrolled values, handlers, required, disabled, ref and ARIA. The unstyled escape hatch retains the existing specialized filter geometry. Field supplies a matching control ID/label plus descriptions and error references; generated IDs are unique and absent messages do not create dangling references. ControlGroup is a native fieldset/legend, including native disabled behavior.

Control styles were extracted without a palette redesign. Controls have a minimum 44px height and min-width 0; invalid controls keep their error border on hover and an error focus ring. An explicit focus outline override preserves the original single focus ring after CSS extraction. Read-only and disabled controls use the muted surface. Motion preferences remain respected.

## Current verification

- `npm ci`: PASS from the current security lockfile; no dependency added.
- `npm audit`: PASS, 0 vulnerabilities.
- `npm run check:env` and `--example`: PASS.
- `npm run test:logic`: PASS, 367 compiled tests plus 12 glob adapter regression tests (379 total). Includes 8 UI contract tests for native prop/ref forwarding and Field associations.
- `npm run lint`: PASS, 0 errors. Existing unused-type warning in `src/lib/items/item-photo-ai/providers/groq.ts` remains outside scope.
- `npm run build`: PASS, Next 16.3.8 including TypeScript.
- `npx tsc --noEmit`: PASS.
- `git diff --check`: PASS.
- E2E test discovery: PASS. Added a specific integration test for native keyboard search/select, URL reset, descriptions of server errors and 390px/1440px geometry. CI retains six UI screenshots as `ui-foundation-screenshots`.
- Local Chromium primitive fixture: PASS at 390px and 1000px, using the actual production CSS and rendered Input/Select/Field/ControlGroup. Verified typing, Tab, ArrowDown, disabled fieldset, error hover border, 44px minimum controls, single visible focus ring and no horizontal overflow. Both screenshots were visually inspected. This fixture does not validate authenticated application data flows.

Local configuration contains only the existing local public Supabase URL/key and app URLs for `http://127.0.0.1:3101`. It is ignored; no AI/SMTP secrets were copied. The production bundle starts on that exact port. Local runtime is Node 24.19.0/npm 12.0.2; CI uses the pinned project runtime.

Supabase API (54321) and Mailpit (54324) were unavailable. No Docker/Supabase start, stop or reset was attempted. Local end-to-end save/data/permission checks are therefore deferred to the isolated CI services; historical PASS results are not evidence for this branch. CI and visual results will be recorded after the current run.

## Owner Preview checks

1. Desktop and phone: open the shared search dialog, type a query, submit with Enter, change object type and clear; check visible keyboard focus. In the native search input the first Escape clears text; the next closes the dialog and returns focus to the trigger.
2. Items: choose category/room/furniture and extra filters, set a custom date range, then clear. Verify that controls and results reset together and the mobile page does not overflow.
3. Save a disposable item and edit its location/name; verify persisted values after reload and the resulting search result. Confirm normal role restrictions still apply.
4. Check loading and controlled error messages, label activation, disabled controls and focus visibility. Preview uses its own test household; do not use production data.

No merge or manual Production deployment is authorized or performed.
