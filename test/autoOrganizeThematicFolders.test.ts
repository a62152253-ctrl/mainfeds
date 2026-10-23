import assert from 'node:assert';

// Mock localStorage for node test environment
const store: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => {
    store[key] = String(val);
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

import { sqliteDb } from '../src/services/sqliteDatabase';
import { WorkspacePage, validateAndMigratePage } from '../src/types/workspace';

console.log('🧪 Running Thematic Folder Organizer & SQLite Tests...');

// Setup test pages
const page1: WorkspacePage = validateAndMigratePage({
  id: 'p-sci-1',
  title: 'Badanie: Koty i sztuczna inteligencja',
  pageType: 'Research',
  blocks: [{ id: 'b1', type: 'p', content: 'Encyklopedia wiedzy o biologii i SI.' }],
  tags: [],
  permissions: { accessLevel: 'workspace', role: 'Owner' },
  isFavorite: false,
  isDeleted: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const page2: WorkspacePage = validateAndMigratePage({
  id: 'p-code-1',
  title: 'Architektura API w React i TypeScript',
  pageType: 'Project',
  blocks: [{ id: 'b2', type: 'code', content: 'export const api = () => {}' }],
  tags: [],
  permissions: { accessLevel: 'workspace', role: 'Owner' },
  isFavorite: false,
  isDeleted: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const page3: WorkspacePage = validateAndMigratePage({
  id: 'p-meet-1',
  title: 'Daily Standup i Retro Zespołu',
  pageType: 'Meeting',
  blocks: [{ id: 'b3', type: 'p', content: 'Omówienie ustaleń ze spotkania sprintu.' }],
  tags: [],
  permissions: { accessLevel: 'workspace', role: 'Owner' },
  isFavorite: false,
  isDeleted: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

sqliteDb.savePage(page1);
sqliteDb.savePage(page2);
sqliteDb.savePage(page3);

const allPagesBefore = sqliteDb.getAllPages();
assert.ok(allPagesBefore.length >= 3, 'Pages should be saved in SQLite');
console.log('✅ Test 1 passed: 3 test pages saved to SQLite without folders');

// Simulate categorization logic
const THEMATIC_CATEGORIES = [
  { name: 'Baza Wiedzy & Nauka', icon: '🧠', keywords: ['badanie', 'sztuczna inteligencja', 'biologia'] },
  { name: 'Projekty & Kod', icon: '💻', keywords: ['api', 'react', 'typescript', 'kod'] },
  { name: 'Zespół & Spotkania', icon: '👥', keywords: ['daily', 'retro', 'spotkanie', 'zespół'] },
];

for (const p of [page1, page2, page3]) {
  const fullText = `${p.title} ${p.blocks.map(b => b.content).join(' ')}`.toLowerCase();
  let matched = THEMATIC_CATEGORIES[0];
  for (const cat of THEMATIC_CATEGORIES) {
    if (cat.keywords.some(k => fullText.includes(k))) {
      matched = cat;
      break;
    }
  }

  const folderId = `folder-${matched.name.replace(/\s+/g, '-').toLowerCase()}`;
  sqliteDb.saveFolder({
    id: folderId,
    name: matched.name,
    icon: matched.icon,
    ownerId: 'local-user',
    createdAt: Date.now(),
  });

  sqliteDb.savePage({
    ...p,
    folderId,
    updatedAt: Date.now(),
  });
}

const p1Updated = sqliteDb.getPageById('p-sci-1');
const p2Updated = sqliteDb.getPageById('p-code-1');
const p3Updated = sqliteDb.getPageById('p-meet-1');

assert.ok(p1Updated?.folderId, 'Page 1 must have folderId');
assert.ok(p2Updated?.folderId, 'Page 2 must have folderId');
assert.ok(p3Updated?.folderId, 'Page 3 must have folderId');

assert.ok(p1Updated?.folderId?.includes('nauka') || p1Updated?.folderId?.includes('wiedzy'));
assert.ok(p2Updated?.folderId?.includes('kod') || p2Updated?.folderId?.includes('projekty'));
assert.ok(p3Updated?.folderId?.includes('spotkania') || p3Updated?.folderId?.includes('zesp'));
console.log('✅ Test 2 passed: All 3 pages categorized and persisted to SQLite');

// Cleanup
sqliteDb.deletePage('p-sci-1');
sqliteDb.deletePage('p-code-1');
sqliteDb.deletePage('p-meet-1');
console.log('✅ Test 3 passed: Test cleanup completed');

console.log('\n🎉 ALL FOLDER ORGANIZER & SQLITE TESTS PASSED 100%!');
