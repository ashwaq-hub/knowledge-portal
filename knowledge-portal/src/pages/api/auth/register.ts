import type { APIRoute } from 'astro';
import { hashPassword, getUserByEmail, getUserByUsername, createSession, SESSION_COOKIE, SESSION_DURATION } from '../../../lib/auth';
import { getDb, schema } from '../../../lib/db/index';

export const POST: APIRoute = async ({ request, cookies }) => {
  let email: string | undefined;
  let username: string | undefined;
  let password: string | undefined;
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('json')) {
    const body = await request.json();
    email = body.email?.toString().trim().toLowerCase();
    username = body.username?.toString().trim();
    password = body.password?.toString();
  } else {
    const formData = await request.formData();
    email = formData.get('email')?.toString().trim().toLowerCase();
    username = formData.get('username')?.toString().trim();
    password = formData.get('password')?.toString();
  }

  if (!email || !username || !password) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
  }

  if (password.length < 8) {
    return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), { status: 400 });
  }

  const existingEmail = await getUserByEmail(email);
  if (existingEmail) {
    return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 409 });
  }

  const existingUsername = await getUserByUsername(username);
  if (existingUsername) {
    return new Response(JSON.stringify({ error: 'Username already taken' }), { status: 409 });
  }

  const db = getDb();
  const now = new Date();

  const result = db.insert(schema.users).values({
    email,
    username,
    passwordHash: hashPassword(password),
    createdAt: now,
    updatedAt: now,
  }).run();

  const userId = Number(result.lastInsertRowid);
  const sessionToken = await createSession(userId);

  cookies.set(SESSION_COOKIE, sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
