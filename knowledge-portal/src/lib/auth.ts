import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { getDb, schema } from './db/index';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 10;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: number): Promise<string> {
  const db = getDb();
  const token = generateSessionToken();
  const now = new Date();
  db.insert(schema.sessions).values({
    userId,
    token,
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
    createdAt: now,
  }).run();
  return token;
}

export async function getSessionUserId(token: string): Promise<number | null> {
  const db = getDb();
  const session = db.select().from(schema.sessions).where(eq(schema.sessions.token, token)).get();
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    db.delete(schema.sessions).where(eq(schema.sessions.token, token)).run();
    return null;
  }
  return session.userId;
}

export async function getUserById(id: number) {
  const db = getDb();
  return db.select().from(schema.users).where(eq(schema.users.id, id)).get();
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  return db.select().from(schema.users).where(eq(schema.users.email, email)).get();
}

export async function getUserByUsername(username: string) {
  const db = getDb();
  return db.select().from(schema.users).where(eq(schema.users.username, username)).get();
}

export async function deleteSession(token: string) {
  const db = getDb();
  db.delete(schema.sessions).where(eq(schema.sessions.token, token)).run();
}

export const SESSION_COOKIE = 'session_token';
export const SESSION_DURATION = SESSION_DURATION_MS;
