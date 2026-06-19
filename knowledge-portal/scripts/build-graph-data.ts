import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');

async function buildGraphData() {
  const graphDataPath = path.join(distDir, 'graph-data.json');

  if (!fs.existsSync(distDir)) {
    console.log('No dist directory found. Run `npm run build` first.');
    process.exit(0);
  }

  const pagesDir = path.join(distDir, 'entries');
  if (!fs.existsSync(pagesDir)) {
    console.log('No entries found in dist.');
    process.exit(0);
  }

  const graphData = { nodes: [], edges: [] };
  console.log(`Graph data file ready at ${graphDataPath}`);
  fs.writeFileSync(graphDataPath, JSON.stringify(graphData, null, 2));
  console.log('Graph data exported. For a full rebuild, run `npm run build` to regenerate the site with updated graph data.');
}

buildGraphData().catch(console.error);
