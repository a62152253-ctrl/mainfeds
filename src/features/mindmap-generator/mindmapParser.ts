import { MindmapNode, MindmapNodeType } from './types';
import { DocBlock } from '../../types/workspace';

/**
 * Parses structured DocBlock[] array directly into a hierarchical Mindmap tree.
 */
export const parseBlocksToMindmap = (blocks: DocBlock[], docTitle: string): MindmapNode => {
  const root: MindmapNode = {
    id: 'root',
    text: docTitle || 'Główna idea dokumentu',
    level: 0,
    type: 'root',
    children: [],
  };

  let currentH1: MindmapNode | null = null;
  let currentH2: MindmapNode | null = null;
  let currentH3: MindmapNode | null = null;

  blocks.forEach((block, idx) => {
    const text = block.content?.trim();
    if (!text && block.type !== 'image') return;

    const blockType = block.type;
    const displayText = text || (blockType === 'image' ? '[Obraz]' : 'Klocek');

    if (blockType === 'h1') {
      const node: MindmapNode = {
        id: block.id || `node-${idx}`,
        text: displayText,
        level: 1,
        type: 'h1',
        children: [],
      };
      root.children.push(node);
      currentH1 = node;
      currentH2 = null;
      currentH3 = null;
    } else if (blockType === 'h2') {
      const node: MindmapNode = {
        id: block.id || `node-${idx}`,
        text: displayText,
        level: 2,
        type: 'h2',
        children: [],
      };
      if (currentH1) {
        currentH1.children.push(node);
      } else {
        root.children.push(node);
      }
      currentH2 = node;
      currentH3 = null;
    } else if (blockType === 'h3') {
      const node: MindmapNode = {
        id: block.id || `node-${idx}`,
        text: displayText,
        level: 3,
        type: 'h3',
        children: [],
      };
      if (currentH2) {
        currentH2.children.push(node);
      } else if (currentH1) {
        currentH1.children.push(node);
      } else {
        root.children.push(node);
      }
      currentH3 = node;
    } else if (blockType === 'todo' || blockType === 'bullet' || blockType === 'callout') {
      const node: MindmapNode = {
        id: block.id || `node-${idx}`,
        text: displayText,
        level: 4,
        type: blockType as MindmapNodeType,
        checked: block.checked,
        children: [],
      };

      const parent = currentH3 || currentH2 || currentH1 || root;
      parent.children.push(node);
    }
  });

  return root;
};

/**
 * Backward compatibility parser that parses HTML strings
 */
export const parseDocumentStructure = (html: string, docTitle: string): MindmapNode => {
  const root: MindmapNode = {
    id: 'root',
    text: docTitle || 'Główna idea',
    level: 0,
    type: 'root',
    children: [],
  };

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const elements = temp.querySelectorAll('h1, h2, h3, li, blockquote');
  let currentH1: MindmapNode | null = null;
  let currentH2: MindmapNode | null = null;

  elements.forEach((el, idx) => {
    const text = el.textContent?.trim();
    if (!text) return;
    const tag = el.tagName.toLowerCase();

    let nodeType: MindmapNodeType = 'custom';
    let level = 4;
    if (tag === 'h1') {
      nodeType = 'h1';
      level = 1;
    } else if (tag === 'h2') {
      nodeType = 'h2';
      level = 2;
    } else if (tag === 'h3') {
      nodeType = 'h3';
      level = 3;
    } else if (tag === 'li') {
      nodeType = 'bullet';
      level = 4;
    }

    const node: MindmapNode = {
      id: 'node-' + idx,
      text,
      level,
      type: nodeType,
      children: [],
    };

    if (level === 1) {
      root.children.push(node);
      currentH1 = node;
      currentH2 = null;
    } else if (level === 2) {
      if (currentH1) {
        currentH1.children.push(node);
      } else {
        root.children.push(node);
      }
      currentH2 = node;
    } else {
      if (currentH2) {
        currentH2.children.push(node);
      } else if (currentH1) {
        currentH1.children.push(node);
      } else {
        root.children.push(node);
      }
    }
  });

  return root;
};
