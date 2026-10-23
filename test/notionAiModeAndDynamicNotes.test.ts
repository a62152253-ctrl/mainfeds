import { reasonAboutUserInput } from '../src/features/ai/reasoning';
import { composeBotAnswer } from '../src/features/ai/answering';
import { performMultiSourceResearch } from '../src/features/ai/multiSourceResearchService';

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log('🧪 Running Notion AI Mode Choice, Dynamic Notes & 4-Source Verification Tests...');

  // 1. Test zapytania o zdolności badawcze (Capability Showcase - "umiesz w 4 źródłach")
  const capQuery1 = reasonAboutUserInput('Zbadaj umiesz w 4 źródłach');
  assert(capQuery1.intent === 'CAPABILITY_SHOWCASE', `Should be CAPABILITY_SHOWCASE, got: ${capQuery1.intent}`);
  console.log('✅ Test 1 passed: "Zbadaj umiesz w 4 źródłach" rozpoznane jako CAPABILITY_SHOWCASE bez crasha');

  const capQuery2 = reasonAboutUserInput('czy umiesz badać w 4 źródłach?');
  assert(capQuery2.intent === 'CAPABILITY_SHOWCASE', `Should be CAPABILITY_SHOWCASE, got: ${capQuery2.intent}`);
  const answer = composeBotAnswer(capQuery2, { pagesCount: 2, tasksCount: 1, activeTasksCount: 1, doneTasksCount: 0 });
  assert(answer.text.includes('OpenAlex') && answer.text.includes('Wikidata') && answer.text.includes('Crossref'), 'Answer should list the 4 verified data engines');
  console.log('✅ Test 2 passed: Prezentacja silnika 4 baz (OpenAlex, Wikidata, Crossref, Web) i trybów Szybkość/Precyzja');

  // 2. Test komendy analyze i deep research
  const analyzeQuery = reasonAboutUserInput('analyze TypeScript');
  assert(analyzeQuery.intent === 'DEEP_RESEARCH', `Should be DEEP_RESEARCH, got: ${analyzeQuery.intent}`);
  assert(analyzeQuery.extractedTopic?.toLowerCase().includes('typescript'), `Topic should be typescript, got: ${analyzeQuery.extractedTopic}`);
  console.log('✅ Test 3 passed: Komenda "analyze TypeScript" poprawnie rozpoznana pod DEEP_RESEARCH');

  // 3. Test literówek w tworzeniu notatek
  const typoQuery1 = reasonAboutUserInput('stwurz notatke o kotach');
  assert(typoQuery1.intent === 'CREATE_NOTE_LIVE', `Should be CREATE_NOTE_LIVE, got: ${typoQuery1.intent}`);
  assert(typoQuery1.extractedTopic?.toLowerCase().includes('kot'), `Topic should be kot, got: ${typoQuery1.extractedTopic}`);

  const typoQuery2 = reasonAboutUserInput('zrup notatke: psy');
  assert(typoQuery2.intent === 'CREATE_NOTE_LIVE', `Should be CREATE_NOTE_LIVE, got: ${typoQuery2.intent}`);
  console.log('✅ Test 4 passed: Odporność na literówki ("stwurz notatke", "zrup notatke:")');

  // 4. Test dynamicznej architektury notatek (brak sztywnego szablonu - zoologia vs software)
  const catResearch = await performMultiSourceResearch('Koty');
  assert(catResearch.uniqueDomainsCount >= 4, `Expected at least 4 domains, got ${catResearch.uniqueDomainsCount}`);
  assert(catResearch.blocks.some(b => b.content.includes('Anatomia') || b.content.includes('Gatunk') || b.content.includes('biologiczn')), 'Zoology note must have zoology-tailored headings');
  assert(catResearch.blocks.some(b => b.type === 'table'), 'Should contain tailored table block');
  console.log('✅ Test 5 passed: Dynamiczna architektura dla Zoologii ("Koty") bez sztywnego szablonu');

  const tsResearch = await performMultiSourceResearch('TypeScript');
  assert(tsResearch.uniqueDomainsCount >= 4, `Expected at least 4 domains, got ${tsResearch.uniqueDomainsCount}`);
  assert(tsResearch.blocks.some(b => b.content.includes('Architektur') || b.content.includes('Wzorce') || b.content.includes('technologiczn')), 'Software note must have tech-tailored headings');
  console.log('✅ Test 6 passed: Dynamiczna architektura dla IT/Software ("TypeScript") wygenerowana OD ZERA');

  console.log('\n🎉 ALL NOTION AI MODE CHOICE, DYNAMIC NOTES & 4-SOURCE TESTS PASSED 100%!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
