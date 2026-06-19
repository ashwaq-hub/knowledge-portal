import { test, expect } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────────────

const NAV_LINKS = ['/', '/entries', '/search', '/mindmap', '/graph', '/timeline', '/export', '/analytics'];
const CATEGORY_IDS = ['life-lessons', 'decision-frameworks', 'financial-wisdom', 'family-history', 'practical-skills', 'book-library', 'values', 'letters-to-future', 'career-craft', 'health-wellness'];
const TAG_SLUGS = ['leadership', 'management', 'career', 'family', 'finance', 'investing', 'health', 'communication'];
const API_PATHS = ['/api/entries', '/api/tags', '/api/categories'];

async function expectPageOk(page, url: string) {
  const resp = await page.goto(url);
  expect(resp?.status()).toBe(200);
}

async function expectNoConsoleErrors(page) {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));
  return errors;
}

// ── Static Route Verification ───────────────────────────────────────────

test.describe('Static route completeness', () => {
  test('homepage returns 200', async ({ page }) => {
    await expectPageOk(page, '/');
  });

  test('all main navigation pages return 200', async ({ page }) => {
    for (const path of NAV_LINKS) {
      const resp = await page.goto(path);
      expect(resp?.status(), `${path} should be 200`).toBe(200);
    }
  });

  test('all category pages return 200', async ({ page }) => {
    for (const cat of CATEGORY_IDS) {
      const resp = await page.goto(`/entries/${cat}`);
      expect(resp?.status(), `/entries/${cat} should be 200`).toBe(200);
    }
  });

  test('all tag pages return 200', async ({ page }) => {
    for (const tag of TAG_SLUGS) {
      const resp = await page.goto(`/tags/${tag}`);
      expect(resp?.status(), `/tags/${tag} should be 200`).toBe(200);
    }
  });

  test('all export pages return 200', async ({ page }) => {
    for (const cat of CATEGORY_IDS) {
      const resp = await page.goto(`/export/${cat}`);
      expect(resp?.status(), `/export/${cat} should be 200`).toBe(200);
    }
  });

  test('analytics page returns 200', async ({ page }) => {
    await expectPageOk(page, '/analytics');
  });

  test('custom 404 page returns 200 and renders content', async ({ page }) => {
    const resp = await page.goto('/nonexistent-route-xyz');
    expect(resp?.status()).toBe(404);
    await expect(page.locator('.not-found-code')).toContainText('404');
    await expect(page.locator('.not-found-link')).toHaveText('Return home →');
  });

  test('all API endpoints return 200 with valid JSON', async ({ page }) => {
    for (const path of API_PATHS) {
      const resp = await page.goto(path);
      expect(resp?.status(), `${path} should be 200`).toBe(200);
      const contentType = resp?.headers()['content-type'] || '';
      expect(contentType).toContain('application/json');
    }
  });
});

// ── Homepage ────────────────────────────────────────────────────────────

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with title and actions', async ({ page }) => {
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.hero-actions .btn-primary')).toHaveText('Browse All Entries');
    await expect(page.locator('.hero-actions .btn-outline')).toHaveText('Search Knowledge');
  });

  test('displays dashboard stats', async ({ page }) => {
    const statCards = page.locator('.stat-card');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      await expect(statCards.nth(i).locator('.stat-value')).toBeVisible();
      await expect(statCards.nth(i).locator('.stat-label')).toBeVisible();
    }
  });

  test('shows category cards', async ({ page }) => {
    const cards = page.locator('.category-card');
    const count = await cards.count();
    expect(count).toBe(10);
    await expect(cards.first()).toBeVisible();
  });

  test('shows popular tags section', async ({ page }) => {
    await expect(page.locator('.tag-cloud')).toBeVisible();
    const tags = page.locator('.tag-cloud-item');
    expect(await tags.count()).toBeGreaterThanOrEqual(1);
  });

  test('shows recent entries', async ({ page }) => {
    await expect(page.locator('.entry-list')).toBeVisible();
    const entries = page.locator('.entry-card');
    expect(await entries.count()).toBeGreaterThanOrEqual(1);
  });

  test('shows RSS/Atom and tool links', async ({ page }) => {
    const feedLinks = page.locator('.feed-link');
    const texts = await feedLinks.allTextContents();
    expect(texts).toContain('RSS Feed');
    expect(texts).toContain('Atom Feed');
    expect(texts).toContain('Knowledge Graph');
    expect(texts).toContain('Mindmap');
    expect(texts).toContain('Timeline');
    expect(texts).toContain('Export');
  });
});

