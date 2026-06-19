import type { CollectionEntry } from 'astro:content';

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
  type: 'related' | 'same-tag' | 'same-life-stage';
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraphData(entries: CollectionEntry<'entries'>[]): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const entry of entries) {
    nodes.push({
      id: entry.id,
      label: entry.data.title,
      category: entry.data.category,
      tags: entry.data.tags,
      date: entry.data.date_created.toISOString(),
    });
  }

  for (const entry of entries) {
    for (const relatedId of entry.data.related) {
      const resolved = entries.find(e => e.id === relatedId);
      if (resolved) {
        const key = [entry.id, resolved.id].sort().join('::');
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({
            source: entry.id,
            target: resolved.id,
            type: 'related',
            weight: 3,
          });
        }
      }
    }
  }

  const tagMap = new Map<string, string[]>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push(entry.id);
    }
  }
  for (const [, entryIds] of tagMap) {
    for (let i = 0; i < entryIds.length; i++) {
      for (let j = i + 1; j < entryIds.length; j++) {
        const key = [entryIds[i], entryIds[j]].sort().join('::');
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({
            source: entryIds[i],
            target: entryIds[j],
            type: 'same-tag',
            weight: 1,
          });
        }
      }
    }
  }

  const stageMap = new Map<string, string[]>();
  for (const entry of entries) {
    for (const stage of entry.data.life_stage) {
      if (!stageMap.has(stage)) stageMap.set(stage, []);
      stageMap.get(stage)!.push(entry.id);
    }
  }
  for (const [, entryIds] of stageMap) {
    for (let i = 0; i < entryIds.length; i++) {
      for (let j = i + 1; j < entryIds.length; j++) {
        const key = [entryIds[i], entryIds[j]].sort().join('::');
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({
            source: entryIds[i],
            target: entryIds[j],
            type: 'same-life-stage',
            weight: 2,
          });
        }
      }
    }
  }

  return { nodes, edges };
}
