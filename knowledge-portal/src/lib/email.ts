import type { CollectionEntry } from 'astro:content';

const SITE_URL = import.meta.env.SITE_URL || 'http://localhost:4321';
const FROM_EMAIL = import.meta.env.EMAIL_FROM || 'Knowledge Portal <no-reply@example.com>';
const API_KEY = import.meta.env.RESEND_API_KEY as string | undefined;

type Entry = CollectionEntry<'entries'>;

function getResend() {
  if (!API_KEY) return null;
  // Lazy import so missing resend doesn't crash at import time
  const { Resend } = require('resend') as typeof import('resend');
  return new Resend(API_KEY);
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const client = getResend();
  if (!client) {
    console.log('[email] RESEND_API_KEY not set — would send to:', to, '|', subject);
    return;
  }
  const { error } = await client.emails.send({ from: FROM_EMAIL, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

function entryUrl(entry: Entry): string {
  return `${SITE_URL}/entries/${entry.id}`;
}

function categoryLabel(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function entryCard(entry: Entry): string {
  const url = entryUrl(entry);
  const date = new Date(entry.data.date_created).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  return `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">
        ${categoryLabel(entry.data.category)} · ${date}
      </div>
      <a href="${url}" style="font-size:16px;font-weight:600;color:#1f2937;text-decoration:none;">
        ${entry.data.title}
      </a>
      ${entry.data.excerpt ? `<p style="font-size:14px;color:#4b5563;margin:6px 0 0;">${entry.data.excerpt}</p>` : ''}
      <a href="${url}" style="display:inline-block;margin-top:10px;font-size:13px;color:#7c3aed;text-decoration:none;">
        Read entry →
      </a>
    </div>
  `;
}

function baseTemplate(body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
        <div style="font-size:18px;font-weight:700;color:#1f2937;margin-bottom:24px;">
          📖 Personal Knowledge Portal
        </div>
        ${body}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="font-size:12px;color:#9ca3af;margin:0;">
          You're receiving this because you subscribed to updates.
          <a href="${SITE_URL}/subscribe" style="color:#7c3aed;">Manage preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function sendWelcomeEmail(to: string, username: string): Promise<void> {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#1f2937;">Welcome, ${username}!</h2>
    <p style="color:#4b5563;">You've subscribed to the Knowledge Portal. You'll receive updates
       when new entries are added based on your preferences.</p>
    <a href="${SITE_URL}/entries" style="display:inline-block;margin-top:16px;padding:10px 20px;
       background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
       Browse entries
    </a>
  `);
  await send(to, 'Welcome to the Knowledge Portal', html);
}

export async function sendNewEntryNotification(to: string, entry: Entry): Promise<void> {
  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937;">New entry added</h2>
    ${entryCard(entry)}
  `);
  await send(to, `New entry: ${entry.data.title}`, html);
}

export async function sendSubscriptionDigest(
  to: string,
  entries: Entry[],
  frequency: 'daily' | 'weekly' | 'immediate',
): Promise<void> {
  const label = frequency === 'daily' ? 'Daily' : 'Weekly';
  const count = entries.length;
  const html = baseTemplate(`
    <h2 style="margin:0 0 4px;font-size:20px;color:#1f2937;">${label} digest</h2>
    <p style="color:#6b7280;margin:0 0 20px;font-size:14px;">
      ${count} new ${count === 1 ? 'entry' : 'entries'}
    </p>
    ${entries.map(e => entryCard(e)).join('')}
    <a href="${SITE_URL}/entries" style="display:inline-block;margin-top:8px;padding:10px 20px;
       background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
       Browse all entries
    </a>
  `);
  await send(to, `${label} knowledge digest — ${count} new ${count === 1 ? 'entry' : 'entries'}`, html);
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${SITE_URL}/reset-password/${token}`;
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#1f2937;">Reset your password</h2>
    <p style="color:#4b5563;">Click the button below to reset your password. This link expires in 1 hour.</p>
    <a href="${resetUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;
       background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
       Reset password
    </a>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;">
       If you didn't request this, ignore this email. Your password won't change.
    </p>
  `);
  await send(to, 'Reset your Knowledge Portal password', html);
}
