# Feedback Alignment After Vibe Coding Review

**Date:** 2026-09-04
**Source:** Vibe Coding feedback PDF
**Status:** Documentation alignment branch

## What Was Aligned

- README no longer describes the current application as a ready Progressive Web App. The current status is a responsive web application; full PWA/offline support remains a separate implementation topic.
- README marks `Users` / `Osoby` and `Documents` / `Dokumenty` as planned modules currently shown as `Wkrotce` / `Soon`, matching the module availability decision and current route placeholders.
- README describes item-photo AI Vision as an existing MVP extension for editable suggestions, while broader AI assistance remains future scope.
- README testing instructions use the real scripts from `package.json`: `npm run test:logic`, `npm run test:e2e`, `npm run lint`, and `npm run build`. It no longer recommends `npm test`.
- `.env.example` now lists non-secret placeholders for Supabase, optional item-photo AI Vision, local dev origin, and E2E test configuration.
- The product spec now includes a status note that PWA/offline is not currently claimed without manifest and service-worker support.

## Explicitly Deferred

- `feature/item-search`: global item search is the next recommended product step after this cleanup.
- Roles & Invites: the fuller `Users` / `Osoby` workflow remains a separate larger phase.
- Full PWA/offline: manifest, service worker, installability, and offline behavior remain a separate topic.

## Not Changed

- Application runtime code was not changed.
- RLS, migrations, policies, server actions, and data model were not changed.
- Dependencies and lockfiles were not changed.
- No package installation or dependency upgrade was performed.
