# Personal Knowledge Portal

A durable, personal knowledge archive — built to outlast you and designed to pass wisdom to future generations.

## Features

- **10 knowledge categories** — Life lessons, decision frameworks, financial wisdom, family history, practical skills, book reviews, values, letters to the future, career insights, and health & wellness
- **Full-text search** — Instant search across all entries
- **Knowledge graph** — Visualize connections between ideas
- **Timeline view** — Browse entries chronologically
- **Print-ready** — Export any page to PDF
- **Local-first** — No server required, works offline
- **Markdown-based** — Human-readable forever

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:4321
```

## Project Structure

```
knowledge-portal/
├── content/              # Knowledge entries (Markdown)
│   ├── life-lessons/
│   ├── decision-frameworks/
│   └── ...
├── src/
│   ├── components/      # UI components
│   ├── layouts/          # Page layouts
│   ├── pages/            # Routes
│   ├── styles/           # CSS
│   └── lib/              # Utilities
├── templates/            # Entry templates for new content
└── public/               # Static assets
```

## Adding Content

1. Copy a template from `/templates/`
2. Place it in the appropriate `/content/{category}/` folder
3. Edit the frontmatter and content
4. Save — the site updates automatically in dev mode

## Build for Production

```bash
npm run build    # Static site → /dist
npm run preview  # Preview production build
```

## Technology

- **Astro 5** — Static site generator
- **FlexSearch** — Client-side full-text search
- **Markdown** — Content format (50+ year durability)
- **CSS Custom Properties** — Theming without frameworks

## License

Private — Built with love for future generations.
