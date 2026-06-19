# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Admin / CMS >> can create and edit entry when authenticated
- Location: tests\smoke.spec.ts:739:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
```

# Test source

```ts
  673 | });
  674 | 
  675 | // ── 404 Handling ────────────────────────────────────────────────────────
  676 | 
  677 | test.describe('Error pages', () => {
  678 |   test('non-existent route returns 404', async ({ page }) => {
  679 |     const resp = await page.goto('/this-does-not-exist');
  680 |     expect(resp?.status()).toBe(404);
  681 |   });
  682 | });
  683 | 
  684 | // ── Auth ───────────────────────────────────────────────────────────────
  685 | 
  686 | test.describe('Auth system', () => {
  687 |   test('register creates a new user', async ({ page }) => {
  688 |     const uid = Date.now().toString(36);
  689 |     const resp = await page.request.post('/api/auth/register', {
  690 |       data: { email: `test-${uid}@example.com`, username: `testuser-${uid}`, password: 'testpass123' },
  691 |     });
  692 |     const body = await resp.json();
  693 |     expect(resp.status()).toBe(200);
  694 |     expect(body.success).toBe(true);
  695 |   });
  696 | 
  697 |   test('login succeeds with valid credentials', async ({ page }) => {
  698 |     const uid = Date.now().toString(36);
  699 |     await page.request.post('/api/auth/register', {
  700 |       data: { email: `login-${uid}@example.com`, username: `login-${uid}`, password: 'testpass123' },
  701 |     });
  702 |     const resp = await page.request.post('/api/auth/login', {
  703 |       data: { email: `login-${uid}@example.com`, password: 'testpass123' },
  704 |     });
  705 |     const body = await resp.json();
  706 |     expect(resp.status()).toBe(200);
  707 |     expect(body.success).toBe(true);
  708 |   });
  709 | 
  710 |   test('login fails with wrong password', async ({ page }) => {
  711 |     const resp = await page.request.post('/api/auth/login', {
  712 |       data: { email: 'nonexistent@example.com', password: 'wrongpassword' },
  713 |     });
  714 |     const body = await resp.json();
  715 |     expect(resp.status()).toBe(401);
  716 |     expect(body.error).toBeTruthy();
  717 |   });
  718 | });
  719 | 
  720 | // ── Admin / CMS ────────────────────────────────────────────────────────
  721 | 
  722 | test.describe('Admin / CMS', () => {
  723 |   const testEmail = `cms-${Date.now().toString(36)}@example.com`;
  724 |   const testUser = `cms-${Date.now().toString(36)}`;
  725 |   const testPass = 'testpass123';
  726 | 
  727 |   test('admin pages redirect to login when unauthenticated', async ({ page }) => {
  728 |     const resp = await page.goto('/admin/entries');
  729 |     expect(resp?.url()).toContain('/login');
  730 |   });
  731 | 
  732 |   test('API returns 401 for unauthenticated requests', async ({ page }) => {
  733 |     const resp = await page.request.post('/api/admin/entries', {
  734 |       data: { title: 'test', category: 'values', body: 'test body' },
  735 |     });
  736 |     expect(resp.status()).toBe(401);
  737 |   });
  738 | 
  739 |   test('can create and edit entry when authenticated', async ({ page }) => {
  740 |     await page.request.post('/api/auth/register', {
  741 |       data: { email: testEmail, username: testUser, password: testPass },
  742 |     });
  743 |     await page.request.post('/api/auth/login', {
  744 |       data: { email: testEmail, password: testPass },
  745 |     });
  746 | 
  747 |     const createResp = await page.request.post('/api/admin/entries', {
  748 |       data: { title: 'CMS Test Entry', category: 'values', maturity: 'draft', tags: ['test'], excerpt: 'A test entry', body: '## Hello\n\nThis is a test entry.' },
  749 |     });
  750 |     expect(createResp.status()).toBe(201);
  751 |     const createBody = await createResp.json();
  752 |     expect(createBody.success).toBe(true);
  753 |     expect(createBody.slug).toBeTruthy();
  754 | 
  755 |     const slug = createBody.slug;
  756 | 
  757 |     const updateResp = await page.request.put(`/api/admin/entries/${slug}`, {
  758 |       data: { title: 'CMS Test Entry Updated', category: 'values', maturity: 'reviewed', tags: ['test', 'updated'], excerpt: 'An updated test entry', body: '## Updated\n\nThis entry was updated.' },
  759 |     });
  760 |     expect(updateResp.status()).toBe(200);
  761 | 
  762 |     const listResp = await page.request.get('/api/admin/entries');
  763 |     expect(listResp.status()).toBe(200);
  764 |     const list = await listResp.json();
  765 |     expect(Array.isArray(list)).toBe(true);
  766 |     expect(list.some((e: { title: string }) => e.title === 'CMS Test Entry Updated')).toBe(true);
  767 | 
  768 |     const deleteResp = await page.request.delete(`/api/admin/entries/${slug}`, {
  769 |       data: {},
  770 |     });
  771 |     const deleteText = await deleteResp.text();
  772 |     console.log('DELETE status:', deleteResp.status(), 'body:', deleteText);
> 773 |     expect(deleteResp.status()).toBe(200);
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  774 |   });
  775 | });
  776 | 
  777 | // ── PWA / Offline Support ──────────────────────────────────────────────
  778 | 
  779 | test.describe('PWA / Offline Support', () => {
  780 |   test('web app manifest is linked', async ({ page }) => {
  781 |     await page.goto('/');
  782 |     const manifest = page.locator('link[rel="manifest"]');
  783 |     await expect(manifest).toHaveAttribute('href', '/site.webmanifest');
  784 |   });
  785 | 
  786 |   test('theme-color meta tag is present', async ({ page }) => {
  787 |     await page.goto('/');
  788 |     const meta = page.locator('meta[name="theme-color"]');
  789 |     await expect(meta).toHaveAttribute('content', '#7c3aed');
  790 |   });
  791 | 
  792 |   test('service worker is registered', async ({ page }) => {
  793 |     await page.goto('/');
  794 |     const registered = await page.evaluate(() => {
  795 |       return 'serviceWorker' in navigator;
  796 |     });
  797 |     expect(registered).toBe(true);
  798 |   });
  799 | 
  800 | });
  801 | 
  802 | 
```