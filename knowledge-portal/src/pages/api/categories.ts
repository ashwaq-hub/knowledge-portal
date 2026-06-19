import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categories } from '../../config';

export const GET: APIRoute = async () => {
  const entries = await getCollection('entries');

  const byCategory = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    description: cat.description,
    entryCount: entries.filter(e => e.data.category === cat.id).length,
  }));

  const totalTagCount = [...new Set(entries.flatMap(e => e.data.tags))].length;
  const maturityBreakdown = {
    draft: entries.filter(e => e.data.maturity === 'draft').length,
    reviewed: entries.filter(e => e.data.maturity === 'reviewed').length,
    final: entries.filter(e => e.data.maturity === 'final').length,
  };
  const priorityBreakdown = {
    low: entries.filter(e => e.data.priority === 'low').length,
    medium: entries.filter(e => e.data.priority === 'medium').length,
    high: entries.filter(e => e.data.priority === 'high').length,
    critical: entries.filter(e => e.data.priority === 'critical').length,
  };

  return new Response(JSON.stringify({
    totalEntries: entries.length,
    totalCategories: categories.length,
    totalTags: totalTagCount,
    categories: byCategory,
    maturityBreakdown,
    priorityBreakdown,
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
