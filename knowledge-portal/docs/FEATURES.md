# Feature Reference

## Authentication & Sessions

### Registration
`POST /api/auth/register` — creates a user with bcrypt-hashed password, starts a session.
Fields: `email`, `username` (min 3 chars), `password` (min 8 chars).

### Login / Logout
`POST /api/auth/login` — verifies credentials, sets `session_token` as an `httpOnly`, `sameSite: lax` cookie (7-day TTL).
`POST /api/auth/logout` — deletes the session from the database and clears the cookie.

### Session middleware
`src/middleware.ts` runs on every SSR request. Reads `session_token`, validates it against the `sessions` table, and sets `Astro.locals.currentUser` if valid.

### Protected routes
Pages that require auth check `Astro.locals.currentUser` and redirect to `/login` if absent:
- `/admin`, `/admin/entries`, `/admin/entries/new`, `/admin/entries/edit/[slug]`

---

## Password Reset

1. User visits `/forgot-password`, submits email
2. `POST /api/auth/forgot-password`:
   - Looks up the user by email
   - Generates a `crypto.randomBytes(32)` token, stores in `password_reset_tokens` with 1-hour expiry
   - Sends a reset email via Resend
   - Always returns 200 (no email enumeration)
3. User clicks the link in the email (`/reset-password/{token}`)
4. Page validates the token server-side before rendering (shows error if invalid/expired/used)
5. User submits new password
6. `POST /api/auth/reset-password`:
   - Validates token again
   - Updates `users.password_hash`
   - Marks token as `used_at`
   - Deletes all existing sessions for the user (security: log out all devices)
   - Creates a new session → user is logged in immediately

---

## Knowledge Entries & CMS

### Content format
Entries are Markdown (or MDX) files in `src/content/entries/{category}/slug.md`.

Frontmatter schema (`src/content/config.ts`):

```yaml
title: string          # required
category: string       # one of the 11 category IDs
tags: string[]         # default []
date_created: date     # required
date_updated: date     # optional
life_stage: string[]   # e.g. [parenthood, career-start]
related: string[]      # slugs of related entries
people_mentioned: string[]
media: string[]
maturity: draft|reviewed|final  # default draft
priority: low|medium|high|critical  # default medium
excerpt: string        # used in cards and email
```

### In-browser CMS (`/admin`)
- Entry list at `/admin/entries` — sorted by date, shows maturity badge
- New entry at `/admin/entries/new` — markdown textarea with live preview, category/tags/maturity fields
- Edit entry at `/admin/entries/edit/[slug]` — prefills all fields, saves to disk

The CMS writes files directly to `src/content/entries/` via `src/lib/content.ts`. In production with a read-only filesystem (e.g. Vercel), the CMS won't persist. It's intended for use on a self-hosted Node server or locally.

### From the CLI
```bash
npm run create
```
Interactive wizard: prompts for title, category, and tags, then creates the file.

---

## Search

