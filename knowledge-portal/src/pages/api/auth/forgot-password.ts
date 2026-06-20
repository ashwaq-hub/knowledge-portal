import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { getDb, schema } from '../../../lib/db/index';
import { getUserByEmail } from '../../../lib/auth';
import { sendPasswordResetEmail } from '../../../lib/email';
import { eq } from 'drizzle-orm';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export const POST: APIRoute = async ({ request }) => {
  let email: string = '';
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('json')) {
    const body = await request.json().catch(() => ({}));
    email = body.email?.toString().trim().toLowerCase() || '';
  } else {
    const fd = await request.formData();
    email = fd.get('email')?.toString().trim().toLowerCase() || '';
  }

  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Valid email required' }), { status: 400 });
  }

  // Always return 200 to avoid email enumeration
  const user = await getUserByEmail(email);
  if (!user) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  const db = getDb();
  const now = new Date();
  const token = crypto.randomBytes(32).toString('hex');

  // Invalidate any existing unused tokens for this user
  db.delete(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.userId, user.id))
    .run();

  db.insert(schema.passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
    createdAt: now,
  }).run();

  try {
    await sendPasswordResetEmail(email, token);
  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
