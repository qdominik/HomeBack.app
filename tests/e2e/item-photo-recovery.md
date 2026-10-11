# Item photo client regression (#91)

Run from the repository root:

```sh
npm ci
npx playwright install chromium
npm run test:e2e -- --config playwright.config.photo.ts
```

The ordinary `playwright.config.ts` also includes this spec, so the existing E2E
CI runs it. The standalone configuration does not start Next or Supabase.
Both configurations retain the existing timeouts. This spec uses **zero retries**,
including CI; successful user-triggered retries are asserted within each scenario.

The fixture bundles the current checkout's real `ItemForm`, location and submit
components, Next Image/Link, browser compression and production CSS using the
already installed Next webpack/TypeScript/PostCSS tooling. It substitutes only
the Server Actions module and serves on an ephemeral loopback port. It creates
no app route, account, database data or hosted object. Page errors and unexpected
outbound requests fail the tests. Its temporary files/server are released even
if setup fails. No external source override is accepted in the durable suite.

Each of these 13 scenarios runs at desktop 1440×900 and mobile 390×844:

| Scenario | Assertions |
| --- | --- |
| Thrown upload error | Safe message, values/existing photo retained, controls released, same file can be selected again; no cleanup of persisted photo |
| Returned upload error | Previous draft and exact hidden metadata retained; successful retry cleans only the previous draft |
| Thrown AI error | Safe message, fields/draft retained, controls released and a later analysis succeeds |
| Thrown draft cleanup error | Draft stays selected; retry removes only that draft and restores the original photo; persisted-photo removal only sets the form flag |
| Replacement cleanup failure | New draft stays selected with a warning; exact cleanup targets exclude the original photo |
| Thrown quick category error | Submitted category name and item fields retained; retry with `existing` selects that category |
| Weak suggestions | Manual name survives PL/EN placeholders, null and low/none confidence |
| Preview plus rollback exception | Real `uploadItemPhotoWithPreview` keeps the primary preview error; only its confirmed new path reaches rollback, existing photo remains |
| Corrupt large JPEG | Real browser decoding/compression fails safely before upload; previous draft/fields remain and valid retry succeeds |
| Late strong suggestion | Manual typing or intentional clearing while analysis is pending remains intact |
| Late upload | Newer photo wins; only the stale operation's own successful draft is cleaned |
| Late AI | Analysis of the old photo cannot fill the newer selection; a new analysis uses the new path |
| Successful client flow | Real canvas compression respects 750 KiB/1600 px, upload → analysis → form action passes matching metadata, no raw file in submit, no horizontal overflow |

The two race scenarios deliberately inject native file changes while the input
is disabled. They test the defensive run-id guard; normal user clicks are blocked
during the pending operation. Gates are explicitly released, without sleeps or
longer timeouts. Screenshots and synthetic action-call records are attached to
each successful test.

This is a **client integration regression**, not a test of Next Server Actions'
wire protocol, Supabase Storage, the AI provider, database persistence, RLS or
server photo finalization. Upload/AI/save responses are controlled fixtures;
the upload preview/rollback helper is real, with controlled storage callbacks.
Those server boundaries are covered by the existing logic/pgTAP tests and review,
to the extent stated in the review report. Do not interpret the 26 client passes
as a real Storage/AI/database end-to-end result.

Scope was agreed with Team A: only E2E spec/helpers/docs and Playwright configs,
without application, dependency, workflow, hosted data or configuration changes.
