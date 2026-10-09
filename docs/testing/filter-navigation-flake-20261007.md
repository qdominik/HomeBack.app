# Filter navigation flake investigation

Base: `264d1358e948e50b81b88215fdd9502988de3f2f` (main after #73).

## Observed failures

- [PR #71 CI](https://github.com/qdominik/HomeBack.app/actions/runs/37514255612/job/112442991006), head `57605a7069478bf6ed53f389c0bd596799adf576`: `Delayed item navigation preserves both rapid filters (desktop, category-room)` failed its first attempt because the second request omitted `category`; the retry passed. Summary: 49 passed, 1 flaky, 3 skipped.
- [Main after #73](https://github.com/qdominik/HomeBack.app/actions/runs/37652974938/job/112900809230), head `264d1358e948e50b81b88215fdd9502988de3f2f`: `Latest repeated filter choice survives a pending navigation` failed its first attempt because the final URL had `category: null` after room Kitchen -> Salon. The unchanged 10-second assertion timed out; the retry passed. Summary: 49 passed, 1 flaky, 3 skipped. The separate invitations-disabled pass passed once without retry.

Both workflows reported success despite a failed first attempt. They did not publish the failed trace because diagnostics upload required `failure()`. The subsequent kill-switch pass also reused and cleared the default results directory. Historical traces cannot be recovered from the published artifacts, so the exact scheduling of those two runs remains unavailable.

## Reproduction and setup checks

Before changing the application, local tests used the already-running local Supabase and Mailpit, without starting/stopping/resetting services or accessing hosted data:

- Unchanged failing case: 5 repeats, retries 0, 5 passed.
- Both affected cases (with new category preparation checks in the repeated-room case): 10 repeats each, retries 0, 20 passed. These passing runs do not disprove an intermittent race.

Local runtime was Node 24.19.0 / npm 12.0.2; installed React 19.2.8, Next 16.3.8 and Playwright 1.63.0 match the lockfile. The final CI separately verifies the repository's pinned Node 24.18.0 / npm 11.16.0.

The response barrier now identifies its captured request. Tests check the initial empty controls and verify that the first held request belongs to the selected filter. The repeated-room case additionally checks the category value and React-rendered category chip before Kitchen -> Salon. These are assertions about preparation, not sleeps or a substitute for the original rapid sequence. The original response barrier and final URL, control, item and reload assertions remain.

## Cause and scope

The component writes the intended query synchronously before calling `startTransition`. Its passive reconciliation effect captures `committedSearch` and `isPending` from a prior render. If that effect runs after the first change handler writes the category, it can replace the intended query with the old committed query. Later room changes then compose from an empty query, while the first category request remains valid.

A controlled regression uses the actual ItemFilters component and installed React/ReactDOM, with a suspended navigation and a first action before passive effects. It distinguishes an application lifecycle race from a missing category fixture or an action before React has handled the selection. Synchronizing the ref during the layout effect prevents a stale passive effect from erasing the first action; the existing `!isPending` guard still prevents intermediate routes from becoming the next action's base.

The harness substitutes Next's transport, Link and decorative icons, while using the real component, parsers, routes and React runtime. A parent layout effect dispatches the initial real change event before the child's passive effect. This controls the lifecycle ordering rather than reproducing the precise historical Next scheduling. The category DOM value, React-rendered chip and first category request are all verified before the two room changes. React documents the commit timing of [useLayoutEffect](https://react.dev/reference/react/useLayoutEffect) and the deferred timing of [useEffect](https://react.dev/reference/react/useEffect).

No Tailwind or SDK causal connection is established. No timeout/retry increases, sleeps, skips, assertion weakening, database/RLS changes or manual deployments are part of the fix. PRs #69 and #71 remain open for separate decisions.

## Verification

- Controlled regression against the unchanged main component: 1 failed (category missing from both room requests), 2 passed, retries 0. The first category request and category/chip preconditions passed before the failure. Reverting only the component reproduces this result in the integrated worktree too.
- Controlled regression with the layout effect: 3 passed; Team A then repeated all three cases five times, 15 passed, retries 0. Integrated worktree verification: another 3 passed, retries 0.
- All ten real navigation regressions after the fix: three repeats each, 30 passed, retries 0, no flaky outcomes or first-attempt failures.
- Diagnostic sanitizer: 6 Node tests passed, including viewer compatibility, credential exclusion, first-failure/retry accounting, trace association and fail-closed malformed input. Real before traces also passed sanitization and the pinned Playwright TraceLoader/TraceModel; all three traces remained associated with their test/attempt.
- ESLint for the changed code/config and TypeScript `--noEmit`: passed. No dependency/lockfile change.
- One initial local trace probe could not launch Chromium because the sandbox selected a different browser cache (3 launch errors, no test bodies executed). Re-running with the installed browser path produced the controlled 1-failed/2-passed result above; this was an environment correction, not a Playwright test retry.

Final-head CI is linked in the pull request and delivery report. Its full attempt summary, including first failures, is checked separately from job success.

## Retained diagnostics

CI now writes Playwright JSON results and sanitizes/uploads diagnostics after each E2E invocation even when a retry makes the job successful. The main-suite artifact is uploaded before the invitations kill-switch invocation can clear `test-results`. `attempts.json` records each retry index/status, aggregate first-attempt failures and flaky outcomes, and associates every retained trace with its test attempt. Infrastructure image/download retries are not counted as test retries.

The published ZIPs retain action timing and request URL/status metadata readable by the pinned trace viewer. They intentionally omit DOM snapshots, sources, bodies, cookies/headers, console, screenshots/video and binary resources. Credential-bearing URL fields, fragments, known environment values and the fixture password are removed or redacted. Sanitization fails closed and prevents upload on malformed/unsupported input; no raw Supabase status artifact is published. These restrictions limit visual inspection of authenticated pages but preserve navigation-order evidence without publishing credentials.
