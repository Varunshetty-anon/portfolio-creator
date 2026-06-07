# FRAMES Phase 0 Product Audit

Date: 2026-06-07
Branch: `codex/product-rescue-sprint`

## Scope

Phase 0 covered static code review, route analysis, backend architecture, editor workflow, portfolio workflow, publishing workflow, upload/link workflow, player architecture, mobile responsiveness, baseline builds/tests, live local browser verification, screenshots, and design reference research.

No source-code product changes were made in this phase.

## Evidence Artifacts

Before screenshots:

- `audit-evidence/phase0/before-landing-desktop.png`
- `audit-evidence/phase0/before-landing-mobile.png`
- `audit-evidence/phase0/before-onboarding-name.png`
- `audit-evidence/phase0/before-onboarding-role.png`
- `audit-evidence/phase0/before-editor-desktop.png`
- `audit-evidence/phase0/before-editor-mobile.png`
- `audit-evidence/phase0/before-editor-project-created.png`
- `audit-evidence/phase0/before-editor-showreel.png`
- `audit-evidence/phase0/before-editor-published.png`
- `audit-evidence/phase0/before-public-intro.png`
- `audit-evidence/phase0/before-public-desktop.png`
- `audit-evidence/phase0/before-public-mobile.png`
- `audit-evidence/phase0/before-project-modal.png`

After screenshots:

- Not applicable. Phase 0 was audit-only.

## Baseline Verification

Passed:

- `npm run build --prefix client`
- `npm run build --prefix server`
- Local backend started and connected to MongoDB.
- Local frontend started at `http://localhost:3000`.
- Manual UI path reached signup, onboarding, editor, publish, and public portfolio.

Failed or incomplete:

- `npm run lint --prefix client` fails because `eslint` is not installed/configured even though the script exists.
- Existing Playwright suite fails 2/3 tests. Tests target `http://localhost:5173/auth`, but Vite runs on `http://localhost:3000` and the app mounts auth at `/`, not `/auth`.
- Existing Playwright suite has stale expectations: `Join FRAMES`, `Sign in instead`, `theme-futuristic`, and `Published!` do not match the current UI.
- Existing media-upload E2E test is effectively empty.
- No visual regression framework/config was found.

## Routes

Evidence: `client/src/router.tsx`

- `/` renders auth.
- `/editor` is protected and requires onboarding.
- `/onboarding` is protected.
- `/portfolio/:username` is public.
- `/@handle` redirects to `/portfolio/handle`.
- `/v/:username` redirects to `/portfolio/:username`.
- `*` renders 404.

Problems:

- Tests expect `/auth`, but the router only defines `/`.
- 404 navigation from public portfolio failure calls `navigate('/404')`, but `/404` is not a dedicated route; it falls through to `*`.

## What Is Working

- The core stack is coherent: React/Vite/Tailwind/Framer Motion frontend, Express/Mongoose backend, Cloudinary direct-upload intent, httpOnly cookie auth.
- Lazy route loading is already in place.
- Auth signup, onboarding, editor load, and publish can complete through the UI.
- The editor has a promising product direction: live portfolio preview in the center, controls on the side.
- Server builds cleanly.
- Client builds cleanly.
- Upload architecture is attempting direct-to-Cloudinary uploads, avoiding Render memory pressure.
- Public portfolios are gated behind `isPublished: true`.
- Drag reorder for projects exists.

## Critical Findings

### 1. Public video playback is broken or untrustworthy

Evidence:

- `FramesPlayer` wraps `ReactPlayer` at `client/src/components/shared/FramesPlayer.tsx`.
- Live public page with a YouTube showreel rendered a `region "Video Player"` but no iframe and an empty native `video` source.
- Console errors included React warnings that `onDuration`, `onBuffer`, and `onBufferEnd` were unknown event handler props being passed to a native `video`.
- `before-public-desktop.png` and `before-project-modal.png` show portfolio/project surfaces without actual playable media.

Impact:

- FRAMES is for video-first creators, but the most important asset is not reliably visible or playable.
- A recruiter or creative director could land on a portfolio and see a blank/broken hero.

### 2. Project URL paste flow drops media

Evidence:

- UI path: Projects -> New Project -> Paste Link -> YouTube URL -> Save.
- After save, the project returned to upload state and still displayed `Brand Trailer • No link`.
- DOM probe confirmed no URL value, no thumbnail image, and no iframe.
- Relevant code: `ProjectCardEditor.tsx` uses `onUrlSave` with sequential `handleFieldChange` calls around lines 197-201; `MediaManager.tsx` calls `onUrlSave(url)` around lines 184-185.

Impact:

