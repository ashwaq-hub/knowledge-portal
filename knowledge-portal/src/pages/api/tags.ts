import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const entries = await getCollection('entries');

  const tagMap = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }

  const tags = [...tagMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return new Response(JSON.stringify({ count: tags.length, tags }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
