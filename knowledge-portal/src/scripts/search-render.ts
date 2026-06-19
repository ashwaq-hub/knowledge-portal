interface SearchEntry {
  id: string;
  title: string;
  category: string;
  tags: string[];
  excerpt: string;
  body: string;
  maturity: string;
  date: string;
}

interface SearchFilters {
  category: string;
  maturity: string;
  tags: string[];
}

interface ParsedQuery {
  text: string;
  tagFilter?: string;
  categoryFilter?: string;
  maturityFilter?: string;
}

interface ScoredResult {
  entry: SearchEntry;
  score: number;
}

let searchIndex: SearchEntry[] = [];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function getWords(text: string): string[] {
  return normalize(text).split(/\s+/).filter(w => w.length > 0);
}

function parseQuery(query: string): ParsedQuery {
  let text = query;
  let tagFilter: string | undefined;
  let categoryFilter: string | undefined;
  let maturityFilter: string | undefined;

  const tagMatch = text.match(/\btag:(\S+)/i);
  if (tagMatch) {
    tagFilter = tagMatch[1].toLowerCase();
    text = text.replace(tagMatch[0], '').trim();
  }
  const catMatch = text.match(/\bcat(?:egory)?:(\S+)/i);
  if (catMatch) {
    categoryFilter = catMatch[1].toLowerCase();
    text = text.replace(catMatch[0], '').trim();
  }
  const matMatch = text.match(/\bmaturity:(\S+)/i);
  if (matMatch) {
    maturityFilter = matMatch[1].toLowerCase();
    text = text.replace(matMatch[0], '').trim();
  }

  return { text, tagFilter, categoryFilter, maturityFilter };
}

function matchesFilters(entry: SearchEntry, filters: SearchFilters, parsed?: ParsedQuery): boolean {
  if (filters.category && entry.category !== filters.category) return false;
  if (filters.maturity && entry.maturity !== filters.maturity) return false;
  if (filters.tags.length > 0) {
    const entryTags = entry.tags.map(normalize);
    const ok = filters.tags.some(t => entryTags.includes(normalize(t)));
    if (!ok) return false;
  }
  if (parsed?.categoryFilter && normalize(entry.category) !== parsed.categoryFilter) return false;
  if (parsed?.maturityFilter && normalize(entry.maturity) !== parsed.maturityFilter) return false;
  if (parsed?.tagFilter) {
    const entryTags = entry.tags.map(normalize);
    if (!entryTags.some(t => t.includes(parsed.tagFilter!))) return false;
  }
  return true;
}

function scoreEntry(entry: SearchEntry, query: string): number {
  const q = normalize(query);
  const qWords = getWords(query);
  const title = normalize(entry.title);
  const category = normalize(entry.category);
  const tags = entry.tags.map(normalize);
  const excerpt = normalize(entry.excerpt);
  const body = normalize(entry.body);
  const searchableBody = `${title} ${category} ${tags.join(' ')} ${excerpt} ${body}`;

  let score = 0;

  if (title === q) score += 100;
  else if (title.includes(q)) score += 50;
  else if (qWords.some(w => title.startsWith(w))) score += 35;
  else if (qWords.some(w => title.includes(w))) score += 25;

  const allWordsPresent = qWords.every(w => searchableBody.includes(w));
  if (allWordsPresent) score += 30;

  for (const w of qWords) {
    if (title.includes(w)) score += 20;
    if (category.includes(w)) score += 12;
    if (tags.some(t => t.includes(w))) score += 8;
    if (excerpt.includes(w)) score += 6;
    if (body.includes(w)) score += 3;
  }

  return score;
}

