import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categories } from '../../config';

export const GET: APIRoute = async () => {
  const entries = await getCollection('entries');

  const data = entries.map(e => ({
    id: e.id,
    slug: e.slug,
    title: e.data.title,
    category: e.data.category,
    categoryName: categories.find(c => c.id === e.data.category)?.name || e.data.category,
    tags: e.data.tags,
    date_created: e.data.date_created,
    date_updated: e.data.date_updated || null,
    maturity: e.data.maturity,
    priority: e.data.priority,
    excerpt: e.data.excerpt || null,
    people_mentioned: e.data.people_mentioned || [],
    life_stage: e.data.life_stage || [],
    related: e.data.related || [],
    url: `/entries/${e.id}`,
  }));

  return new Response(JSON.stringify({
    count: data.length,
    entries: data,
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
