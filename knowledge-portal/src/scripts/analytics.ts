interface PageView {
  path: string;
  title: string;
  timestamp: number;
  category?: string;
}

function trackPageView(): void {
  const path = window.location.pathname;
  const titleEl = document.querySelector('title');
  const title = titleEl?.textContent || path;
  const entryId = document.getElementById('entry-id')?.getAttribute('data-value');

  let category = '';
  if (entryId) {
    category = entryId.split('/')[0];
  }

  const view: PageView = { path, title, timestamp: Date.now(), category };

  let views: PageView[] = [];
  try {
    views = JSON.parse(localStorage.getItem('kp-page-views') || '[]');
  } catch {}

  views.push(view);

  // Keep last 2000 views
  if (views.length > 2000) views = views.slice(-2000);
  localStorage.setItem('kp-page-views', JSON.stringify(views));

  // Aggregate counts
  let counts: Record<string, number> = {};
  try {
    counts = JSON.parse(localStorage.getItem('kp-view-counts') || '{}');
  } catch {}
  counts[path] = (counts[path] || 0) + 1;
  localStorage.setItem('kp-view-counts', JSON.stringify(counts));

  // Category counts
  if (category) {
    let catCounts: Record<string, number> = {};
    try {
      catCounts = JSON.parse(localStorage.getItem('kp-cat-counts') || '{}');
    } catch {}
    catCounts[category] = (catCounts[category] || 0) + 1;
    localStorage.setItem('kp-cat-counts', JSON.stringify(catCounts));
  }

  // Weekly stats
  const weekKey = getWeekKey();
  let weekly: Record<string, number> = {};
  try {
    weekly = JSON.parse(localStorage.getItem('kp-weekly-views') || '{}');
  } catch {}
  weekly[weekKey] = (weekly[weekKey] || 0) + 1;
  localStorage.setItem('kp-weekly-views', JSON.stringify(weekly));
}

function getWeekKey(): string {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

function getTotalViews(): number {
  try {
    const counts = JSON.parse(localStorage.getItem('kp-view-counts') || '{}');
    return Object.values(counts as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
  } catch { return 0; }
}

function getMostViewed(limit = 10): { path: string; title: string; count: number }[] {
  try {
    const counts = JSON.parse(localStorage.getItem('kp-view-counts') || '{}') as Record<string, number>;
    const views: PageView[] = JSON.parse(localStorage.getItem('kp-page-views') || '[]');
    const titles: Record<string, string> = {};
    views.forEach(v => { titles[v.path] = v.title; });

    const latestViews = views.reduce<Record<string, PageView>>((acc, v) => {
      acc[v.path] = v;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([path, count]) => ({
        path,
        title: titles[path] || latestViews[path]?.title || path,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch { return []; }
}

function getCategoryCounts(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('kp-cat-counts') || '{}');
  } catch { return {}; }
}

function getWeeklyTrends(): { week: string; views: number }[] {
  try {
    const weekly = JSON.parse(localStorage.getItem('kp-weekly-views') || '{}') as Record<string, number>;
    return Object.entries(weekly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, views]) => ({ week, views }));
  } catch { return []; }
}

function getTodayViews(): number {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const views: PageView[] = JSON.parse(localStorage.getItem('kp-page-views') || '[]');
    return views.filter(v => new Date(v.timestamp).toISOString().slice(0, 10) === today).length;
  } catch { return 0; }
}

export function renderAnalyticsDashboard(container: HTMLElement): void {
  const totalViews = getTotalViews();
  const todayViews = getTodayViews();
  const mostViewed = getMostViewed(10);
  const categoryCounts = getCategoryCounts();
  const weekly = getWeeklyTrends();

  const maxCat = Math.max(...Object.values(categoryCounts), 1);

  container.innerHTML = `
    <div class="analytics-grid">
      <div class="analytics-card">
        <div class="analytics-card-label">Total Views</div>
        <div class="analytics-card-value">${totalViews}</div>
      </div>
      <div class="analytics-card">
        <div class="analytics-card-label">Today</div>
        <div class="analytics-card-value">${todayViews}</div>
      </div>
      <div class="analytics-card">
        <div class="analytics-card-label">Tracked Pages</div>
        <div class="analytics-card-value">${mostViewed.length}</div>
      </div>
      <div class="analytics-card">
        <div class="analytics-card-label">Categories</div>
        <div class="analytics-card-value">${Object.keys(categoryCounts).length}</div>
      </div>
    </div>

    <h3 class="analytics-section-title">Most Viewed Pages</h3>
    <div class="analytics-list">
      ${mostViewed.map((item, i) => `
        <a href="${item.path}" class="analytics-row">
          <span class="analytics-rank">${i + 1}</span>
          <span class="analytics-row-title">${item.title.replace(/ \| .*$/, '')}</span>
          <span class="analytics-row-count">${item.count}</span>
        </a>
      `).join('')}
    </div>

    <h3 class="analytics-section-title">Category Heatmap</h3>
    <div class="analytics-heatmap">
      ${Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, count]) => `
          <div class="analytics-heatmap-row">
            <span class="analytics-heatmap-label">${cat.replace(/-/g, ' ')}</span>
            <div class="analytics-heatmap-bar-wrap">
              <div class="analytics-heatmap-bar" style="width:${(count / maxCat) * 100}%"></div>
            </div>
            <span class="analytics-heatmap-count">${count}</span>
          </div>
        `).join('')}
    </div>

    ${weekly.length > 0 ? `
      <h3 class="analytics-section-title">Weekly Trends</h3>
      <div class="analytics-weekly">
        ${weekly.map(w => {
          const maxWeekly = Math.max(...weekly.map(x => x.views), 1);
          return `
            <div class="analytics-weekly-col">
              <div class="analytics-weekly-bar" style="height:${(w.views / maxWeekly) * 100}%"></div>
              <span class="analytics-weekly-label">${w.week.slice(5)}</span>
              <span class="analytics-weekly-count">${w.views}</span>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}
  `;
}

if (window.location.pathname !== '/analytics') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }
}