Full-text search runs entirely in the browser using [FlexSearch](https://github.com/nextapps-de/flexsearch).

### Query operators

| Operator | Example | Effect |
|---|---|---|
| Plain text | `negotiation` | Score-ranked across all fields |
| `tag:` | `tag:investing` | Filter by tag |
| `cat:` / `category:` | `cat:financial-wisdom` | Filter by category |
| `maturity:` | `maturity:final` | Filter by maturity |
| Phrase | `"cost of silence"` | Exact phrase match |

### Autocomplete
Appears after 2+ characters. Shows top 5 results, keyboard-navigable (↑ ↓ Enter Esc).

### Keyboard shortcuts
- `/` or `k` (when not in an input) — focus search box

### Filters
Dropdowns for Category, Maturity, Tag appear after the search box. Selections sync to URL params (`?q=…&category=…&maturity=…&tag=…`) so searches are shareable.

---

## Comments

Comments are stored in the `comments` table and support 2-level threading (root comments and replies).

### Data
- `entryId` — matches the content collection entry `id`
- `parentId` — null for root comments, parent comment ID for replies
- `body` — 2–2000 characters
- `userId` — references `users.id`

### API
```
GET    /api/comments/{entryId}    List comments for an entry (no auth)
POST   /api/comments/{entryId}    Create comment (auth required)
DELETE /api/comments/{entryId}    Delete comment by ID in body (auth, own comments only)
```

### UI (`src/components/Comments.astro`)
- Initial list loaded server-side (SSR) — no flash of empty content
- Submit and delete happen via `fetch` without page reload
- Own comment: shows `×` delete button
- Reply button opens context banner with "Replying to comment #N"
- Cancel reply clears the parent context
- Character counter (0/2000)

---

## Reactions

Per-user emoji reactions on entries. Stored in the `reactions` table with a unique constraint on `(userId, entryId, type)`.

### Types
`like` 👍 · `love` ❤️ · `fire` 🔥 · `insightful` 💡

### API
```
GET  /api/reactions/{entryId}   Returns { counts: {like:N,…}, userIds: {like:[…],…} }
POST /api/reactions/{entryId}   Toggle reaction { type: "like" } — adds if absent, removes if present
```

### UI (`src/components/Reactions.astro`)
- Counts loaded server-side (SSR)
- Click toggles — optimistic update with server-side revert on failure
- Active state highlighted in accent colour
- Disabled (non-clickable) when logged out, with "Log in to react" link

---

## Activity Feed (`/activity`)

Shows recent activity across the portal in a reverse-chronological timeline.

### Timeline items
- **New entry** — entry title, category icon, relative time
- **Comment** — commenter name, truncated quote (120 chars), entry link

Items from both sources are merged and sorted by date, limited to 30.

### Sidebar
- **Most reacted** — top 10 entries by total reaction count
- **Most bookmarked** — top 10 entries by total bookmark count

---

## Subscriptions & Email Digests

Users manage subscriptions at `/subscribe`.

### Settings
- **Frequency**: `immediate` (per entry), `daily` (batched), `weekly` (batched)
- **Categories**: leave all unchecked to subscribe to everything, or pick specific categories

### Storage
- `subscriptions` — one row per user with `frequency` and `lastSentAt`
- `category_subscriptions` — zero or more rows per subscription, one per selected category

### API
```
GET    /api/subscriptions    Returns current subscription (auth required)
POST   /api/subscriptions    Create or update subscription { frequency, categories }
DELETE /api/subscriptions    Remove subscription entirely
```

### Email delivery
See [EMAIL.md](EMAIL.md) for cron setup, Resend configuration, and troubleshooting.

---

## Knowledge Graph (`/graph`)

Force-directed graph built with [Sigma](https://www.sigmajs.org) and [Graphology](https://graphology.github.io).

- Nodes = entries, sized by connection count
- Edges = `related` frontmatter links (bidirectional)
- Click a node to navigate to the entry
- Hover shows the title
- Pan / zoom with mouse or touch

---

## Mindmap (`/mindmap`)

Hierarchical D3 tree view. Root → category → entries. Click an entry to open it.

---

## Timeline (`/timeline`)

Entries sorted by `date_created`, displayed as a vertical timeline grouped by year. Useful for seeing how the archive has grown.

---

## Export / PDF

`/export` — lists all categories and entries available for PDF export.
`/export/{category}` — category-level print view.
`/export/{entryId}` — single-entry print view.

Print styles (`src/styles/print.css`) hide nav, add page breaks, and use printer-friendly fonts.

---

## PWA & Offline Support

- `public/site.webmanifest` — app manifest (name, icons, theme colour)
- `public/sw.js` — service worker: caches `_astro/*` static assets on install, serves `offline.html` fallback when network is unavailable
- `public/pwa-icon-192.svg` and `pwa-icon-512.svg` — PWA icons
- Install prompt supported via `beforeinstallprompt` event

---

## Analytics (`/analytics`)

Client-side page-view tracking using `localStorage` — no third-party services, no cookies, no tracking pixels. Data stays on the device.

Tracked per page: view count, last visited. Dashboard shows top entries by view count and recent history.

---

## Bookmarks

Entries can be bookmarked from the entry detail page (bookmark icon, keyboard shortcut `B`). Bookmarks are stored in the `bookmarks` table per user. Used by the activity feed sidebar (most bookmarked entries).

---

## Reading Time

`src/components/ReadingTime.astro` — calculates reading time from `entry.body` at ~200 wpm. Displayed in the entry header.

---

## Breadcrumbs + JSON-LD

Entry pages render `<Breadcrumbs>` (Home → Category → Entry) and a `<script type="application/ld+json">` block with `Article` structured data including `headline`, `datePublished`, `dateModified`, `author`, and `keywords`.
