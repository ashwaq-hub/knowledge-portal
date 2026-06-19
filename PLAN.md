# Personal Knowledge Portal — Master Plan

> A durable, personal knowledge archive built to outlast you — structured so your children and future generations can navigate, search, and benefit from decades of your accumulated wisdom.

---

## Vision

Generational knowledge loss is the single largest wealth transfer failure. A parent spends 30+ years accumulating judgment, mistakes, frameworks, stories, and skills. When they pass, nearly all of it evaporates.

This portal changes that. It is **not a blog, not a social profile, not a journal**. It is a **personal knowledge vault** — designed for durability, searchability, and intergenerational handover.

**Core principle:** Open, local-first, vendor-free. Your children should be able to open this archive on any computer in 2075 with nothing more than a text editor.

---

## Core Content Categories

| # | Category | What It Captures | Example Entries |
|---|---|---|---|
| 1 | **Life Lessons** | Hard-earned insights, mistakes, what you'd tell your younger self | "The negotiation mistake that cost me $20K" |
| 2 | **Decision Frameworks** | How you think about big choices | "How I decide between safety and growth" |
| 3 | **Financial Wisdom** | Money philosophy, investment lessons, wealth mistakes & wins | "Why I bought that house, and what I'd do differently" |
| 4 | **Family History** | Stories of grandparents, origins, traditions, annotated photos | "Grandfather's journey from village to city" |
| 5 | **Practical Skills** | How-tos: cooking, fixing, negotiating, leading, parenting | "How to change a tire, negotiate a salary, calm a crying baby" |
| 6 | **Book & Knowledge Library** | Books that shaped you, key takeaways, reading paths | "5 books that changed how I think about money" |
| 7 | **Values & Principles** | What you stand for, non-negotiables, how you define a good life | "The 7 principles I never compromise on" |
| 8 | **Letters to the Future** | Time-capsule letters for specific life moments | "Read this when you get your first rejection letter" |
| 9 | **Career & Craft** | Professional lessons, industry insights, mentorship notes | "What no one tells you about leading a team of 20" |
| 10 | **Health & Wellness** | Body/mind lessons, aging, fitness, mental health | "What I learned about stress at 40" |

---

## Design Principles

1. **Flat files over databases** — Markdown, not SQL. Readable forever.
2. **No vendor lock-in** — No SaaS dependency. Runs on any machine.
3. **Versioned thinking** — Git history tracks how your ideas evolved.
4. **Searchable and linked** — Full-text search + knowledge graph connections.
5. **Offline-first** — Works without internet. Always accessible.
6. **Export to physical** — Annual PDF archive for printed handover.
7. **AI-optional** — Conversational layer is additive, not required.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Content Layer                    │
│  Markdown files with YAML frontmatter             │
│  /content/{category}/{entry}.md                   │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│                Processing Layer                   │
│  Astro (static site generator)                    │
│  - Transforms MD → HTML                           │
│  - Builds search index (client-side)              │
│  - Generates knowledge graph data                 │
│  - Produces PDF exports                           │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│               Presentation Layer                  │
│  Static HTML/CSS/JS (no server runtime)           │
│  - Category pages, timeline view                  │
│  - Full-text search (FlexSearch)                  │
│  - Knowledge graph visualization (D3/Sigma)       │
│  - Responsive, dark mode, print-friendly          │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│                Optional AI Layer                  │
│  Ollama + embeddings (local, private)             │
│  - "Ask my father/mother" conversational Q&A      │
│  - Voice synthesis for reading entries aloud       │
└─────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Repository structure and content templates
- Astro static site generator setup
- Basic navigation, search, and styling
- First 10-15 sample entries

### Phase 2: Knowledge Graph (Week 3-4)
- YAML frontmatter and tagging system
- Knowledge graph visualization
- Related entry linking
- Timeline and category views
- PDF export functionality

### Phase 3: Content Deep-Dive (Month 2-3)
- Write content across all 10 categories
- Scan and annotate old photos
- Record video/audio notes linked to entries
- Create "Letters to the Future" for key milestones
- Build the book/knowledge library section

### Phase 4: AI Layer (Optional, Month 4)
- Embed content as vector embeddings
- Connect local LLM (Ollama) for conversational access
- "Ask my father/mother" Q&A interface
- Voice synthesis for reading entries

### Phase 5: Handover Package (Ongoing)
- "How to Use This" guide for children
- Annual backup process documentation
- Physical backup setup (encrypted USB)
- Family onboarding

---

## Success Metrics

- **Content depth:** 100+ entries across all 10 categories
- **Link density:** Average 3+ related entries per item
- **Search quality:** Any entry findable in <3 seconds
- **Export reliability:** Clean PDF output for any category
- **Durability:** Archive opens and renders on a fresh machine with zero setup beyond git clone + node install

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Content becomes overwhelming | High | Structured templates, incremental writing |
| Tech becomes obsolete | Medium | Markdown is 50+ year durable format |
| Family doesn't know how to use it | Medium | Handover guide + simple UI |
| Private data exposure | High | Local-first, no cloud by default, encryption options |
| Writing momentum lost | High | Start small, 1 entry/week minimum |

---

## Key Decisions Required

1. **Tone**: Direct advice vs. storytelling vs. both? *(Recommend: both — stories stick, advice is actionable)*
2. **Privacy scope**: Fully private vs. some entries shareable with family?
3. **AI layer**: Conversational "chat with your knowledge" feature?
4. **Update cadence**: Ongoing (life happens) vs. batch (dedicated writing sessions)?
5. **Physical artifact**: Annual printed book? Encrypted USB? Both?

---

*Document version: 1.0 | Created: 2025-06-19*
