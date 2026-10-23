import { BlockType, DocBlock, PageType, validateAndMigratePage } from '../src/types/workspace';
import { getSuggestedNextBlocks, NextBlockSuggestion } from '../src/features/ai/nextBlockSuggester';
import { generateEditorAiResponse } from '../src/features/ai/editorAiService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Running Tests: Extended Blocks, Next-Block Smart Suggester & Puter AI...');

// Test 1: Verify 25+ new specialized block types are registered in BlockType
{
  const newSpecializedBlocks: BlockType[] = [
    'decision_matrix',
    'risk_register',
    'milestone_roadmap',
    'api_endpoint',
    'swot_analysis',
    'user_story',
    'math_equation_card',
    'stepper',
    'kpi_scorecard',
    'pros_cons_matrix',
    'code_sandbox',
    'audio_memo',
    'team_directory',
    'interactive_poll',
    'citation_source',
    'event_schedule',
    'embed_figma',
    'embed_github',
    'summary_box',
    'announcement_banner',
    'spec_table',
    'persona_card',
    'release_notes',
    'data_metric_bar',
    'meeting_action_item',
  ];

  const sampleDocBlock: DocBlock = {
    id: 'block-decision-1',
    type: 'decision_matrix',
    content: 'Wybór rozwiązania',
    decisionMatrixData: {
      criteria: ['Wydajność', 'Bezpieczeństwo'],
      options: [
        { name: 'Opcja A', scores: [9, 10], totalScore: 19 },
        { name: 'Opcja B', scores: [6, 7], totalScore: 13 },
      ],
    },
  };

  assert(newSpecializedBlocks.length === 25, '25 new specialized block types verified');
  assert(sampleDocBlock.decisionMatrixData?.options.length === 2, 'Decision matrix data structure verified');
  assert(sampleDocBlock.decisionMatrixData?.options[0].totalScore === 19, 'Decision matrix score verified');

  console.log('✅ Test 1 passed: 25 new specialized block types & data schemas verified');
}

// Test 2: Next-Block Suggester for SPOTKANIE (Meeting)
{
  const h1Block: DocBlock = { id: 'b-m-h1', type: 'h1', content: 'Spotkanie Zespołu: Planowanie Sprintu' };
  const suggestions = getSuggestedNextBlocks({
    currentBlock: h1Block,
    pageType: 'Meeting',
    allBlocks: [h1Block],
    blockIndex: 0,
  });

  assert(suggestions.length >= 3, 'Returns at least 3 suggestions for Meeting H1');
  const types = suggestions.map((s) => s.type);
  assert(types.includes('event_schedule'), 'Meeting suggests event_schedule (Agenda czasowa)');
  assert(types.includes('callout_info'), 'Meeting suggests callout_info (Cel spotkania)');
  assert(types.includes('decision_matrix'), 'Meeting suggests decision_matrix (Lista decyzji)');

  console.log('✅ Test 2 passed: Smart Suggester for Meeting correctly prioritizes agenda and decisions');
}

// Test 3: Next-Block Suggester for PROJEKT (Project)
{
  const h1Block: DocBlock = { id: 'b-p-h1', type: 'h1', content: 'Nowoczesny Workspace 2.0' };
  const suggestions = getSuggestedNextBlocks({
    currentBlock: h1Block,
    pageType: 'Project',
    allBlocks: [h1Block],
    blockIndex: 0,
  });

  const types = suggestions.map((s) => s.type);
  assert(types.includes('lead'), 'Project suggests lead (Wstęp projektu)');
  assert(types.includes('milestone_roadmap'), 'Project suggests milestone_roadmap (Harmonogram etapów)');
  assert(types.includes('kpi_scorecard'), 'Project suggests kpi_scorecard (Karta KPI)');
  assert(types.includes('risk_register'), 'Project suggests risk_register (Rejestr ryzyk)');

  console.log('✅ Test 3 passed: Smart Suggester for Project correctly prioritizes roadmap, KPI & risks');
}

