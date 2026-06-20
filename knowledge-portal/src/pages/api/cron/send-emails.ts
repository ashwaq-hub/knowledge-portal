import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getDb, schema } from '../../../lib/db/index';
import { getUserById } from '../../../lib/auth';
import {
  sendNewEntryNotification,
  sendSubscriptionDigest,
} from '../../../lib/email';
import { eq } from 'drizzle-orm';

const CRON_SECRET = import.meta.env.CRON_SECRET as string | undefined;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

function isDue(
  sub: { frequency: string; lastSentAt: Date | null },
  now: Date,
): boolean {
  if (!sub.lastSentAt) return true;
  const elapsed = now.getTime() - new Date(sub.lastSentAt).getTime();
  if (sub.frequency === 'immediate') return elapsed >= HOUR_MS;
  if (sub.frequency === 'daily') return elapsed >= DAY_MS;
  return elapsed >= WEEK_MS;
}

export const POST: APIRoute = async ({ request }) => {
  const auth = request.headers.get('authorization');
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const db = getDb();
  const now = new Date();
  const allEntries = await getCollection('entries');
  const allSubs = db.select().from(schema.subscriptions).all();

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const sub of allSubs) {
    if (!isDue(sub, now)) { skipped++; continue; }

    const since = sub.lastSentAt ? new Date(sub.lastSentAt) : new Date(0);

    const catSubs = db
      .select()
      .from(schema.categorySubscriptions)
      .where(eq(schema.categorySubscriptions.subscriptionId, sub.id))
      .all();
    const catFilter = catSubs.map(c => c.categoryId);

    const newEntries = allEntries.filter(e => {
      const created = new Date(e.data.date_created);
      if (created <= since) return false;
      if (catFilter.length > 0 && !catFilter.includes(e.data.category)) return false;
      return true;
    });

    // Always update lastSentAt so we don't poll constantly for empty periods
    db.update(schema.subscriptions)
      .set({ lastSentAt: now, updatedAt: now })
      .where(eq(schema.subscriptions.id, sub.id))
      .run();

    if (newEntries.length === 0) { skipped++; continue; }

    const user = await getUserById(sub.userId);
    if (!user) { skipped++; continue; }

    try {
      if (sub.frequency === 'immediate') {
        for (const entry of newEntries) {
          await sendNewEntryNotification(user.email, entry);
        }
      } else {
        await sendSubscriptionDigest(
          user.email,
          newEntries,
          sub.frequency as 'daily' | 'weekly',
        );
      }
      sent++;
    } catch (err) {
      errors.push(`${user.email}: ${err instanceof Error ? err.message : String(err)}`);
      skipped++;
    }
  }

  return new Response(
    JSON.stringify({ sent, skipped, errors: errors.length ? errors : undefined }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
