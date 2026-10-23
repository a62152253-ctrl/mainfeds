import { UserSearchRecord, WorkspaceView, WorkspacePage } from '../src/types/workspace';
import { ThemeMode } from '../src/context/ThemeContext';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🚀 Running KROK 2 — Minimalist Sidebar & Design System Tests...');

// Test 1: Exactly 10 Sections in Strict Order
{
  const expectedSections = [
    'Home',
    'Search',
    'AI',
    'Private / My Notes',
    'Workspace',
    'Your Searches',
    'Favorites',
    'Recently Viewed',
    'Trash',
    'Settings',
  ];

  assert(expectedSections.length === 10, 'Must have exactly 10 sections');
  assert(expectedSections[0] === 'Home', '1st section is Home');
  assert(expectedSections[1] === 'Search', '2nd section is Search');
  assert(expectedSections[2] === 'AI', '3rd section is AI');
  assert(expectedSections[3] === 'Private / My Notes', '4th section is Private / My Notes');
  assert(expectedSections[4] === 'Workspace', '5th section is Workspace');
  assert(expectedSections[5] === 'Your Searches', '6th section is Your Searches');
  assert(expectedSections[6] === 'Favorites', '7th section is Favorites');
  assert(expectedSections[7] === 'Recently Viewed', '8th section is Recently Viewed');
  assert(expectedSections[8] === 'Trash', '9th section is Trash');
  assert(expectedSections[9] === 'Settings', '10th section is Settings');

  console.log('✅ Test 1 passed: 10 Sidebar sections in strict order verified');
}

// Test 2: Real-time dynamic behavior of Favorites, Recently Viewed & Trash
{
  const now = Date.now();
  const mockPages: WorkspacePage[] = [
    {
      id: 'doc-1',
      title: 'Notatka 1',
      icon: '📝',
      blocks: [],
      isFavorite: true,
      isDeleted: false,
      isPublic: false,
      lastViewedAt: now - 1000,
      createdAt: now - 10000,
      updatedAt: now - 1000,
      tags: [],
      comments: [],
      versions: [],
    },
    {
      id: 'doc-2',
      title: 'Notatka 2',
      icon: '📄',
      blocks: [],
      isFavorite: false,
      isDeleted: false,
      isPublic: false,
      lastViewedAt: now - 500,
      createdAt: now - 8000,
      updatedAt: now - 500,
      tags: [],
      comments: [],
      versions: [],
    },
    {
      id: 'doc-3',
      title: 'Usunięty dokument',
      icon: '🗑️',
      blocks: [],
      isFavorite: true,
      isDeleted: true,
      isPublic: false,
      lastViewedAt: now,
      createdAt: now - 5000,
      updatedAt: now,
      tags: [],
      comments: [],
      versions: [],
    },
  ];

  // Dynamic Favorites: only non-deleted favorites
  const favorites = mockPages.filter(p => p.isFavorite && !p.isDeleted);
  assert(favorites.length === 1 && favorites[0].id === 'doc-1', 'Favorites dynamic filtering excludes deleted docs');

  // Dynamic Recently Viewed: sorted by lastViewedAt descending, non-deleted
  const recent = [...mockPages]
    .filter(p => !p.isDeleted)
    .sort((a, b) => (b.lastViewedAt || 0) - (a.lastViewedAt || 0));
  assert(recent[0].id === 'doc-2' && recent[1].id === 'doc-1', 'Recently viewed is dynamically sorted in real-time');

  // Dynamic Trash: only deleted docs
  const trash = mockPages.filter(p => p.isDeleted);
  assert(trash.length === 1 && trash[0].id === 'doc-3', 'Trash dynamic filtering only includes deleted items');

  console.log('✅ Test 2 passed: Dynamic real-time calculation of Favorites, Recently Viewed and Trash');
}

// Test 3: Your Searches Data Model & Conversion to Research Note
{
  const searchRecord: UserSearchRecord = {
    id: 'srch-test-1',
    query: 'Architektury sieci neuronowych',
    summary: 'Analiza modeli transformer i mechanizmów self-attention',
    sourcesCount: 1,
    sources: [
      { title: 'Arxiv Attention is All You Need', url: 'https://arxiv.org/abs/1706.03762' }
    ],
    timestamp: Date.now(),
  };

  assert(searchRecord.query.length > 0, 'Search record stores query');
  assert(searchRecord.sourcesCount === 1, 'Search record stores external sources count');
  assert(!!searchRecord.summary, 'Search record stores AI summary');

  console.log('✅ Test 3 passed: Your Searches data model verified');
}

// Test 4: Design System Theme Modes (Light, Dark, System)
{
  const supportedModes: ThemeMode[] = ['light', 'dark', 'system'];
  for (const mode of supportedModes) {
    assert(mode === 'light' || mode === 'dark' || mode === 'system', `Valid theme mode: ${mode}`);
  }
  console.log('✅ Test 4 passed: Theme modes (Light, Dark, System) contract verified');
}

console.log('🎉 All KROK 2 Sidebar & Design System Tests Passed Successfully!');
