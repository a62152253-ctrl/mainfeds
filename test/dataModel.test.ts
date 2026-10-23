import { validateAndMigratePage, PageType, DocBlock, WorkspacePage } from '../src/types/workspace';
import { USER_PROFILES, ProfileDefinition } from '../src/features/profile/userProfileConfig';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🚀 Running Data Model & Migration Tests (Krok 1)...');

// Test 1: Null/Undefined raw page
{
  const empty = validateAndMigratePage(null);
  assert(empty.id.startsWith('page-'), 'Null raw document gets generated ID');
  assert(empty.title === 'Bez tytułu', 'Null raw document gets fallback title');
  assert(empty.pageType === 'Note' || empty.pageType === 'Document', 'Null raw document gets valid fallback pageType');
  assert(Array.isArray(empty.blocks) && empty.blocks.length > 0, 'Null raw document has default block');
  assert(empty.permissions?.accessLevel === 'workspace', 'Has default permissions accessLevel');
  assert(empty.permissions?.role === 'Owner', 'Has default permissions role');
  console.log('✅ Test 1 passed: Fallback migration on null/undefined input');
}

// Test 2: Legacy page migration without pageType or permissions
{
  const legacyDoc = {
    id: 'legacy-123',
    title: 'Moja stara notatka',
    blocks: [
      { id: 'b1', type: 'h1', content: 'Stary nagłówek' },
      { id: 'b2', type: 'p', content: 'Stara treść' },
    ],
    createdAt: 1600000000000,
    updatedAt: 1600000005000,
  };

  const migrated = validateAndMigratePage(legacyDoc);
  assert(migrated.id === 'legacy-123', 'Preserves original document ID');
  assert(migrated.pageType === 'Note', 'Infers pageType Note for short legacy document');
  assert(migrated.blocks.length === 2, 'Preserves all blocks');
  assert(migrated.blocks[0].order === 0 && migrated.blocks[1].order === 1, 'Assigns sequential order to legacy blocks');
  assert(migrated.permissions?.accessLevel === 'workspace', 'Generates default workspace access level');
  assert(migrated.permissions?.role === 'Owner', 'Generates default Owner role');
  assert(migrated.createdAt === 1600000000000, 'Preserves legacy createdAt');
  console.log('✅ Test 2 passed: Legacy document migration & block ordering');
}

// Test 3: Type inference based on title keywords
{
  const cases: { title: string; expected: PageType }[] = [
    { title: 'Spotkanie projektowe z klientem', expected: 'Meeting' },
    { title: 'Research & Analiza konkurencji', expected: 'Research' },
    { title: 'Lista Zadań Sprint 4', expected: 'TaskList' },
    { title: 'Projekt Nowej Aplikacji', expected: 'Project' },
    { title: 'Baza Klientów i Leadów', expected: 'Database' },
    { title: 'Kolekcja Artykułów', expected: 'Collection' },
  ];

  for (const c of cases) {
    const res = validateAndMigratePage({ id: 'test-id', title: c.title, blocks: new Array(10).fill({ type: 'p', content: 'test' }) });
    assert(res.pageType === c.expected, `Inferred ${res.pageType} for "${c.title}", expected ${c.expected}`);
  }
  console.log('✅ Test 3 passed: Title-based pageType intelligent inference');
}

// Test 4: Block hierarchy and nesting support
{
  const nestedBlocks: DocBlock[] = [
    { id: 'parent-1', type: 'h2', content: 'Sekcja 1', order: 0, childrenIds: ['child-1', 'child-2'] },
    { id: 'child-1', type: 'p', content: 'Podpunkt A', order: 1, parentId: 'parent-1', indent: 1 },
    { id: 'child-2', type: 'todo', content: 'Zadanie zagnieżdżone', order: 2, parentId: 'parent-1', indent: 1, relatedBlockIds: ['rel-1'] },
  ];

  const docWithNesting = validateAndMigratePage({
    id: 'hierarchical-doc',
    title: 'Struktura hierarchiczna',
    blocks: nestedBlocks,
  });

  assert(docWithNesting.blocks[0].childrenIds?.[0] === 'child-1', 'Supports childrenIds hierarchy');
  assert(docWithNesting.blocks[1].parentId === 'parent-1', 'Supports parentId link');
  assert(docWithNesting.blocks[1].indent === 1, 'Supports indent level');
  assert(docWithNesting.blocks[2].relatedBlockIds?.[0] === 'rel-1', 'Supports cross-block relations');
  console.log('✅ Test 4 passed: Block nesting, indent, hierarchy & relations');
}

// Test 5: Verify all 6 User Profiles
{
  const profileTypes = ['Student', 'Developer', 'Founder', 'Team / Company', 'Personal', 'Other'] as const;
  
  for (const pType of profileTypes) {
    const profile = USER_PROFILES[pType];
    assert(!!profile, `Profile ${pType} exists in registry`);
    assert(profile.title.length > 0, `Profile ${pType} has title`);
    assert(profile.suggestedAiPills.length >= 3, `Profile ${pType} has at least 3 AI suggestions`);
    assert(profile.starterPageTemplates.length >= 1, `Profile ${pType} has starter templates`);

    for (const tpl of profile.starterPageTemplates) {
      assert(!!tpl.title, `Template in ${pType} has title`);
      assert(!!tpl.pageType, `Template in ${pType} has pageType`);
      assert(Array.isArray(tpl.blocks) && tpl.blocks.length > 0, `Template in ${pType} has valid blocks`);

      const migratedTpl = validateAndMigratePage({
        id: `tpl-${Math.random()}`,
        title: tpl.title,
        icon: tpl.icon,
        pageType: tpl.pageType,
        blocks: tpl.blocks,
      });

      assert(migratedTpl.pageType === tpl.pageType, `Migrated template maintains pageType ${tpl.pageType}`);
      assert(migratedTpl.blocks.every(b => typeof b.order === 'number'), 'All template blocks have valid order');
    }
  }
  console.log('✅ Test 5 passed: All 6 User Profiles with starter templates validated');
}

console.log('🎉 All KROK 1 Data Model & Profile Tests Passed Successfully!');
