# Email Integration

The portal uses [Resend](https://resend.com) for transactional email. When `RESEND_API_KEY` is not set, all email calls print to the console instead — so local development works with zero config.

## Setup

### 1. Get a Resend API key

1. Create a free account at [resend.com](https://resend.com)
2. Go to **API Keys** → **Create API Key**
3. Copy the key (starts with `re_`)

### 2. Verify a sending domain (optional but recommended)

- Resend's free tier lets you send from `onboarding@resend.dev` without verification
- For custom domains: go to **Domains** in the Resend dashboard and follow the DNS instructions

### 3. Set environment variables

```bash
# .env
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=Knowledge Portal <no-reply@yourdomain.com>
SITE_URL=https://yourportal.example.com
```

If you skip domain verification, use:
```
EMAIL_FROM=Knowledge Portal <onboarding@resend.dev>
```

## Email Types

| Function | Trigger | Template |
|---|---|---|
| `sendWelcomeEmail(to, username)` | After subscription created | Welcome message with link to browse entries |
| `sendNewEntryNotification(to, entry)` | Cron job (immediate subscribers) | Entry title, excerpt, and "Read entry →" link |
| `sendSubscriptionDigest(to, entries, frequency)` | Cron job (daily/weekly) | List of new entries since last digest |
| `sendPasswordResetEmail(to, token)` | `/api/auth/forgot-password` | Reset link (expires 1 hour) |

All templates are defined in `src/lib/email.ts`. They share a base HTML layout.

## Cron Job — Sending Digests

Digests are sent by `POST /api/cron/send-emails`. You need to call this endpoint on a schedule from outside the app.

### What it does

1. Finds subscriptions due for their configured frequency
2. Collects entries created since `lastSentAt` (or all entries if never sent)
3. Filters by per-category subscription settings (if any)
4. Sends `sendNewEntryNotification` for immediate subscribers (one email per new entry)
5. Sends `sendSubscriptionDigest` for daily/weekly subscribers (one batched email)
6. Updates `lastSentAt` for each processed subscription

### Frequency thresholds

| Frequency | Sends when elapsed ≥ |
|---|---|
| `immediate` | 1 hour |
| `daily` | 24 hours |
| `weekly` | 7 days |

### Protecting the endpoint

Set `CRON_SECRET` in `.env`. Pass it as a bearer token:

```
Authorization: Bearer your_secret_here
```

Leave `CRON_SECRET` empty to allow unauthenticated calls (fine locally).

### Vercel Cron

In `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-emails",
      "schedule": "0 * * * *"
    }
  ]
}
```

Set `CRON_SECRET` in the Vercel project environment variables. Vercel sends requests with `Authorization: Bearer $CRON_SECRET` automatically when configured via the dashboard.

### GitHub Actions

```yaml
# .github/workflows/cron.yml
name: Email digest cron
on:
  schedule:
    - cron: '0 * * * *'   # hourly
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger email cron
        run: |
          curl -s -X POST "${{ secrets.SITE_URL }}/api/cron/send-emails" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### System cron (self-hosted)

```cron
0 * * * *  curl -s -X POST https://yourportal.example.com/api/cron/send-emails \
             -H "Authorization: Bearer your_secret"
```

## Testing Email Locally

Without `RESEND_API_KEY`, all sends are logged to stdout:

```
[email] RESEND_API_KEY not set — would send to: user@example.com | Weekly knowledge digest — 3 new entries
```

To test actual email delivery:
1. Set `RESEND_API_KEY` in `.env`
2. Set `SITE_URL=http://localhost:4321`
3. Create a subscription at `/subscribe`
4. Call the cron endpoint:
   ```bash
   curl -X POST http://localhost:4321/api/cron/send-emails
   ```
5. Check the inbox (or Resend dashboard → Emails)

## Troubleshooting

**No email received after setup**
- Check Resend dashboard → Emails for delivery status and error messages
- Verify `EMAIL_FROM` domain is verified in Resend, or use `onboarding@resend.dev`
- Check server logs for `[email] RESEND_API_KEY not set` — means env var isn't loaded

**Cron endpoint returns 401**
- `CRON_SECRET` is set but you're not passing the bearer token
- Leave `CRON_SECRET` empty for unauthenticated access, or pass `Authorization: Bearer <secret>`

**Digest shows 0 new entries**
- Entries are filtered by `date_created > lastSentAt`
- `lastSentAt` is updated even when there are no new entries, so old entries won't appear in future digests
- Reset `lastSentAt` to `NULL` in the database to re-send all entries on next cron run:
  ```sql
  UPDATE subscriptions SET last_sent_at = NULL;
  ```

**Password reset email not received**
- Tokens expire after 1 hour; request a new one if expired
- Check Resend dashboard for delivery errors
- Verify the user's email exists in the `users` table (the API returns 200 regardless to prevent enumeration)
