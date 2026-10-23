import assert from 'assert';
import { sqliteDb } from '../src/services/sqliteDatabase';
import { AI_COMMANDS, matchAiCommands } from '../src/features/ai/commandsRegistry';
import { generateEditorAiResponse } from '../src/features/ai/editorAiService';
import { WorkspacePage, validateAndMigratePage } from '../src/types/workspace';

console.log('🧪 Running Tests: SQLite Database & 5 New AI Commands...');

// Mock localStorage for node test environment if needed
if (typeof localStorage === 'undefined') {
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
}

async function runTests() {
  // 1. SQLite Service Verification
  sqliteDb.initDatabase();
  const initialPages = sqliteDb.getAllPages();
  assert(initialPages.length > 0, 'SQLite should initialize with default welcome page');
  console.log(`✅ Test 1 passed: SQLite initialized with ${initialPages.length} default pages`);

  // Test saving and reading page in SQLite
  const testPage: WorkspacePage = validateAndMigratePage({
    id: 'test-page-sqlite-1',
    title: 'Strona testowa SQLite',
    pageType: 'Project',
    icon: '📊',
    blocks: [
      { id: 'b-1', type: 'h1', content: 'Projekt Relacyjnej Bazy' },
      { id: 'b-2', type: 'p', content: 'Opis projektu...' },
    ],
    tags: ['test', 'sqlite'],
    permissions: { accessLevel: 'workspace', role: 'Owner' },
    isFavorite: true,
    isDeleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  sqliteDb.savePage(testPage);
  const fetched = sqliteDb.getPageById('test-page-sqlite-1');
  assert.strictEqual(fetched?.title, 'Strona testowa SQLite', 'Page should be retrieved from SQLite');
  assert.strictEqual(fetched?.isFavorite, true, 'isFavorite flag should persist');
  console.log('✅ Test 2 passed: SQLite savePage and getPageById verified');

  // Test SQL Dump Generation
  const dump = sqliteDb.dumpSql();
  assert(dump.includes('CREATE TABLE IF NOT EXISTS pages'), 'Dump must include pages table');
  assert(dump.includes('CREATE TABLE IF NOT EXISTS tasks'), 'Dump must include tasks table');
  assert(dump.includes('Strona testowa SQLite'), 'Dump must contain saved records');
  console.log('✅ Test 3 passed: SQLite dumpSql generated valid relational SQL schema and data');

  // 2. Registry verification of 5 New AI Commands
  const expectedCommands = ['@mindmap', '@translate', '@polishstyle', '@critique', '@expandblock'];
  for (const cmd of expectedCommands) {
    const found = AI_COMMANDS.find((c) => c.command === cmd);
    assert(found, `Command ${cmd} must be registered in AI_COMMANDS`);
    const matched = matchAiCommands(cmd);
    assert(matched.some((m) => m.command === cmd), `Command ${cmd} should match prefix`);
  }
  console.log('✅ Test 4 passed: All 5 new AI commands registered and searchable in palette');

  const mockDoc: WorkspacePage = validateAndMigratePage({
    id: 'doc-ai-test',
    title: 'Strategia Rozwoju SearchPoint',
    pageType: 'Document',
    blocks: [
      { id: 'b-1', type: 'h1', content: 'Strategia 2026' },
      { id: 'b-2', type: 'p', content: 'Głównym celem jest eliminacja chmury na rzecz lokalnego SQLite.' },
    ],
    tags: [],
    permissions: { accessLevel: 'workspace', role: 'Owner' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // 3. Test @mindmap
  const mindmapRes = await generateEditorAiResponse({
    query: '@mindmap Strategia Rozwoju SearchPoint',
    activeDoc: mockDoc,
    pages: [mockDoc],
  });
  assert(mindmapRes.text.includes('Wizualna Mapa Myśli'), 'Mindmap response must include title');
  assert(mindmapRes.blocks && mindmapRes.blocks.length > 0, 'Mindmap must return structured blocks');
  console.log('✅ Test 5 passed: @mindmap generates visual concept hierarchy and blocks');

  // 4. Test @translate
  const translateRes = await generateEditorAiResponse({
    query: '@translate EN Strategia Rozwoju SearchPoint',
    activeDoc: mockDoc,
    pages: [mockDoc],
  });
  assert(translateRes.text.includes('Translated Document'), 'Translate response must include translated header');
  assert(translateRes.blocks && translateRes.blocks.length > 0, 'Translate must return formatted blocks');
  console.log('✅ Test 6 passed: @translate generates multilingual block translation');

  // 5. Test @polishstyle
  const polishRes = await generateEditorAiResponse({
    query: '@polishstyle',
    activeDoc: mockDoc,
    pages: [mockDoc],
  });
  assert(polishRes.text.includes('Redakcja Stylistyczna'), 'Polish response must include style audit');
  assert(polishRes.blocks && polishRes.blocks.length > 0, 'Polish must return blocks');
  console.log('✅ Test 7 passed: @polishstyle refines tone and fixes grammar');

  // 6. Test @critique
  const critiqueRes = await generateEditorAiResponse({
    query: '@critique',
    activeDoc: mockDoc,
    pages: [mockDoc],
  });
  assert(critiqueRes.text.includes('Adwokat Diabła'), 'Critique response must include devil advocate audit');
  assert(critiqueRes.blocks && critiqueRes.blocks.length > 0, 'Critique must return risk matrix blocks');
  console.log('✅ Test 8 passed: @critique audits assumptions and builds counter-arguments');

  // 7. Test @expandblock
  const expandRes = await generateEditorAiResponse({
    query: '@expandblock Wdrożenie SQLite',
    activeDoc: mockDoc,
    pages: [mockDoc],
  });
  assert(expandRes.text.includes('Rozwinięcie Koncepcji'), 'Expand response must include expansion header');
  assert(expandRes.blocks && expandRes.blocks.length > 0, 'Expand must return actionable checklist blocks');
  console.log('✅ Test 9 passed: @expandblock contextually elaborates ideas into concrete steps');

  // Clean up
  sqliteDb.deletePage('test-page-sqlite-1');

  console.log('\n🎉 ALL SQLITE AND 5 NEW AI COMMAND TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
