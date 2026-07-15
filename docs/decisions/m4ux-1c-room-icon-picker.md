# M4UX.1C - compact Room icon picker

Date: 2026-07-15
Status: Zaimplementowano, przetestowano i zaakceptowano ręcznie.

## Decision

The Room form uses a compact, 56 px square icon control instead of a permanently
expanded icon grid. The control shows the selected semantic icon and its label;
its accessible button label explains that it changes the icon.

The picker opens a native modal `dialog`. It contains search and a bounded,
scrollable grid of 44 px-or-larger square icon buttons. The grid uses three
columns on mobile and grows to four and five columns at larger breakpoints.
The native dialog keeps focus in the open picker and supports Escape to close.

## Automatic suggestion

`src/lib/icons/room-icon-suggestion.ts` maps known Room kinds to existing
semantic keys in the entity icon registry:

- Salon -> `living-room`
- Sypialnia -> `bedroom`
- Pokój dziecka -> `child-room`
- Pokój gościnny -> bedroom
- Kuchnia -> `kitchen`
- Łazienka / WC -> `bathroom`
- Przedpokój -> `hallway`
- Biuro -> `office`
- Garaż -> `garage`
- Piwnica -> `basement`
- Balkon -> `balcony`
- other or unknown kinds -> `room`

The helper reuses `inferHomeKind` and its existing normalization, including
case, Polish diacritics, repeated spaces, and recognised aliases. New forms
start with the generic `room` icon and update their automatic suggestion while
the user edits the name or kind.

## Manual choice and editing

The create form explicitly tracks `automatic` versus `manual` icon selection.
Once the user chooses an icon in the picker, later name or kind changes do not
overwrite it. An existing Room opens in manual mode: its stored valid icon is
preserved, and a legacy or unknown value safely falls back to `room` until the
user picks a valid semantic key.

## Scope and verification

No database field, migration, RLS policy, RPC, server action, route, HTTP
method, item model, or icon registry strategy changed. `room.ikona` continues
to store only stable semantic keys.

Logic tests cover kind mapping, existing name inference, normalization, automatic updates, manual-selection protection, edit preservation, and legacy fallback. Verification passed: 57/57 logic tests, lint, build, and git diff --check.
