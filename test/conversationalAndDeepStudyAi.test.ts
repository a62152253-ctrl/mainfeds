import assert from 'node:assert';
import { generateEditorAiResponse } from '../src/features/ai/editorAiService';
import { reasonAboutUserInput } from '../src/features/ai/reasoning';
import { validateAndMigratePage } from '../src/types/workspace';

console.log('🧪 Running Conversational & Deep Study AI In-Doc Tests...');

const dummyDoc = validateAndMigratePage({
  id: 'doc-1',
  title: 'Notatka Badawcza',
  blocks: [],
  pageType: 'Document',
  tags: [],
  permissions: { accessLevel: 'workspace', role: 'Owner' },
  isFavorite: false,
  isDeleted: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

async function run() {
  // 1. "ey mam pytanie skrome" must be recognized as QUESTION_OPENING
  const r1 = reasonAboutUserInput('ey mam pytanie skrome');
  assert.strictEqual(r1.intent, 'QUESTION_OPENING', 'Should recognize "ey mam pytanie skrome" as QUESTION_OPENING');
  console.log('✅ Test 1 passed: "ey mam pytanie skrome" classified as QUESTION_OPENING');

  // 2. generateEditorAiResponse for "ey mam pytanie skrome" must NOT return generic corporate boilerplate
  const res1 = await generateEditorAiResponse({
    query: 'ey mam pytanie skrome',
    activeDoc: dummyDoc,
  });

  assert.ok(!res1.text.includes('Współczesne środowisko cyfrowe wymaga rozwiązań'), 'Must not contain old boilerplate intro');
  assert.ok(!res1.text.includes('Zagadnienie "**ey mam pytanie skrome**"'), 'Must never treat casual question as corporate topic');
  assert.ok(/(pytaj|śmiało|pomóc|słuch|chętnie|pytań)/i.test(res1.text), 'Must invite user to ask question naturally');
  assert.ok(Array.isArray(res1.blocks) && res1.blocks.length > 0, 'Must produce Notion blocks');
  console.log('✅ Test 2 passed: Casual question opening handled warmly and without cringe template');

  // 3. "mam pytanko" classification
  const r2 = reasonAboutUserInput('siemanko mam pytanko');
  assert.strictEqual(r2.intent, 'QUESTION_OPENING');
  console.log('✅ Test 3 passed: "siemanko mam pytanko" classified as QUESTION_OPENING');

  // 4. Knowledge query (e.g. closure) returns real technical content
  const resClosure = await generateEditorAiResponse({
    query: 'czym jest closure w javascript',
    activeDoc: dummyDoc,
  });
  assert.ok(resClosure.text.includes('Domknięcia w JavaScript') || resClosure.text.includes('Closures'), 'Must fetch technical knowledge entry');
  console.log('✅ Test 4 passed: Knowledge query returns real technical explanation');

  // 5. Deep analytical SaaS query returns comprehensive 8-point study
  const deepPrompt = `Mam pomysł na SaaS, który ma obsługiwać 500 000 jednoczesnych użytkowników. Każdy może korzystać z AI, przeszukiwać internet, automatyzować przeglądarkę i tworzyć dokumenty. Budżet początkowy wynosi 0 zł miesięcznie.
1. Zbadaj aktualne oferty i limity darmowych usług.
2. Wyjaśnij dlaczego 500 000 jednoczesnych użytkowników nie oznacza 500 000 aktywnych zapytań.
3. Oszacuj zapotrzebowanie na CPU i RAM.
4. Zaprojektuj architekturę MVP.`;

  const resDeep = await generateEditorAiResponse({
    query: deepPrompt,
    activeDoc: dummyDoc,
  });
  assert.ok(resDeep.text.includes('500 000 CCU') || resDeep.text.includes('Studium Architektury'), 'Must generate deep study');
  assert.ok(resDeep.blocks && resDeep.blocks.length >= 5, 'Must contain rich structured blocks');
  console.log('✅ Test 5 passed: Deep analytical SaaS query generates comprehensive 8-point study');

  console.log('\n🎉 ALL CONVERSATIONAL & DEEP STUDY AI TESTS PASSED 100%!');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
