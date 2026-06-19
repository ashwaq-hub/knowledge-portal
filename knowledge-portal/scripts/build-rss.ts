import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.resolve(import.meta.dirname, '..', 'src', 'content', 'entries');
const OUT_DIR = path.resolve(import.meta.dirname, '..', 'dist');

const CATEGORY_NAMES: Record<string, string> = {
  'life-lessons': 'Life Lessons',
  'decision-frameworks': 'Decision Frameworks',
  'financial-wisdom': 'Financial Wisdom',
  'family-history': 'Family History',
  'practical-skills': 'Practical Skills',
  'book-library': 'Book Library',
  'values': 'Values & Principles',
  'letters-to-future': 'Letters to the Future',
  'career-craft': 'Career & Craft',
  'health-wellness': 'Health & Wellness',
};

function loadEntries() {
  const entries: {
    slug: string; title: string; category: string; tags: string[];
    date_created: string; date_updated?: string; maturity: string;
    excerpt: string; content: string;
  }[] = [];

  for (const cat of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    const catDir = path.join(CONTENT_DIR, cat.name);
    for (const file of fs.readdirSync(catDir).filter(f => f.endsWith('.md'))) {
      const raw = fs.readFileSync(path.join(catDir, file), 'utf-8');
      const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
      if (!m) continue;
      const fm = m[1];
      entries.push({
        slug: file.replace(/\.md$/, ''),
        title: fm.match(/^title:\s+"(.+)"$/m)?.[1] || file,
        category: cat.name,
        tags: (fm.match(/^tags:\s*\[([\s\S]*?)\]/m)?.[1] || '')
          .split(',').map(t => t.trim().replace(/"/g, '')).filter(Boolean),
        date_created: fm.match(/^date_created:\s*(.+)$/m)?.[1]?.trim() || '',
        date_updated: fm.match(/^date_updated:\s*(.+)$/m)?.[1]?.trim(),
        maturity: fm.match(/^maturity:\s*(.+)$/m)?.[1]?.trim() || 'draft',
        excerpt: fm.match(/^excerpt:\s+"(.+)"$/m)?.[1] || '',
        content: raw.slice(m[0].length).trim(),
      });
    }
  }
  entries.sort((a, b) => ((b.date_updated || b.date_created) < (a.date_updated || a.date_created) ? -1 : 1));
  return entries;
}

function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function strip(md: string) { return md.replace(/^###?\s+/gm, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[(.+?)\]\(.+?\)/g, '$1').replace(/>\s+/g, '').replace(/^-{3,}$/gm, '').trim(); }

async function main() {
  const entries = loadEntries();
  console.log(`Generating RSS/Atom for ${entries.length} entries...`);

  const siteUrl = process.env.SITE_URL || 'https://knowledge.example.com';

  const rssItems = entries.map(e => {
    const url = `${siteUrl}/entries/${e.category}/${e.slug}/`;
    const desc = esc(e.excerpt || strip(e.content).slice(0, 300));
    const pubDate = e.date_created ? new Date(e.date_created).toUTCString() : new Date().toUTCString();
    const tags = e.tags.map(t => `      <category>${esc(t)}</category>`).join('\n');
    return `    <item>
      <title>${esc(e.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      <category>${esc(CATEGORY_NAMES[e.category] || e.category)}</category>
${tags}
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Personal Knowledge Portal</title>
    <link>${siteUrl}</link>
    <description>A durable archive of life lessons, frameworks, and intergenerational wisdom</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

  const atomEntries = entries.map(e => {
    const url = `${siteUrl}/entries/${e.category}/${e.slug}/`;
    const summary = esc(e.excerpt || strip(e.content).slice(0, 300));
    const cats = `    <category term="${esc(CATEGORY_NAMES[e.category] || e.category)}"/>`;
    const tags = e.tags.map(t => `    <category term="${esc(t)}"/>`).join('\n');
    return `  <entry>
    <title>${esc(e.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <published>${e.date_created || new Date().toISOString()}</published>
    <updated>${e.date_updated || e.date_created || new Date().toISOString()}</updated>
    <summary type="text">${summary}</summary>
${cats}
${tags}
    <author>
      <name>Legacy Author</name>
    </author>
  </entry>`;
  }).join('\n');

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Personal Knowledge Portal</title>
  <link href="${siteUrl}"/>
  <link href="${siteUrl}/atom.xml" rel="self" type="application/atom+xml"/>
  <updated>${new Date().toISOString()}</updated>
  <id>${siteUrl}/</id>
  <author>
    <name>Legacy Author</name>
  </author>
${atomEntries}
</feed>`;

  fs.writeFileSync(path.join(OUT_DIR, 'rss.xml'), rss, 'utf-8');
  fs.writeFileSync(path.join(OUT_DIR, 'atom.xml'), atom, 'utf-8');

  console.log(`  \u2713 rss.xml (${(rss.length / 1024).toFixed(1)} kB)`);
  console.log(`  \u2713 atom.xml (${(atom.length / 1024).toFixed(1)} kB)`);
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