- Upload/link workflow is not reliable.
- Project cards can become text-only shells.
- Public project modal falls back to a broken image if no media exists.

### 3. Broken modal fallback creates invalid image source

Evidence:

- Public project modal rendered an image with `src` resolving to the current portfolio URL when `imageUrl` and `thumbnailUrl` were empty.
- Code path: `PortfolioLayout.tsx` renders `src={selectedProject.imageUrl || selectedProject.thumbnailUrl}` around lines 363-364.

Impact:

- A project without media becomes a broken presentation surface.
- The UI does not protect creators from publishing incomplete work.

### 4. Publishing is not a true snapshot workflow

Evidence:

- `POST /publish` copies `portfolio.draftContent` to `portfolio.liveContent`, then sets `isPublished` and `publishedAt`.
- The normal editable profile fields and projects are not assembled into a frozen live version.
- Public route returns current portfolio fields and current `Project.find(...)`, not a live project snapshot.
- Relevant code: `server/src/routes/portfolio.ts` lines around 160-173 and 222-261.

Impact:

- Publish does not mean “approved version is live.”
- Edits after publish can leak to public portfolio depending on field/project behavior.
- There is no rollback/versioning safety.

### 5. Existing E2E coverage gives false confidence

Evidence:

- `client/tests/core-flows.spec.ts` targets `/auth` and port `5173`.
- Current app is `/` and Vite dev server is `3000`.
- Test expectations reference stale UI strings/classes.
- Media upload test contains only comments.

Impact:

- The suite does not currently protect registration, login, onboarding, project creation, upload, publish, public viewing, mobile viewing, or playback.

### 6. Secrets are present in tracked `.env.example`

Evidence:

- `.env.example` contains live-looking MongoDB, JWT, Cloudinary, and Google OAuth values.
- `git ls-files` shows `.env.example` is tracked.

Impact:

- If these values are real, they must be rotated immediately.
- This is a trust and reliability issue, not just cleanup.

### 7. Upload route logs credential presence

Evidence:

- `server/src/routes/upload.ts` logs whether Cloudinary config fields are set.

Impact:

- It does not print the secret values, but production logs should avoid credential diagnostics outside controlled debug mode.

## UX/UI Findings

### Portfolio Experience

Current answer to the product questions:

- Would a recruiter be impressed? No, not reliably. The default portfolio can publish without visible work/video.
- Would a creative director remember it? Not in its current generated state; the visual system is stark but generic.
- Does it feel premium? Partially. Dark surface, large type, and restrained grid help, but broken video destroys premium perception.
- Does it feel custom? No. It reads like a fixed template with name/role/project slots.
- Does it feel world-class? No, because the video and project presentation are unreliable.
- Does it feel like software? Yes, especially in editor and modal patterns.
- Does it feel like a template? Yes.

What works:

- Dark cinematic base is directionally appropriate.
- Work grid uses tight media tiles and keeps project browsing simple.
- Hero attempts to prioritize video through `heroVideoUrl`.

What is broken/confusing:

- No media validation before publish.
- Default hero has no video if the creator has not added a showreel or project video.
- Work grid cards can show text-only projects.
- Contact drawer and `LET'S TALK` are oversized relative to missing work.
- Project modal is split like a generic content modal, not a cinematic case/presentation page.

What is generic/ugly:

- `FRAMES` nav watermark feels template-branded, not creator-branded.
- Heavy uppercase, mono labels, gold accent, dark background repeat everywhere.
- Skills/contact sections feel bolted on.

### Editor Experience

What works:

- Live preview is the right foundation.
- Autosave exists.
- Publish is easy to find.

What is broken/confusing:

- Editor tabs are named like admin properties: `profile Properties`, `projects Properties`, `design Properties`.
- Project creation uses expandable cards and property forms, which feels like a CMS.
- Design tab contains account deletion, which does not belong in creative design workflow.
- Publish has no checklist, missing-media warning, validation, live preview confirmation, or public URL handoff.
- Autosave can collapse/shift editing state after project creation.

What is generic:

- Left nav + right property sidebar pattern resembles admin/CMS tooling.
- Form controls dominate instead of guided creative decisions.

### Onboarding

What works:

- Three-step onboarding is easy to complete.
- Username validation exists client-side.

What is weak:

- It is visually generic: centered card, progress pills, icon, role buttons.
- It does not ask for the most important thing: showreel/hero media.
- It lets creators enter editor with a portfolio that cannot impress yet.

### Intro Experience

Evidence:

- `IntroOverlay` accepts only `name`, `role`, and `onComplete`.
- It does not use `profileImageUrl`.
- It uses a viewfinder SVG and text reveal.

