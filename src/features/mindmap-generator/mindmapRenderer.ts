import { MindmapNode, MindmapTreeLayout, MindmapTheme } from './types';

export const THEME_CONFIG: Record<
  MindmapTheme,
  {
    bg: string;
    root: { bg: string; border: string; text: string };
    h1: { bg: string; border: string; text: string };
    h2: { bg: string; border: string; text: string };
    h3: { bg: string; border: string; text: string };
    item: { bg: string; border: string; text: string };
    line: string;
  }
> = {
  modern: {
    bg: '#0f172a',
    root: { bg: '#2563eb', border: '#60a5fa', text: '#ffffff' },
    h1: { bg: '#1e293b', border: '#3b82f6', text: '#93c5fd' },
    h2: { bg: '#1e293b', border: '#6366f1', text: '#c7d2fe' },
    h3: { bg: '#0f172a', border: '#475569', text: '#cbd5e1' },
    item: { bg: '#182234', border: '#334155', text: '#94a3b8' },
    line: '#3b82f6',
  },
  cyberpunk: {
    bg: '#120a1f',
    root: { bg: '#d946ef', border: '#f472b6', text: '#ffffff' },
    h1: { bg: '#2e1065', border: '#c084fc', text: '#f5d0fe' },
    h2: { bg: '#3b0764', border: '#a855f7', text: '#e9d5ff' },
    h3: { bg: '#1e1b4b', border: '#818cf8', text: '#c7d2fe' },
    item: { bg: '#1a103c', border: '#6b21a8', text: '#d8b4fe' },
    line: '#d946ef',
  },
  emerald: {
    bg: '#06281e',
    root: { bg: '#059669', border: '#34d399', text: '#ffffff' },
    h1: { bg: '#064e3b', border: '#10b981', text: '#a7f3d0' },
    h2: { bg: '#022c22', border: '#059669', text: '#6ee7b7' },
    h3: { bg: '#064e3b', border: '#047857', text: '#a7f3d0' },
    item: { bg: '#09382b', border: '#065f46', text: '#a7f3d0' },
    line: '#10b981',
  },
  amber: {
    bg: '#271708',
    root: { bg: '#d97706', border: '#fbbf24', text: '#ffffff' },
    h1: { bg: '#451a03', border: '#f59e0b', text: '#fde68a' },
    h2: { bg: '#78350f', border: '#d97706', text: '#fcd34d' },
    h3: { bg: '#451a03', border: '#b45309', text: '#fde68a' },
    item: { bg: '#391c0b', border: '#92400e', text: '#fde68a' },
    line: '#f59e0b',
  },
};

export const getNodeBadgeColor = (level: number): string => {
  switch (level) {
    case 0:
      return 'bg-blue-600 text-white font-bold border-blue-400';
    case 1:
      return 'bg-indigo-900/60 text-indigo-200 border-indigo-700/60 font-semibold';
    case 2:
      return 'bg-violet-900/50 text-violet-200 border-violet-700/50 font-medium';
    case 3:
      return 'bg-slate-800 text-slate-300 border-slate-700';
    default:
      return 'bg-slate-900 text-slate-400 border-slate-800';
  }
};

/**
 * Calculates 2D spatial coordinates for visual tree layout with smooth Bezier links.
 */
export function calculateTreeLayout(root: MindmapNode): MindmapTreeLayout {
  const nodeWidth = 180;
  const nodeHeight = 44;
  const horizontalGap = 120;
  const verticalGap = 24;

  let currentY = 40;
  const positionedNodes: (MindmapNode & { x: number; y: number })[] = [];
  const links: MindmapTreeLayout['links'] = [];

  function layoutSubtree(node: MindmapNode, depth: number): number {
    const startY = currentY;

    if (node.children.length === 0) {
      const y = currentY;
      currentY += nodeHeight + verticalGap;
      const x = depth * (nodeWidth + horizontalGap) + 60;
      positionedNodes.push({ ...node, x, y, width: nodeWidth, height: nodeHeight });
      return y;
    }

    const childYs: number[] = [];
    node.children.forEach((child) => {
      const childY = layoutSubtree(child, depth + 1);
      childYs.push(childY);
    });

    const midY = (childYs[0] + childYs[childYs.length - 1]) / 2;
    const x = depth * (nodeWidth + horizontalGap) + 60;
    positionedNodes.push({ ...node, x, y: midY, width: nodeWidth, height: nodeHeight });

    node.children.forEach((child) => {
      const childNode = positionedNodes.find((n) => n.id === child.id);
      if (childNode) {
        links.push({
          sourceId: node.id,
          targetId: child.id,
          sourceX: x + nodeWidth,
          sourceY: midY + nodeHeight / 2,
          targetX: childNode.x,
          targetY: childNode.y + nodeHeight / 2,
        });
      }
    });

    return midY;
  }

  layoutSubtree(root, 0);

  const maxX = Math.max(...positionedNodes.map((n) => n.x + (n.width || nodeWidth))) + 80;
  const maxY = Math.max(...positionedNodes.map((n) => n.y + (n.height || nodeHeight))) + 80;

  return {
    width: Math.max(maxX, 800),
    height: Math.max(maxY, 600),
    nodes: positionedNodes,
    links,
  };
}

/**
 * Exports mindmap tree into clean Markdown Outline format.
 */
export function exportToMarkdownOutline(root: MindmapNode): string {
  const lines: string[] = [`# ${root.text}\n`];

  function walk(node: MindmapNode, depth: number) {
    node.children.forEach((child) => {
      const prefix = '  '.repeat(depth) + (child.type === 'todo' ? (child.checked ? '- [x] ' : '- [ ] ') : '- ');
      lines.push(`${prefix}${child.text}`);
      walk(child, depth + 1);
    });
  }

  walk(root, 0);
  return lines.join('\n');
}
