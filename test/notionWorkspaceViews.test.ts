import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdownToNotionBlocks } from '../src/features/ai/markdownToBlocks';
import {
  buildProjectRecords,
  buildTaskRecords,
  buildMeetingRecords,
  filterAndSortDatabaseRecords,
  loadDatabaseViewConfig,
  saveDatabaseViewConfig,
} from '../src/features/database/viewConfigService';
import {
  parseNaturalLanguageWorkspaceCommands,
  executeUniversalCommands,
} from '../src/features/ai/universalCommandSystem';
import { parseAiBlockTagsToBlocks } from '../src/features/ai/blockTagParser';
import { BlockFactory } from '../src/features/ai/engine/blockFactory';
import { serializeDocToMarkdown } from '../src/utils/noteExportCopy';
import { WorkspacePage, TaskItem, DocBlock } from '../src/types/workspace';

test('AI Note Engine: parses user-pasted "1-tygodniowy MVP dla realnej sprzedaży" without raw ** or unwanted footer blocks', () => {
  const rawInput = `**Najlepszy plan (1): „1‑tydzieńny MVP dla realnej sprzedaży”**

1) **Zdefiniuj problem i wynik (1–2h)**

- Jedno zdanie: dla kogo, jaki ból i jaki efekt.

- Jedno zdanie „dlaczego teraz” (okazja/trigger).

2) **Zidentyfikuj 1 segment i 1 kluczową czynność (1–2h)**

- Wybierz **najwęższy** target.

- Określ **jedną** rzecz, którą użytkownik ma wykonać, żeby Twój MVP „działało”.

3) **Zbuduj tylko „dowód wartości” (1 dzień)**

- Interfejs minimalny (Landing + formularz) albo prosta strona z ofertą.

- Dodaj **2–3 warianty komunikatu** (nagłówek/oferta) żeby szybko sprawdzić reakcję.

4) **Waliduj sprzedażą, nie budową (3–4 dni)**

- Zbieraj leady i od razu proponuj: call / demo / wstępny dostęp.

- Rób krótkie rozmowy i pytaj o: obecny proces, gotowość do zapłaty, warunki wdrożenia.

- Celuj w: **liczbę rozmów + zapisów + potwierdzoną gotowość do płatności**.

5) **Mierniki sukcesu (od początku, 30 min)**

- Minimum: np. **X% zapisów**, **Y rozmów**, **Z osób gotowych do pilota/płatności** (ustal progi przed startem).

6) **Pętla decyzji (codziennie, 30 min)**

- Jeśli metryki nie idą: zmiana komunikatu, oferty, segmentu lub sposobu dotarcia.

- Jeśli idą: zawężaj zakres, przygotuj „kolejny krok” do pilota.

7) **Wynik na koniec tygodnia (raport 1 strona)**

- Co potwierdziłeś, co obaliłeś, jakie segmenty działają.

- Czy przechodzisz do wersji 2 (mały produkt) i jaki ma być następny backlog.

**Dlaczego ten plan jest najlepszy:** najszybciej weryfikuje popyt i płatność bez marnowania czasu na pełną aplikację.

Zadaj pytanie lub poproś AI o rozwinięcie wybranej sekcji tego dokumentu...

SearchPoint AI Knowledge Engine`;

  const parsed = parseMarkdownToNotionBlocks(rawInput);
  const blocks = parsed.blocks;

  assert.ok(blocks.length >= 10, 'Should produce structured blocks');

  // 1. Verify no block contains raw "**" markdown syntax in content
  for (const b of blocks) {
    assert.ok(
      !b.content.includes('**'),
      `Block [${b.type}] still contains raw "**": ${b.content}`
    );
  }

  // 2. Verify no unwanted ai_prompt or signature blocks
  assert.ok(
    !blocks.some((b) => b.type === 'ai_prompt' || b.type === 'signature'),
    'Should not contain unwanted ai_prompt or signature footer blocks'
  );
  assert.ok(
    !blocks.some((b) => b.content.includes('Zadaj pytanie lub poproś AI')),
    'Should strip unwanted "Zadaj pytanie..." footer line'
  );
  assert.ok(
    !blocks.some((b) => b.content.includes('SearchPoint AI Knowledge Engine')),
    'Should strip unwanted "SearchPoint AI Knowledge Engine" footer line'
  );

  // 3. Verify headings were recognized from standalone bold and numbered "1) **Step**" lines
  const h1Blocks = blocks.filter((b) => b.type === 'h1');
  const h2Blocks = blocks.filter((b) => b.type === 'h2');
  const keyTakeawayBlocks = blocks.filter((b) => b.type === 'key_takeaway');

  assert.ok(h1Blocks.length >= 1, 'Standalone bold title should become h1');
  assert.ok(h2Blocks.length >= 7, 'Numbered 1) **Step** items should become h2 headings');
  assert.ok(
    keyTakeawayBlocks.length >= 1,
    '"Dlaczego ten plan jest najlepszy:" should become a key_takeaway block'
  );

  // 4. Verify serializeDocToMarkdown does not duplicate title or emit footer junk
  const exported = serializeDocToMarkdown({
    title: parsed.title,
    icon: '📄',
    blocks: blocks as any,
  });
  assert.ok(!exported.includes('SearchPoint AI Knowledge Engine'));
  assert.ok(!exported.includes('Zadaj pytanie lub poproś AI'));
});

