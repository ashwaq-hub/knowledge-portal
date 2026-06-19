import type { CollectionEntry } from 'astro:content';
import { categories } from '../config';

export interface PDFSection {
  title: string;
  entries: CollectionEntry<'entries'>[];
}

export function buildPDFSections(entries: CollectionEntry<'entries'>[]): PDFSection[] {
  return categories
    .map(cat => ({
      title: `${cat.icon} ${cat.name}`,
      entries: entries
        .filter(e => e.data.category === cat.id)
        .sort((a, b) => new Date(b.data.date_created).getTime() - new Date(a.data.date_created).getTime()),
    }))
    .filter(section => section.entries.length > 0);
}

export function generatePDFHTML(sections: PDFSection[]): string {
  const entriesHTML = sections.map(section => `
    <div class="pdf-section page-break">
      <h1 class="pdf-section-title">${section.title}</h1>
      ${section.entries.map(entry => `
        <article class="pdf-entry">
          <h2 class="pdf-entry-title">${entry.data.title}</h2>
          <div class="pdf-entry-meta">
            <span>Created: ${new Date(entry.data.date_created).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            ${entry.data.tags.length ? `<span>Tags: ${entry.data.tags.join(', ')}</span>` : ''}
          </div>
          ${entry.data.excerpt ? `<p class="pdf-entry-excerpt">${entry.data.excerpt}</p>` : ''}
          <div class="pdf-entry-body">${entry.body || ''}</div>
        </article>
      `).join('')}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Knowledge Portal Export</title>
  <style>
    @page { margin: 2cm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: black; }
    .pdf-section { margin-bottom: 2cm; }
    .pdf-section-title { font-size: 24pt; margin-bottom: 1cm; border-bottom: 2px solid #000; padding-bottom: 0.5cm; }
    .pdf-entry { margin-bottom: 1.5cm; page-break-inside: avoid; }
    .pdf-entry-title { font-size: 18pt; margin-bottom: 0.3cm; }
    .pdf-entry-meta { font-size: 10pt; color: #666; margin-bottom: 0.5cm; }
    .pdf-entry-meta span { margin-right: 1cm; }
    .pdf-entry-excerpt { font-style: italic; margin-bottom: 0.5cm; color: #444; }
    .pdf-entry-body { font-size: 11pt; }
    .pdf-entry-body h2 { font-size: 14pt; margin: 0.5cm 0 0.3cm; }
    .pdf-entry-body p { margin-bottom: 0.3cm; }
    .page-break { page-break-before: always; }
    .page-break:first-of-type { page-break-before: avoid; }
  </style>
</head>
<body>
  <div class="pdf-cover" style="text-align: center; padding-top: 5cm;">
    <h1 style="font-size: 36pt; margin-bottom: 1cm;">Personal Knowledge Portal</h1>
    <p style="font-size: 14pt; color: #666;">Complete Archive Export</p>
    <p style="font-size: 12pt; color: #666; margin-top: 0.5cm;">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <div class="page-break">
    <h1 style="font-size: 24pt; margin-bottom: 0.5cm;">Table of Contents</h1>
    <ul style="font-size: 12pt; line-height: 2;">
      ${sections.map(s => `<li>${s.title} (${s.entries.length} entries)</li>`).join('')}
    </ul>
  </div>
  ${entriesHTML}
</body>
</html>`;
}