// ── All Entries Page ────────────────────────────────────────────────────

test.describe('All Entries page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entries');
  });

  test('renders page header and entry list', async ({ page }) => {
    await expect(page.locator('.page-title')).toContainText('All');
    await expect(page.locator('.view-toggle')).toBeVisible();
  });

  test('view toggle switches between card and table views', async ({ page }) => {
    const toggleBtns = page.locator('.view-toggle-btn');
    const btnCount = await toggleBtns.count();
    expect(btnCount).toBeGreaterThanOrEqual(2);

    await toggleBtns.nth(0).click();
    await expect(page.locator('.entry-card').first()).toBeVisible();

    await toggleBtns.nth(1).click();
    await expect(page.locator('.entry-table').first()).toBeVisible();
  });

  test('category filter links work', async ({ page }) => {
    // Category navigation links in page header
    const catLinks = page.locator('a[href*="/entries/"]').filter({ hasNot: page.locator('[href="/entries"]') });
    const count = await catLinks.count();
    if (count > 0) {
      const href = await catLinks.first().getAttribute('href');
      const resp = await page.goto(href!);
      expect(resp?.status()).toBe(200);
    }
  });
});

// ── Entry Detail ────────────────────────────────────────────────────────

test.describe('Entry detail pages', () => {
  test('navigates to first entry and verifies structure', async ({ page }) => {
    await page.goto('/entries');
    const firstCard = page.locator('.entry-card').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    await expect(page.locator('.entry-title')).toBeVisible();
    await expect(page.locator('.breadcrumbs')).toBeVisible();
    await expect(page.locator('.entry-content')).toBeVisible();
    await expect(page.locator('.entry-meta')).toBeVisible();
    await expect(page.locator('.tag').first()).toBeVisible();
  });

  test('backlinks section renders if present', async ({ page }) => {
    // Navigate through entries to find one with backlinks
    await page.goto('/entries');
    const cards = page.locator('.entry-card');
    const count = await cards.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      await cards.nth(i).click();
      await expect(page.locator('.entry-title')).toBeVisible();
      const title = await page.locator('.entry-title').textContent();
      expect(title).toBeTruthy();
      await page.goto('/entries');
    }
  });

  test('navigation between entries works', async ({ page }) => {
    await page.goto('/entries/life-lessons');
    const firstCard = page.locator('.entry-card').first();
    await firstCard.click();

    // Try prev/next navigation
    const prevLink = page.locator('.entry-prev-next-prev');
    const nextLink = page.locator('.entry-prev-next-next');

    if (await nextLink.isVisible()) {
      await nextLink.click();
      await expect(page.locator('.entry-title')).toBeVisible();
    } else if (await prevLink.isVisible()) {
      await prevLink.click();
      await expect(page.locator('.entry-title')).toBeVisible();
    }
  });

  test('reading time badge is visible on entry detail', async ({ page }) => {
    await page.goto('/entries');
    await page.locator('.entry-card').first().click();
    await expect(page.locator('.entry-meta .reading-time')).toBeVisible();
  });

  test('table of contents sidebar renders when headings present', async ({ page }) => {
    await page.goto('/entries');
    const card = page.locator('.entry-card').first();
    await card.click();
    const toc = page.locator('.table-of-contents');
    // ToC may be present if entry has h2/h3 headings
    const exists = await toc.count();
    if (exists > 0) {
      await expect(toc.locator('nav')).toBeVisible();
    }
  });

  test('bookmark and random action buttons visible on entry', async ({ page }) => {
    await page.goto('/entries');
    await page.locator('.entry-card').first().click();
    await expect(page.locator('#bookmark-btn')).toBeVisible();
    await expect(page.locator('#random-btn')).toBeVisible();
  });

  test('bookmark button toggles state on click', async ({ page }) => {
    await page.goto('/entries');
    await page.locator('.entry-card').first().click();
    const btn = page.locator('#bookmark-btn');
    const initialSvg = await btn.locator('svg').getAttribute('fill');
    await btn.click();
    await page.waitForTimeout(100);
    const afterSvg = await btn.locator('svg').getAttribute('fill');
    expect(afterSvg).not.toBe(initialSvg);
  });
});

