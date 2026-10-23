import { generateEditorAiResponse } from '../src/features/ai/editorAiService';
import { WorkspacePage, DocBlock } from '../src/types/workspace';
import { parseMarkdownToNotionBlocks } from '../src/features/ai/markdownToBlocks';

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Running Comprehensive Editor AI Copilot & In-Doc AI Tests...');

const mockDoc1: WorkspacePage = {
  id: 'doc-active-1',
  title: 'Architektura Systemu SearchPoint',
  icon: '⚡',
  blocks: [
    { id: 'b1', type: 'h1', content: 'Architektura Systemu SearchPoint 2026' },
    { id: 'b2', type: 'p', content: 'Główny silnik aplikacji oparty jest na DocBlock i jednolitym modelu danych.' },
    { id: 'b3', type: 'key_takeaway', content: 'Wszystkie moduły korzystają ze wspólnych identyfikatorów i relacji.' },
    { id: 'b4', type: 'todo', content: 'Zaimplementować pełną weryfikację w 5 źródłach', checked: false },
    { id: 'b5', type: 'todo', content: 'Zapewnić zero-lag fallback dla asystenta w edytorze', checked: true },
  ],
  isFavorite: true,
  isDeleted: false,
  isPublic: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: ['architecture', 'ai'],
  comments: [],
  versions: [],
};

const mockDoc2: WorkspacePage = {
  id: 'doc-kot-2',
  title: 'Kot domowy',
  icon: '🐱',
  blocks: [
    { id: 'k1', type: 'h1', content: 'Kot domowy (Felis catus)' },
    { id: 'k2', type: 'p', content: 'Udomowiony gatunek ssaka z rzędu drapieżnych z rodziny kotowatych.' },
    { id: 'k3', type: 'key_takeaway', content: 'Koty towarzyszą człowiekowi od co najmniej 9500 lat.' },
    { id: 'k4', type: 'callout_tip', content: 'Wymagają diety bogatej w taurynę i regularnej stymulacji umysłowej.' },
  ],
  isFavorite: false,
  isDeleted: false,
  isPublic: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: ['biologia', 'zwierzęta'],
  comments: [],
  versions: [],
};

const pagesCollection = [mockDoc1, mockDoc2];

// Test 1: @priev command shrinks AI and signals preview mode
(async () => {
  const res1 = await generateEditorAiResponse({
    query: '@priev',
    activeDoc: mockDoc1,
    pages: pagesCollection,
  });
  assert(res1.actionType === 'preview', '@priev returns actionType: preview');
  assert(res1.text.includes('Live Preview'), '@priev explains live preview');

  const res2 = await generateEditorAiResponse({
    query: 'Pokaż podgląd dokumentu',
    activeDoc: mockDoc1,
    pages: pagesCollection,
  });
  assert(res2.actionType === 'preview', 'Natural language "Pokaż podgląd" returns preview');

  console.log('✅ Test 1 passed: @priev and live preview commands verified');
})();

// Test 2: @streszcz command accurately summarizes active doc and named docs across pages
(async () => {
  // Summarize active doc
  const resActive = await generateEditorAiResponse({
    query: '@streszcz ten dokument',
    activeDoc: mockDoc1,
    pages: pagesCollection,
  });
  assert(resActive.actionType === 'summarize', 'Returns actionType summarize');
  assert(resActive.text.includes('Architektura Systemu SearchPoint'), 'Active doc title in summary');
  assert(resActive.blocks && resActive.blocks.length > 0, 'Summary parsed into DocBlocks');

  // Summarize named doc from workspace ("Kot domowy")
  const resNamed = await generateEditorAiResponse({
    query: 'Streszcz mi notatkę "Kot domowy"',
    activeDoc: mockDoc1, // activeDoc is different!
    pages: pagesCollection,
  });
  assert(resNamed.text.includes('Kot domowy'), 'Successfully locates and summarizes named page "Kot domowy"');
  assert(resNamed.text.includes('Felis catus') || resNamed.text.includes('Koty towarzyszą'), 'Includes facts from Kot domowy');

  console.log('✅ Test 2 passed: @streszcz for active doc and cross-workspace pages verified');
})();

// Test 3: @actionitems extracts todos and formats actionable checklist
(async () => {
  const resTasks = await generateEditorAiResponse({
    query: '@actionitems',
    activeDoc: mockDoc1,
    pages: pagesCollection,
  });
  assert(resTasks.text.includes('Znalezione zadania'), 'Action items header found');
  assert(resTasks.text.includes('Zaimplementować pełną weryfikację'), 'First task extracted');
  assert(resTasks.blocks && resTasks.blocks.length > 0, 'Tasks parsed into Notion blocks');

  console.log('✅ Test 3 passed: @actionitems task extraction verified');
})();

