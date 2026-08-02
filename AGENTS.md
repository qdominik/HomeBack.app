# HomeBack.app Agent Notes

Read `docs/product/homebase-product-spec.md` before product or data changes.

Binding project constraints:

- MVP modules only: Inventory, Structure, Users & Roles, Dashboard, Knowledge Base, Categories, Settings.
- No AI, Home Assistant, QR/NFC features, Vault UI, payments, multi-household, 2D maps, or native mobile app in MVP.
- Every data read and write must respect `household_id` and RLS.
- Do not add dependencies, routes, tables, fields, relations, or RLS changes without the required decision record.
- UI translations use the local dictionary in `src/lib/i18n`; no i18n library is active in MVP.
- User-entered data must never be translated automatically.

This project uses a recent Next.js scaffold. Check installed package docs before relying on older framework conventions.
## Landing Page Separation

- The sales landing page is a separate project, not part of the HomeBack.app application.
- The landing page target is `https://homeback.app`; the product application target is `https://my.homeback.app`.
- Do not commit `landing-v201/` or future landing-page project folders into this app repository.
- Preferred structure: keep the landing page in its own repository, for example `HomeBack.landing`, with its own `package.json`, deployment, environment variables, and versioning.
- The HomeBack.app repository remains for the product application: auth, dashboard, Supabase, RLS, and MVP modules.
- If a temporary landing folder exists inside this workspace, treat it as a workbench only and add/keep it ignored before app commits.
- Commit landing-page changes in the landing repository, not in this application repository.

## Parallel Team Work

- main is the integration branch only. Agents do not work directly on main.
- Each team works in its own branch and Git worktree.
- Only Team A may modify supabase/migrations/**, supabase/policies/**, supabase/tests/**, src/types/database.ts, production RPC and RLS, and production server actions related to data integrity.
- Team B may modify only tests/e2e/**, playwright.config.*, E2E helper files, Playwright-specific package.json and lockfile changes, and E2E test documentation. It must not change application behavior merely to make a test pass.
- Team C may create only an accessibility and responsive audit report in its first stage.
- Team D may create only a production-readiness report and CI proposal in its first stage. It must not read, modify, or delete docs/deploy-checklist.md or docs/services.md.
- Before a commit, every agent shows git status --short, git diff --stat, git diff --name-only, git diff --cached --stat, and git diff --cached --name-only.
- git add ., git add -A, force push, and direct merges to main are prohibited.
- Commit, branch push, pull request, merge, and tag are separate operations. A stable tag is created only after tests and owner manual acceptance.

## Terminal and environment operations

Terminal usage is allowed for normal project work, including:

- Git inspection and standard branch operations,
- reading files,
- running logic tests,
- running lint and build,
- checking Supabase status,
- running database tests when Supabase is already available.

Agents must not independently:

- restart Docker Desktop or Docker Engine,
- start or stop Docker services,
- run `supabase start`,
- run `supabase stop`,
- run `supabase db reset`,
- perform system administration or ACL changes.

When one of these restricted operations is required, the agent must stop and ask the owner to execute it manually.

These restrictions do not prohibit normal terminal usage.
