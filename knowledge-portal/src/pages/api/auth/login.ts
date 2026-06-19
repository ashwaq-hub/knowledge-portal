import type { APIRoute } from 'astro';
import { verifyPassword, getUserByEmail, createSession, SESSION_COOKIE, SESSION_DURATION } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  let email: string | undefined;
  let password: string | undefined;
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('json')) {
    const body = await request.json();
    email = body.email?.toString().trim().toLowerCase();
    password = body.password?.toString();
  } else {
    const formData = await request.formData();
    email = formData.get('email')?.toString().trim().toLowerCase();
    password = formData.get('password')?.toString();
  }

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
  }

  const sessionToken = await createSession(user.id);
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
