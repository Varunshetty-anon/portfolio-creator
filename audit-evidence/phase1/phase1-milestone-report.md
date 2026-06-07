# Phase 1 Milestone Report

## Scope

This milestone focused on reliability defects found in Phase 0 before starting a larger visual redesign:

- Broken media playback on public portfolios.
- Pasted project links not persisting correctly in the editor.
- Invalid project-modal fallback media.
- Publish workflow exposing mutable draft state instead of a live snapshot.
- Stale E2E coverage that no longer matched the app.
- Missing client lint installation/configuration.

## Before Evidence

See `audit-evidence/phase0/phase0-audit-report.md` and the Phase 0 screenshots.

Key reproducible defects:

- `FramesPlayer` used ReactPlayer v2 props against ReactPlayer v3, so public playback did not reliably render.
- `ProjectCardEditor` saved pasted media URLs via sequential stale state updates, causing the second update to overwrite the first.
- Project modal rendered an image even when no `imageUrl`, `thumbnailUrl`, or `videoUrl` existed.
- Publish only changed `isPublished`; public portfolios could drift with draft edits.
- Existing Playwright tests targeted stale routes and ports.

## Fixes

- Updated `FramesPlayer` to ReactPlayer v3-compatible `src`, duration, buffering, progress, and seeking behavior.
- Made pasted project media URL updates atomic in `ProjectCardEditor`.
- Added accessible, keyboard-openable project cards and a valid "Media pending" modal fallback.
- Added `imageUrl` persistence for project drafts.
- Changed publish to write `liveContent` with serialized portfolio and ordered projects.
- Changed public portfolio reads to serve the last published snapshot when available.
- Added publish validation in the editor so empty portfolios and incomplete projects are blocked before publishing.
- Added an unauthenticated-safe `/api/v1/auth/session` route and updated the client auth refresh path to avoid expected 401 noise on app load.
- Added client ESLint dependencies and flat config.
- Replaced stale Playwright coverage with current core-flow coverage for registration, login, onboarding, project URL upload, publish, public viewing, mobile viewing, and project modal/playback visibility.
- Added git ignores for generated Playwright artifacts.

## After Evidence

- `after-editor-desktop.png`
- `after-public-desktop.png`
- `after-project-modal.png`
- `after-public-mobile.png`

Seeded local published portfolio used for screenshots:

- Username: `frames-phase1-1780842422253`
- Public URL: `http://localhost:3000/portfolio/frames-phase1-1780842422253`

## Verification

- Client type check/build: `npm run build --prefix client` passed.
- Server type check/build: `npm run build --prefix server` passed.
- Client lint: `npm run lint --prefix client` passed with warnings.
- E2E: `npx playwright test --reporter=line` passed with 2 active tests and 2 expected project-scope skips.
- Visual checks: screenshots captured under this directory.

## Remaining Issues

- The product still needs the larger portfolio/editor redesign. Phase 1 made the current experience more reliable, but did not yet make it world-class.
- Client lint still reports warnings, mostly unused imports and Fast Refresh export warnings.
- Vite still reports large chunks during build, especially video/player packages.
- Upload flow is covered through URL-based media upload. Cloudinary file upload still needs live credential verification and production-safe diagnostics.
- Deployment URL remains unresolved until the hosting target is confirmed. The previously tested Render health URL returned 404.
