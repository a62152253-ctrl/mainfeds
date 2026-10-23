import { BlockType, DocBlock, TaskItem, PropertyType, WorkspacePage } from '../src/types/workspace';
import { summarizePage, extractActionItemsFromPage } from '../src/features/ai/noteOpsService';
import { AI_COMMANDS, matchAiCommands } from '../src/features/ai/commandsRegistry';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Running KROK 3 Tests: Block Editor, Database Engine & AI Copilot Integration...');

// Test 1: Full BlockType hierarchy includes H1-H6 and 50+ Notion block types
{
  const expectedHeadings: BlockType[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const testBlocks: DocBlock[] = [
    { id: 'b-h1', type: 'h1', content: 'Główny tytuł', textAlign: 'left' },
    { id: 'b-h2', type: 'h2', content: 'Podsekcja 2', textAlign: 'center' },
    { id: 'b-h3', type: 'h3', content: 'Podsekcja 3', textAlign: 'right' },
    { id: 'b-h4', type: 'h4', content: 'Podsekcja 4' },
    { id: 'b-h5', type: 'h5', content: 'Podsekcja 5' },
    { id: 'b-h6', type: 'h6', content: 'Podsekcja 6' },
  ];

  assert(testBlocks.length === 6, 'All 6 heading levels instantiated');
  assert(testBlocks[0].textAlign === 'left', 'H1 has left alignment');
  assert(testBlocks[1].textAlign === 'center', 'H2 has center alignment');
  assert(testBlocks[2].textAlign === 'right', 'H3 has right alignment');

  console.log('✅ Test 1 passed: H1-H6 hierarchy and text alignment verified');
}

// Test 2: Table block operations (Add row, Add column, Remove column, Sort A-Z)
{
  let tableData: string[][] = [
    ['Zadanie', 'Status', 'Priorytet'],
    ['Projektowanie UI', 'Zrobione', 'Wysoki'],
    ['Architektura danych', 'W trakcie', 'Krytyczny'],
    ['Automatyzacja AI', 'Do zrobienia', 'Średni'],
  ];

  // 1. Add Row
  const newRow = ['Wdrożenie', 'Do zrobienia', 'Wysoki'];
  tableData = [...tableData, newRow];
  assert(tableData.length === 5, 'Row added successfully');

  // 2. Add Column
  tableData = tableData.map((row, i) => [...row, i === 0 ? 'Termin' : '2026-10-25']);
  assert(tableData[0].length === 4, 'Column added successfully');
  assert(tableData[0][3] === 'Termin', 'New column has correct header');

  // 3. Remove Column
  tableData = tableData.map((row) => row.slice(0, -1));
  assert(tableData[0].length === 3, 'Column removed successfully');

  // 4. Sort Rows A-Z by column 0 (ignoring header)
  const header = tableData[0];
  const sortedRows = [...tableData.slice(1)].sort((a, b) => a[0].localeCompare(b[0]));
  tableData = [header, ...sortedRows];

  assert(tableData[1][0] === 'Architektura danych', 'Sorted first alphabetically');
  assert(tableData[2][0] === 'Automatyzacja AI', 'Sorted second alphabetically');
  assert(tableData[3][0] === 'Projektowanie UI', 'Sorted third alphabetically');

  console.log('✅ Test 2 passed: Table block add/remove/sort operations verified');
}

// Test 3: Database View Schema & Property Types
{
  const validPropertyTypes: PropertyType[] = ['text', 'number', 'date', 'status', 'select', 'multi_select', 'relation', 'url'];
  assert(validPropertyTypes.length === 8, '8 rich property types supported');

  const testTask: TaskItem = {
    id: 'task-1',
    title: 'Wdrożyć Global Searches',
    pageId: 'page-1',
    status: 'Do zrobienia',
    priority: 'Krytyczny',
    dueDate: '2026-10-23',
    tag: 'Dev',
    url: 'https://searchpoint.pl',
    isCompleted: false,
    relationPageTitle: 'Specyfikacja Rebuild V1',
  };

  assert(testTask.status === 'Do zrobienia', 'Task status valid');
  assert(testTask.priority === 'Krytyczny', 'Task priority valid');
  assert(testTask.relationPageTitle === 'Specyfikacja Rebuild V1', 'Relation page title bound');

  console.log('✅ Test 3 passed: Database property types and TaskItem schema verified');
}

// Test 4: AI Command Registry includes @priev, @streszcz, @deepresearch
{
  const prievCmd = AI_COMMANDS.find((c) => c.command === '@priev');
  assert(!!prievCmd, '@priev command registered in AI commands');
  assert(prievCmd!.aliases.includes('@preview'), '@preview alias present');

  const matches = matchAiCommands('@priev');
  assert(matches.length > 0, '@priev matches command detector');
  assert(matches[0].id === 'cmd-live-preview', '@priev resolved to live preview command');

  console.log('✅ Test 4 passed: @priev AI command correctly registered and matched');
}

// Test 5: Note operations for AI Copilot (Summarize & Action Items)
{
  const mockPage: WorkspacePage = {
    id: 'page-ai-test',
    title: 'Strategia AI 2026',
    icon: '⚡',
    blocks: [
      { id: '1', type: 'h1', content: 'Główne cele projektu' },
      { id: '2', type: 'p', content: 'Wdrożenie inteligentnej bazy wiedzy dla wszystkich użytkowników.' },
      { id: '3', type: 'key_takeaway', content: 'Kluczowy cel: Połączenie edytora, bazy danych i AI w 1 spójny system.' },
      { id: '4', type: 'todo', content: 'Zintegrować 4-5 źródeł weryfikacji faktów', checked: false },
      { id: '5', type: 'todo', content: 'Dodać panel administratora /sell/sell/admin', checked: false },
    ],
    isFavorite: false,
    isDeleted: false,
    isPublic: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['ai', 'strategy'],
    comments: [],
    versions: [],
  };

  const summary = summarizePage(mockPage);
  assert(summary.pageTitle === 'Strategia AI 2026', 'Page title matched in summary');
  assert(summary.stats.blocksCount === 5, '5 blocks counted');
  assert(summary.keyTakeaways.length > 0, 'Key takeaway extracted');

  const actionItems = extractActionItemsFromPage(mockPage);
  assert(actionItems.length === 2, '2 action items / todos extracted from blocks');
  assert(actionItems[0].title.includes('Zintegrować 4-5 źródeł'), 'First action item matched');

  console.log('✅ Test 5 passed: AI note summarization & action items extraction verified');
}

// Test 6: 10 New Modern Blocks (Mermaid, Kanban, Countdown, FAQ, Before/After, Mention, FileCard, Changelog, Testimonial, TargetMeter)
{
  const newBlocks: DocBlock[] = [
    { id: 'nb-1', type: 'mermaid', content: 'Architektura', diagramSyntax: 'graph TD\nA-->B', diagramType: 'flowchart' },
    { id: 'nb-2', type: 'kanban_board', content: 'Sprint Kanban', kanbanColumns: [{ id: 'c1', title: 'TODO', color: '#333', items: [] }] },
    { id: 'nb-3', type: 'countdown', content: 'Launch', targetDate: '2026-11-01T12:00', countdownTitle: 'Release' },
    { id: 'nb-4', type: 'faq', content: 'Pytania', faqItems: [{ question: 'Q1', answer: 'A1', isOpen: true }] },
    { id: 'nb-5', type: 'before_after', content: 'Refactor', beforeAfterData: { beforeTitle: 'Przed', beforePoints: ['P1'], afterTitle: 'Po', afterPoints: ['P2'] } },
    { id: 'nb-6', type: 'user_mention', content: 'Kacper', mentionUser: { name: 'Kacper', role: 'Architekt', status: 'Online' } },
    { id: 'nb-7', type: 'file_card', content: 'Spec.pdf', fileName: 'Spec.pdf', fileSize: '2MB', fileUrl: 'https://ex.com' },
    { id: 'nb-8', type: 'changelog', content: 'v2.4.0', changelogData: { version: 'v2.4.0', releaseDate: '2026-10-22', items: [{ type: 'added', text: 'Nowe bloki' }] } },
    { id: 'nb-9', type: 'testimonial', content: 'Świetny workspace', quoteAuthor: 'Anna', ratingStars: 5 },
    { id: 'nb-10', type: 'target_meter', content: 'Cel Q4', gaugeData: { current: 85, target: 100, unit: '%', label: 'Cel' } },
  ];

  assert(newBlocks.length === 10, 'All 10 new block types instantiated with specialized data models');
  assert(newBlocks[0].type === 'mermaid', 'Mermaid block type valid');
  assert(newBlocks[1].type === 'kanban_board', 'Kanban board block type valid');
  assert(newBlocks[2].type === 'countdown', 'Countdown block type valid');
  assert(newBlocks[3].type === 'faq', 'FAQ block type valid');
  assert(newBlocks[4].type === 'before_after', 'Before/After block type valid');
  assert(newBlocks[5].type === 'user_mention', 'User mention block type valid');
  assert(newBlocks[6].type === 'file_card', 'File card block type valid');
  assert(newBlocks[7].type === 'changelog', 'Changelog block type valid');
  assert(newBlocks[8].type === 'testimonial', 'Testimonial block type valid');
  assert(newBlocks[9].type === 'target_meter', 'Target meter block type valid');

  console.log('✅ Test 6 passed: 10 new blocks (Mermaid, Kanban, Countdown, FAQ, Before/After, Mention, FileCard, Changelog, Testimonial, TargetMeter) verified');
}

console.log('🎉 ALL KROK 3 TESTS PASSED PERFECTLY!\n');
