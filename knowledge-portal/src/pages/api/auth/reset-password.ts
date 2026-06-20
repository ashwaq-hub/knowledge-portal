import type { APIRoute } from 'astro';
import { getDb, schema } from '../../../lib/db/index';
import { hashPassword, SESSION_COOKIE, SESSION_DURATION, createSession } from '../../../lib/auth';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, cookies }) => {
  let token: string = '';
  let password: string = '';
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('json')) {
    const body = await request.json().catch(() => ({}));
    token = body.token?.toString() || '';
    password = body.password?.toString() || '';
  } else {
    const fd = await request.formData();
    token = fd.get('token')?.toString() || '';
    password = fd.get('password')?.toString() || '';
  }

  if (!token || !password) {
    return new Response(JSON.stringify({ error: 'Token and password are required' }), { status: 400 });
  }

  if (password.length < 8) {
    return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), { status: 400 });
  }

  const db = getDb();
  const now = new Date();

  const resetToken = db
    .select()
    .from(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.token, token))
    .get();

  if (!resetToken) {
    return new Response(JSON.stringify({ error: 'Invalid or expired reset link' }), { status: 400 });
  }

  if (resetToken.usedAt) {
    return new Response(JSON.stringify({ error: 'Reset link already used' }), { status: 400 });
  }

  if (new Date(resetToken.expiresAt) < now) {
    db.delete(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.id, resetToken.id))
      .run();
    return new Response(JSON.stringify({ error: 'Reset link has expired' }), { status: 400 });
  }

  // Update password
  db.update(schema.users)
    .set({ passwordHash: hashPassword(password), updatedAt: now })
    .where(eq(schema.users.id, resetToken.userId))
    .run();

  // Mark token as used
  db.update(schema.passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(schema.passwordResetTokens.id, resetToken.id))
    .run();

  // Invalidate all sessions for this user (security: log out all devices)
  db.delete(schema.sessions)
    .where(eq(schema.sessions.userId, resetToken.userId))
    .run();

  // Create a new session so user is logged in immediately
  const sessionToken = await createSession(resetToken.userId);
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