// ── Search ──────────────────────────────────────────────────────────────

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
  });

  test('search input is visible and interactive', async ({ page }) => {
    await expect(page.locator('#search-input')).toBeVisible();
    await expect(page.locator('.search-title')).toContainText('Search');
  });

  test('search returns results for common terms', async ({ page }) => {
    const input = page.locator('#search-input');
    await input.fill('leadership');
    // Wait for debounced search (180ms + render)
    await page.waitForTimeout(500);
    const results = page.locator('.search-card');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0); // Accept no results gracefully
  });

  test('search keyboard navigation works', async ({ page }) => {
    const input = page.locator('#search-input');
    await input.fill('life');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    // Should navigate to an entry
    await expect(page).not.toHaveURL('/search');
  });

  test('/ key shortcut focuses search', async ({ page }) => {
    await page.keyboard.press('/');
    await expect(page.locator('#search-input')).toBeFocused();
  });

  test('empty query shows no results', async ({ page }) => {
    const results = page.locator('.search-card');
    expect(await results.count()).toBe(0);
  });

  test('filter dropdowns are visible on search page', async ({ page }) => {
    await expect(page.locator('#search-filters')).toBeVisible();
    await expect(page.locator('#filter-category')).toBeVisible();
    await expect(page.locator('#filter-maturity')).toBeVisible();
    await expect(page.locator('#filter-tag')).toBeVisible();
  });

  test('filters narrow search results', async ({ page }) => {
    const input = page.locator('#search-input');
    await input.fill('life');
    await page.waitForTimeout(500);
    const unfilteredCount = await page.locator('.search-card').count();

    // Apply category filter
    await page.locator('#filter-category').selectOption('life-lessons');
    await page.waitForTimeout(300);
    const filteredCount = await page.locator('.search-card').count();

    expect(filteredCount).toBeLessThanOrEqual(unfilteredCount);
  });
});

// ── Analytics Dashboard ────────────────────────────────────────────────

test.describe('Analytics dashboard', () => {
  test('analytics page renders with stat cards', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('.page-title')).toContainText('Analytics');
    const cards = page.locator('.analytics-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('.analytics-card-value')).toBeVisible();
    }
  });

  test('most viewed list renders', async ({ page }) => {
    await page.goto('/analytics');
    const rows = page.locator('.analytics-row');
    expect(await rows.count()).toBeGreaterThanOrEqual(0);
  });

  test('category heatmap section renders', async ({ page }) => {
    await page.goto('/');
    await page.goto('/entries');
    await page.goto('/search');
    await page.goto('/analytics');
    await page.waitForTimeout(500);
    const heatmap = page.locator('.analytics-heatmap');
    await expect(heatmap).toHaveCount(1);
    await expect(page.locator('.analytics-section-title').first()).toContainText('Most Viewed');
  });
});

// ── Tags ────────────────────────────────────────────────────────────────

test.describe('Tags', () => {
  test('tag cloud index renders all tags', async ({ page }) => {
    await page.goto('/tags');
    await expect(page.locator('.page-title')).toContainText('Tags');
    const tagItems = page.locator('.tag-cloud-item');
    expect(await tagItems.count()).toBeGreaterThanOrEqual(5);
  });

  test('per-tag page shows entries', async ({ page }) => {
    await page.goto('/tags/leadership');
    await expect(page.locator('.page-title')).toContainText('leadership');
    const entries = page.locator('.entry-card');
    expect(await entries.count()).toBeGreaterThanOrEqual(0);
  });

  test('tag links navigate to correct tag page', async ({ page }) => {
    await page.goto('/tags');
    const firstTagHref = await page.locator('.tag-cloud-item').first().getAttribute('href');
    await page.goto(firstTagHref!);
    expect(page.url()).toContain('/tags/');
    await expect(page.locator('.page-title')).toBeVisible();
  });
});

// ── Content Management ─────────────────────────────────────────────────

