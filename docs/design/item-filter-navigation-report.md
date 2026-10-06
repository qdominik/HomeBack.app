# Items filter navigation — PR #89 follow-up, 2026-10-06

## Raport zmiany

### Zmieniono

The existing Items filter handler built every router.replace from the committed
window.location.search. A second choice made before the first navigation
completed therefore discarded the first choice. This handler predates the UI
foundation; the defect is not described as a design-system regression.

The handler now composes changes synchronously from the latest intended query.
React useOptimistic within navigation transitions keeps the native controls and
filter chips on the same intended state. The form no longer remounts on each
server filter update, preserving keyboard focus and an unsubmitted search draft.
Settled external navigation reconciles the base; popstate immediately adopts
the history target. Next's installed navigation queue discards superseded
navigation responses, including Back/Forward. No timeout or debounce is used.

Reset, single-chip removal and native GET-form submission use the same intent
path. Select changes still replace history; submit and chip/reset links still
push history. Modified link clicks retain normal new-tab behavior. Search is
still applied on submit, including an empty q; date bounds are removed when
leaving the custom preset, and changing itemStatus still removes view.

### Pliki

- src/components/items/item-filters.tsx — intended query, optimistic native
  controls/chips, reset/remove/submit/history synchronization.
- tests/e2e/item-filter-navigation.spec.ts and playwright.config.ts — response
  barrier regression coverage in the existing E2E workflow.
- package-lock.json — compatible transitive patches needed for the unchanged
  npm audit CI gate; no package.json or environment configuration change.
- docs/decisions/dependency-security-updates-2026-10.md — patch rationale.

### Zgodność z MVP

Tak. Existing Inventory filters only; no new feature, route or dependency.

### Baza danych

Brak zmian. No hosted database operation, migration, grant or RLS change.
E2E creates its usual disposable fixture in CI's isolated local services only.

### Bezpieczeństwo

Authorization, household scope and server filtering are unchanged. The original
response-barrier commit also exposed two freshly reported transitive dependency
advisories in npm audit; only compatible sharp/source-map-js patches are applied.
No audit threshold is relaxed. Preview QA must use Jan Testowy / Testowy Dom in
homeback-preview (yzewupqxkefyvljnfolk), with owner-entered authentication.

### Test

1. First committed the response-barrier regression independently as 6bf33d4,
   while leaving the defective component unchanged. Its separate CI run is
   https://github.com/qdominik/HomeBack.app/actions/runs/37497594988 . The final
   run reproduced six filter failures: both orders on desktop/mobile, repeated
   selection and chip removal. The newer request lacked the earlier parameter
   (received null), confirming the race independently of the npm audit failure.
   Reset passed; one unrelated icon-catalog test passed on retry. The final
   PR description and QA report record the fixed run separately.
2. The barrier fetches and holds the first RSC response until the newer user
   choice commits, then releases the obsolete response. Assertions inspect
   the newer request, both URL parameters, native values, filter chips,
   household fixture results and the same state after reload. It does not
   rely on sleeps or network speed.
3. Covers category/room in both orders at 1440px and 390px, repeated room choice,
   reset while pending, chip removal, a preserved search draft and submission,
   date bounds/preset cleanup, and Back/Forward while pending.
4. Run full logic tests, lint, build/TypeScript, environment contract, npm audit
   and whitespace checks. CI validates the pinned runtime, clean install,
   default Turbopack build, all E2E, pgTAP and invitation checks. Local hosted
   Supabase lifecycle commands are prohibited and not used.
5. Preview acceptance follows the new SHA/deployment and an owner login; it is
   separate from automated isolated-fixture coverage. Passing this scope does
   not establish whole-application acceptance or physical mobile coverage.

### Wymaga decyzji

No new product or data-model decision. No merge or Production deployment.
Final CI and Preview acceptance remain explicitly recorded in the PR and the
external QA report for the delivered SHA.
