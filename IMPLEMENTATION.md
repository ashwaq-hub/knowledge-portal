# Personal Knowledge Portal — Implementation Details

Technical specification for building the personal knowledge portal.

---

## 1. Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Content Format** | Markdown + YAML frontmatter | Human-readable, 50+ year durable, universal |
| **Site Generator** | Astro 5.x | Fast, MD-first, excellent MDX support, zero-JS by default |
| **Styling** | CSS custom properties + modern CSS | No framework dependency, easy to theme |
| **Search** | FlexSearch (client-side) | Fast, no server, works offline |
| **Knowledge Graph** | Sigma.js or D3.js force-graph | Interactive node visualization |
| **PDF Export** | Puppeteer or browser print | High-fidelity PDF from HTML |
| **AI Layer (opt)** | Ollama + llama.cpp embeddings | Fully local, private, no API keys |
| **Version Control** | Git | Tracks evolution of thinking over time |
| **Deployment** | Static files (no server) | Anywhere: local, GitHub Pages, self-hosted |

---

## 2. Repository Structure

```
knowledge-portal/
├── content/                          # All knowledge entries
│   ├── life-lessons/                 # category-1
│   │   ├── _category.md              # Category description
│   │   ├── negotiation-mistake.md
│   │   └── ...
│   ├── decision-frameworks/          # category-2
│   ├── financial-wisdom/             # category-3
│   ├── family-history/               # category-4
│   ├── practical-skills/             # category-5
│   ├── book-library/                 # category-6
│   ├── values/                       # category-7
│   ├── letters-to-future/            # category-8
│   ├── career-craft/                 # category-9
│   └── health-wellness/              # category-10
├── media/                            # Embedded media
│   ├── photos/
│   ├── audio/
│   └── video/
├── public/                           # Static assets
│   ├── favicon.svg
│   ├── og-image.png
│   └── fonts/
├── src/                              # Astro source
│   ├── components/
│   │   ├── EntryCard.astro           # Card for entry listing
│   │   ├── SearchBox.astro           # Search input + results
│   │   ├── GraphView.astro           # Knowledge graph canvas
│   │   ├── TimelineView.astro        # Chronological timeline
│   │   ├── RelatedEntries.astro      # "See also" component
│   │   ├── Breadcrumbs.astro         # Navigation breadcrumbs
│   │   └── PDFTemplate.astro         # Print-optimized layout
│   ├── layouts/
│   │   ├── BaseLayout.astro          # HTML shell, head, nav
│   │   ├── EntryLayout.astro         # Single entry page
│   │   └── CategoryLayout.astro      # Category index page
│   ├── pages/
│   │   ├── index.astro               # Home / landing
│   │   ├── search.astro              # Search results page
│   │   ├── graph.astro               # Knowledge graph page
│   │   ├── timeline.astro            # Timeline view
│   │   ├── export.astro              # PDF export trigger page
│   │   └── [category]/
│   │       ├── index.astro           # Category listing
│   │       └── [...slug].astro       # Individual entry
│   ├── lib/
│   │   ├── content.ts                # Content collection helpers
│   │   ├── search-index.ts           # FlexSearch index builder
│   │   ├── graph-data.ts             # Knowledge graph data builder
│   │   └── pdf-generator.ts          # PDF export logic
│   ├── styles/
│   │   ├── global.css                # Base styles, reset
│   │   ├── typography.css            # Font stacks, readability
│   │   ├── components.css            # Component-specific styles
│   │   └── print.css                 # Print/PDF overrides
│   └── config.ts                     # Site configuration
├── scripts/
│   ├── build-search-index.ts         # Pre-build search index
│   ├── build-graph-data.ts           # Pre-build graph JSON
│   └── export-pdf.ts                 # Batch PDF export
├── templates/                        # Authoring templates
│   ├── entry.md
│   ├── letter.md
│   ├── skill-guide.md
│   └── book-review.md
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── .gitignore
├── README.md                         # What this is, setup instructions
├── PLAN.md                           # Master plan (this project)
├── IMPLEMENTATION.md                 # This file
└── HANDBOVER.md                      # Guide for your children
```

---

## 3. Content Schema

### 3.1 YAML Frontmatter

Every entry uses this frontmatter schema:

```yaml
---
title: "The Most Important Negotiation Lesson I Ever Learned"
slug: negotiation-mistake-2018
category: life-lessons
tags: [negotiation, career, confidence]
date_created: 2025-06-19
date_updated: 2025-06-19
life_stage: [career-building, mid-career]
related:
  - decision-frameworks/career-choices
  - financial-wisdom/salary-negotiation
  - career-craft/leading-negotiations
people_mentioned: []
media: []
maturity: draft          # draft | reviewed | final
priority: high           # low | medium | high | critical
---
```

### 3.2 Entry Body Template

