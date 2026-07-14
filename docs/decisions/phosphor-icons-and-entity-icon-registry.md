# M4UX.1A/B - Phosphor Icons and entity icon registry

Date: 2026-07-14
Status: Implemented and accepted manually.

## Decision

HomeBack.app uses `@phosphor-icons/react` as the MVP icon family for the
interface pilot and for stable semantic entity icons.

Phosphor was chosen because it provides a broad household-friendly symbol set,
multiple weights, `currentColor` rendering, SSR/RSC exports and individual
exports that let the app avoid importing the whole icon catalog.

Installed package:

- `@phosphor-icons/react@2.1.10`

## Import strategy

Server Components use explicit SSR icon exports such as:

```ts
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
```

Client Components use explicit supported exports such as:

```ts
import { PlusIcon } from "@phosphor-icons/react/Plus";
```

The project does not use `import * as Icons`, string-based dynamic imports,
runtime package scans, barrel exports of the whole package or
`experimental.optimizePackageImports`.

## Icon standard

Icons render with `currentColor` and inherit color from the surrounding UI.

Size scale:

- 16 px for helper information;
- 18-20 px for actions;
- 20-24 px for cards and entity icons;
- 28-32 px for larger previews and empty states.

Weight scale:

- `regular` for information and entities;
- `bold` for compact actions;
- `duotone` for selected entity previews;
- `fill` only for rare active states.

Decorative icons use `aria-hidden="true"`. Text labels remain visible on
actions; icon-only buttons are outside this stage.

## Entity icons

Entity icons are different from interface icons. Interface icons describe an
action such as edit, add, archive or search. Entity icons describe a stored or
displayed domain object such as a room, category or item.

The database stores only stable semantic keys, never React component names,
SVG, JSX or package import paths.

Examples:

- `living-room`;
- `bedroom`;
- `kitchen`;
- `storage`;
- `food`;
- `documents`;
- `package`;
- `other`.

## Architecture

The registry is intentionally small and explicit.

Files:

- `src/lib/icons/entity-icon-definitions.ts` - stable keys, labels, groups and
  search terms without React imports;
- `src/lib/icons/entity-icon-validation.ts` - allowlist, normalization,
  fallback and search functions usable by server actions;
- `src/lib/icons/category-icon-map.ts` - system category key to entity icon key;
- `src/lib/icons/item-icon-resolution.ts` - item icon resolution prepared for a
  future item-level override;
- `src/lib/icons/home-structure-icons.ts` - storage and position display icons;
- `src/components/icons/entity-icon.tsx` - explicit Phosphor component mapping;
- `src/components/icons/entity-icon-picker.tsx` - room icon picker.

Fallbacks:

- room -> `room`;
- storage -> `storage`;
- position -> `position`;
- item -> `package`;
- category -> `other`;
- generic -> `generic`.

Unknown, empty or legacy values never break rendering.

## Room icon picker

The existing `room.ikona` text column stores the stable icon key.

The add and edit Room forms use a picker with:

- current icon preview;
- search input;
- small controlled icon grid;
- Polish and English search aliases;
- selected state;
- fallback `room` for unknown values.

The server action validates the submitted icon key through the shared allowlist
before writing to `room.ikona`.

## Items and categories

`item` has no persistent icon column in the current schema. This stage does not
add one. Item cards render a calculated icon:

1. future item-specific icon key, when a future schema supports it;
2. system category icon;
3. item fallback `package`.

This prepares a separate future stage:

- `M4UX.1C - individual item icons`.

`category` already has an optional `ikona` column. This stage does not add a
category picker. Category cards render a valid stored icon key when present;
otherwise system categories are mapped by `category.key`, while custom
categories use fallback `other`.

## Storage and positions

Storage L2 does not have a persistent icon column. Storage cards render an icon
derived from the storage kind, for example wardrobe, dresser, shelf, drawer or
box. Position L3 uses the generic `position` icon. Individual storage and
position icon pickers are future work.

## Impact

Database:

- no migrations;
- no table, column or relation changes;
- existing `room.ikona` is reused;
- existing `category.ikona` is rendered when it contains an allowed key.

Backend:

- room create and update actions validate icon keys;
- no service role;
- no RLS changes;
- no RPC changes;
- no new HTTP endpoints or methods.

Build:

- one dependency was added;
- all imports are explicit and controlled;
- the whole Phosphor catalog is not imported.

## Manual acceptance

1. Add a room, search for an icon by Polish name and choose it.
2. Save the room and confirm the card shows the selected icon.
3. Edit the room and confirm the current icon is selected.
4. Change the icon and save.
5. Confirm old or unknown `room.ikona` values fall back safely.
6. Confirm item cards show icons based on system category.
7. Confirm custom categories and `other` use a safe fallback.
8. Confirm actions retain visible text.
9. Confirm keyboard focus is visible in the room icon picker.
10. Confirm mobile width has no horizontal scroll.

The project owner manually accepted the complete scope, including the final
category-card action correction: `PencilSimpleLineIcon` for edit,
`TrashIcon` for delete, a hidden native `details` marker, visible action text,
`aria-hidden="true"` on decorative icons and 18 px action icons.

## Out of scope

This stage does not add:

- icon library to the logo;
- navigation-wide icon redesign;
- login/register icons;
- icons for every form field;
- full Phosphor explorer;
- item icon persistence;
- storage, position or category icon pickers;
- M4UX.2;
- M4D.2+;
- M4B;
- M4C;
- QR/NFC;
- photos;
- AI.
