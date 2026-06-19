import Sigma from 'sigma';
import Graph from 'graphology';

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  tags: string[];
  date: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function renderGraph(
  containerId: string,
  loadingId: string,
  tooltipId: string,
  graphData: GraphData,
  categoryColors: Record<string, string>,
) {
  const container = document.getElementById(containerId);
  const loading = document.getElementById(loadingId);
  const tooltip = document.getElementById(tooltipId);

  if (!container || graphData.nodes.length === 0) {
    if (loading) {
      loading.innerHTML = '<p style="color: var(--color-text-muted);">No entries yet — add entries with tags and related links to see the graph.</p>';
    }
    return;
  }

  const graph = new Graph();
  const nodeSizeScale = Math.max(6, 20 - graphData.nodes.length * 0.3);

  graphData.nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / graphData.nodes.length;
    const radius = Math.min(300, 50 + graphData.nodes.length * 8);
    graph.addNode(n.id, {
      label: n.label,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      size: nodeSizeScale,
      color: categoryColors[n.category] || '#666',
      category: n.category,
      tags: n.tags,
      date: n.date,
    });
  });

  graphData.edges.forEach(e => {
    try {
      graph.addEdge(e.source, e.target, {
        type: 'arrow',
        color: e.type === 'related' ? '#666' : '#999',
        size: e.type === 'related' ? 1.5 : 0.5,
      });
    } catch (err) {
      // edge may already exist
    }
  });

  if (loading) loading.style.display = 'none';

  const renderer = new Sigma(graph, container, {
    renderEdgeLabels: false,
    enableEdgeEvents: true,
    labelDensity: 0.3,
    labelRenderedSizeThreshold: 8,
    minCameraRatio: 0.1,
    maxCameraRatio: 10,
  });

  let hoveredNode: string | null = null;

  renderer.on('enterNode', ({ node }) => {
    hoveredNode = node;
    const attrs = graph.getNodeAttributes(node);
    if (tooltip) {
      tooltip.innerHTML = `
        <div class="graph-tooltip-title">${attrs.label}</div>
        <div class="graph-tooltip-meta">${categoryColors[attrs.category] ? `<span style="color:${categoryColors[attrs.category]}">●</span>` : ''} ${attrs.category}</div>
        ${attrs.tags?.length ? `<div class="graph-tooltip-tags">${attrs.tags.slice(0, 5).map(t => '#' + t).join(' ')}</div>` : ''}
        <div class="graph-tooltip-link"><a href="/entries/${node}">Open entry →</a></div>
      `;
      tooltip.style.display = 'block';
    }
    graph.setNodeAttribute(node, 'size', nodeSizeScale * 1.5);
  });

  renderer.on('leaveNode', ({ node }) => {
    hoveredNode = null;
    if (tooltip) tooltip.style.display = 'none';
    graph.setNodeAttribute(node, 'size', nodeSizeScale);
  });

  renderer.on('clickNode', ({ node }) => {
    window.location.href = `/entries/${node}`;
  });

  renderer.getMouseCaptor().on('mousemove', (e) => {
    if (hoveredNode && tooltip) {
      tooltip.style.left = (e.x + 15) + 'px';
      tooltip.style.top = (e.y - 10) + 'px';
    }
  });

  let resizeTimeout: number;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => renderer.refresh(), 200);
  });
}