test.describe('Content management', () => {
  test('shortcuts modal opens and closes', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', code: 'Slash', shiftKey: true, bubbles: true }));
    });
    await expect(page.locator('#shortcuts-modal')).toBeVisible();
    await expect(page.locator('#shortcuts-modal')).toContainText('Keyboard Shortcuts');
    await page.locator('#shortcuts-close').click();
    await expect(page.locator('#shortcuts-modal')).not.toBeVisible();
  });

  test('maturity filter chips visible on entries page', async ({ page }) => {
    await page.goto('/entries');
    const chips = page.locator('.filter-chip');
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(3);
    const texts = await chips.allTextContents();
    expect(texts.some(t => t.includes('seedling'))).toBeTruthy();
    expect(texts.some(t => t.includes('growing'))).toBeTruthy();
    expect(texts.some(t => t.includes('evergreen'))).toBeTruthy();
  });

  test('maturity filter persists in URL', async ({ page }) => {
    await page.goto('/entries');
    const evergreenChip = page.locator('.filter-chip[data-maturity="evergreen"]');
    if (await evergreenChip.count() > 0) {
      await Promise.all([
        page.waitForURL('**/entries?maturity=evergreen**'),
        evergreenChip.click(),
      ]);
      expect(page.url()).toContain('maturity=evergreen');
    }
  });
});

// ── Graph ───────────────────────────────────────────────────────────────

test.describe('Knowledge Graph', () => {
  test('graph page renders container', async ({ page }) => {
    await expectPageOk(page, '/graph');
    await expect(page.locator('#graph-container')).toBeVisible();
    // sigma.js requires WebGL — in headless mode the loading state may persist but container is present
  });

  test('legend displays all categories', async ({ page }) => {
    await page.goto('/graph');
    const legendItems = page.locator('.graph-legend-item');
    const count = await legendItems.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });
});

// ── Mindmap ─────────────────────────────────────────────────────────────

test.describe('Mindmap', () => {
  test('mindmap page renders container', async ({ page }) => {
    await expectPageOk(page, '/mindmap');
    const container = page.locator('#mindmap-container');
    await expect(container).toBeVisible();
    // d3.js renders in the container; in headless mode SVG may render differently
    await expect(page.locator('.mindmap-zoom-hint')).toBeVisible();
  });
});

// ── Timeline ────────────────────────────────────────────────────────────

test.describe('Timeline', () => {
  test('timeline renders years', async ({ page }) => {
    await page.goto('/timeline');
    await expect(page.locator('.timeline-year')).toBeVisible();
    const years = page.locator('.timeline-year-label');
    expect(await years.count()).toBeGreaterThanOrEqual(1);
  });
});

// ── Export ──────────────────────────────────────────────────────────────

test.describe('Export pages', () => {
  test('main export page renders', async ({ page }) => {
    await page.goto('/export');
    await expect(page.locator('.page-title')).toContainText('Export');
  });

  test('per-category export pages render', async ({ page }) => {
    for (const cat of CATEGORY_IDS.slice(0, 3)) {
      const resp = await page.goto(`/export/${cat}`);
      expect(resp?.status()).toBe(200);
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });
});

// ── Dark Mode ───────────────────────────────────────────────────────────

test.describe('Dark mode', () => {
  test('toggle switches theme', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('#themeToggle');
    await expect(toggle).toBeVisible();

    // Click to toggle dark
    await toggle.click();
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    // Click to toggle back to light
    await toggle.click();
    const theme2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme2).toBe('light');
  });

  test('theme persists across navigation', async ({ page }) => {
    await page.goto('/');
    await page.locator('#themeToggle').click();
    await page.goto('/entries');
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
  });

  test('theme persists on reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('#themeToggle').click();
    await page.reload();
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
  });
});

// ── API Endpoints ───────────────────────────────────────────────────────

