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
