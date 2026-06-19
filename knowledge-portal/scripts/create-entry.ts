import fs from 'fs';
import path from 'path';
import readline from 'readline';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

const CATEGORIES = [
  { id: 'life-lessons', name: 'Life Lessons' },
  { id: 'decision-frameworks', name: 'Decision Frameworks' },
  { id: 'financial-wisdom', name: 'Financial Wisdom' },
  { id: 'family-history', name: 'Family History' },
  { id: 'practical-skills', name: 'Practical Skills' },
  { id: 'book-library', name: 'Book Library' },
  { id: 'values', name: 'Values & Principles' },
  { id: 'letters-to-future', name: 'Letters to the Future' },
  { id: 'career-craft', name: 'Career & Craft' },
  { id: 'health-wellness', name: 'Health & Wellness' },
];

const TEMPLATES = [
  { id: 'entry', name: 'Generic Entry' },
  { id: 'book-review', name: 'Book Review' },
  { id: 'letter', name: 'Letter' },
  { id: 'skill-guide', name: 'Skill Guide' },
];

const TEMPLATE_DIR = path.resolve(import.meta.dirname, '..', 'templates');
const CONTENT_DIR = path.resolve(import.meta.dirname, '..', 'src', 'content', 'entries');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(query: string): Promise<string> {
  return new Promise(resolve => rl.question(`  ${query}`, resolve));
}

async function pick<T>(label: string, options: { id: string; name: string }[]): Promise<string> {
  console.log(`\n  ${label}:`);
  options.forEach((o, i) => console.log(`    ${i + 1}. ${o.name}`));
  const answer = await ask(`  Enter number (1-${options.length}): `);
  const idx = parseInt(answer, 10) - 1;
  if (idx >= 0 && idx < options.length) return options[idx].id;
  console.log('  Invalid choice, defaulting to first option.');
  return options[0].id;
}

async function main() {
  console.log('\n  ═══════════════════════════');
  console.log('   New Knowledge Entry');
  console.log('  ═══════════════════════════\n');

  const title = await ask('Title: ');
  if (!title) {
    console.log('  Title is required. Aborting.\n');
    process.exit(1);
  }

  const slug = slugify(title);
  const categoryId = await pick('Category', CATEGORIES);
  const templateId = await pick('Template', TEMPLATES);

  const tagsRaw = await ask('Tags (comma-separated): ');
  const tags = tagsRaw
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const excerpt = await ask('Excerpt (one-line summary): ');

  const maturity = await pick('Maturity', [
    { id: 'draft', name: 'Draft' },
    { id: 'reviewed', name: 'Reviewed' },
    { id: 'final', name: 'Final' },
  ]);

  const priority = await pick('Priority', [
    { id: 'low', name: 'Low' },
    { id: 'medium', name: 'Medium' },
    { id: 'high', name: 'High' },
    { id: 'critical', name: 'Critical' },
  ]);

  const targetDir = path.join(CONTENT_DIR, categoryId);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, `${slug}.md`);

  if (fs.existsSync(filePath)) {
    const overwrite = await ask(`File ${filePath} exists. Overwrite? (y/N): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('  Aborted.\n');
      process.exit(0);
    }
  }

  const tagsYaml = tags.length > 0 ? `\n[${tags.map(t => `"${t}"`).join(', ')}]` : ' []';

  const frontmatter = `---
title: "${title}"
category: ${categoryId}
tags: ${tagsYaml}
date_created: ${todayISO()}
life_stage: []
related: []
maturity: ${maturity}
priority: ${priority}
excerpt: "${excerpt}"
---

`;
  let body = frontmatter;

  const templatePath = path.join(TEMPLATE_DIR, `${templateId}.md`);
  if (fs.existsSync(templatePath)) {
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const templateBody = templateContent.replace(/---[\s\S]*?---\n*/, '').trim();
    body += templateBody + '\n';
  } else {
    body += `## ${title}\n\nStart writing...\n`;
  }

  fs.writeFileSync(filePath, body);

  console.log(`\n  ✓ Created: ${filePath}\n`);

  const editNow = await ask('Open in editor? (y/N): ');
  if (editNow.toLowerCase() === 'y') {
    const editor = process.env.EDITOR || process.env.VISUAL || 'notepad';
    const { execSync } = await import('child_process');
    execSync(`"${editor}" "${filePath}"`, { stdio: 'inherit' });
  }

  console.log('  Done.\n');
  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
