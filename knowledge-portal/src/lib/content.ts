import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRIES_DIR = path.resolve(__dirname, '..', 'content', 'entries');

export interface EntryFormData {
  title: string;
  category: string;
  tags: string[];
  maturity: string;
  excerpt: string;
  body: string;
  date_created?: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function escapeYaml(value: string): string {
  return value.replace(/"/g, '\\"');
}

function formatFrontmatter(data: EntryFormData): string {
  const today = new Date().toISOString().split('T')[0];
  const dateCreated = data.date_created || today;
  const tagStr = JSON.stringify(data.tags);

  return `---
title: "${escapeYaml(data.title)}"
category: ${JSON.stringify(data.category)}
tags: ${tagStr}
date_created: ${dateCreated}
date_updated: ${today}
maturity: ${JSON.stringify(data.maturity || 'draft')}
excerpt: "${escapeYaml(data.excerpt || '')}"
---
`;
}

export function getEntryPath(category: string, slug: string): string {
  const catDir = path.join(ENTRIES_DIR, category);
  return path.join(catDir, `${slug}.md`);
}

export function readEntryFromDisk(filePath: string): { data: EntryFormData; raw: string } | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) return null;

    const frontmatter: Record<string, unknown> = {};
    for (const line of match[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*(.+)$/);
      if (kv) {
        let val: unknown = kv[2].trim();
        if (val === '[]' || val === '') val = [];
        else if (typeof val === 'string' && val.startsWith('[')) {
          try { val = JSON.parse(val.replace(/'/g, '"')); } catch {}
        }
        else if (typeof val === 'string') val = val.replace(/^["']|["']$/g, '');
        frontmatter[kv[1]] = val;
      }
    }

    return {
      data: {
        title: (frontmatter.title as string) || '',
        category: (frontmatter.category as string) || '',
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags as string[] : [],
        maturity: (frontmatter.maturity as string) || 'draft',
        excerpt: (frontmatter.excerpt as string) || '',
        body: match[2].trim(),
        date_created: frontmatter.date_created as string,
      },
      raw,
    };
  } catch {
    return null;
  }
}

export function writeEntryFile(data: EntryFormData, slug?: string, existingPath?: string): { slug: string; filePath: string } {
  const entrySlug = slug || slugify(data.title);
  const catDir = path.join(ENTRIES_DIR, data.category);

  if (!fs.existsSync(catDir)) {
    fs.mkdirSync(catDir, { recursive: true });
    const categoryMd = path.join(catDir, '_category.md');
    if (!fs.existsSync(categoryMd)) {
      fs.writeFileSync(categoryMd, `---\n# ${data.category}\n---\n`, 'utf-8');
    }
  }

  const filePath = path.join(catDir, `${entrySlug}.md`);
  const content = formatFrontmatter(data) + '\n' + data.body.trim() + '\n';
  fs.writeFileSync(filePath, content, 'utf-8');

  return { slug: entrySlug, filePath };
}

export function deleteEntryFile(category: string, slug: string): boolean {
  const filePath = getEntryPath(category, slug);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

export interface EntryListItem {
  id: string;
  slug: string;
  category: string;
  title: string;
  tags: string[];
  maturity: string;
  excerpt: string;
  date_created: string;
  date_updated: string;
}

export function listEntriesFromDisk(): EntryListItem[] {
  if (!fs.existsSync(ENTRIES_DIR)) return [];

  const entries: EntryListItem[] = [];
  const categories = fs.readdirSync(ENTRIES_DIR, { withFileTypes: true });

  for (const cat of categories) {
    if (!cat.isDirectory()) continue;
    const catDir = path.join(ENTRIES_DIR, cat.name);
    const files = fs.readdirSync(catDir);

    for (const file of files) {
      if (!file.endsWith('.md') || file.startsWith('_')) continue;
      const filePath = path.join(catDir, file);
      const parsed = readEntryFromDisk(filePath);
      if (!parsed) continue;

      const slug = file.replace(/\.md$/, '');
      entries.push({
        id: `${cat.name}/${slug}`,
        slug,
        category: cat.name,
        title: parsed.data.title,
        tags: parsed.data.tags,
        maturity: parsed.data.maturity,
        excerpt: parsed.data.excerpt,
        date_created: parsed.data.date_created || '',
        date_updated: '',
      });
    }
  }

  entries.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  return entries;
}
