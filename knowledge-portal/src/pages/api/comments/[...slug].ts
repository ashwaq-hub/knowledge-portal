import type { APIRoute } from 'astro';
import { getDb, schema } from '../../../lib/db/index';
import { getSessionUserId, getUserById, SESSION_COOKIE } from '../../../lib/auth';
import { eq, asc } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
  const entryId = params.slug;
  if (!entryId) {
    return new Response(JSON.stringify({ error: 'Missing entry ID' }), { status: 400 });
  }

  const db = getDb();
  const rows = db
    .select({
      id: schema.comments.id,
      userId: schema.comments.userId,
      parentId: schema.comments.parentId,
      body: schema.comments.body,
      createdAt: schema.comments.createdAt,
      username: schema.users.username,
    })
    .from(schema.comments)
    .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
    .where(eq(schema.comments.entryId, entryId))
    .orderBy(asc(schema.comments.createdAt))
    .all();

  return new Response(JSON.stringify(rows), {
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

  let body: string = '';
  let parentId: number | null = null;

  const ct = request.headers.get('content-type') || '';
  if (ct.includes('json')) {
    const data = await request.json();
    body = data.body?.toString().trim() || '';
    parentId = data.parentId ? Number(data.parentId) : null;
  } else {
    const fd = await request.formData();
    body = fd.get('body')?.toString().trim() || '';
    parentId = fd.get('parentId') ? Number(fd.get('parentId')) : null;
  }

  if (body.length < 2) {
    return new Response(JSON.stringify({ error: 'Comment is too short' }), { status: 400 });
  }
  if (body.length > 2000) {
    return new Response(JSON.stringify({ error: 'Comment exceeds 2000 characters' }), { status: 400 });
  }

  const db = getDb();
  const now = new Date();
  const result = db.insert(schema.comments).values({
    userId,
    entryId,
    parentId,
    body,
    createdAt: now,
    updatedAt: now,
  }).run();

  const id = Number(result.lastInsertRowid);
  const user = await getUserById(userId);

  return new Response(JSON.stringify({ id, userId, entryId, parentId, body, createdAt: now, username: user?.username }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
  }
  const userId = await getSessionUserId(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
  }

  const { id } = await request.json().catch(() => ({})) as { id?: number };
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing comment ID' }), { status: 400 });
  }

  const db = getDb();
  const comment = db.select().from(schema.comments).where(eq(schema.comments.id, id)).get();
  if (!comment) {
    return new Response(JSON.stringify({ error: 'Comment not found' }), { status: 404 });
  }
  if (comment.userId !== userId) {
    return new Response(JSON.stringify({ error: 'Not allowed' }), { status: 403 });
  }

  db.delete(schema.comments).where(eq(schema.comments.id, id)).run();
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