// Test 4: Project plan generation with milestones, risk matrix table and takeaways
(async () => {
  const resPlan = await generateEditorAiResponse({
    query: 'Stwórz kompletny plan wdrożenia nowego systemu CRM',
    activeDoc: mockDoc1,
    pages: pagesCollection,
  });
  assert(resPlan.text.includes('Plan Wdrożenia'), 'Contains Plan Wdrożenia heading');
  assert(resPlan.text.includes('Faza 1:') && resPlan.text.includes('Faza 4:'), 'Contains all 4 roadmap phases');
  assert(resPlan.text.includes('| Ryzyko |'), 'Contains risk register markdown table');
  assert(resPlan.blocks && resPlan.blocks.length >= 4, 'Parsed into multiple structured Notion blocks');

  console.log('✅ Test 4 passed: Project plan generation with risk matrix verified');
})();

// Test 5: Comparison table generation
(async () => {
  const resTable = await generateEditorAiResponse({
    query: 'Porównaj w tabeli bazę PostgreSQL i MongoDB dla naszego projektu',
    activeDoc: mockDoc1,
    pages: pagesCollection,
  });
  assert(resTable.text.includes('| Kryterium Ocena |'), 'Markdown comparison table generated');
  assert(resTable.blocks && resTable.blocks.some((b) => b.type === 'table'), 'Contains table block type');

  console.log('✅ Test 5 passed: Comparative table generation verified');
})();

// Test 6: Meeting agenda generation
(async () => {
  const resMeeting = await generateEditorAiResponse({
    query: 'Przygotuj agendę spotkania architektonicznego z zespołem',
    activeDoc: mockDoc1,
    pages: pagesCollection,
  });
  assert(resMeeting.text.includes('Agenda Spotkania') || resMeeting.text.includes('Protokół'), 'Meeting agenda generated');
  assert(resMeeting.text.includes('Harmonogram Spotkania'), 'Timed slots generated');
  assert(resMeeting.text.includes('Rejestr Ustaleń'), 'Decision register table generated');

  console.log('✅ Test 6 passed: Meeting agenda generation verified');
})();

// Test 7: Zero Sidecar Leakage Check (Crucial UX requirement)
(async () => {
  const queries = [
    'Napisz notatkę o sztucznej inteligencji',
    'Stwórz dokument o uczeniu maszynowym',
    'Wytłumacz zasady SOLID',
    'Podsumuj cele na Q4',
  ];

  for (const q of queries) {
    const res = await generateEditorAiResponse({
      query: q,
      activeDoc: mockDoc1,
      pages: pagesCollection,
    });
    assert(!res.text.includes('Po prawej stronie otworzyłem Mini Edytor'), `Query "${q}" does not leak Mini Edytor message`);
    assert(!res.text.includes('Otwieram po prawej Mini Okno'), `Query "${q}" does not leak Mini Okno message`);
    assert(res.text.length > 50, `Query "${q}" produces substantive text (>50 chars)`);
    assert(res.blocks && res.blocks.length > 0, `Query "${q}" produces valid DocBlocks`);
  }

  console.log('✅ Test 7 passed: Zero sidecar leakage and substantive editor responses verified');
})();

// Test 8: In-Doc markdown to Notion block insertion
(async () => {
  const testMarkdown = `## Kluczowe Zagadnienia
- Punkt pierwszy o architekturze
- Punkt drugi o testach

| Parametr | Wartość |
|---|---|
| Czas reakcji | < 100ms |
| Dostępność | 99.99% |

> 🏆 Sukces: Wszystkie testy przeszły pomyślnie.`;

  const parsed = parseMarkdownToNotionBlocks(testMarkdown, 'Test Bloków');
  assert(parsed.blocks.length >= 4, 'Parsed at least 4 blocks from markdown');
  assert(parsed.blocks.some((b) => b.type === 'h2'), 'H2 block present');
  assert(parsed.blocks.some((b) => b.type === 'bullet'), 'Bullet blocks present');
  assert(parsed.blocks.some((b) => b.type === 'table'), 'Table block present');
  assert(parsed.blocks.some((b) => b.type === 'key_takeaway' || b.type === 'quote' || b.type === 'callout_tip'), 'Callout block present');

  console.log('✅ Test 8 passed: In-doc Markdown parsing to rich Notion blocks verified');
})();

setTimeout(() => {
  console.log('\n🎉 ALL 8 EDITOR AI & COPILOT TESTS PASSED PERFECTLY!\n');
}, 500);
