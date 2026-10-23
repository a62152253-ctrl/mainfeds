import { DocumentSnapshot } from './types';

const STORAGE_KEY = 'notion_history_snapshots_v1';

export const loadSnapshots = (docId: string): DocumentSnapshot[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${docId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveSnapshot = (snapshot: DocumentSnapshot): void => {
  try {
    const key = `${STORAGE_KEY}_${snapshot.docId}`;
    const list = loadSnapshots(snapshot.docId);
    // Limit to latest 30 snapshots
    const updated = [snapshot, ...list].slice(0, 30);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save snapshot:', err);
  }
};