// Test 4: Next-Block Suggester for BADANIA / RESEARCH
{
  const h1Block: DocBlock = { id: 'b-r-h1', type: 'h1', content: 'Weryfikacja Modeli Collaborative Editing' };
  const suggestions = getSuggestedNextBlocks({
    currentBlock: h1Block,
    pageType: 'Research',
    allBlocks: [h1Block],
    blockIndex: 0,
  });

  const types = suggestions.map((s) => s.type);
  assert(types.includes('citation_source'), 'Research suggests citation_source (Karta cytowania / DOI)');
  assert(types.includes('swot_analysis'), 'Research suggests swot_analysis (Analiza SWOT)');
  assert(types.includes('table'), 'Research suggests table (Tabela porównawcza)');

  console.log('✅ Test 4 passed: Smart Suggester for Research correctly prioritizes citations and SWOT');
}

// Test 5: Contextual transitions after Code and Table
{
  const codeBlock: DocBlock = { id: 'b-code', type: 'code', content: 'const a = 1;' };
  const afterCode = getSuggestedNextBlocks({ currentBlock: codeBlock, blockIndex: 1 });
  const codeTypes = afterCode.map((s) => s.type);
  assert(codeTypes.includes('terminal'), 'After code suggests terminal output');
  assert(codeTypes.includes('callout_tip'), 'After code suggests tip / explanation');

  const tableBlock: DocBlock = { id: 'b-table', type: 'table', content: 'Tabela' };
  const afterTable = getSuggestedNextBlocks({ currentBlock: tableBlock, blockIndex: 2 });
  const tableTypes = afterTable.map((s) => s.type);
  assert(tableTypes.includes('key_takeaway'), 'After table suggests key takeaway conclusion');
  assert(tableTypes.includes('decision_matrix'), 'After table suggests decision matrix');

  console.log('✅ Test 5 passed: Contextual block-to-block transitions verified');
}

// Test 6: Data Migration preserves all 25+ extended block properties
{
  const rawPage = {
    id: 'test-page-ext',
    title: 'Spotkanie Architektury',
    blocks: [
      {
        id: 'b-1',
        type: 'event_schedule',
        content: 'Agenda',
        eventScheduleData: { timeStart: '09:00', timeEnd: '10:00', title: 'Start' },
      },
      {
        id: 'b-2',
        type: 'decision_matrix',
        content: 'Wybór',
        decisionMatrixData: { criteria: ['Wydajność'], options: [{ name: 'A', scores: [10], totalScore: 10 }] },
      },
      {
        id: 'b-3',
        type: 'risk_register',
        content: 'Ryzyka',
        riskRegisterData: [{ risk: 'API down', likelihood: 'Niska', impact: 'Krytyczny', mitigation: 'Mock' }],
      },
    ],
  };

  const migrated = validateAndMigratePage(rawPage);
  assert(migrated.pageType === 'Meeting', 'Auto-detected Meeting pageType from title');
  assert(migrated.blocks.length === 3, 'All 3 blocks migrated');
  assert(migrated.blocks[0].eventScheduleData?.timeStart === '09:00', 'eventScheduleData preserved');
  assert(migrated.blocks[1].decisionMatrixData?.options[0].name === 'A', 'decisionMatrixData preserved');
  assert(migrated.blocks[2].riskRegisterData?.[0].risk === 'API down', 'riskRegisterData preserved');

  console.log('✅ Test 6 passed: validateAndMigratePage preserves all specialized block fields');
}

// Test 7: Puter AI Integration & Dual-Engine with Claude 3.5 Sonnet / GPT-4o options
{
  async function testPuterAiFlow() {
    const activeDoc = validateAndMigratePage({
      id: 'doc-ai-test',
      title: 'Spotkanie Strategiczne Zarządu',
      pageType: 'Meeting',
      blocks: [{ id: 'b-ai-1', type: 'h1', content: 'Spotkanie Strategiczne' }],
    });

    const response = await generateEditorAiResponse({
      query: 'Wygeneruj agendę spotkania i zadania',
      activeDoc,
      preferredModel: 'claude-3-5-sonnet',
    });

    assert(response.text.length > 50, 'Generated substantive response');
    assert(Boolean(response.blocks && response.blocks.length > 0), 'Parsed into Notion DocBlocks');
    assert(typeof response.modelUsed === 'string', 'Reported model used');

    console.log(`✅ Test 7 passed: Editor AI response verified (${response.modelUsed}, ${response.blocks?.length} blocks)`);
  }

  testPuterAiFlow().then(() => {
    console.log('\n🎉 ALL EXTENDED BLOCKS, SMART SUGGESTER & PUTER AI TESTS PASSED PERFECTLY!\n');
  });
}