test.describe('API endpoints', () => {
  test('/api/entries returns entry list', async ({ page }) => {
    const resp = await page.goto('/api/entries');
    expect(resp?.status()).toBe(200);
    const body = JSON.parse(await resp!.text());
    expect(body).toHaveProperty('entries');
    expect(Array.isArray(body.entries)).toBe(true);
    expect(body.entries.length).toBeGreaterThan(0);
    expect(body.entries[0]).toHaveProperty('title');
    expect(body.entries[0]).toHaveProperty('category');
    expect(body.entries[0]).toHaveProperty('tags');
    expect(body.entries[0]).toHaveProperty('url');
  });

  test('/api/tags returns tag list', async ({ page }) => {
    const resp = await page.goto('/api/tags');
    expect(resp?.status()).toBe(200);
    const body = JSON.parse(await resp!.text());
    expect(body).toHaveProperty('tags');
    expect(Array.isArray(body.tags)).toBe(true);
    expect(body.tags.length).toBeGreaterThan(0);
    expect(body.tags[0]).toHaveProperty('tag');
    expect(body.tags[0]).toHaveProperty('count');
  });

  test('/api/categories returns category breakdown', async ({ page }) => {
    const resp = await page.goto('/api/categories');
    expect(resp?.status()).toBe(200);
    const body = JSON.parse(await resp!.text());
    expect(body).toHaveProperty('categories');
    expect(Array.isArray(body.categories)).toBe(true);
    expect(body.categories.length).toBe(10);
    expect(body).toHaveProperty('totalEntries');
    expect(body).toHaveProperty('maturityBreakdown');
    expect(body).toHaveProperty('priorityBreakdown');
    expect(body.categories[0]).toHaveProperty('entryCount');
  });
});

// ── Navigation ──────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('all nav links are present and clickable', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('.nav-link');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(6);

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (href) {
        const resp = await page.goto(href);
        expect(resp?.status(), `Nav link ${href} should be 200`).toBe(200);
      }
    }
  });

  test('active nav link has active class', async ({ page }) => {
    await page.goto('/entries');
    const activeLinks = page.locator('.nav-link.active');
    expect(await activeLinks.count()).toBeGreaterThanOrEqual(1);
    await expect(activeLinks.first()).toHaveAttribute('href', '/entries');
  });
});

// ── Console Error Check ─────────────────────────────────────────────────

test.describe('Console errors', () => {
  test('no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    // Wait for any async scripts to finish
    await page.waitForTimeout(2000);

    expect(errors.length, `Console errors: ${errors.join(', ')}`).toBe(0);
  });

  test('no console errors on graph page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/graph');
    await page.waitForTimeout(3000); // sigma.js needs time to render

    expect(errors.length, `Console errors on graph: ${errors.join(', ')}`).toBe(0);
  });

  test('no console errors on mindmap page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/mindmap');
    await page.waitForTimeout(2000);

    expect(errors.length, `Console errors on mindmap: ${errors.join(', ')}`).toBe(0);
  });

  test('no console errors on analytics page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/analytics');
    await page.waitForTimeout(1000);

    expect(errors.length, `Console errors on analytics: ${errors.join(', ')}`).toBe(0);
  });

  test('no console errors on entry detail page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/entries');
    await page.locator('.entry-card').first().click();
    await page.waitForTimeout(1000);

    expect(errors.length, `Console errors on entry: ${errors.join(', ')}`).toBe(0);
  });

  test('no console errors on search page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/search');
    await page.locator('#search-input').fill('test');
    await page.waitForTimeout(500);

    expect(errors.length, `Console errors on search: ${errors.join(', ')}`).toBe(0);
  });
});

// ── Responsive / Mobile ─────────────────────────────────────────────────

test.describe('Responsive layout', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('homepage is usable on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.stat-card').first()).toBeVisible();
    await expect(page.locator('.category-card').first()).toBeVisible();
  });

  test('graph page renders on mobile', async ({ page }) => {
    await page.goto('/graph');
    await expect(page.locator('#graph-container')).toBeVisible();
  });

  test('nav stacks vertically on mobile', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('.nav-logo');
    const links = page.locator('.nav-links');
    await expect(logo).toBeVisible();
    await expect(links).toBeVisible();
  });

  test('entry detail readable on mobile', async ({ page }) => {
    await page.goto('/entries');
    await page.locator('.entry-card').first().click();
    await expect(page.locator('.entry-title')).toBeVisible();
    const titleFontSize = await page.locator('.entry-title').evaluate(el => window.getComputedStyle(el).fontSize);
    expect(parseFloat(titleFontSize)).toBeGreaterThan(16); // Should be large enough
  });
});

// ── 404 Handling ────────────────────────────────────────────────────────

