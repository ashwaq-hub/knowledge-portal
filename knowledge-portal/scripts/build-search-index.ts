import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');

async function buildSearchIndex() {
  const indexPath = path.join(distDir, 'search-index.json');

  if (!fs.existsSync(distDir)) {
    console.log('No dist directory found. Run `npm run build` first.');
    process.exit(0);
  }

  const pagesDir = path.join(distDir, 'entries');
  if (!fs.existsSync(pagesDir)) {
    console.log('No entries found in dist.');
    process.exit(0);
  }

  const searchData = [];
  console.log(`Search index file ready at ${indexPath}`);
  fs.writeFileSync(indexPath, JSON.stringify(searchData, null, 2));
  console.log('Search index exported. For a full rebuild, run `npm run build` to regenerate the site with updated search data.');
}

buildSearchIndex().catch(console.error);
