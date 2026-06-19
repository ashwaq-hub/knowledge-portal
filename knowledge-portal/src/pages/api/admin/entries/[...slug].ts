import fs from 'node:fs';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { readEntryFromDisk, writeEntryFile, deleteEntryFile, getEntryPath, type EntryFormData, ENTRIES_DIR } from '../../../../lib/content';

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.currentUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const slug = params.slug as string;
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
  }

  const entries = await getCollection('entries');
  const entry = entries.find(e => e.id === slug);
  if (!entry) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  const filePath = getEntryPath(entry.data.category, slug.split('/').pop()!);
  const onDisk = readEntryFromDisk(filePath);

  return new Response(JSON.stringify({
    id: entry.id,
    title: entry.data.title,
    category: entry.data.category,
    tags: entry.data.tags,
    maturity: entry.data.maturity,
    excerpt: entry.data.excerpt || '',
    body: onDisk?.data.body || '',
    date_created: entry.data.date_created,
    date_updated: entry.data.date_updated,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request, params, locals }) => {
  if (!locals.currentUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const slug = params.slug as string;
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
  }

  let body: EntryFormData;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parts = slug.split('/');
  const entrySlug = parts.pop()!;
  const category = parts.join('/') || body.category;

  try {
    writeEntryFile(body, entrySlug);
    return new Response(JSON.stringify({ success: true, slug }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to update entry' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.currentUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const slug = params.slug as string;
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
  }

  const parts = slug.split('/');
  const entrySlug = parts.pop()!;
  const category = parts.join('/');

  const filePath = getEntryPath(category, entrySlug);
  const exists = fs.existsSync(filePath);

  const ok = deleteEntryFile(category, entrySlug);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Not found', path: filePath, exists, slug, category, entrySlug, entriesDir: ENTRIES_DIR }), { status: 404 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