test('5-View Database Engine: Projects, Tasks, and Meetings share unified records and calculate relational progress', () => {
  const pages: WorkspacePage[] = [
    {
      id: 'proj-1',
      title: 'SearchPoint AI 2.0',
      icon: '🚀',
      pageType: 'Project',
      blocks: [{ id: 'b1', type: 'p', content: 'Przebudowa przestrzeni roboczej Notion Killer' }],
      tags: ['PROJEKT', 'AI'],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
      metadata: {
        status: 'W trakcie',
        priority: 'Krytyczny',
        owner: 'Kamil',
        dueDate: '2026-11-01',
      },
    },
    {
      id: 'mtg-1',
      title: 'Sprint Planning & Kickoff',
      icon: '📅',
      pageType: 'Meeting',
      blocks: [{ id: 'b2', type: 'p', content: 'Omówienie architektury 5 widoków' }],
      tags: ['SPOTKANIE'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        status: 'Zaplanowane',
        priority: 'Wysoki',
        date: '2026-10-25',
        startTime: '10:00',
        endTime: '11:00',
        projectId: 'proj-1',
      },
    },
  ];

  const tasks: TaskItem[] = [
    {
      id: 'task-1',
      title: 'Zbudować widok Tabeli i Tablicy',
      status: 'Zrobione',
      priority: 'Wysoki',
      dueDate: '2026-10-24',
      tag: 'PROJEKT',
      assignee: 'Kamil',
      relationPageId: 'proj-1',
    },
    {
      id: 'task-2',
      title: 'Wdrożyć widok Kalendarza i Galerii',
      status: 'W trakcie',
      priority: 'Krytyczny',
      dueDate: '2026-10-26',
      tag: 'PROJEKT',
      assignee: 'Anna',
      relationPageId: 'proj-1',
    },
  ];

  const projectRecords = buildProjectRecords(pages, tasks);
  assert.equal(projectRecords.length, 1);
  assert.equal(projectRecords[0].title, 'SearchPoint AI 2.0');
  assert.equal(projectRecords[0].icon, '🚀');
  assert.equal(projectRecords[0].progressPercent, 50, '1 of 2 linked tasks is Zrobione -> 50%');
  assert.equal(projectRecords[0].relatedTasksCount, 2);
  assert.equal(projectRecords[0].completedTasksCount, 1);
  assert.equal(projectRecords[0].relatedMeetingsCount, 1);
  assert.deepEqual(projectRecords[0].relatedTaskIds, ['task-1', 'task-2']);
  assert.deepEqual(projectRecords[0].relatedMeetingIds, ['mtg-1']);

  // Complete second task and verify live progress recalculates to 100%
  tasks[1].status = 'Zrobione';
  const updatedProjects = buildProjectRecords(pages, tasks);
  assert.equal(updatedProjects[0].progressPercent, 100, '2 of 2 linked tasks Zrobione -> 100%');

  // Verify Task records & Meeting records
  const taskRecords = buildTaskRecords(tasks, pages);
  assert.equal(taskRecords.length, 2);
  assert.equal(taskRecords[0].relationProjectTitle, 'SearchPoint AI 2.0');
  assert.equal(taskRecords[0].relatedProjectTitle, 'SearchPoint AI 2.0');

  const meetingRecords = buildMeetingRecords(pages, tasks);
  assert.equal(meetingRecords.length, 1);
  assert.equal(meetingRecords[0].relationProjectTitle, 'SearchPoint AI 2.0');
  assert.equal(meetingRecords[0].relatedProjectTitle, 'SearchPoint AI 2.0');
  assert.equal(meetingRecords[0].date, '2026-10-25');

  // Verify filtering & sorting works identically across views
  const filteredTasks = filterAndSortDatabaseRecords(taskRecords, {
    id: 'view-tasks-test',
    name: 'Widok testowy',
    entityKind: 'tasks',
    viewMode: 'board',
    searchQuery: 'Kalendarza',
    statusFilter: 'all',
    priorityFilter: 'all',
    ownerFilter: 'all',
    projectFilter: 'proj-1',
    sortField: 'title',
    sortDir: 'asc',
    groupBy: 'status',
    visibleColumns: ['title', 'status'],
  });
  assert.equal(filteredTasks.length, 1);
  assert.equal(filteredTasks[0].id, 'task-2');

  // Verify view config load/save works safely
  const cfg = loadDatabaseViewConfig('projects');
  cfg.viewMode = 'gallery';
  saveDatabaseViewConfig(cfg);
});

