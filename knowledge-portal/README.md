# Personal Knowledge Portal

A durable personal knowledge archive — built for intergenerational wisdom. Write once, readable forever.

## Features

### Content
- **11 categories** — life lessons, decision frameworks, financial wisdom, family history, practical skills, book library, values, letters to the future, career & craft, health & wellness, relationships
- **Markdown/MDX entries** with frontmatter: title, tags, maturity (`draft` / `reviewed` / `final`), life stages, related entries, people mentioned
- **Full-text search** with `tag:`, `cat:`, `maturity:` operators, autocomplete, and match highlighting
- **Knowledge graph** — force-directed D3 visualization of entry connections
- **Mindmap** — hierarchical view by category
- **Timeline** — entries sorted chronologically
- **PDF export** — print-ready layout per entry or per category
- **RSS feed** — subscribe via feed reader

### Platform
- **Auth** — register, log in, sessions (7-day cookies, bcrypt passwords)
- **Password reset** — email-based reset flow with 1-hour tokens
- **Content CMS** — `/admin` editor: create, edit, preview markdown entries
- **Comments** — threaded (2-level) commenting on entries, auth-required
- **Reactions** — 👍 ❤️ 🔥 💡 per entry, toggle on/off, optimistic UI
- **Bookmarks** — save entries for later (stored per user)
- **Activity feed** — unified timeline of new entries and comments, with most-reacted / most-bookmarked sidebars
- **Subscriptions** — subscribe to email digests (immediate / daily / weekly) with per-category filtering
- **Email** — Resend integration for digests, new-entry notifications, welcome emails, password reset
- **Analytics** — page-view tracking (localStorage, no third-party)
- **PWA** — installable, offline fallback page, service worker

## Quick Start

```bash
git clone <repo>
cd knowledge-portal
npm install

# Copy and fill in environment variables
cp .env.example .env

# Run migrations + start dev server
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

See [docs/SETUP.md](docs/SETUP.md) for detailed instructions.

## Project Structure

```
knowledge-portal/
├── src/
│   ├── content/entries/    # Markdown knowledge entries (by category)
│   ├── components/         # Astro components
│   ├── layouts/            # BaseLayout, EntryLayout, CategoryLayout
│   ├── pages/              # All routes (see below)
│   ├── lib/                # auth.ts, email.ts, content.ts, db/
│   └── scripts/            # Client-side TS (search, graph, mindmap…)
├── drizzle/                # SQL migrations
├── data/                   # SQLite database (portal.db)
├── scripts/                # Node build scripts
├── templates/              # Entry templates (entry, letter, book-review, skill-guide)
├── public/                 # Static assets, PWA manifest, service worker
└── tests/                  # Playwright smoke tests
```

## Routes

| Route | Description |
|---|---|
| `/` | Home / dashboard |
| `/entries` | All entries (card / table view, tag + maturity filters) |
| `/entries/[category]` | Category page |
| `/entries/[...slug]` | Entry detail (SSR — comments, reactions live here) |
| `/search` | Full-text search with operators and autocomplete |
| `/graph` | Knowledge graph visualization |
| `/mindmap` | Category mindmap |
| `/timeline` | Chronological entry timeline |
| `/tags` | All tags |
| `/tags/[tag]` | Entries by tag |
| `/activity` | Activity feed (timeline + most-reacted / most-bookmarked) |
| `/subscribe` | Subscription preferences |
| `/export` | PDF export index |
| `/analytics` | Read analytics |
| `/login` | Login |
| `/register` | Registration |
| `/forgot-password` | Password reset request |
| `/reset-password/[token]` | Password reset confirmation |
| `/admin` | Admin dashboard |
| `/admin/entries` | CMS — entry list |
| `/admin/entries/new` | CMS — new entry |
| `/admin/entries/edit/[slug]` | CMS — edit entry |

### API Endpoints

| Endpoint | Methods | Description |
|---|---|---|
| `/api/auth/login` | POST | Login |
| `/api/auth/register` | POST | Register |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Apply new password |
| `/api/entries` | GET | List all entries (JSON) |
| `/api/entry/[...slug]` | GET | Single entry (JSON) |
| `/api/categories` | GET | Category breakdown |
| `/api/tags` | GET | All tags |
| `/api/comments/[...slug]` | GET, POST, DELETE | Comments on an entry |
| `/api/reactions/[...slug]` | GET, POST | Reactions on an entry |
| `/api/subscriptions` | GET, POST, DELETE | Subscription management |
| `/api/admin/entries` | GET, POST | CMS CRUD |
| `/api/admin/entries/[...slug]` | GET, PUT, DELETE | CMS single entry |
| `/api/cron/send-emails` | POST | Send due email digests (cron-protected) |

## Architecture

```
Browser → Astro SSR (Node) → SQLite (Drizzle ORM)
                           → Content Collection (markdown files)
                           → Resend API (email)
```

- **Runtime:** Astro 5, `output: 'server'`, `@astrojs/node` standalone adapter
- **Database:** SQLite via `better-sqlite3`, migrations via `drizzle-orm/better-sqlite3/migrator`
- **Auth:** bcryptjs password hashing, `crypto.randomBytes` session tokens, `httpOnly` cookies
- **Search:** FlexSearch (client-side, index embedded in page)
- **Graph:** Sigma + Graphology + D3

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Accounts (email, username, password hash) |
| `sessions` | Login sessions (7-day tokens) |
| `bookmarks` | Per-user entry bookmarks |
| `history` | Per-user visit history |
| `subscriptions` | Email subscription settings (frequency, lastSentAt) |
| `category_subscriptions` | Per-category subscription filters |
| `comments` | Threaded entry comments |
| `reactions` | Per-user emoji reactions (like/love/fire/insightful) |
| `password_reset_tokens` | 1-hour password reset tokens |

## Development Commands

```bash
npm run dev              # Migrate DB + start Astro dev server
npm run build            # Migrate DB + production build
npm run preview          # Migrate DB + preview production build
npm run check            # TypeScript type check
npm run db:migrate       # Run pending migrations
npm run create           # CLI wizard to scaffold a new entry
npm run build:search     # Regenerate search index JSON
npm run build:graph      # Regenerate graph data JSON
npm run build:rss        # Regenerate RSS feed
npm run test             # Build + run Playwright smoke tests
npm run test:smoke       # Run Playwright tests (no build)
npm run test:headed      # Playwright with browser visible
```

## Docs

- [Setup guide](docs/SETUP.md)
- [Email integration](docs/EMAIL.md)
- [Feature reference](docs/FEATURES.md)

## Content Entry Frontmatter

```yaml
---
title: "Your entry title"
category: life-lessons       # see src/config.ts for all IDs
tags: [wisdom, mistakes]
date_created: 2024-01-15
date_updated: 2024-03-01     # optional
life_stage: [parenthood]     # optional
related: [career-craft/negotiation-cost-of-silence]  # optional
people_mentioned: [Name]     # optional
maturity: draft              # draft | reviewed | final
priority: medium             # low | medium | high | critical
excerpt: "One sentence summary shown in cards and email"
---
```

## License

Private — built with love for future generations.
