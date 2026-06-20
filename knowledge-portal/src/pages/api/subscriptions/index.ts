import type { APIRoute } from 'astro';
import { getDb, schema } from '../../../lib/db/index';
import { getSessionUserId, SESSION_COOKIE } from '../../../lib/auth';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
  }
  const userId = await getSessionUserId(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
  }

  const db = getDb();
  const sub = db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId)).get();
  if (!sub) {
    return new Response(JSON.stringify({ subscribed: false }), { status: 200 });
  }

  const catSubs = db.select().from(schema.categorySubscriptions)
    .where(eq(schema.categorySubscriptions.subscriptionId, sub.id))
    .all();

  return new Response(JSON.stringify({
    subscribed: true,
    frequency: sub.frequency,
    categories: catSubs.map(c => c.categoryId),
  }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
  }
  const userId = await getSessionUserId(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
  }

  const data = await request.json().catch(() => ({})) as { frequency?: string; categories?: string[] };
  const frequency = (['immediate', 'daily', 'weekly'].includes(data.frequency || '') ? data.frequency : 'weekly') as 'immediate' | 'daily' | 'weekly';
  const categoryIds: string[] = Array.isArray(data.categories) ? data.categories : [];

  const db = getDb();
  const now = new Date();

  const existing = db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId)).get();

  let subId: number;
  if (existing) {
    db.update(schema.subscriptions)
      .set({ frequency, updatedAt: now })
      .where(eq(schema.subscriptions.userId, userId))
      .run();
    subId = existing.id;
    db.delete(schema.categorySubscriptions).where(eq(schema.categorySubscriptions.subscriptionId, subId)).run();
  } else {
    const result = db.insert(schema.subscriptions).values({ userId, frequency, createdAt: now, updatedAt: now }).run();
    subId = Number(result.lastInsertRowid);
  }

  for (const categoryId of categoryIds) {
    db.insert(schema.categorySubscriptions).values({ subscriptionId: subId, categoryId }).run();
  }

  return new Response(JSON.stringify({ success: true, frequency, categories: categoryIds }), { status: 200 });
};

export const DELETE: APIRoute = async ({ cookies }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
  }
  const userId = await getSessionUserId(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
  }

  const db = getDb();
  db.delete(schema.subscriptions).where(eq(schema.subscriptions.userId, userId)).run();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
