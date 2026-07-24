# HomeBack.app Team Workstreams

## Shared rules

- main is the integration branch. Changes reach it only through a reviewed pull request.
- Teams use separate branches and Git worktrees. They do not share edits to production files.
- Team A owns local Supabase migrations, RLS, RPC, supabase db reset, and migration sequencing.
- Full E2E runs by Team B require an agreed time window because local Supabase and the development server are shared resources.
- A commit, branch push, pull request, merge, and stable tag are separate actions. Stable tags require automated checks and owner manual acceptance.

## Team A - Product development

- Scope: primary product development.
- Exclusive ownership: database schema, migrations, RLS, production RPC, and data-integrity server actions.
- Model: GPT-5.6 Sol.
- Effort: high or xhigh.
- Branch: assigned only after a specific M4D stage is formally approved.

## Team B - E2E regression

- Scope: Playwright and E2E regression coverage.
- Branch: test/e2e-regression-foundation.
- Model: GPT-5.6 Terra.
- Effort: high.
- Constraints: does not alter application behavior to make tests pass; coordinates full E2E execution with Team A.

## Team C - Accessibility and responsive audit

- Scope: accessibility and responsive design audit.
- Branch: audit/accessibility-responsive.
- Model: GPT-5.6 Terra.
- Effort: medium.
- First stage: audit report only; no production changes.

## Team D - Production readiness

- Scope: production analysis, security, CI proposal, rollback, and health checks.
- Branch: ops/production-readiness.
- Model: GPT-5.6 Terra.
- Effort: medium.
- First stage: readiness report and CI proposal only; no deployment or configuration changes.
- Restricted owner notes: must not read, modify, or delete docs/deploy-checklist.md and docs/services.md.

## Team E - Marketing site

- Scope: future, separate marketing-site repository.
- Status: not part of the current application repository.