Assessment:

- Weak. It does not meet the brief requirement to use creator profile image.
- It delays access without materially improving perception.
- It should be replaced with a creator-image/media-aware motion piece or removed until it earns its load cost.

### Mobile Experience

Evidence:

- Mobile screenshots captured for landing, editor, and public portfolio.

Findings:

- Landing stacks reasonably.
- Editor mobile becomes a narrow icon rail plus preview/properties, which is functional but cramped for real content editing.
- Public mobile inherits the same video reliability problem.
- Mobile project modal has broken media fallback risk.

## Technical Architecture Findings

Backend:

- Express API is straightforward and small.
- Auth uses httpOnly cookies and JWT/refresh cookies.
- Public portfolio query omits `_id`, so analytics `trackView(portfolioId)` cannot currently be called from public data without API changes.
- Draft/live model is incomplete.
- Project upsert/delete logic relies on incoming `_id` and deletes missing IDs; risky if client state is stale.

Frontend:

- Component count is manageable.
- Design tokens exist, but many components bypass tokens with hard-coded colors.
- Tailwind config references line-height tokens that are not defined in `tokens.css`.
- Several imports in `EditorLayout.tsx` are unused, which lint would catch if configured.
- `ProjectModal.tsx` exists but `PortfolioLayout.tsx` implements another modal inline; duplicate modal architecture.
- `FramesPlayer` stores volume/mute globally in localStorage, so one viewer interaction can affect all later player instances in that browser.

Performance:

- Client build passes but warns about large chunks.
- Large chunks include media playback dependencies such as HLS and DASH.
- For a public portfolio, the first impression should not load heavy editor/player code unnecessarily.

Reliability:

- No meaningful E2E coverage currently passes for real flows.
- No visual regression setup exists.
- No upload test proves Cloudinary signature/direct upload end to end.

## Design Research Extract

Sources reviewed:

- BUCK work index: https://buck.co/work
- Ordinary Folk: https://www.ordinaryfolk.co/
- Giant Ant portfolio: https://www.giantant.com/portfolio
- Instrument work: https://www.instrument.com/work
- Work & Co work: https://work.co/work
- Basement Studio: https://basement.studio/
- Fantasy work: https://fantasy.co/work
- Locomotive: https://locomotive.ca/en
- Elastic redirected to MakeMake work: https://makemake.com/design-animation/work/filter/featured/
- Apple: https://www.apple.com/

Research gap:

- The exact requested `Maleo` reference was not verifiably found from accessible web results. Searches returned `maleo.si`/Behance, unrelated game/business references, and `Malevo.tv`. I am not treating any of those as the requested Maleo grid reference without an exact URL.

Extracted principles:

- Work is the interface. The best references make project media and case thumbnails the primary navigation.
- Metadata is disciplined. Titles, client names, categories, and one-line outcomes are concise and secondary.
- Strong grids are rhythmic, not uniform-by-default. BUCK and motion/design references vary scale while maintaining clear scan order.
- Project pages lead with the artifact. Ordinary Folk exposes video surfaces immediately and uses process/detail after the work.
- Typography is confident but not noisy. Large type is reserved for identity/offers; project labels stay quiet.
- Interaction should clarify hierarchy. Hover/tap states should reveal context, not decorate.
- Brand chrome is restrained. Portfolio builders should let the creator’s identity dominate over the platform brand.
- Premium comes from confidence, spacing, and reliable media, not generic glass cards or decorative glow.
- Apple-like product presentation uses crisp visual priority, short copy, and strong asset fidelity.
- Locomotive/Basement show that expressive motion can coexist with direct project access, but the work still has to be easy to reach.

Implications for FRAMES:

- Video must be validated before publish and visible above the fold.
- The public portfolio should become a creator-branded project theater, not a template page.
- The editor should become a guided publishing tool: identity, hero reel, selected work, review, publish.
- Project browsing needs stronger rhythm: featured hero, editorial grid, project details, next/previous motion.
- Platform branding should be subtle after publish.

## Recommended Phase 1 Priorities

1. Fix player architecture and URL media persistence.
2. Add publish validation and a real live snapshot model.
3. Replace the public portfolio with a video-first, creator-branded presentation.
4. Redesign editor workflow around creative publishing stages, not property panels.
5. Build real Playwright coverage for auth, onboarding, project media, publish, public portfolio, mobile, and playback.
6. Remove/replace weak intro with profile-image/media-aware intro.
7. Rotate exposed credentials and replace `.env.example` with placeholders.
8. Configure lint and visual regression.

## Remaining Issues After Phase 0

All product issues remain unfixed by design. This phase produced evidence only.
