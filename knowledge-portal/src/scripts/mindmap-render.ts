import * as d3 from 'd3';

export interface MindmapEntry {
  id: string;
  title: string;
  category: string;
  tags: string[];
  date: string;
}

export interface MindmapData {
  entries: MindmapEntry[];
  categories: { id: string; name: string; icon: string }[];
}

interface HierarchyNode {
  name: string;
  type: 'root' | 'category' | 'tag' | 'entry';
  id?: string;
  entries?: number;
  icon?: string;
  category?: string;
  children?: HierarchyNode[];
}

export function renderMindmap(
  containerId: string,
  data: MindmapData,
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = container.clientWidth;
  const height = Math.max(600, window.innerHeight - 250);

  container.innerHTML = '';

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  const root: HierarchyNode = {
    name: 'Knowledge',
    type: 'root',
    entries: data.entries.length,
    children: data.categories.map(cat => {
      const catEntries = data.entries.filter(e => e.category === cat.id);
      const tagMap = new Map<string, MindmapEntry[]>();
      catEntries.forEach(e => {
        e.tags.forEach(t => {
          if (!tagMap.has(t)) tagMap.set(t, []);
          tagMap.get(t)!.push(e);
        });
      });
      return {
        name: cat.name,
        type: 'category',
        id: cat.id,
        icon: cat.icon,
        entries: catEntries.length,
        children: [...tagMap.entries()]
          .sort((a, b) => b[1].length - a[1].length)
          .map(([tag, tagEntries]) => ({
            name: tag,
            type: 'tag',
            entries: tagEntries.length,
            children: tagEntries.map(e => ({
              name: e.title,
              type: 'entry',
              id: e.id,
              category: e.category,
            })),
          })),
      };
    }),
  };

  const hierarchy = d3.hierarchy(root);
  const treeLayout = d3.tree<HierarchyNode>()
    .size([2 * Math.PI, Math.min(width / 2 - 80, 400)])
    .separation((a, b) => (a.parent === b.parent ? 1.5 : 2.5) / (a.depth + 1));

  treeLayout(hierarchy);

  const categoryColors: Record<string, string> = {
    'life-lessons': '#2563eb',
    'decision-frameworks': '#7c3aed',
    'financial-wisdom': '#059669',
    'family-history': '#d97706',
    'practical-skills': '#dc2626',
    'book-library': '#0891b2',
    'values': '#9333ea',
    'letters-to-future': '#db2777',
    'career-craft': '#ca8a04',
    'health-wellness': '#16a34a',
  };

  const linkGenerator = d3.linkRadial<d3.HierarchyPointNode<HierarchyNode>, d3.HierarchyPointNode<HierarchyNode>>()
    .angle(d => d.x)
    .radius(d => d.y);

  const links = svg.append('g')
    .selectAll('path')
    .data(hierarchy.links())
    .join('path')
    .attr('d', linkGenerator)
    .attr('fill', 'none')
    .attr('stroke', d => {
      if (d.target.data.type === 'category') return '#666';
      if (d.target.data.type === 'tag') return '#999';
      return '#ccc';
    })
    .attr('stroke-width', d => {
      if (d.target.data.type === 'category') return 2;
      if (d.target.data.type === 'tag') return 1.5;
      return 0.5;
    })
    .attr('stroke-opacity', 0.6);

  const node = svg.append('g')
    .selectAll('g')
    .data(hierarchy.descendants())
    .join('g')
    .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
    .style('cursor', d => d.data.type === 'entry' ? 'pointer' : 'default');

  node.append('circle')
    .attr('r', d => {
      if (d.data.type === 'root') return 10;
      if (d.data.type === 'category') return 8;
      if (d.data.type === 'tag') return 5;
      return 3;
    })
    .attr('fill', d => {
      if (d.data.type === 'root') return '#1c1917';
      if (d.data.type === 'category') return categoryColors[d.data.id || ''] || '#666';
      if (d.data.type === 'tag') return '#999';
      return '#ccc';
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5);

  node.append('text')
    .attr('dy', d => d.data.type === 'entry' ? 3 : -12)
    .attr('x', d => d.x < Math.PI ? 12 : -12)
    .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
    .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : 'rotate(0)')
    .text(d => {
      if (d.data.type === 'root') return `${d.data.name} (${d.data.entries})`;
      if (d.data.type === 'category') return `${d.data.icon} ${d.data.name} (${d.data.entries})`;
      if (d.data.type === 'tag') return `#${d.data.name} (${d.data.entries})`;
      const maxLen = Math.floor(width / (d.depth * 5 + 60));
      return d.data.name.length > maxLen ? d.data.name.slice(0, maxLen - 3) + '...' : d.data.name;
    })
    .attr('font-size', d => {
      if (d.data.type === 'root') return '14px';
      if (d.data.type === 'category') return '12px';
      if (d.data.type === 'tag') return '10px';
      return '9px';
    })
    .attr('font-weight', d => {
      if (d.data.type === 'root' || d.data.type === 'category') return '600';
      return '400';
    })
    .attr('fill', d => {
      if (d.data.type === 'root') return '#1c1917';
      if (d.data.type === 'category') return categoryColors[d.data.id || ''] || '#666';
      return '#666';
    });

  node.on('click', (_event: any, d: d3.HierarchyPointNode<HierarchyNode>) => {
    if (d.data.type === 'entry' && d.data.id) {
      window.location.href = `/entries/${d.data.id}`;
    }
  });

  node.append('title')
    .text(d => {
      if (d.data.type === 'entry') return `Open: ${d.data.name}`;
      if (d.data.type === 'tag') return `Tag: ${d.data.name} (${d.data.entries} entries)`;
      return `${d.data.name} (${d.data.entries} entries)`;
    });

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 3])
    .on('zoom', (event) => {
      svg.attr('transform', event.transform);
    });

  d3.select(container).select('svg').call(zoom);

  d3.select(container).select('svg').on('dblclick.zoom', null);
}
