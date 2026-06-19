function escapeHtml(text: string): string {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(text));
  return d.innerHTML;
}

function renderMarkdown(md: string): string {
  if (!md) return '<p class="preview-empty">Nothing to preview</p>';

  let html = md;

  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  let listType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ulMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    const headingMatch = line.match(/^<h[1-6]>/);
    const blockquoteMatch = line.match(/^<blockquote>/);
    const isEmpty = line.trim() === '';

    if (isEmpty) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      result.push('');
      continue;
    }

    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li>${ulMatch[1]}</li>`);
      continue;
    }

    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      result.push(`<li>${olMatch[1]}</li>`);
      continue;
    }

    if (headingMatch || blockquoteMatch) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      result.push(line);
      continue;
    }

    if (inList) {
      result.push(`</${listType}>`);
      inList = false;
    }
    result.push(`<p>${line}</p>`);
  }

  if (inList) {
    result.push(`</${listType}>`);
  }

  return result.join('\n');
}

function collectFormData(form: HTMLFormElement): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const fd = new FormData(form);
  for (const [key, val] of fd) {
    if (key === 'tags') {
      data[key] = (val as string).split(',').map(t => t.trim()).filter(Boolean);
    } else {
      data[key] = val;
    }
  }
  return data;
}

function initEditor(): void {
  const form = document.getElementById('entry-form') as HTMLFormElement | null;
  const bodyField = document.getElementById('entry-body') as HTMLTextAreaElement | null;
  const preview = document.getElementById('preview-content');
  const titleField = document.getElementById('entry-title') as HTMLInputElement | null;
  const slugField = document.getElementById('entry-slug') as HTMLInputElement | null;

  if (!form || !bodyField || !preview) return;

  bodyField.addEventListener('input', () => {
    preview.innerHTML = renderMarkdown(bodyField.value);
  });

  if (titleField && slugField) {
    titleField.addEventListener('input', () => {
      const slug = titleField.value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim();
      if (!slugField.dataset.manual) {
        slugField.value = slug;
      }
    });

    slugField.addEventListener('input', () => {
      slugField.dataset.manual = 'true';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = collectFormData(form);
    const method = form.dataset.method || 'POST';
    const action = form.action;

    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    try {
      const res = await fetch(action, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        const msg = document.getElementById('editor-msg');
        if (msg) {
          msg.innerHTML = '<span class="editor-msg-success">Entry saved!</span>';
          msg.className = 'editor-msg editor-msg--visible';
        }
        if (result.slug && method === 'POST') {
          window.location.href = `/admin/entries/edit/${result.slug}`;
        }
      } else {
        const msg = document.getElementById('editor-msg');
        if (msg) {
          msg.innerHTML = `<span class="editor-msg-error">${escapeHtml(result.error || 'Failed to save')}</span>`;
          msg.className = 'editor-msg editor-msg--visible';
        }
      }
    } catch {
      const msg = document.getElementById('editor-msg');
      if (msg) {
        msg.innerHTML = '<span class="editor-msg-error">Network error</span>';
        msg.className = 'editor-msg editor-msg--visible';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save';
      }
    }
  });

  preview.innerHTML = renderMarkdown(bodyField.value);
}

document.addEventListener('DOMContentLoaded', initEditor);
