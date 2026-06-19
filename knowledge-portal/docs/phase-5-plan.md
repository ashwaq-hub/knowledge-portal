# Phase 5 Plan — Platform & Experience Expansion

## Overview

Phase 5 adds seven feature areas (user accounts, CMS, PWA, search improvements, newsletter, comments, performance & SEO). The biggest architectural decision is **static → hybrid SSR** — auth, CMS, comments, and email all require server-side rendering.

## Architecture Decision

### Current state
- `output: 'static'` — static HTML files, no server runtime
- No database, no auth, no API sessions

### Required change
- Switch to `output: 'server'` with `@astrojs/node` adapter
- Add a database (SQLite via `better-sqlite3` for zero-infra local dev)
- Add session middleware for auth

### Fallback (if SSR is too heavy)
Keep the original static build for public content and layer auth/CMS behind a separate small Express app at `/admin`. But this creates a split architecture. **Recommend SSR.**

---

## Feature Areas & Roadmap

### Track A — Foundation (Ship first, unblocks everything else)

#### A1. SSR Migration
- Switch to `output: 'server'` with `@astrojs/node`
- Add `astro start` / production entry point
- Verify all 65 existing smoke tests pass under SSR mode
- Add smoke test: SSR health check (`/_astro/` serving, `__astro_cookies` present)

**Effort:** Medium (config + adapter + testing)
**Tests:** ~2 new

#### A2. Database Setup
- Add `better-sqlite3` and `drizzle-orm` (lightweight, type-safe)
- Define schema: `users`, `sessions`, `bookmarks` (migrate from localStorage), `history`, `comments`, `subscriptions`, `pageviews` (migrate from localStorage)
- Migration runner script
- DB helper module at `src/lib/db/index.ts`

**Effort:** Medium (schema design + migrations)
**Tests:** Integration tests for DB CRUD

#### A3. Auth System
- Register / Login form pages with email + password (hashed with `bcryptjs`)
- Session cookies with `@astrojs/node` cookie support
- Auth middleware: `Astro.locals.currentUser` available in every page/endpoint
- Protected route wrapper (`AuthGuard.astro`)
- Logout, password reset flow
- Nav updates: Login/Register links → avatar dropdown

**Effort:** Large (forms, sessions, middleware, reset flow)
**Tests:** ~6 new (auth pages, protected routes, session persistence)

**Total Track A:** 3 items, ships as one milestone

---

### Track B — Independent (No deps, can ship anytime)

#### B1. PWA / Offline Support
- Web app manifest (`site.webmanifest`) with icons, theme color
- Service worker via `Workbox` or a small hand-written SW
  - Cache static assets (`_astro/*`) on install
  - Cache content pages on first visit (stale-while-revalidate)
  - Offline fallback page
- `<link rel="manifest">` in `BaseLayout.astro`
- `beforeinstallprompt` listener in a client script
- Register SW in `BaseLayout.astro` inline script

**Effort:** Medium (SW logic, manifest assets, testing)
**Tests:** ~3 new (SW registered, offline fallback, manifest present)

#### B2. Search Improvements
- Upgrade `flexsearch` integration: add `tokenize: 'forward'` for fuzzy prefix matching
- Autocomplete dropdown: show top-5 results as user types (debounced, 150ms)
- Advanced search operators:
  - `tag:foo` → filter by tag
  - `cat:bar` → filter by category
  - `maturity:evergreen` → filter by maturity
  - `"exact phrase"` → phrase search
- Highlight matches in search results (`<mark>` around matched terms)
- Search result count / "X of Y results" summary

**Effort:** Medium (client-side, no deps)
**Tests:** ~4 new (autocomplete, operators, highlighting, count)

#### B3. Performance & SEO
- **Lighthouse pass:**
  - Lazy-load below-fold images with `loading="lazy"`
  - Preload hero/LCP image
  - Add `width` / `height` to all `<img>` tags (Aspect Ratio CLS fix)
  - Eliminate render-blocking resources (inline critical CSS, defer non-critical)
- **SEO:**
  - JSON-LD structured data: `WebSite`, `Article` (per entry), `BreadcrumbList`
  - `meta description` per page (entry excerpts, category descriptions)
  - OpenGraph image generation (simple card with title overlay)
  - Breadcrumb nav on entry pages with `itemprop` / `itemscope`
- **Bundle optimization:**
  - Audit client JS chunks; split `content-mgmt.ts` if needed
  - Remove unused CSS via PurgeCSS in build step

