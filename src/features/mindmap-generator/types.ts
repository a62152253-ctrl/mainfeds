export type MindmapNodeType = 'root' | 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'quote' | 'callout' | 'custom';

export type MindmapLayoutMode = 'tree' | 'radial' | 'outline';

export type MindmapTheme = 'modern' | 'cyberpunk' | 'emerald' | 'amber';

export interface MindmapNode {
  id: string;
  text: string;
  level: number;
  type?: MindmapNodeType;
  checked?: boolean;
  collapsed?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children: MindmapNode[];
}

export interface MindmapTreeLayout {
  width: number;
  height: number;
  nodes: (MindmapNode & { x: number; y: number })[];
  links: { sourceId: string; targetId: string; sourceX: number; sourceY: number; targetX: number; targetY: number }[];
}
