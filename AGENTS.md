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