**Effort:** Medium–Large (many small changes across files)
**Tests:** ~3 new (structured data present, Lighthouse thresholds via `lighthouse` CI — optional; at minimum test JSON-LD in DOM)

---

### Track C — Auth-Dependent (Wait for Track A)

#### C1. Content Editor / CMS
- New page: `/admin/entries` — list of all entries with status (draft/published)
- New page: `/admin/entries/new` and `/admin/entries/edit/[slug]`
- Markdown editor: `<textarea>` with live preview (rendered Markdown via `marked` or `showdown`)
- Metadata editor: title, category (dropdown), tags (multi-select), maturity (select), slug (auto-generated, editable)
- Image upload: drag-and-drop → stored in `public/uploads/` or cloud storage (cloudinary / S3)
- Save as draft or publish
- Delete entry with confirmation
- Link from entry detail: "Edit this entry" (visible to authed user only)
- Entry listing: sort by updated date, filter by status
- Content diff view (optional)

**Effort:** Very Large (editor, preview, file handling, UI)
**Tests:** ~8 new (editor pages, CRUD, validation, image upload)

#### C2. Email / Newsletter
- Subscription management: subscribe/unsubscribe at `/subscribe`
- Email storage in DB
- Trigger on publish: when an entry is published, queue a notification
- Digest builder: collect recent entries, render into email template
- Send via `nodemailer` (SMTP) or `resend` API
- Preference center: frequency (immediate / daily / weekly), categories to follow
- Unsubscribe link in every email
- RSS feed enhancements: full-content RSS, category-specific feeds

**Effort:** Large (email templates, send pipeline, preference management)
**Tests:** ~5 new (subscribe, unsubscribe, preference update, RSS content)

#### C3. Social / Comments
- Comment component: thread display with nesting (2 levels), markdown body
- Comment form: textarea + submit (authed only)
- Reply button on each comment (opens inline form)
- Edit/delete own comments (within 5 min window)
- Reactions: emoji reactions on entries (👍❤️🔥💡) — stored per-user
- Share buttons: copy link, tweet, email
- Activity feed page (`/activity`) — recent comments, new entries, popular reactions

**Effort:** Very Large (threaded comments, reactions, activity feed)
**Tests:** ~8 new (comment submission, threading, reactions, activity page)

---

## Implementation Order

```
Sprint 1   │ A1 SSR Migration + A2 Database Setup
Sprint 2   │ A3 Auth System
           ├─────────────┬──────────────┬──────────────┐
Sprint 3   │ B1 PWA       │ B2 Search    │ B3 Perf & SEO│
Sprint 4   │ C1 CMS       │              │              │
Sprint 5   │ C2 Newsletter│ C3 Comments  │              │
Sprint 6   │ Polish, full test pass, deploy             │
```

Tracks B (independent) can parallelize if needed.

---

## Test Strategy

| Area | New tests | Key things to cover |
|---|---|---|
| SSR migration | ~2 | Server starts, cookies work, static pages still serve |
| DB | ~2 | CRUD operations, migration runs clean |
| Auth | ~6 | Register, login, logout, protected route, invalid creds, session persist |
| PWA | ~3 | SW registered, manifest linked, offline fallback |
| Search | ~4 | Autocomplete renders, operators filter, highlighting, count |
| Perf & SEO | ~3 | JSON-LD present, images have dimensions, breadcrumb markup |
| CMS | ~8 | Create/edit/delete entry, save draft, publish, image upload, validation |
| Email | ~5 | Subscribe, unsubscribe, preference update, RSS full content |
| Comments | ~8 | Submit, thread display, reply, edit/delete, reactions, activity page |

**Total new tests:** ~41
**Phase 5 total:** 65 current + 41 new = **106 tests**

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| SSR migration breaks existing pages | Run all 65 current tests first; fix any regressions before adding features |
| Auth adds complexity | Keep session logic in middleware, not scattered across pages; use `Astro.locals` |
| SQLite not suitable for production | Start with SQLite, abstract DB layer so swapping to Postgres later is a config change |
| CMS editor UX is large scope | Ship minimal editor first (textarea + preview); rich toolbar is post-MVP |
| Email deliverability | Use transactional email API (Resend) instead of self-hosted SMTP |
| Phase scope creep | Features marked "optional" can be deferred without breaking the milestone |

---

## Definition of Done

Each feature ships when:
1. ✅ Build passes (`astro build` or `astro build` for hybrid)
2. ✅ All existing tests pass
3. ✅ New tests for the feature pass
4. ✅ No console errors in dev or preview
5. ✅ Feature works in both light and dark mode (where UI)
6. ✅ Responsive at 375px, 768px, 1024px
