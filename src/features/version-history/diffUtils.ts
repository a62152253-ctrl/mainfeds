export interface DiffSegment {
  type: 'same' | 'added' | 'removed';
  text: string;
}

export const formatSnapshotTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
};

export const extractCleanText = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const getPreviewSnippet = (html: string): string => {
  const text = extractCleanText(html);
  return text.slice(0, 80).trim() + (text.length > 80 ? '...' : '');
};

/**
 * Line-based diff computation comparing two versions
 */
export function computeTextDiff(oldText: string, newText: string): DiffSegment[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffSegment[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i];
    const n = newLines[i];

    if (o === n) {
      if (o !== undefined) result.push({ type: 'same', text: o });
    } else {
      if (o !== undefined) result.push({ type: 'removed', text: o });
      if (n !== undefined) result.push({ type: 'added', text: n });
    }
  }

  return result;
}

/**
 * Calculates number of added and deleted lines
 */
export function calculateDiffStats(oldHtml: string, newHtml: string): { additions: number; deletions: number } {
  const oldText = extractCleanText(oldHtml);
  const newText = extractCleanText(newHtml);
  const segments = computeTextDiff(oldText, newText);

  let additions = 0;
  let deletions = 0;
  segments.forEach((s) => {
    if (s.type === 'added') additions++;
    if (s.type === 'removed') deletions++;
  });

  return { additions, deletions };
}