function search(query: string, filters: SearchFilters, parsed?: ParsedQuery): ScoredResult[] {
  if (!query || query.length < 2) return [];

  const results: ScoredResult[] = [];

  for (const entry of searchIndex) {
    if (!matchesFilters(entry, filters, parsed)) continue;
    const score = scoreEntry(entry, query);
    if (score > 0) {
      results.push({ entry, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

function highlightText(text: string, query: string): string {
  if (!query || query.length < 2) return escapeHtml(text);
  const qWords = getWords(query);
  let result = escapeHtml(text);
  for (const word of qWords) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }
  return result;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'values': '⭐',
    'life-lessons': '🛤️',
    'career-craft': '💼',
    'decision-frameworks': '🧩',
    'practical-skills': '🛠️',
    'financial-wisdom': '💰',
    'health-wellness': '🧠',
    'book-library': '📚',
    'family-history': '📜',
    'letters-to-future': '✉️',
  };
  return map[category] || '📄';
}

function getCategoryDisplay(category: string): string {
  return category.replace(/-/g, ' ');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderResults(results: ScoredResult[], query: string, filters: SearchFilters): void {
  const content = document.getElementById('search-content');
  const stats = document.getElementById('search-stats');
  if (!content) return;

  if (!query || query.length < 2) {
    content.innerHTML = '';
    if (stats) stats.textContent = '';
    return;
  }

  if (results.length === 0) {
    if (stats) stats.textContent = '';
    content.innerHTML = `
      <div class="search-empty">
        <div class="search-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>
        <p class="search-empty-title">No results for "<strong>${escapeHtml(query)}</strong>"</p>
        <p class="search-empty-hint">Try different keywords, adjust filters, or check your spelling</p>
      </div>
    `;
    return;
  }

  if (stats) {
    stats.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}" · ${(performance.now() - searchStartTime).toFixed(0)}ms`;
  }

  const html = `
    <div class="search-results-grid" id="search-results-grid">
      ${results.map(({ entry, score }, i) => `
        <a href="/entries/${entry.id}" class="search-card" data-index="${i}" style="animation-delay: ${i * 30}ms">
          <div class="search-card-meta">
            <span class="search-card-category">${getCategoryEmoji(entry.category)} ${getCategoryDisplay(entry.category)}</span>
            <span class="search-card-date">${formatDate(entry.date)}</span>
          </div>
          <h3 class="search-card-title">${highlightText(entry.title, query)}</h3>
          ${entry.excerpt ? `<p class="search-card-excerpt">${highlightText(entry.excerpt, query)}</p>` : ''}
          <div class="search-card-footer">
            <div class="search-card-tags">
              ${entry.tags.slice(0, 4).map(tag => `<span class="search-tag">${highlightText(`#${tag}`, query)}</span>`).join('')}
            </div>
            <span class="search-card-maturity search-card-maturity--${entry.maturity}">${entry.maturity}</span>
          </div>
        </a>
      `).join('')}
    </div>
  `;

  content.innerHTML = html;
  resultItems = content.querySelectorAll('.search-card');
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let searchStartTime = 0;
let resultItems: NodeListOf<HTMLElement> | null = null;
let selectedIndex = -1;
let currentFilters: SearchFilters = { category: '', maturity: '', tags: [] };

function getUniqueCategories(): string[] {
  return [...new Set(searchIndex.map(e => e.category))].sort();
}

function getUniqueMaturities(): string[] {
  return [...new Set(searchIndex.map(e => e.maturity))].sort();
}

function getAllTags(): string[] {
  return [...new Set(searchIndex.flatMap(e => e.tags))].sort();
}

function buildFilterBar(): void {
  const bar = document.getElementById('search-filters');
  if (!bar) return;

  const categories = getUniqueCategories();
  const maturities = getUniqueMaturities();
  const allTags = getAllTags();

  const selectedTag = currentFilters.tags[0] || '';

  bar.innerHTML = `
    <div class="search-filters-inner">
      <div class="filter-group">
        <label class="filter-label" for="filter-category">Category</label>
        <select id="filter-category" class="filter-select">
          <option value="">All</option>
          ${categories.map(c => `<option value="${c}"${c === currentFilters.category ? ' selected' : ''}>${getCategoryDisplay(c)}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label" for="filter-maturity">Maturity</label>
        <select id="filter-maturity" class="filter-select">
          <option value="">All</option>
          ${maturities.map(m => `<option value="${m}"${m === currentFilters.maturity ? ' selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label" for="filter-tag">Tag</label>
        <select id="filter-tag" class="filter-select">
          <option value="">All</option>
          ${allTags.map(t => `<option value="${t}"${t === selectedTag ? ' selected' : ''}>#${t}</option>`).join('')}
        </select>
      </div>
    </div>
  `;

  bar.querySelectorAll('select').forEach(el => {
    el.addEventListener('change', onFilterChange);
  });
}

function getFilterValues(): SearchFilters {
  const cat = (document.getElementById('filter-category') as HTMLSelectElement)?.value || '';
  const mat = (document.getElementById('filter-maturity') as HTMLSelectElement)?.value || '';
  const tag = (document.getElementById('filter-tag') as HTMLSelectElement)?.value || '';
  return { category: cat, maturity: mat, tags: tag ? [tag] : [] };
}

function updateUrlParams(filters: SearchFilters, query: string): void {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  if (filters.category) url.searchParams.set('category', filters.category);
  else url.searchParams.delete('category');
  if (filters.maturity) url.searchParams.set('maturity', filters.maturity);
  else url.searchParams.delete('maturity');
  if (filters.tags.length) url.searchParams.set('tag', filters.tags[0]);
  else url.searchParams.delete('tag');
  window.history.replaceState({}, '', url.pathname + url.search);
}

function readFiltersFromUrl(): SearchFilters {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get('category') || '',
    maturity: params.get('maturity') || '',
    tags: params.get('tag') ? [params.get('tag')!] : [],
  };
}

function onFilterChange(): void {
  currentFilters = getFilterValues();
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  const raw = input?.value.trim() || '';
  const parsed = parseQuery(raw);
  updateUrlParams(currentFilters, raw);
  hideAutocomplete();
  clearSelection();
  runSearch(parsed.text, currentFilters, parsed);
}

function onSearchInput(e: Event): void {
  const input = e.target as HTMLInputElement;
  const raw = input.value.trim();
  const parsed = parseQuery(raw);
  const query = parsed.text;

  if (searchTimeout) clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    currentFilters = getFilterValues();
    updateUrlParams(currentFilters, raw);
    runSearch(query, currentFilters, parsed);
    runAutocomplete(query, parsed);
  }, 150);
}

function runSearch(query: string, filters: SearchFilters, parsed?: ParsedQuery): void {
  searchStartTime = performance.now();
  const results = search(query, filters, parsed);
  renderResults(results, query, filters);
  clearSelection();
}

function runAutocomplete(query: string, parsed: ParsedQuery): void {
  const container = document.getElementById('search-autocomplete');
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  if (!container || !input) return;

  const results = search(query, { category: '', maturity: '', tags: [] }, parsed);

  if (results.length === 0 || query.length < 2) {
    container.innerHTML = '';
    container.classList.remove('search-autocomplete--visible');
    return;
  }

  const top5 = results.slice(0, 5);
  container.innerHTML = `
    <div class="search-autocomplete-inner">
      ${top5.map((r, i) => `
        <a href="/entries/${r.entry.id}" class="search-autocomplete-item" data-index="${i}">
          <span class="search-autocomplete-title">${highlightText(r.entry.title, query)}</span>
          <span class="search-autocomplete-meta">${getCategoryDisplay(r.entry.category)} · ${r.entry.maturity}</span>
        </a>
      `).join('')}
    </div>
  `;
  container.classList.add('search-autocomplete--visible');
}

function hideAutocomplete(): void {
  const container = document.getElementById('search-autocomplete');
  if (container) {
    container.innerHTML = '';
    container.classList.remove('search-autocomplete--visible');
  }
  autoSelectedIndex = -1;
}

function clearSelection(): void {
  if (resultItems) {
    resultItems.forEach(el => el.classList.remove('search-card--selected'));
  }
  selectedIndex = -1;
}

let autoSelectedIndex = -1;

function selectNext(): void {
  const autoContainer = document.getElementById('search-autocomplete');
  const autoItems = autoContainer?.querySelectorAll('.search-autocomplete-item');

  if (autoItems && autoItems.length > 0) {
    autoItems.forEach(el => el.classList.remove('search-autocomplete-item--selected'));
    autoSelectedIndex = Math.min(autoSelectedIndex + 1, autoItems.length - 1);
    const el = autoItems[autoSelectedIndex] as HTMLElement;
    el.classList.add('search-autocomplete-item--selected');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }

  if (!resultItems || resultItems.length === 0) return;
  clearSelection();
  selectedIndex = Math.min(selectedIndex + 1, resultItems.length - 1);
  const el = resultItems[selectedIndex];
  el.classList.add('search-card--selected');
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function selectPrev(): void {
  const autoContainer = document.getElementById('search-autocomplete');
  const autoItems = autoContainer?.querySelectorAll('.search-autocomplete-item');

  if (autoItems && autoItems.length > 0) {
    autoItems.forEach(el => el.classList.remove('search-autocomplete-item--selected'));
    autoSelectedIndex = Math.max(autoSelectedIndex - 1, 0);
    const el = autoItems[autoSelectedIndex] as HTMLElement;
    el.classList.add('search-autocomplete-item--selected');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }

  if (!resultItems || resultItems.length === 0) return;
  clearSelection();
  selectedIndex = Math.max(selectedIndex - 1, 0);
  const el = resultItems[selectedIndex];
  el.classList.add('search-card--selected');
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function openSelected(): void {
  if (selectedIndex >= 0 && resultItems && resultItems[selectedIndex]) {
    (resultItems[selectedIndex] as HTMLAnchorElement).click();
  }
}

function initSearch(): void {
  const dataEl = document.getElementById('search-data');
  if (!dataEl) return;

  try {
    const raw = dataEl.getAttribute('data-value') || '';
    searchIndex = JSON.parse(decodeURIComponent(raw));
  } catch (e) {
    console.error('Search: failed to parse search index', e);
    return;
  }

  currentFilters = readFiltersFromUrl();
  buildFilterBar();

  const input = document.getElementById('search-input') as HTMLInputElement | null;
  if (!input) return;

  const autocompleteDiv = document.createElement('div');
  autocompleteDiv.id = 'search-autocomplete';
  autocompleteDiv.className = 'search-autocomplete';
  input.parentNode?.insertBefore(autocompleteDiv, input.nextSibling);

  input.addEventListener('input', onSearchInput);
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); selectNext(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectPrev(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const autoItem = autocompleteDiv.querySelector('.search-autocomplete-item--selected') as HTMLAnchorElement | null;
      if (autoItem) { autoItem.click(); return; }
      openSelected();
    }
    else if (e.key === 'Escape') { input.blur(); hideAutocomplete(); clearSelection(); }
  });

  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as Node;
    if (input && !input.parentNode?.contains(target)) {
      hideAutocomplete();
    }
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.key === '/' || e.key === 'k') && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      input.focus();
    }
  });

  const urlQuery = new URLSearchParams(window.location.search).get('q');
  if (urlQuery) {
    input.value = urlQuery;
    const parsed = parseQuery(urlQuery);
    runSearch(parsed.text, currentFilters, parsed);
    runAutocomplete(parsed.text, parsed);
  }

  input.focus();
}

document.addEventListener('DOMContentLoaded', initSearch);
