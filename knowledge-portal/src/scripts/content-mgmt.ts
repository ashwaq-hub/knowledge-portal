interface SiteEntry {
  id: string;
  title: string;
  category: string;
  tags: string[];
  excerpt: string;
  maturity: string;
  date: string;
}

interface BookmarkEntry {
  id: string;
  title: string;
  savedAt: number;
}

let entryIndex: SiteEntry[] = [];

function getEntryIndex(): void {
  const el = document.getElementById('site-index');
  if (!el) return;
  try {
    entryIndex = JSON.parse(decodeURIComponent(el.getAttribute('data-value') || ''));
  } catch {}
}

function goRandom(): void {
  if (entryIndex.length === 0) return;
  const idx = Math.floor(Math.random() * entryIndex.length);
  window.location.href = `/entries/${entryIndex[idx].id}`;
}

function toggleBookmark(id: string, title: string): boolean {
  let bookmarks: BookmarkEntry[] = [];
  try {
    bookmarks = JSON.parse(localStorage.getItem('kp-bookmarks') || '[]');
  } catch {}
  const existing = bookmarks.findIndex(b => b.id === id);
  if (existing >= 0) {
    bookmarks.splice(existing, 1);
    localStorage.setItem('kp-bookmarks', JSON.stringify(bookmarks));
    return false;
  }
  bookmarks.push({ id, title, savedAt: Date.now() });
  localStorage.setItem('kp-bookmarks', JSON.stringify(bookmarks));
  return true;
}

function isBookmarked(id: string): boolean {
  try {
    const bookmarks: BookmarkEntry[] = JSON.parse(localStorage.getItem('kp-bookmarks') || '[]');
    return bookmarks.some(b => b.id === id);
  } catch { return false; }
}

function getBookmarks(): BookmarkEntry[] {
  try {
    return JSON.parse(localStorage.getItem('kp-bookmarks') || '[]');
  } catch { return []; }
}

function addToHistory(id: string, title: string): void {
  let history: BookmarkEntry[] = [];
  try {
    history = JSON.parse(localStorage.getItem('kp-history') || '[]');
  } catch {}
  history = history.filter(h => h.id !== id);
  history.unshift({ id, title, savedAt: Date.now() });
  if (history.length > 50) history = history.slice(0, 50);
  localStorage.setItem('kp-history', JSON.stringify(history));
}

function getHistory(): BookmarkEntry[] {
  try {
    return JSON.parse(localStorage.getItem('kp-history') || '[]');
  } catch { return []; }
}

function renderBookmarks(container: HTMLElement): void {
  const bookmarks = getBookmarks();
  if (bookmarks.length === 0) {
    container.innerHTML = '<p style="color:var(--color-text-muted);font-size:var(--text-sm)">No bookmarks yet.</p>';
    return;
  }
  container.innerHTML = `
    <ul style="list-style:none;padding:0;margin:0">
      ${bookmarks.map(b => `
        <li style="margin-bottom:var(--space-2)">
          <a href="/entries/${b.id}" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none">
            ${b.title}
          </a>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderHistory(container: HTMLElement): void {
  const history = getHistory().slice(0, 10);
  if (history.length === 0) {
    container.innerHTML = '<p style="color:var(--color-text-muted);font-size:var(--text-sm)">No recent history.</p>';
    return;
  }
  container.innerHTML = `
    <ul style="list-style:none;padding:0;margin:0">
      ${history.map(h => `
        <li style="margin-bottom:var(--space-2)">
          <a href="/entries/${h.id}" style="font-size:var(--text-sm);color:var(--color-text);text-decoration:none">
            ${h.title}
          </a>
        </li>
      `).join('')}
    </ul>
  `;
}

function showShortcuts(): void {
  const existing = document.getElementById('shortcuts-modal');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'shortcuts-modal';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
    backdrop-filter:blur(4px);
    animation:fadeIn 150ms ease;
  `;

  overlay.innerHTML = `
    <div style="
      background:var(--color-bg);color:var(--color-text);
      border-radius:16px;padding:var(--space-8);
      max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);
    ">
      <h2 style="margin:0 0 var(--space-6);font-size:var(--text-xl);font-weight:600">Keyboard Shortcuts</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:var(--space-2) 0"><kbd class="shortcut-kbd">/</kbd> or <kbd class="shortcut-kbd">K</kbd></td><td style="padding:var(--space-2) 0;color:var(--color-text-muted)">Search</td></tr>
        <tr><td style="padding:var(--space-2) 0"><kbd class="shortcut-kbd">R</kbd></td><td style="padding:var(--space-2) 0;color:var(--color-text-muted)">Random entry</td></tr>
        <tr><td style="padding:var(--space-2) 0"><kbd class="shortcut-kbd">B</kbd></td><td style="padding:var(--space-2) 0;color:var(--color-text-muted)">Toggle bookmark</td></tr>
        <tr><td style="padding:var(--space-2) 0"><kbd class="shortcut-kbd">?</kbd></td><td style="padding:var(--space-2) 0;color:var(--color-text-muted)">This cheat sheet</td></tr>
        <tr><td style="padding:var(--space-2) 0"><kbd class="shortcut-kbd">T</kbd></td><td style="padding:var(--space-2) 0;color:var(--color-text-muted)">Toggle theme</td></tr>
        <tr><td style="padding:var(--space-2) 0"><kbd class="shortcut-kbd">Esc</kbd></td><td style="padding:var(--space-2) 0;color:var(--color-text-muted)">Close</td></tr>
      </table>
      <button id="shortcuts-close" style="
        margin-top:var(--space-6);width:100%;padding:var(--space-2);
        background:var(--color-bg-secondary);border:1px solid var(--color-border);
        border-radius:10px;color:var(--color-text);font-size:var(--text-sm);cursor:pointer;
      ">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#shortcuts-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function initContentMgmt(): void {
  getEntryIndex();

  const entryId = document.getElementById('entry-id')?.getAttribute('data-value');
  const entryTitle = document.getElementById('entry-id')?.getAttribute('data-title');

  if (entryId && entryTitle) {
    addToHistory(entryId, entryTitle);

    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (bookmarkBtn) {
      const updateBtn = () => {
        const saved = isBookmarked(entryId);
        bookmarkBtn.innerHTML = saved
          ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>';
      };
      updateBtn();
      bookmarkBtn.addEventListener('click', () => {
        toggleBookmark(entryId, entryTitle);
        updateBtn();
      });
    }
  }

  const randomBtn = document.getElementById('random-btn');
  if (randomBtn) randomBtn.addEventListener('click', goRandom);

  const bkPanel = document.getElementById('bookmarks-panel');
  if (bkPanel) renderBookmarks(bkPanel);

  const histPanel = document.getElementById('history-panel');
  if (histPanel) renderHistory(histPanel);

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.key) {
      case 'r':
      case 'R':
        e.preventDefault();
        goRandom();
        break;
      case '?':
        e.preventDefault();
        showShortcuts();
        break;
      case 'Escape':
        const modal = document.getElementById('shortcuts-modal');
        if (modal) modal.remove();
        break;
      case 'b':
        if (entryId && entryTitle) {
          toggleBookmark(entryId, entryTitle);
          const btn = document.getElementById('bookmark-btn');
          if (btn) {
            const saved = isBookmarked(entryId);
            btn.innerHTML = saved
              ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>'
              : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>';
          }
        }
        break;
      case 't':
        e.preventDefault();
        const html = document.documentElement;
        const current = html.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        break;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentMgmt);
} else {
  initContentMgmt();
}
