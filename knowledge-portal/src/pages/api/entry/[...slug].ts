import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { categories } from '../../../config';

export const GET: APIRoute = async ({ params }) => {
  const entries = await getCollection('entries');
  const entry = entries.find(e => e.id === params.slug);

  if (!entry) {
    return new Response(JSON.stringify({ error: 'Entry not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = {
    id: entry.id,
    slug: entry.slug,
    title: entry.data.title,
    category: entry.data.category,
    categoryName: categories.find(c => c.id === entry.data.category)?.name || entry.data.category,
    tags: entry.data.tags,
    date_created: entry.data.date_created,
    date_updated: entry.data.date_updated || null,
    maturity: entry.data.maturity,
    priority: entry.data.priority,
    excerpt: entry.data.excerpt || null,
    people_mentioned: entry.data.people_mentioned || [],
    life_stage: entry.data.life_stage || [],
    related: entry.data.related || [],
    url: `/entries/${entry.id}`,
  };

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('entries');
  return entries.map(e => ({ params: { slug: e.id } }));
};