test('Natural Language Workspace Commands: creates projects, linked tasks, and meetings', () => {
  const cmd1 = parseNaturalLanguageWorkspaceCommands(
    'Create a project called Apollo Launch'
  );
  assert.equal(cmd1.length, 1);
  assert.equal(cmd1[0].type, 'PROJECT');
  assert.ok(cmd1[0].rawBody.includes('Apollo Launch'));

  const cmd2 = parseNaturalLanguageWorkspaceCommands(
    'Create five tasks for the project SearchPoint AI'
  );
  assert.equal(cmd2.length, 5);
  assert.ok(cmd2.every((c) => c.type === 'TASK' && c.rawBody.includes('SearchPoint AI')));

  const cmd3 = parseNaturalLanguageWorkspaceCommands(
    'Create a meeting called Product Sync and add follow-up tasks'
  );
  assert.ok(cmd3.some((c) => c.type === 'MEETING'));

  const cmd4 = parseNaturalLanguageWorkspaceCommands(
    'Add a linked tasks view to this project'
  );
  assert.equal(cmd4.length, 1);
  assert.equal(cmd4[0].type, 'DATABASE');
  assert.equal(cmd4[0].param, 'tasks');

  // Multi-step complex orchestration in Polish natural language
  const complexPrompt =
    'Hej dodaj marek@eskp.pl do notatki Koty i Psy daj mu all uprawnienia i dodaj mu i mi taska skończyć projekt Koty i Psy do jutra';
  const cmd5 = parseNaturalLanguageWorkspaceCommands(complexPrompt);
  assert.ok(cmd5.some((c) => c.type === 'SHARE' && c.rawBody.includes('marek@eskp.pl')));
  assert.ok(cmd5.some((c) => c.type === 'TASK' && c.rawBody.includes('Koty i Psy')));

  // Execute on existing project
  const existingPage: WorkspacePage = {
    id: 'page-koty-psy',
    title: 'Koty i Psy',
    icon: '🐱',
    pageType: 'Project',
    blocks: [],
    tags: ['Zwierzęta'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ownerId: 'owner-1',
    permissions: { accessLevel: 'workspace', role: 'Owner' },
  };

  const execRes = executeUniversalCommands(complexPrompt, {
    pages: [existingPage],
    tasks: [],
    actor: { uid: 'owner-1', email: 'owner@eskp.pl', displayName: 'Owner' },
  });

  assert.ok(execRes.executedCommandsCount >= 2);
  assert.equal(execRes.createdTasks.length, 1);
  assert.equal(execRes.createdTasks[0].relationPageId, 'page-koty-psy');
  assert.ok(execRes.createdTasks[0].assignee?.includes('marek@eskp.pl'));
  assert.ok(execRes.updatedPages.some((p) => p.id === 'page-koty-psy' && p.sharedWith?.includes('marek@eskp.pl')));

  // Test Autonomous Proactive AI capabilities: UPDATE_TASK, AUTO_SCHEDULE, AUDIT_WORKSPACE
  const taskToUpdate: TaskItem = {
    id: 'task-old-1',
    title: 'Przygotować specyfikację',
    status: 'Do zrobienia',
    priority: 'Wysoki',
    dueDate: '2020-01-01', // Przeterminowane
    tag: 'Tech',
  };

  const autoScheduleRes = executeUniversalCommands('uporządkuj terminy i audyt workspace oraz oznacz zadanie Przygotować specyfikację jako zrobione', {
    pages: [existingPage],
    tasks: [taskToUpdate],
    actor: { uid: 'owner-1', email: 'owner@eskp.pl', displayName: 'Owner' },
  });

  assert.ok(autoScheduleRes.executedCommandsCount >= 2);
  assert.ok(autoScheduleRes.updatedTasks.some((t) => t.id === 'task-old-1' && t.status === 'Zrobione'));
  assert.ok(autoScheduleRes.summaryLines.some((s) => s.includes('Audyt Workspace') || s.includes('harmonogram')));
});

test('Linked Database Views & Universal Page Architecture: parses #LINKED_DB# tags and creates Project/Meeting pages with embedded linked databases', () => {
  const factory = new BlockFactory();
  const linkedBlock = factory.linkedDatabase('tasks', 'board', 'Zadania projektu', 'auto');
  assert.equal(linkedBlock.type, 'linked_database');
  assert.equal(linkedBlock.linkedDatabaseData?.entityKind, 'tasks');
  assert.equal(linkedBlock.linkedDatabaseData?.viewMode, 'board');
  assert.equal(linkedBlock.linkedDatabaseData?.projectFilter, 'auto');

  const parsedTag = parseAiBlockTagsToBlocks(
    '#H1#Plan Projektu#H1#\n#LINKED_DB:tasks#Zadania Sprintu | board | auto#LINKED_DB#'
  );
  assert.ok(parsedTag, 'Should parse #LINKED_DB# protocol');
  const dbBlock = parsedTag.blocks.find((b) => b.type === 'linked_database');
  assert.ok(dbBlock, 'Should produce a linked_database block');
  assert.equal(dbBlock!.linkedDatabaseData?.entityKind, 'tasks');
  assert.equal(dbBlock!.linkedDatabaseData?.viewMode, 'board');
  assert.equal(dbBlock!.linkedDatabaseData?.projectFilter, 'auto');

  // Execute universal AI commands to create a Project and verify embedded linked_database blocks
  const result = executeUniversalCommands(
    '#PROJECT#Apollo 11 | Misja księżycowa | Kamil | 2026-12-01#PROJECT#\n#TASK#Zbudować moduł lądownika | Krytyczny | Kamil | 2026-11-15 | Apollo 11#TASK#',
    {
      pages: [],
      tasks: [],
    }
  );

  assert.equal(result.executedCommandsCount, 2);
  assert.equal(result.createdPages.length, 1);
  assert.equal(result.createdPages[0].pageType, 'Project');
  assert.ok(
    result.createdPages[0].blocks?.some((b) => b.type === 'linked_database'),
    'Created Project page should include embedded linked_database block(s)'
  );
  assert.equal(result.createdTasks.length, 1);
  assert.equal(
    result.createdTasks[0].relationPageId,
    result.createdPages[0].id,
    'Task should link to newly created Project ID'
  );
});