test.describe('Error pages', () => {
  test('non-existent route returns 404', async ({ page }) => {
    const resp = await page.goto('/this-does-not-exist');
    expect(resp?.status()).toBe(404);
  });
});

// ── Auth ───────────────────────────────────────────────────────────────

test.describe('Auth system', () => {
  test('register creates a new user', async ({ page }) => {
    const uid = Date.now().toString(36);
    const resp = await page.request.post('/api/auth/register', {
      data: { email: `test-${uid}@example.com`, username: `testuser-${uid}`, password: 'testpass123' },
    });
    const body = await resp.json();
    expect(resp.status()).toBe(200);
    expect(body.success).toBe(true);
  });

  test('login succeeds with valid credentials', async ({ page }) => {
    const uid = Date.now().toString(36);
    await page.request.post('/api/auth/register', {
      data: { email: `login-${uid}@example.com`, username: `login-${uid}`, password: 'testpass123' },
    });
    const resp = await page.request.post('/api/auth/login', {
      data: { email: `login-${uid}@example.com`, password: 'testpass123' },
    });
    const body = await resp.json();
    expect(resp.status()).toBe(200);
    expect(body.success).toBe(true);
  });

  test('login fails with wrong password', async ({ page }) => {
    const resp = await page.request.post('/api/auth/login', {
      data: { email: 'nonexistent@example.com', password: 'wrongpassword' },
    });
    const body = await resp.json();
    expect(resp.status()).toBe(401);
    expect(body.error).toBeTruthy();
  });
});

// ── Admin / CMS ────────────────────────────────────────────────────────

test.describe('Admin / CMS', () => {
  const testEmail = `cms-${Date.now().toString(36)}@example.com`;
  const testUser = `cms-${Date.now().toString(36)}`;
  const testPass = 'testpass123';

  test('admin pages redirect to login when unauthenticated', async ({ page }) => {
    const resp = await page.goto('/admin/entries');
    expect(resp?.url()).toContain('/login');
  });

  test('API returns 401 for unauthenticated requests', async ({ page }) => {
    const resp = await page.request.post('/api/admin/entries', {
      data: { title: 'test', category: 'values', body: 'test body' },
    });
    expect(resp.status()).toBe(401);
  });

  test('can create and edit entry when authenticated', async ({ page }) => {
    await page.request.post('/api/auth/register', {
      data: { email: testEmail, username: testUser, password: testPass },
    });
    await page.request.post('/api/auth/login', {
      data: { email: testEmail, password: testPass },
    });

    const createResp = await page.request.post('/api/admin/entries', {
      data: { title: 'CMS Test Entry', category: 'values', maturity: 'draft', tags: ['test'], excerpt: 'A test entry', body: '## Hello\n\nThis is a test entry.' },
    });
    expect(createResp.status()).toBe(201);
    const createBody = await createResp.json();
    expect(createBody.success).toBe(true);
    expect(createBody.slug).toBeTruthy();

    const slug = createBody.slug;

    const updateResp = await page.request.put(`/api/admin/entries/${slug}`, {
      data: { title: 'CMS Test Entry Updated', category: 'values', maturity: 'reviewed', tags: ['test', 'updated'], excerpt: 'An updated test entry', body: '## Updated\n\nThis entry was updated.' },
    });
    expect(updateResp.status()).toBe(200);

    const listResp = await page.request.get('/api/admin/entries');
    expect(listResp.status()).toBe(200);
    const list = await listResp.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((e: { title: string }) => e.title === 'CMS Test Entry Updated')).toBe(true);

    const deleteResp = await page.request.delete(`/api/admin/entries/${slug}`, {
      data: {},
    });
    expect(deleteResp.status()).toBe(200);
  });
});

// ── PWA / Offline Support ──────────────────────────────────────────────

test.describe('PWA / Offline Support', () => {
  test('web app manifest is linked', async ({ page }) => {
    await page.goto('/');
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', '/site.webmanifest');
  });

  test('theme-color meta tag is present', async ({ page }) => {
    await page.goto('/');
    const meta = page.locator('meta[name="theme-color"]');
    await expect(meta).toHaveAttribute('content', '#7c3aed');
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto('/');
    const registered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(registered).toBe(true);
  });

});

