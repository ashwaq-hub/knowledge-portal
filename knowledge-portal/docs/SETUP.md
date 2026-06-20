# Setup Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- Git

No external services are required to run locally. Email sending is optional (see [EMAIL.md](EMAIL.md)).

## Installation

```bash
git clone <repo-url>
cd knowledge-portal
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because `@astrojs/node` currently declares a peer dep on Astro 4
> while the project uses Astro 5. Everything works; the flag just suppresses the peer conflict error.

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `RESEND_API_KEY` | No | — | Resend API key. If unset, emails are logged to console instead of sent |
| `EMAIL_FROM` | No | `no-reply@example.com` | "From" address for outgoing emails |
| `SITE_URL` | No | `http://localhost:4321` | Base URL used in email links |
| `CRON_SECRET` | No | — | Bearer token protecting `POST /api/cron/send-emails`. Leave empty to allow unauthenticated calls locally |

## Database

Migrations run automatically on `npm run dev` and `npm run build`. To run them manually:

```bash
npm run db:migrate
```

The SQLite database is stored at `data/portal.db`. The file is created automatically.

### Schema migrations

Migrations live in `drizzle/`. The migrator reads them in order based on `drizzle/meta/_journal.json`.
To add a migration:
1. Create `drizzle/000N_description.sql`
2. Add an entry to `_journal.json`
3. Update `src/lib/db/schema.ts`

## Running Locally

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

The dev server hot-reloads on source changes. Database migrations run at startup.

## First-Time Setup

1. Open `http://localhost:4321/register` and create your account
2. Go to `http://localhost:4321/admin` to access the CMS
3. Use `npm run create` to scaffold new entries from templates, or create files directly in `src/content/entries/`

## Adding Content

### Via CLI wizard
```bash
npm run create
```
Prompts for title, category, and tags. Creates the frontmatter file in the right directory.

### Manually
1. Copy a template from `templates/` (`entry.md`, `letter.md`, `book-review.md`, `skill-guide.md`)
2. Place in `src/content/entries/{category}/your-slug.md`
3. Fill in frontmatter (see README for all fields)
4. Edit the body

### Via CMS
Log in and go to `/admin/entries/new`. The in-browser editor has a live markdown preview.

## Content Categories

| ID | Name |
|---|---|
| `life-lessons` | Life Lessons |
| `decision-frameworks` | Decision Frameworks |
| `financial-wisdom` | Financial Wisdom |
| `family-history` | Family History |
| `practical-skills` | Practical Skills |
| `book-library` | Book Library |
| `values` | Values & Principles |
| `letters-to-future` | Letters to the Future |
| `career-craft` | Career & Craft |
| `health-wellness` | Health & Wellness |
| `relationships` | Relationships |

To add a new category, update `src/config.ts` (the `categories` array) and create the corresponding directory under `src/content/entries/`.

## Building for Production

```bash
npm run build
node dist/server/entry.mjs   # start the production server
```

Or with environment variable:
```bash
HOST=0.0.0.0 PORT=8080 node dist/server/entry.mjs
```

The build outputs to `dist/`. The Node adapter produces a standalone server at `dist/server/entry.mjs`.

## Running Tests

Playwright smoke tests verify that all routes return 200 and key UI elements render.

```bash
# Build first, then test
npm test

# Or test against an already-running dev server
npm run test:smoke

# Open headed browser (useful for debugging)
npm run test:headed

# Interactive Playwright UI
npm run test:ui
```

The playwright config (`playwright.config.ts`) points at `http://localhost:4321` by default.

## Useful Build Scripts

```bash
npm run build:search   # Regenerate search index (writes to public/)
npm run build:graph    # Regenerate graph data (writes to public/)
npm run build:rss      # Regenerate RSS feed
npm run export:all     # build + search + graph + rss in sequence
npm run check          # TypeScript type check (astro check)
```

## Project Layout

```
src/
├── components/
│   ├── Breadcrumbs.astro
│   ├── Comments.astro       # SSR comment list + client submit
│   ├── EntryCard.astro
│   ├── EntryList.astro
│   ├── EntryTable.astro
│   ├── Reactions.astro      # SSR reaction counts + client toggle
│   ├── ReadingTime.astro
│   ├── RelatedEntries.astro
│   └── TableOfContents.astro
├── content/
│   └── entries/             # Markdown knowledge entries
│       ├── life-lessons/
│       ├── relationships/
│       └── ...
├── layouts/
│   ├── BaseLayout.astro     # Nav, head, theme toggle
│   ├── CategoryLayout.astro
│   └── EntryLayout.astro    # Entry page with TOC, reactions, comments
├── lib/
│   ├── auth.ts              # Session management, password hashing
│   ├── content.ts           # Filesystem CMS helpers
│   ├── db/
│   │   ├── index.ts         # getDb() singleton
│   │   └── schema.ts        # Drizzle schema
│   ├── email.ts             # Resend email functions
│   ├── graph-data.ts
│   ├── pdf-generator.ts
│   └── search-index.ts
├── pages/                   # All routes
├── scripts/                 # Client-side TypeScript
└── styles/
    ├── global.css
    ├── components.css
    └── print.css
```
