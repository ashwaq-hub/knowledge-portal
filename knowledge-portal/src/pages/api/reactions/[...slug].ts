import type { APIRoute } from 'astro';
import { getDb, schema } from '../../../lib/db/index';
import { getSessionUserId, SESSION_COOKIE } from '../../../lib/auth';
import { eq, and } from 'drizzle-orm';

const VALID_TYPES = ['like', 'love', 'fire', 'insightful'] as const;
type ReactionType = typeof VALID_TYPES[number];

export const GET: APIRoute = async ({ params }) => {
  const entryId = params.slug;
  if (!entryId) {
    return new Response(JSON.stringify({ error: 'Missing entry ID' }), { status: 400 });
  }

  const db = getDb();
  const rows = db
    .select()
    .from(schema.reactions)
    .where(eq(schema.reactions.entryId, entryId))
    .all();

  // Aggregate counts per type
  const counts: Record<string, number> = { like: 0, love: 0, fire: 0, insightful: 0 };
  const userIds: Record<string, number[]> = { like: [], love: [], fire: [], insightful: [] };
  for (const r of rows) {
    counts[r.type] = (counts[r.type] || 0) + 1;
    if (!userIds[r.type]) userIds[r.type] = [];
    userIds[r.type].push(r.userId);
  }

  return new Response(JSON.stringify({ counts, userIds }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, params, cookies }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
  }
  const userId = await getSessionUserId(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
  }

  const entryId = params.slug;
  if (!entryId) {
    return new Response(JSON.stringify({ error: 'Missing entry ID' }), { status: 400 });
  }

  const data = await request.json().catch(() => ({})) as { type?: string };
  const type = data.type as ReactionType | undefined;
  if (!type || !VALID_TYPES.includes(type)) {
    return new Response(JSON.stringify({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }), { status: 400 });
  }

  const db = getDb();
  const existing = db
    .select()
    .from(schema.reactions)
    .where(
      and(
        eq(schema.reactions.userId, userId),
        eq(schema.reactions.entryId, entryId),
        eq(schema.reactions.type, type),
      ),
    )
    .get();

  if (existing) {
    // Toggle off
    db.delete(schema.reactions).where(eq(schema.reactions.id, existing.id)).run();
    return new Response(JSON.stringify({ action: 'removed', type }), { status: 200 });
  }

  // Toggle on
  db.insert(schema.reactions).values({
    userId,
    entryId,
    type,
    createdAt: new Date(),
  }).run();

  return new Response(JSON.stringify({ action: 'added', type }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
