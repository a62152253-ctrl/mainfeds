import { generateEditorAiResponse } from '../src/features/ai/editorAiService';
import { cleanResearchQuery } from '../src/features/ai/multiSourceResearchService';
import { WorkspacePage } from '../src/types/workspace';

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Running Editor Action Dock & Unified AI Tests...');

const mockDoc: WorkspacePage = {
  id: 'doc-action-dock-1',
  title: 'Dokument Roboczy',
  icon: '📝',
  blocks: [
    { id: 'b1', type: 'h1', content: 'Dokument Roboczy SearchPoint' },
    { id: 'b2', type: 'p', content: 'Notatka zawiera opis wymagań oraz wstępny plan rozwoju aplikacji.' },
    { id: 'b3', type: 'todo', content: 'Zaimplementować mini pasek zadań AI na dole edytora', checked: false },
    { id: 'b4', type: 'todo', content: 'Połączyć dwa AI w jeden główny asystent', checked: true },
  ],
  isFavorite: false,
  isDeleted: false,
  isPublic: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: ['ai', 'dock'],
  comments: [],
  versions: [],
};

(async () => {
  // Test 1: Polish case normalization & typo resilience ("stwurz notatke i psach" -> Pies)
  const cleanDogs = cleanResearchQuery('stwurz notatke i psach');
  assert(cleanDogs === 'Pies' || cleanDogs === 'Psy', `cleanDogs was "${cleanDogs}"`);

  const cleanCats = cleanResearchQuery('stwórz notatkę o kotach');
  assert(cleanCats === 'Kot domowy' || cleanCats === 'Koty', `cleanCats was "${cleanCats}"`);

  console.log('✅ Test 1 passed: Polish case normalization & typo-resilient query cleaner verified');

  // Test 2: "stwórz notatkę o psach" generates create_note action with structured blocks
  const resDogs = await generateEditorAiResponse({
    query: 'stwórz notatkę o psach',
    activeDoc: mockDoc,
  });
  assert(resDogs.actionType === 'create_note', 'Action type must be create_note');
  assert(resDogs.blocks && resDogs.blocks.length > 0, 'Must produce structured blocks for the note');
  console.log(`✅ Test 2 passed: "stwórz notatkę o psach" generates create_note with ${resDogs.blocks?.length} blocks`);

  // Test 3: "Wstaw tabelę porównawczą" generates table blocks directly
  const resTable = await generateEditorAiResponse({
    query: 'Wstaw tabelę porównawczą wariantów',
    activeDoc: mockDoc,
  });
  const hasTable = resTable.blocks?.some((b) => b.type === 'table');
  assert(hasTable, 'Generated response must include a table block');
  console.log('✅ Test 3 passed: Direct table insertion verified');

  // Test 4: "Wstaw plan wdrożenia" generates plan blocks
  const resPlan = await generateEditorAiResponse({
    query: 'Wstaw plan wdrożenia i harmonogram',
    activeDoc: mockDoc,
  });
  assert(resPlan.text.includes('Plan Wdrożenia') || resPlan.text.includes('Harmonogram'), 'Generates plan content');
  assert(resPlan.blocks && resPlan.blocks.length >= 3, 'Generates multiple plan blocks');
  console.log('✅ Test 4 passed: Direct plan insertion verified');

  // Test 5: "Wyciągnij zadania" extracts todos
  const resTodos = await generateEditorAiResponse({
    query: '@actionitems Wyciągnij zadania',
    activeDoc: mockDoc,
  });
  const hasTodos = resTodos.blocks?.some((b) => b.type === 'todo');
  assert(hasTodos, 'Extracts todos into todo blocks');
  console.log('✅ Test 5 passed: Direct actionitems task extraction verified');

  // Test 6: @priev returns preview action
  const resPreview = await generateEditorAiResponse({
    query: '@priev Podgląd',
    activeDoc: mockDoc,
  });
  assert(resPreview.actionType === 'preview', 'Action type must be preview');
  console.log('✅ Test 6 passed: Live preview command verified');

  console.log('\n🎉 ALL EDITOR ACTION DOCK & UNIFIED AI TESTS PASSED PERFECTLY!');
})();
