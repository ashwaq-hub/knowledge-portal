import type { CollectionEntry } from 'astro:content';

export interface SearchEntry {
  id: string;
  title: string;
  category: string;
  tags: string[];
  excerpt: string;
  date: string;
  body: string;
}

export function buildSearchIndex(entries: CollectionEntry<'entries'>[]): SearchEntry[] {
  return entries.map(entry => ({
    id: entry.id,
    title: entry.data.title,
    category: entry.data.category,
    tags: entry.data.tags,
    excerpt: entry.data.excerpt || '',
    date: entry.data.date_created.toISOString(),
    body: entry.body || '',
  }));
}
