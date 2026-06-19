import type { APIRoute } from 'astro';
import { writeEntryFile, listEntriesFromDisk, type EntryFormData } from '../../../../lib/content';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.currentUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const list = listEntriesFromDisk();

  return new Response(JSON.stringify(list), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.currentUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body: EntryFormData;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (!body.title || !body.category || !body.body) {
    return new Response(JSON.stringify({ error: 'Title, category, and body are required' }), { status: 400 });
  }

  const validCategories = [
    'values', 'life-lessons', 'career-craft', 'decision-frameworks',
    'practical-skills', 'financial-wisdom', 'health-wellness',
    'book-library', 'family-history', 'letters-to-future',
  ];

  if (!validCategories.includes(body.category)) {
    return new Response(JSON.stringify({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` }), { status: 400 });
  }

  try {
    const { slug } = writeEntryFile(body);
    return new Response(JSON.stringify({ success: true, slug }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to create entry' }), { status: 500 });
  }
};