```markdown
## The Situation
[Context: what happened, when, where, who was involved]

## What I Did
[Your actions, decisions, and reasoning at the time]

## What Happened
[The outcome — good, bad, or mixed]

## What I Learned
[The core insight extracted from this experience]

## What I'd Tell You
[Direct advice to your child or future reader]

## When This Applies
[Context boundaries: when is this lesson relevant? when is it NOT?]

## Related Thinking
- [Link to related entries via YAML frontmatter `related` field]
```

---

## 4. Astro Configuration

### `astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'http://localhost:4321',        // Local-first, change for deploy
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
  build: {
    format: 'directory',                // Clean URLs
  },
});
```

### Content Collections (`src/content/config.ts`)

```typescript
import { defineCollection, z } from 'astro:content';

const entryCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    date_created: z.date(),
    date_updated: z.date().optional(),
    life_stage: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    people_mentioned: z.array(z.string()).default([]),
    media: z.array(z.string()).default([]),
    maturity: z.enum(['draft', 'reviewed', 'final']).default('draft'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  }),
});

export const collections = {
  entries: entryCollection,
};
```

---

## 5. Search System

### Architecture
- **Build time:** Astro collects all entries, extracts text, builds FlexSearch index as a JSON file
- **Runtime:** Client-side JavaScript loads the index, provides instant full-text search
- **No server required** — works offline

### `src/lib/search-index.ts`

```typescript
import FlexSearch from 'flexsearch';
import { getCollection } from 'astro:content';

export async function buildSearchIndex() {
  const entries = await getCollection('entries');
  const index = new FlexSearch.Document({
    document: {
      id: 'id',
      index: ['title', 'body', 'tags', 'category'],
      store: ['title', 'slug', 'category', 'date_created', 'tags'],
    },
  });

  for (const entry of entries) {
    index.add({
      id: entry.id,
      title: entry.data.title,
      body: entry.body,
      tags: entry.data.tags.join(' '),
      category: entry.data.category,
      slug: entry.data.slug || entry.slug,
      date_created: entry.data.date_created,
    });
  }

  return index.export();
}
```

### Search UI Component

```astro
---
// src/components/SearchBox.astro
---
<div id="search-container">
  <input type="search" id="search-input" placeholder="Search knowledge..." />
  <div id="search-results"></div>
</div>

<script>
  import FlexSearch from 'flexsearch';

  let index: FlexSearch.Document;

  fetch('/search-index.json')
    .then(r => r.json())
    .then(data => {
      index = new FlexSearch.Document({ ... });
      index.import(data);
    });

  document.getElementById('search-input').addEventListener('input', (e) => {
    const results = index.search(e.target.value);
    // Render results to #search-results
  });
</script>
```

---

## 6. Knowledge Graph

### Data Model

```typescript
// src/lib/graph-data.ts
interface GraphNode {
  id: string;           // content path
  label: string;        // entry title
  category: string;
  tags: string[];
  date: string;
}

interface GraphEdge {
  source: string;       // source entry id
  target: string;       // target entry id
  type: 'related' | 'references' | 'same-tag' | 'same-life-stage';
  weight: number;       // 1-5, based on connection strength
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

### Build Logic

```typescript
export async function buildGraphData(): Promise<GraphData> {
  const entries = await getCollection('entries');
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Build nodes
  for (const entry of entries) {
    nodes.push({
      id: entry.id,
      label: entry.data.title,
      category: entry.data.category,
      tags: entry.data.tags,
      date: entry.data.date_created.toISOString(),
    });
  }

  // Build edges from `related` frontmatter
  for (const entry of entries) {
    for (const relatedId of entry.data.related) {
      edges.push({
        source: entry.id,
        target: relatedId,
        type: 'related',
        weight: 3,
      });
    }
  }

  // Build edges from shared tags
  const tagMap = new Map<string, string[]>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push(entry.id);
    }
  }
  for (const [tag, entryIds] of tagMap) {
    for (let i = 0; i < entryIds.length; i++) {
      for (let j = i + 1; j < entryIds.length; j++) {
        edges.push({
          source: entryIds[i],
          target: entryIds[j],
          type: 'same-tag',
          weight: 1,
        });
      }
    }
  }

  return { nodes, edges };
}
```

### Visualization

```astro
---
// src/components/GraphView.astro
---
<div id="graph-container" style="width: 100%; height: 600px;"></div>

<script>
  import Sigma from 'sigma';
  import Graph from 'graphology';

  fetch('/graph-data.json')
    .then(r => r.json())
    .then(data => {
      const graph = new Graph();
      data.nodes.forEach(n => graph.addNode(n.id, { label: n.label, ... }));
      data.edges.forEach(e => graph.addEdge(e.source, e.target, { ... }));

      const container = document.getElementById('graph-container');
      const renderer = new Sigma(graph, container);
    });
</script>
```

---

## 7. PDF Export System

### Approach
- Dedicated print CSS (`src/styles/print.css`)
- `window.print()` for manual export
- Puppeteer script for batch export

### `scripts/export-pdf.ts`

```typescript
import puppeteer from 'puppeteer';

async function exportCategoryPDF(category: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:4321/export/${category}`);
  await page.pdf({
    path: `export/${category}-${Date.now()}.pdf`,
    format: 'A4',
    printBackground: true,
    margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
  });
  await browser.close();
}
```

---

## 8. Styling System

### CSS Architecture

```css
/* src/styles/global.css */
:root {
  --color-bg: #fafafa;
  --color-text: #1a1a1a;
  --color-text-muted: #6b7280;
  --color-accent: #2563eb;
  --color-border: #e5e7eb;
  --font-serif: 'Georgia', 'Times New Roman', serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --max-width: 720px;
  --spacing-unit: 1rem;
}

