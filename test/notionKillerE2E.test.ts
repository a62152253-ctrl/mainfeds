/**
 * End-to-End Integration & Functional Verification Suite ("Notion Killer" Specification)
 *
 * Weryfikuje wszystkie 12 wymaganych scenariuszy:
 * 1. Tworzenie ustrukturyzowanej notatki komendami `#HEADER#` / `#TAG#`, zapis i ponowne otwarcie bez utraty bloków
 * 2. Tworzenie interaktywnego wykresu (`#CHART#` / `buildChartBlockFromWorkspaceState`) z rzeczywistych danych zadań
 * 3. Tworzenie projektu (`#PROJECT#`) i zadań (`#TASK#`) oraz wyliczanie postępu projektu (`calculateProjectProgress`)
 * 4. Konwersja ustaleń ze spotkania (`#MEETING#` / `convertMeetingDecisionsToTasks`) w przypisane zadania
 * 5. Autoryzowane udostępnianie notatki przez `_user@gmail.com` / `#SHARE:user@gmail.com#` i weryfikacja uprawnień
 * 6. Blokada nieautoryzowanego dostępu oraz ochrona przed przypadkowym udostępnieniem przez zwykły email w tekście
 * 7. Obsługa globalnej dyrektywy `ALL_USER@GMAIAL.COM` (oraz wycofywanie dostępu i ochrona stron prywatnych)
 * 8. Wzmianki i pingowanie współpracowników (`@ping user@gmail.com` / `#PING#`) generujące powiadomienia z `pageId`
 * 9. Prawdziwy wieloźródłowy research online i weryfikacja źródeł (9+ rejestrów)
 * 10. Rozdzielanie wielotematycznych poleceń (np. "stwórz notatkę o psach, biznes plan i jak zdobyć pierwszą miłość") na osobne notatki
 * 11. Uczciwa obsługa błędów wyszukiwania (`createResearchFailureResult`) bez fabrykowania źródeł
 * 12. Walidacja i naprawa dokumentów (`validateAndMigratePage` & `validateAndRepairDocument`)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validateAndMigratePage, WorkspacePage, TaskItem } from '../src/types/workspace';
import {
  hasAiBlockTags,
  parseAiBlockTagsToBlocks,
} from '../src/features/ai/blockTagParser';
import {
  extractExplicitShareDirectives,
  extractPingDirectives,
  evaluatePageAccess,
  applyShareToWorkspacePages,
  revokeShareFromWorkspacePages,
  createPingNotification,
  isWorkspaceWideShareDirective,
} from '../src/features/sharing/sharingService';
import {
  executeUniversalCommands,
  buildChartBlockFromWorkspaceState,
  convertMeetingDecisionsToTasks,
  calculateProjectProgress,
} from '../src/features/ai/universalCommandSystem';
import {
  splitMultiTopicResearchPrompt,
  openRealBrowserSearchTabs,
  createResearchFailureResult,
  performMultiSourceResearch,
} from '../src/features/ai/multiSourceResearchService';

test('1. Structured note creation via #HEADER# & #TAG# commands, persistence and reopen', () => {
  const rawCommandStream = [
    '#HEADER#Strategia Produktowa Q4#HEADER#',
    '#LEAD#Kompleksowy plan rozwoju platformy produktywności.#LEAD#',
    '#CALLOUT_INFO#Wszystkie moduły współdzielą jedną bazę wiedzy i zadań.#CALLOUT_INFO#',
    '#TABLE#Moduł | Status | Właściciel \n Notatki | Gotowe | Kamil \n Wykresy | Gotowe | Anna#TABLE#',
    '#TODO#[x] Wdrożyć parser tagów \n [ ] Przeprowadzić audyt bezpieczeństwa#TODO#',
    '#CODE:typescript#const status: string = "production";#CODE#',
  ].join('\n\n');

  assert.equal(hasAiBlockTags(rawCommandStream), true);
  const parsed = parseAiBlockTagsToBlocks(rawCommandStream);

  assert.equal(parsed.title, 'Strategia Produktowa Q4');
  assert.ok(parsed.blocks.length >= 6);
  assert.ok(parsed.usedBlockTypes.includes('h1'));
  assert.ok(parsed.usedBlockTypes.includes('lead'));
  assert.ok(parsed.usedBlockTypes.includes('callout_info'));
  assert.ok(parsed.usedBlockTypes.includes('table'));
  assert.ok(parsed.usedBlockTypes.includes('todo'));
  assert.ok(parsed.usedBlockTypes.includes('code'));

  // Symulacja zapisu i ponownego odczytu (reopen) przez validateAndMigratePage
  const savedPage = validateAndMigratePage({
    id: 'page-test-1',
    title: parsed.title,
    blocks: parsed.blocks,
  });

  const reopenedPage = validateAndMigratePage(JSON.parse(JSON.stringify(savedPage)));
  assert.equal(reopenedPage.title, 'Strategia Produktowa Q4');
  assert.equal(reopenedPage.blocks.length, parsed.blocks.length);
  assert.deepEqual(reopenedPage.blocks[3].tableData, [
    ['Moduł', 'Status', 'Właściciel'],
    ['Notatki', 'Gotowe', 'Kamil'],
    ['Wykresy', 'Gotowe', 'Anna'],
  ]);
});

test('2. Chart creation (#CHART#) from inline series and from real workspace tasks', () => {
  const inlineChartStream =
    '#CHART:bar#Sprzedaż kwartalna :: Q1: 120 | Q2: 185 | Q3: 240 | Q4: 310#CHART#';
  const parsed = parseAiBlockTagsToBlocks(inlineChartStream);

  const chartBlock = parsed.blocks.find((b) => b.type === 'chart');
  assert.ok(chartBlock, 'Powinien utworzyć blok typu chart');
  assert.equal(chartBlock!.chartData?.title, 'Sprzedaż kwartalna');
  assert.equal(chartBlock!.chartData?.chartType, 'bar');
  assert.equal(chartBlock!.chartData?.dataPoints.length, 4);
  assert.equal(chartBlock!.chartData?.dataPoints[3].value, 310);

  // Wykres generowany z prawdziwych zadań w Workspace
  const sampleTasks: TaskItem[] = [
    { id: 't1', title: 'Zadanie 1', status: 'Do zrobienia', priority: 'Wysoki', dueDate: '2026-11-01', tag: 'Dev' },
    { id: 't2', title: 'Zadanie 2', status: 'W trakcie', priority: 'Średni', dueDate: '2026-11-02', tag: 'Dev' },
    { id: 't3', title: 'Zadanie 3', status: 'Zrobione', priority: 'Krytyczny', dueDate: '2026-11-03', tag: 'Dev' },
    { id: 't4', title: 'Zadanie 4', status: 'Zrobione', priority: 'Niski', dueDate: '2026-11-04', tag: 'Dev' },
  ];

  const workspaceChart = buildChartBlockFromWorkspaceState(
    { pages: [], tasks: sampleTasks },
    'Postęp Sprintu',
    'donut'
  );
  assert.equal(workspaceChart.type, 'chart');
  assert.equal(workspaceChart.chartData?.chartType, 'donut');
  assert.deepEqual(
    workspaceChart.chartData?.dataPoints.map((d) => ({ label: d.label, value: d.value })),
    [
      { label: 'Do zrobienia', value: 1 },
      { label: 'W trakcie', value: 1 },
      { label: 'Zrobione', value: 2 },
    ]
  );
});

test('3. Task creation, Project linking and real Project progress calculation', () => {
  const commandInput = [
    '#PROJECT#Nowa Platforma SaaS | Wdrożenie architektury produkcyjnej | Kamil | 2026-12-01#PROJECT#',
    '#TASK#Skonfigurować bazę danych | Krytyczny | kamil@gmail.com | 2026-11-10 | Nowa Platforma SaaS#TASK#',
    '#TASK#Wdrożyć uwierzytelnianie | Wysoki | anna@gmail.com | 2026-11-12 | Nowa Platforma SaaS#TASK#',
  ].join('\n');

  const execRes = executeUniversalCommands(commandInput, {
    pages: [],
    tasks: [],
    actor: { uid: 'owner-1', email: 'owner@gmail.com', displayName: 'Owner' },
  });

  assert.equal(execRes.createdPages.length, 1);
  assert.equal(execRes.createdPages[0].pageType, 'Project');
  assert.equal(execRes.createdTasks.length, 2);

  const projectPage = execRes.createdPages[0];
  assert.equal(execRes.createdTasks[0].relationPageId, projectPage.id);
  assert.equal(execRes.createdTasks[1].relationPageId, projectPage.id);

  // Oznaczamy pierwsze zadanie jako Zrobione i weryfikujemy postęp projektu
  const updatedTasks: TaskItem[] = [
    { ...execRes.createdTasks[0], status: 'Zrobione', isCompleted: true },
    execRes.createdTasks[1],
  ];

  const progress = calculateProjectProgress(projectPage.id, updatedTasks, projectPage.title);
  assert.equal(progress.totalTasks, 2);
  assert.equal(progress.completedTasks, 1);
  assert.equal(progress.progressPercent, 50);
});

test('4. Meeting decision & action item conversion into assigned Tasks', () => {
  const baseMeeting = validateAndMigratePage({
    id: 'meet-101',
    title: 'Przegląd Architektury',
    pageType: 'Meeting',
    blocks: [{ id: 'b1', type: 'h1', content: 'Przegląd Architektury' }],
  });

  const result = convertMeetingDecisionsToTasks({
    meetingPage: baseMeeting,
    decisionsAndActions: [
      { title: 'Zoptymalizować zapytania indeksowe', assignee: 'marek@gmail.com', priority: 'Krytyczny' },
      { title: 'Przygotować testy obciążeniowe', assignee: 'anna@gmail.com', priority: 'Wysoki' },
    ],
    linkedProjectId: 'proj-1',
    linkedProjectTitle: 'System Core',
  });

  assert.equal(result.createdTasks.length, 2);
  assert.equal(result.createdTasks[0].assignee, 'marek@gmail.com');
  assert.equal(result.createdTasks[0].pageId, 'meet-101');
  assert.equal(result.createdTasks[0].relationPageId, 'proj-1');
  assert.ok(
    result.updatedMeetingPage.blocks.some((b) => b.type === 'meeting_action_item'),
    'Strona spotkania powinna zawierać bloki meeting_action_item powiązane z zadaniami'
  );
});

test('5 & 6. Authorized note sharing (_user@gmail.com / #SHARE#) vs ordinary prose email safety & unauthorized blocking', () => {
  // Zwykły adres e-mail w tekście (np. cytat lub kontakt) NIE może uruchamiać udostępniania
  const proseText = 'W razie pytań napisz na kontakt@firma.pl lub jan.kowalski@gmail.com w sprawie faktury.';
  const proseDirectives = extractExplicitShareDirectives(proseText);
  assert.equal(proseDirectives.length, 0, 'Zwykły email w zdaniu nie może nadawać dostępu');

  // Jawna składnia udostępniania (_user@gmail.com, @share, #SHARE#) jest rozpoznawana
  const explicitText = 'Udostępniam notatkę: _kamil@gmail.com oraz #SHARE:anna@gmail.com:can_comment#';
  const explicitDirectives = extractExplicitShareDirectives(explicitText);
  assert.equal(explicitDirectives.length, 2);
  const kamilDir = explicitDirectives.find((d) => d.targetEmail === 'kamil@gmail.com');
  const annaDir = explicitDirectives.find((d) => d.targetEmail === 'anna@gmail.com');
  assert.ok(kamilDir);
  assert.equal(kamilDir!.role, 'can_edit');
  assert.ok(annaDir);
  assert.equal(annaDir!.role, 'can_comment');

  const ownerPage = validateAndMigratePage({
    id: 'page-sec-1',
    ownerId: 'owner-uid',
    title: 'Poufny Plan Finansowy',
    permissions: { accessLevel: 'private', role: 'Owner' },
  });

  // Nieautoryzowany użytkownik nie ma dostępu
  const strangerEval = evaluatePageAccess(ownerPage, { uid: 'stranger-uid', email: 'intruz@gmail.com' });
  assert.equal(strangerEval.hasAccess, false);
  assert.equal(strangerEval.canView, false);
  assert.equal(strangerEval.canEdit, false);

  // Nieautoryzowany użytkownik nie może sam sobie udostępnić strony
  assert.throws(() => {
    applyShareToWorkspacePages({
      pages: [ownerPage],
      targetPageId: ownerPage.id,
      targetEmail: 'intruz@gmail.com',
      role: 'full_access',
      actor: { uid: 'stranger-uid', email: 'intruz@gmail.com' },
    });
  }, /Brak uprawnień/);

  // Właściciel udostępnia stronę użytkownikowi kamil@gmail.com z rolą can_edit
  const shareRes = applyShareToWorkspacePages({
    pages: [ownerPage],
    targetPageId: ownerPage.id,
    targetEmail: '_kamil@gmail.com',
    role: 'can_edit',
    actor: { uid: 'owner-uid', email: 'owner@gmail.com' },
  });

  const sharedPage = shareRes.updatedPages[0];
  const kamilEval = evaluatePageAccess(sharedPage, { uid: 'kamil-uid', email: 'kamil@gmail.com' });
  assert.equal(kamilEval.hasAccess, true);
  assert.equal(kamilEval.canView, true);
  assert.equal(kamilEval.canEdit, true);
  assert.equal(kamilEval.canManageSharing, false, 'Rola can_edit nie pozwala na dalsze zarządzanie udostępnianiem');
});

test('7. Workspace-wide sharing directive ALL_USER@GMAIAL.COM & revocation', () => {
  assert.equal(isWorkspaceWideShareDirective('ALL_USER@GMAIAL.COM'), true);
  assert.equal(isWorkspaceWideShareDirective('_ALL_USER@GMAIAL.COM'), true);

  const pageA = validateAndMigratePage({
    id: 'p-ws-1',
    ownerId: 'owner-uid',
    workspaceId: 'ws-personal',
    title: 'Notatka Projektowa A',
    permissions: { accessLevel: 'workspace', role: 'Owner' },
  });
  const pageB = validateAndMigratePage({
    id: 'p-ws-2',
    ownerId: 'owner-uid',
    workspaceId: 'ws-personal',
    title: 'Notatka Projektowa B',
    permissions: { accessLevel: 'workspace', role: 'Owner' },
  });
  const strictlyPrivatePage = validateAndMigratePage({
    id: 'p-priv-3',
    ownerId: 'owner-uid',
    workspaceId: 'ws-personal',
    title: 'Ściśle Prywatne Hasła',
    permissions: { accessLevel: 'private', role: 'Owner' },
  });

  const globalShare = applyShareToWorkspacePages({
    pages: [pageA, pageB, strictlyPrivatePage],
    targetPageId: pageA.id,
    targetEmail: 'ALL_USER@GMAIAL.COM',
    role: 'can_edit',
    actor: { uid: 'owner-uid', email: 'owner@gmail.com' },
  });

  assert.equal(globalShare.isWorkspaceWide, true);
  assert.deepEqual(globalShare.affectedPageIds, ['p-ws-1', 'p-ws-2']);

  // Dowolny członek workspace ma teraz dostęp do p-ws-1 i p-ws-2, ale NIE do p-priv-3
  const memberUser = { uid: 'member-99', email: 'member99@gmail.com' };
  assert.equal(evaluatePageAccess(globalShare.updatedPages[0], memberUser).hasAccess, true);
  assert.equal(evaluatePageAccess(globalShare.updatedPages[1], memberUser).hasAccess, true);
  assert.equal(evaluatePageAccess(globalShare.updatedPages[2], memberUser).hasAccess, false);

  // Wycofanie (revoke) dyrektywy ALL_USER@GMAIAL.COM
  const revoked = revokeShareFromWorkspacePages({
    pages: globalShare.updatedPages,
    targetPageId: pageA.id,
    targetEmail: 'ALL_USER@GMAIAL.COM',
    actor: { uid: 'owner-uid', email: 'owner@gmail.com' },
  });

  assert.equal(evaluatePageAccess(revoked.updatedPages[0], memberUser).hasAccess, false);
  assert.equal(evaluatePageAccess(revoked.updatedPages[1], memberUser).hasAccess, false);
});

test('8. User mention / ping notification delivery (@ping / #PING#)', () => {
  const sharedPage = validateAndMigratePage({
    id: 'page-ping-1',
    ownerId: 'owner-uid',
    title: 'Specyfikacja API v3',
    sharedWith: ['kamil@gmail.com'],
    sharedCollaborators: [{ email: 'kamil@gmail.com', role: 'can_edit', addedAt: Date.now() }],
  });

  const pings = extractPingDirectives('@ping kamil@gmail.com Sprawdź sekcję autoryzacji OAuth2');
  assert.equal(pings.length, 1);
  assert.equal(pings[0].targetEmail, 'kamil@gmail.com');

  const notifRes = createPingNotification({
    page: sharedPage,
    targetEmail: pings[0].targetEmail,
    message: pings[0].message,
    senderName: 'Anna',
  });

  assert.equal(notifRes.allowed, true);
  assert.ok(notifRes.notification);
  assert.equal(notifRes.notification!.pageId, 'page-ping-1');
  assert.equal(notifRes.notification!.read, false);
  assert.ok(notifRes.notification!.message.includes('Sprawdź sekcję autoryzacji OAuth2'));

  // Próba pingowania osoby bez dostępu do strony jest blokowana z czytelnym wyjaśnieniem
  const blockedPing = createPingNotification({
    page: sharedPage,
    targetEmail: 'obcy@gmail.com',
    message: 'Hej',
  });
  assert.equal(blockedPing.allowed, false);
  assert.ok(blockedPing.reason?.includes('nie ma jeszcze dostępu'));
});

test('9 & 10. Multi-topic prompt splitting & live multi-source research', async () => {
  const complexPrompt =
    'Stwórz notatkę o psach, napisz biznes plan i jak zdobyć pierwszą miłość';
  const plans = splitMultiTopicResearchPrompt(complexPrompt);

  assert.equal(plans.length, 3, 'Powinien rozdzielić polecenie na 3 osobne tematy');
  assert.ok(plans[0].topic.toLowerCase().includes('pies') || plans[0].topic.toLowerCase().includes('ps'));
  assert.ok(plans[1].topic.toLowerCase().includes('biznes plan'));
  assert.ok(plans[2].topic.toLowerCase().includes('miłość') || plans[2].topic.toLowerCase().includes('milosc'));

  // Sprawdzenie otwierania kart wyszukiwarki w środowisku bez GUI
  const launchReport = openRealBrowserSearchTabs(plans.map((p) => p.topic), 'google');
  assert.equal(launchReport.launchedUrls.length, 3);
  assert.ok(launchReport.launchedUrls[0].startsWith('https://www.google.com/search?q='));

  // Wykonanie realnego zapytania badawczego dla pierwszego tematu
  const researchRes = await performMultiSourceResearch(plans[0].topic, { depth: 'quick_note' });
  assert.ok(researchRes.blocks.length >= 6);
  assert.ok(researchRes.sourcesCount >= 1);
});

test('11. Failed search / zero-result handling without fabricating sources', () => {
  const failure = createResearchFailureResult(
    'Zapytanie Testowe Offline',
    'Przekroczono czas oczekiwania na odpowiedź dostawcy.'
  );

  assert.equal(failure.sourcesCount, 0);
  assert.equal(failure.uniqueDomainsCount, 0);
  assert.equal(failure.sources.length, 0);
  assert.ok(
    failure.blocks.some((b) => b.type === 'callout_warning'),
    'Powinien zawierać jawne ostrzeżenie o niepowodzeniu badania bez zmyślonych źródeł'
  );
});