/* src/styles/print.css */
@media print {
  nav, header, footer, .search-box, .graph-view { display: none; }
  body { font-size: 12pt; line-height: 1.5; }
  a { color: inherit; text-decoration: underline; }
  .page-break { page-break-before: always; }
}
```

---

## 9. AI Layer (Optional)

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Query    │────▶│   Embed Query     │────▶│   Vector Search │
│                 │     │   (local model)   │     │   (entries)     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐     ┌────────▼────────┐
│   Voice Output  │◀────│   TTS (Piper)    │◀────│   LLM Response  │
│   (optional)    │     │   (local)        │     │   (Ollama)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Setup

```bash
# Install Ollama (https://ollama.ai)
ollama pull llama3.2       # or your preferred model
ollama pull nomic-embed-text  # for embeddings

# Embed all content
npx ts-node scripts/embed-content.ts

# Start AI chat server (optional, local Express app)
npx ts-node scripts/ai-chat-server.ts
```

### Embedding Script

```typescript
// scripts/embed-content.ts
import { getCollection } from 'astro:content';
import { Ollama } from 'ollama';
import fs from 'fs';

const ollama = new Ollama();

async function embedAll() {
  const entries = await getCollection('entries');
  const embeddings = [];

  for (const entry of entries) {
    const text = `${entry.data.title}\n\n${entry.body}`;
    const { embedding } = await ollama.embed({
      model: 'nomic-embed-text',
      input: text,
    });
    embeddings.push({
      id: entry.id,
      title: entry.data.title,
      embedding,
      metadata: {
        category: entry.data.category,
        tags: entry.data.tags,
        date: entry.data.date_created,
      },
    });
  }

  fs.writeFileSync('embeddings.json', JSON.stringify(embeddings));
}

embedAll();
```

---

## 10. Development Workflow

### Setup (First Time)

```bash
git clone <repo>
cd knowledge-portal
npm install
npm run dev          # Starts dev server at http://localhost:4321
```

### Daily Authoring

```bash
# Create new entry from template
cp templates/entry.md content/life-lessons/my-new-lesson.md
# Edit the file in your favorite editor
# Save — dev server hot-reloads automatically

npm run dev          # Running in background
```

### Build & Verify

```bash
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run lint         # Markdown lint check
```

### Export

```bash
npm run export:pdf   # Generate PDF archives
npm run export:graph # Regenerate graph data
```

### Backup

```bash
git add .
git commit -m "Add: lesson about X"
git push             # Push to private repo for cloud backup
```

---

## 11. Package.json Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "lint": "markdownlint content/",
    "build:search": "ts-node scripts/build-search-index.ts",
    "build:graph": "ts-node scripts/build-graph-data.ts",
    "export:pdf": "ts-node scripts/export-pdf.ts",
    "embed": "ts-node scripts/embed-content.ts",
    "ai:serve": "ts-node scripts/ai-chat-server.ts",
    "backup": "git add . && git commit -m \"Auto-backup\" && git push"
  }
}
```

---

## 12. Deployment Options

| Option | Cost | Complexity | Notes |
|---|---|---|---|
| **Local only** | $0 | Minimal | `npm run dev` or open `dist/index.html` |
| **GitHub Pages** | $0 | Low | Push to `gh-pages` branch |
| **Self-hosted** | ~$5/mo | Medium | VPS + Nginx + HTTPS |
| **Encrypted USB** | ~$20 | Minimal | Annual export to physical drive |

**Recommended:** Local + GitHub Pages (private repo) + annual USB backup.

---

## 13. Security & Privacy

- **No analytics, no trackers, no third-party scripts**
- **Content never leaves your machine** unless you push to a repo
- **If using GitHub:** private repo only; no public exposure
- **If self-hosting:** basic auth or VPN access only
- **AI layer is fully local** — Ollama runs on your machine, no API calls
- **Annual PDF export** encrypted and stored on physical media

---

## 14. Future Extensions

| Extension | Description | Complexity |
|---|---|---|
| **Voice recording** | Link audio notes to entries | Low |
| **Video messages** | Embed video letters for milestones | Medium |
| **Timeline milestones** | Interactive life timeline | Low |
| **Multi-author** | Spouse/grandparent contributions | Medium |
| **Mobile app** | Read entries on phone (PWA) | Medium |
| **Annual digest** | Auto-generate yearly summary PDF | Low |
| **AI timeline** | "What was I thinking at age 30?" AI summaries | Medium |

---

*Document version: 1.0 | Created: 2025-06-19*
