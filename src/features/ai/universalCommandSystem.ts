/**
 * Uniwersalny System Komend AI i Użytkownika (Universal Command System)
 *
 * Każdy obsługiwany znacznik / komenda posiada:
 * - Zdefiniowaną składnię (`#TAG#...#TAG#`, `#TAG:param#...#TAG#`, `@command`, `/command`)
 * - Parser oraz walidację schematu danych
 * - Model uprawnień (sprawdza dostęp przed mutacją stanu)
 * - Handler wykonawczy, który mutuje rzeczywisty stan Workspace (notatki, bloki, zadania,
 *   projekty, spotkania, zespoły, uprawnienia udostępniania, powiadomienia)
 * - Czytelne zachowanie w przypadku błędów i raport wykonania
 */

import {
  DocBlock,
  NotionAccessRole,
  Priority,
  TaskItem,
  TaskStatus,
  WorkspaceNotification,
  WorkspacePage,
  normalizeAccessRole,
} from '../../types/workspace';
import { BlockFactory, finalizeBlocks } from './engine/blockFactory';
import { parseAiBlockTagsToBlocks } from './blockTagParser';
import {
  applyShareToWorkspacePages,
  createPingNotification,
  extractExplicitShareDirectives,
  extractPingDirectives,
} from '../sharing/sharingService';

export type WorkspaceActionCommandType =
  | 'PROJECT'
  | 'TASK'
  | 'MEETING'
  | 'SHARE'
  | 'PING'
  | 'CHART'
  | 'TEAM'
  | 'DATABASE'
  | 'UPDATE_TASK'
  | 'AUTO_SCHEDULE'
  | 'ORGANIZE_WORKSPACE'
  | 'AUDIT_WORKSPACE';

export interface ParsedActionCommand {
  type: WorkspaceActionCommandType;
  param?: string;
  rawBody: string;
  rawTag: string;
}

export interface CommandExecutionContext {
  pages: WorkspacePage[];
  tasks: TaskItem[];
  activePage?: WorkspacePage | null;
  actor: { uid?: string; email?: string | null; displayName?: string | null } | null;
}

export interface CommandExecutionResult {
  executedCommandsCount: number;
  createdPages: WorkspacePage[];
  updatedPages: WorkspacePage[];
  createdTasks: TaskItem[];
  updatedTasks: TaskItem[];
  createdBlocks: DocBlock[];
  notifications: WorkspaceNotification[];
  errors: string[];
  summaryLines: string[];
  insights?: string[];
}

/**
 * Sprawdza, czy tekst zawiera komendy akcji Workspace (`#PROJECT#`, `#TASK#`, `#MEETING#`,
 * `#SHARE#`, `#PING#`, `#CHART#`, `#TEAM#`, `#DATABASE#`) lub jawne dyrektywy `_user@gmail.com` / `@ping`.
 */
export function hasUniversalWorkspaceCommands(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  if (
    /#(PROJECT|PROJEKT|TASK|ZADANIE_KANBAN|MEETING|SPOTKANIE|SHARE|UDOSTEPNIJ|PING|MENTION|CHART|WYKRES|TEAM|ZESPOL|DATABASE|BAZA|LINKED_DB|LINKED_DATABASE)(?::[a-zA-Z0-9_.+-]+)?#[\s\S]*?#\/?\1#/i.test(
      text
    )
  ) {
    return true;
  }
  if (extractExplicitShareDirectives(text).length > 0) return true;
  if (extractPingDirectives(text).length > 0) return true;
  if (parseNaturalLanguageWorkspaceCommands(text).length > 0) return true;
  return false;
}

/**
 * Rozpoznaje polecenia w języku naturalnym (PL / EN) dotyczące bazy danych Workspace:
 * - "Create a project called SearchPoint AI" / "Stwórz projekt o nazwie SearchPoint AI"
 * - "Create five tasks for the project..." / "Dodaj 5 zadań dla projektu..."
 * - "Create a meeting and add follow-up tasks..." / "Utwórz spotkanie..."
 */
export function parseNaturalLanguageWorkspaceCommands(text: string): ParsedActionCommand[] {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  const commands: ParsedActionCommand[] = [];

  // 1. Tworzenie projektu: "Create a project called X" / "Stwórz projekt X"
  const createProjMatch = trimmed.match(
    /(?:create\s+(?:a\s+)?project\s+(?:called|named)?|stwórz\s+projekt(?:\s+o\s+nazwie)?|utwórz\s+projekt(?:\s+o\s+nazwie)?|nowy\s+projekt)\s+["„”']?([^"„”'\n,.]+)["„”']?/i
  );
  let detectedProjectName = '';
  if (createProjMatch && createProjMatch[1]) {
    detectedProjectName = createProjMatch[1].trim();
    commands.push({
      type: 'PROJECT',
      rawBody: `${detectedProjectName} | Realizacja celów projektu ${detectedProjectName}`,
      rawTag: `#PROJECT#${detectedProjectName}#PROJECT#`,
    });
  }

  // 2. Tworzenie spotkania + zadań ze spotkania: "Create a meeting..." / "Utwórz spotkanie..."
  const createMeetingMatch = trimmed.match(
    /(?:create\s+(?:a\s+)?meeting|stwórz\s+spotkanie|utwórz\s+spotkanie|zaplanuj\s+spotkanie)(?:\s+(?:called|named|o\s+tytule|dotyczące|nt\.?)\s+["„”']?([^"„”'\n,.]+)["„”']?)?/i
  );
  if (createMeetingMatch) {
    const meetingTitle = (createMeetingMatch[1] || 'Spotkanie statusowe projektu').trim();
    const hasFollowUp =
      /follow[- ]?up|zadan|task|action\s+item/i.test(trimmed);
    const decisions = hasFollowUp
      ? 'Przygotować podsumowanie ustaleń i harmonogram; Wdrożyć priorytety ustalone na spotkaniu'
      : 'Zatwierdzenie planu działań zespołu';
    commands.push({
      type: 'MEETING',
      rawBody: `${meetingTitle} | Zespół projektowy | Omówienie postępów, ryzyk i kolejnych kroków | ${decisions}`,
      rawTag: `#MEETING#${meetingTitle}#MEETING#`,
    });
  }

  // 3. Tworzenie N zadań dla projektu: "Create five tasks for the project..." / "Stwórz 5 zadań dla projektu..."
  const multiTasksMatch = trimmed.match(
    /(?:create|add|stwórz|utwórz|dodaj)\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+|jeden|dwa|trzy|cztery|pięć|piec|sześć|szesc)\s+(?:tasks?|zadań|zadania)\s*(?:for\s+(?:the\s+)?project\s*([a-zA-Z0-9\s_-]+)?|dla\s+projektu\s*([a-zA-Z0-9\s_-]+)?)?/i
  );
  if (multiTasksMatch) {
    const wordToNum: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      jeden: 1, dwa: 2, trzy: 3, cztery: 4, pięć: 5, piec: 5, sześć: 6, szesc: 6,
    };
    const countRaw = multiTasksMatch[1].toLowerCase();
    const count = Math.min(10, Math.max(1, wordToNum[countRaw] || parseInt(countRaw, 10) || 3));
    const projRef = (
      multiTasksMatch[2] ||
      multiTasksMatch[3] ||
      detectedProjectName ||
      ''
    )
      .replace(/\b(with|different|priorities|and|due|dates|z|różnymi|priorytetami|terminami)\b.*/i, '')
      .trim();

    const defaultTasks = [
      { title: 'Architektura i specyfikacja wymagań', prio: 'Krytyczny', days: 1 },
      { title: 'Implementacja głównych widoków bazy danych', prio: 'Wysoki', days: 2 },
      { title: 'Integracja silnika AI i komend #TAG#', prio: 'Wysoki', days: 4 },
      { title: 'Testy akceptacyjne E2E i weryfikacja relacji', prio: 'Średni', days: 6 },
      { title: 'Optymalizacja wydajności i wdrożenie produkcyjne', prio: 'Niski', days: 8 },
      { title: 'Audyt bezpieczeństwa i uprawnień udostępniania', prio: 'Wysoki', days: 3 },
      { title: 'Dokumentacja techniczna dla zespołu', prio: 'Średni', days: 5 },
    ];

    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const tpl = defaultTasks[i % defaultTasks.length];
      const due = new Date(now + tpl.days * 86400000).toISOString().split('T')[0];
      const fullTitle = projRef ? `${tpl.title} (${projRef})` : tpl.title;
      commands.push({
        type: 'TASK',
        rawBody: `${fullTitle} | ${tpl.prio} | Ty | ${due} | ${projRef}`,
        rawTag: `#TASK#${fullTitle}#TASK#`,
      });
    }
  }

  // 4. Osadzenie widoku bazy danych (Linked Database View): "Add a linked Tasks view to this project" / "Dodaj widok zadań"
  const linkedDbMatch = trimmed.match(
    /(?:add|insert|dodaj|wstaw)\s+(?:a\s+)?(?:linked\s+)?(tasks?|projects?|meetings?|zadań|zadania|projektów|spotkań)\s+(?:database\s+)?(?:view|widok|bazę)/i
  );
  if (linkedDbMatch) {
    const rawKind = linkedDbMatch[1].toLowerCase();
    const kind =
      rawKind.startsWith('proj')
        ? 'projects'
        : rawKind.startsWith('meet') || rawKind.startsWith('spotk')
          ? 'meetings'
          : 'tasks';
    commands.push({
      type: 'DATABASE',
      param: kind,
      rawBody: `Powiązany widok: ${kind.toUpperCase()} | table | auto`,
      rawTag: `#LINKED_DB:${kind}#Powiązany widok: ${kind}#LINKED_DB#`,
    });
  }

  // 5. Zarządzanie użytkownikami, uprawnieniami i dostępem (Natural Language Share / Team invite)
  // np: "dodaj marek@eskp.pl do notatki Koty i Psy daj mu all uprawnienia"
  // "add john@example.com to project Alpha with full permissions"
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = trimmed.match(emailRegex);
  if (emailMatch) {
    const targetEmail = emailMatch[1].toLowerCase();
    const isShareOrAdd = /(?:dodaj|zaproś|udostępnij|udostepnij|add|invite|share|give|nadaj|grant)\b/i.test(trimmed);
    if (isShareOrAdd) {
      // Wykryj stronę docelową (np. "do notatki Koty i Psy", "do projektu XYZ", "to 'Koty i Psy' notes")
      const targetEntityMatch = trimmed.match(
        /(?:do\s+(?:notatki|projektu|strony|dokumentu)|to\s+(?:the\s+)?(?:note|project|page|notes))\s+["„”']?([^"„”',.\n]+?)["„”']?(?:\s+(?:i\s+|daj\s+|grant\s+|with\s+|oraz\s+)|$)/i
      );
      const targetPageQuery = targetEntityMatch ? targetEntityMatch[1].trim() : '';

      // Wykryj żądaną rolę
      const isFull = /(?:all|pełn|peln|full|admin|właściciel|owner|wszystkie)/i.test(trimmed);
      const isComment = /(?:koment|comment)/i.test(trimmed);
      const isView = /(?:podgląd|podglad|read|view|odczyt)/i.test(trimmed);
      const role: NotionAccessRole = isFull ? 'full_access' : isComment ? 'can_comment' : isView ? 'can_view' : 'can_edit';

      commands.push({
        type: 'SHARE',
        param: targetEmail,
        rawBody: `${targetEmail} | ${role}${targetPageQuery ? ` | ${targetPageQuery}` : ''}`,
        rawTag: `#SHARE:${targetEmail}:${role}#`,
      });
    }
  }

  // 6. Tworzenie powiązanego zadania w języku naturalnym (Natural Language Task Assignment)
  // np: "dodaj mu i mi taska skończyć projekt Koty i Psy do jutra"
  // "create a task for both Marek and me to finish the 'Koty i Psy' project by tomorrow"
  const taskNLMatch = trimmed.match(
    /(?:dodaj\s+(?:mu\s+i\s+mi\s+|nam\s+|dla\s+[^,]+\s+)?(?:taska|zadanie)|create\s+(?:a\s+)?task\s+(?:for\s+[^,]+\s+)?to)\s+["„”']?([^"„”'|,\n]+?)["„”']?(?:\s+(?:do\s+jutra|by\s+tomorrow|do\s+\d{4}-\d{2}-\d{2}|termin\b.*))?$/i
  ) || trimmed.match(
    /(?:task(?:a)?|zadanie)\s*:\s*([^|,\n]+)/i
  );

  if (taskNLMatch) {
    let rawTaskTitle = taskNLMatch[1].trim();
    // Sprawdź termin: "do jutra" / "by tomorrow"
    const isTomorrow = /(?:do\s+jutra|by\s+tomorrow|jutro|tomorrow)/i.test(trimmed);
    const dueDate = isTomorrow
      ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
      : new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

    // Sprawdź wykonawców
    let assignee = 'Ty';
    if (/(?:mu\s+i\s+mi|both\s+.*and\s+me|dla\s+obu|dla\s+nas)/i.test(trimmed) && emailMatch) {
      assignee = `${emailMatch[1]}, Ty`;
    } else if (emailMatch && /(?:dla\s+|for\s+)/i.test(trimmed)) {
      assignee = emailMatch[1];
    }

    // Wykryj projekt powiązany
    const projMatch = trimmed.match(/(?:projekt(?:u)?|project)\s+["„”']?([^"„”',.\n]+?)["„”']?(?:\s+(?:do\s+|by\s+)|$)/i);
    const matchedProjectTitle = projMatch ? projMatch[1].trim() : '';

    commands.push({
      type: 'TASK',
      rawBody: `${rawTaskTitle} | Wysoki | ${assignee} | ${dueDate}${matchedProjectTitle ? ` | ${matchedProjectTitle}` : ''}`,
      rawTag: `#TASK#${rawTaskTitle}#TASK#`,
    });
  }

  // 7. Zmiana statusu lub ukończenie zadania / projektu: "oznacz zadanie X jako zrobione" / "complete task X"
  const completeTaskMatch = trimmed.match(
    /(?:oznacz|zmień\s+status|ustaw\s+status|complete|finish|mark\s+task|zrób)\s+(?:zadanie|zadania|task(?:a)?|projekt|project)\s+["„”']?([^"„”',.\n]+?)["„”']?\s+(?:jako\s+|as\s+|na\s+)?(zrobione|done|completed|w\s+trakcie|in\s+progress|do\s+zrobienia|todo)/i
  );
  if (completeTaskMatch) {
    const targetTitle = completeTaskMatch[1].trim();
    const rawTargetStatus = completeTaskMatch[2].toLowerCase();
    const newStatus: TaskStatus =
      rawTargetStatus.includes('zrobion') || rawTargetStatus === 'done' || rawTargetStatus === 'completed'
        ? 'Zrobione'
        : rawTargetStatus.includes('trakcie') || rawTargetStatus.includes('progress')
          ? 'W trakcie'
          : 'Do zrobienia';
    commands.push({
      type: 'UPDATE_TASK',
      param: newStatus,
      rawBody: `${targetTitle} | ${newStatus}`,
      rawTag: `#UPDATE_TASK#${targetTitle} | ${newStatus}#UPDATE_TASK#`,
    });
  }

  // 8. Autonomiczny audyt i optymalizacja przestrzeni: "zrób audyt workspace", "uporządkuj zadania", "auto schedule"
  if (/(?:audyt\s+workspace|audit\s+workspace|przeanalizuj\s+projekty|sprawdź\s+blokady|analyze\s+workload)/i.test(trimmed)) {
    commands.push({
      type: 'AUDIT_WORKSPACE',
      rawBody: 'Pełna analiza stanu zdrowia projektów, zadań przeterminowanych i obciążenia zespołu',
      rawTag: '#AUDIT_WORKSPACE#',
    });
  }

  if (/(?:uporządkuj\s+terminy|zoptymalizuj\s+harmonogram|auto\s+schedule|rebalance\s+tasks)/i.test(trimmed)) {
    commands.push({
      type: 'AUTO_SCHEDULE',
      rawBody: 'Automatyczne wyrównanie terminów i reallokacja zadań przeterminowanych',
      rawTag: '#AUTO_SCHEDULE#',
    });
  }

  return commands;
}

/**
 * Parsuje wszystkie komendy akcji `#PROJECT#`, `#TASK#`, `#MEETING#`, `#SHARE#`, `#PING#`, `#CHART#`, `#DATABASE#` z tekstu.
 */
export function parseUniversalActionCommands(text: string): ParsedActionCommand[] {
  if (!text || typeof text !== 'string') return [];

  const commands: ParsedActionCommand[] = [];
  const regex =
    /#(PROJECT|PROJEKT|TASK|ZADANIE_KANBAN|MEETING|SPOTKANIE|SHARE|UDOSTEPNIJ|PING|MENTION|CHART|WYKRES|TEAM|ZESPOL|DATABASE|BAZA|LINKED_DB|LINKED_DATABASE|UPDATE_TASK|AUTO_SCHEDULE|AUDIT_WORKSPACE)(?::([a-zA-Z0-9_.+-]+))?#([\s\S]*?)#\/?\1(?::[a-zA-Z0-9_.+-]+)?#/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const rawName = match[1].toUpperCase();
    const param = (match[2] || '').trim();
    const rawBody = (match[3] || '').trim();

    let type: WorkspaceActionCommandType = 'TASK';
    if (rawName === 'PROJECT' || rawName === 'PROJEKT') type = 'PROJECT';
    else if (rawName === 'TASK' || rawName === 'ZADANIE_KANBAN') type = 'TASK';
    else if (rawName === 'MEETING' || rawName === 'SPOTKANIE') type = 'MEETING';
    else if (rawName === 'SHARE' || rawName === 'UDOSTEPNIJ') type = 'SHARE';
    else if (rawName === 'PING' || rawName === 'MENTION') type = 'PING';
    else if (rawName === 'CHART' || rawName === 'WYKRES') type = 'CHART';
    else if (rawName === 'TEAM' || rawName === 'ZESPOL') type = 'TEAM';
    else if (rawName === 'UPDATE_TASK') type = 'UPDATE_TASK';
    else if (rawName === 'AUTO_SCHEDULE') type = 'AUTO_SCHEDULE';
    else if (rawName === 'AUDIT_WORKSPACE') type = 'AUDIT_WORKSPACE';
    else if (
      rawName === 'DATABASE' ||
      rawName === 'BAZA' ||
      rawName === 'LINKED_DB' ||
      rawName === 'LINKED_DATABASE'
    )
      type = 'DATABASE';

    commands.push({
      type,
      param: param || undefined,
      rawBody,
      rawTag: match[0],
    });
  }

  return commands;
}

/**
 * Generuje blok wykresu (`chart`) z rzeczywistych danych zadań i projektów w Workspace
 * (gdy użytkownik pisze "dodaj wykres zadań", "wykres postępu projektu" lub `#CHART:workspace#`).
 */
export function buildChartBlockFromWorkspaceState(
  context: { pages: WorkspacePage[]; tasks: TaskItem[] },
  customTitle?: string,
  chartType: 'bar' | 'line' | 'pie' | 'donut' = 'bar'
): DocBlock {
  const factory = new BlockFactory();
  const tasks = context.tasks || [];

  const todoCount = tasks.filter((t) => t.status === 'Do zrobienia').length;
  const inProgressCount = tasks.filter((t) => t.status === 'W trakcie').length;
  const doneCount = tasks.filter((t) => t.status === 'Zrobione').length;

  const dataPoints =
    tasks.length > 0
      ? [
          { label: 'Do zrobienia', value: todoCount, color: '#64748b' },
          { label: 'W trakcie', value: inProgressCount, color: '#2383e2' },
          { label: 'Zrobione', value: doneCount, color: '#10b981' },
        ]
      : [
          { label: 'Dokumenty', value: context.pages.length || 1, color: '#2383e2' },
          { label: 'Zadania aktywne', value: 0, color: '#f59e0b' },
          { label: 'Zadania ukończone', value: 0, color: '#10b981' },
        ];

  return factory.chart(
    customTitle || 'Wykres realizacji zadań w Workspace',
    dataPoints,
    chartType,
    'zadań',
    `Dane na żywo z Workspace (${tasks.length} zadań)`
  );
}

/**
 * Konwertuje decyzje i punkty działania ze spotkania (`Meeting`) na rzeczywiste zadania (`TaskItem`)
 * powiązane z dokumentem spotkania oraz opcjonalnym projektem.
 */
export function convertMeetingDecisionsToTasks(params: {
  meetingPage: WorkspacePage;
  decisionsAndActions: Array<{
    title: string;
    assignee?: string;
    dueDate?: string;
    priority?: Priority;
  }>;
  linkedProjectId?: string;
  linkedProjectTitle?: string;
  ownerId?: string;
}): {
  updatedMeetingPage: WorkspacePage;
  createdTasks: TaskItem[];
} {
  const {
    meetingPage,
    decisionsAndActions,
    linkedProjectId,
    linkedProjectTitle,
    ownerId = 'local-user',
  } = params;

  const now = Date.now();
  const defaultDueDate = new Date(now + 86400000 * 3).toISOString().split('T')[0];
  const factory = new BlockFactory();

  const createdTasks: TaskItem[] = [];
  const actionBlocks: DocBlock[] = [];

  decisionsAndActions.forEach((item, idx) => {
    const cleanTitle = item.title.trim();
    if (!cleanTitle) return;

    const taskId = `task-meet-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
    const newTask: TaskItem = {
      id: taskId,
      ownerId,
      title: cleanTitle,
      status: 'Do zrobienia',
      priority: item.priority || 'Wysoki',
      dueDate: item.dueDate || defaultDueDate,
      tag: 'Spotkanie',
      assignee: item.assignee || 'Ty',
      pageId: meetingPage.id,
      relationPageId: linkedProjectId || meetingPage.id,
      relationPageTitle: linkedProjectTitle || meetingPage.title,
      isCompleted: false,
      description: `Utworzono z ustaleń spotkania: "${meetingPage.title}"`,
      createdAt: now,
      updatedAt: now,
    };

    createdTasks.push(newTask);

    actionBlocks.push({
      id: factory.ids.next('act'),
      type: 'meeting_action_item',
      content: `${cleanTitle} (${newTask.assignee} · termin: ${newTask.dueDate})`,
      checked: false,
      taskId,
    });
  });

  const updatedBlocks = finalizeBlocks([
    ...meetingPage.blocks,
    ...(actionBlocks.length > 0
      ? [
          factory.h(2, 'Zadania wygenerowane ze spotkania (Action Items)'),
          ...actionBlocks,
        ]
      : []),
  ]);

  const updatedMeetingPage: WorkspacePage = {
    ...meetingPage,
    pageType: 'Meeting',
    blocks: updatedBlocks,
    updatedAt: now,
  };

  return {
    updatedMeetingPage,
    createdTasks,
  };
}

/**
 * Oblicza rzeczywisty postęp projektu (`Project`) na podstawie powiązanych z nim zadań (`TaskItem`).
 */
export function calculateProjectProgress(
  projectPageId: string,
  tasks: TaskItem[],
  projectTitle?: string
): {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  progressPercent: number;
  linkedTasks: TaskItem[];
} {
  const titleLower = (projectTitle || '').trim().toLowerCase();
  const linkedTasks = tasks.filter(
    (t) =>
      t.relationPageId === projectPageId ||
      t.pageId === projectPageId ||
      (titleLower && (t.relationPageTitle || '').toLowerCase() === titleLower)
  );

  const totalTasks = linkedTasks.length;
  const completedTasks = linkedTasks.filter(
    (t) => t.status === 'Zrobione' || t.isCompleted
  ).length;
  const inProgressTasks = linkedTasks.filter((t) => t.status === 'W trakcie').length;
  const todoTasks = linkedTasks.filter((t) => t.status === 'Do zrobienia' && !t.isCompleted).length;

  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    progressPercent,
    linkedTasks,
  };
}

/**
 * Wykonuje zestaw komend uniwersalnych na przekazanym kontekście Workspace.
 * Zwraca utworzone i zmodyfikowane encje gotowe do zapisu w SQLite / Firestore / React State.
 */
export function executeUniversalCommands(
  rawInput: string,
  context: CommandExecutionContext
): CommandExecutionResult {
  const factory = new BlockFactory();
  const now = Date.now();

  let workingPages = [...context.pages];
  const createdPages: WorkspacePage[] = [];
  const updatedPagesMap = new Map<string, WorkspacePage>();
  const createdTasks: TaskItem[] = [];
  const updatedTasks: TaskItem[] = [];
  const createdBlocks: DocBlock[] = [];
  const notifications: WorkspaceNotification[] = [];
  const errors: string[] = [];
  const summaryLines: string[] = [];
  const insights: string[] = [];

  let executedCommandsCount = 0;
  let lastCreatedProjectPage: WorkspacePage | undefined = workingPages.find(
    (p) => p.pageType === 'Project'
  );

  const actionCommands = [
    ...parseUniversalActionCommands(rawInput),
    ...parseNaturalLanguageWorkspaceCommands(rawInput),
  ];

  for (const cmd of actionCommands) {
    executedCommandsCount += 1;

    switch (cmd.type) {
      case 'PROJECT': {
        // Format: #PROJECT#Nazwa Projektu | Cel projektu | Właściciel | Termin#PROJECT#
        const parts = cmd.rawBody.split('|').map((s) => s.trim());
        const projectTitle = parts[0] || 'Nowy Projekt';
        const projectGoal = parts[1] || ` Kompleksowa realizacja projektu: ${projectTitle}`;
        const projectOwner = parts[2] || context.actor?.displayName || 'Owner';
        const projectDeadline =
          parts[3] || new Date(now + 86400000 * 14).toISOString().split('T')[0];

        const projectId = `page-proj-${now}-${Math.random().toString(36).slice(2, 6)}`;
        const projectBlocks = finalizeBlocks([
          factory.h(1, projectTitle),
          factory.lead(projectGoal),
          factory.statGrid([
            { label: 'Właściciel projektu', value: projectOwner, trend: 'Aktywny' },
            { label: 'Termin docelowy', value: projectDeadline, trend: 'W harmonogramie' },
          ]),
          factory.progress('Postęp realizacji zadań projektu', 0),
          factory.h(2, 'Zakres i Kamienie Milowe'),
          factory.todo('Inicjalizacja projektu i podział zadań', true),
          factory.todo('Wdrożenie kluczowych rezultatów', false),
          factory.h(2, 'Zadania projektu (Linked Database)'),
          factory.linkedDatabase('tasks', 'board', `Zadania projektu: ${projectTitle}`, 'auto'),
          factory.h(2, 'Spotkania projektu (Linked Database)'),
          factory.linkedDatabase('meetings', 'table', `Spotkania projektu: ${projectTitle}`, 'auto'),
        ]);

        const newProjectPage: WorkspacePage = {
          id: projectId,
          pageType: 'Project',
          ownerId: context.actor?.uid || 'local-user',
          workspaceId: 'ws-personal',
          title: projectTitle,
          icon: '🚀',
          blocks: projectBlocks,
          metadata: {
            goal: projectGoal,
            owner: projectOwner,
            deadline: projectDeadline,
            status: 'W trakcie',
          },
          permissions: { accessLevel: 'workspace', role: 'Owner' },
          sharedWith: [],
          sharedCollaborators: [],
          isFavorite: true,
          isDeleted: false,
          isPublic: false,
          tags: ['Projekt'],
          comments: [],
          versions: [],
          createdAt: now,
          updatedAt: now,
        };

        workingPages.unshift(newProjectPage);
        createdPages.push(newProjectPage);
        lastCreatedProjectPage = newProjectPage;
        summaryLines.push(`🚀 Utworzono projekt: "${projectTitle}" (termin: ${projectDeadline})`);
        break;
      }

      case 'TASK': {
        // Format: #TASK#Tytuł zadania | Priorytet | Wykonawca | Termin | Nazwa Projektu#TASK#
        const parts = cmd.rawBody.split('|').map((s) => s.trim());
        const taskTitle = parts[0] || 'Nowe zadanie';
        const rawPrio = (parts[1] || cmd.param || 'Wysoki').toLowerCase();
        const priority: Priority =
          rawPrio.includes('kryt') || rawPrio === 'critical'
            ? 'Krytyczny'
            : rawPrio.includes('nis') || rawPrio === 'low'
              ? 'Niski'
              : rawPrio.includes('śred') || rawPrio.includes('sred') || rawPrio === 'medium'
                ? 'Średni'
                : 'Wysoki';

        const assignee = parts[2] || context.actor?.email || 'Ty';
        const dueDate =
          parts[3] && /^\d{4}-\d{2}-\d{2}$/.test(parts[3])
            ? parts[3]
            : new Date(now + 86400000 * 3).toISOString().split('T')[0];
        const projectQuery = parts[4] || '';

        const matchedProject =
          (projectQuery
            ? workingPages.find(
                (p) =>
                  p.title.toLowerCase().includes(projectQuery.toLowerCase()) ||
                  projectQuery.toLowerCase().includes(p.title.toLowerCase())
              )
            : undefined) || lastCreatedProjectPage;

        const newTask: TaskItem = {
          id: `task-cmd-${now}-${createdTasks.length}-${Math.random().toString(36).slice(2, 6)}`,
          ownerId: context.actor?.uid || 'local-user',
          title: taskTitle,
          status: 'Do zrobienia' as TaskStatus,
          priority,
          dueDate,
          tag: matchedProject ? matchedProject.title.slice(0, 18) : 'Zadanie',
          assignee,
          pageId: matchedProject?.id || context.activePage?.id,
          relationPageId: matchedProject?.id || context.activePage?.id,
          relationPageTitle: matchedProject?.title || context.activePage?.title,
          isCompleted: false,
          createdAt: now,
          updatedAt: now,
        };

        createdTasks.push(newTask);
        summaryLines.push(
          `✅ Utworzono zadanie: "${taskTitle}" [${priority}]${
            matchedProject ? ` → powiązane z projektem "${matchedProject.title}"` : ''
          }`
        );
        break;
      }

      case 'MEETING': {
        // Format: #MEETING#Tytuł spotkania | Uczestnicy (a@b.pl, c@d.pl) | Agenda | Decyzja 1; Decyzja 2#MEETING#
        const parts = cmd.rawBody.split('|').map((s) => s.trim());
        const meetingTitle = parts[0] || 'Spotkanie projektowe';
        const attendeesRaw = parts[1] || context.actor?.email || 'Zespół';
        const agendaRaw = parts[2] || 'Omówienie postępów i blokad projektowych';
        const decisionsRaw = parts[3] || '';

        const decisionsList = decisionsRaw
          .split(/;|\n/)
          .map((d) => d.trim())
          .filter(Boolean);

        const meetingId = `page-meet-${now}-${Math.random().toString(36).slice(2, 6)}`;
        const baseBlocks = finalizeBlocks([
          factory.h(1, meetingTitle),
          factory.lead(`Protokół spotkania · Uczestnicy: ${attendeesRaw}`),
          factory.h(2, 'Agenda spotkania'),
          ...factory.bullets(agendaRaw.split(/;|\n/).map((a) => a.trim()).filter(Boolean)),
          factory.h(2, 'Kluczowe ustalenia i decyzje'),
          ...(decisionsList.length > 0
            ? factory.bullets(decisionsList)
            : [factory.p('Zatwierdzono plan działań na bieżący sprint.')]),
          factory.h(2, 'Powiązane zadania (Linked Database)'),
          factory.linkedDatabase('tasks', 'table', `Zadania ze spotkania: ${meetingTitle}`, 'auto'),
        ]);

        const baseMeetingPage: WorkspacePage = {
          id: meetingId,
          pageType: 'Meeting',
          ownerId: context.actor?.uid || 'local-user',
          workspaceId: 'ws-personal',
          title: meetingTitle,
          icon: '🤝',
          blocks: baseBlocks,
          permissions: { accessLevel: 'workspace', role: 'Owner' },
          sharedWith: [],
          sharedCollaborators: [],
          isFavorite: false,
          isDeleted: false,
          isPublic: false,
          tags: ['Spotkanie'],
          comments: [],
          versions: [],
          createdAt: now,
          updatedAt: now,
        };

        const conversion = convertMeetingDecisionsToTasks({
          meetingPage: baseMeetingPage,
          decisionsAndActions: decisionsList.map((d) => ({
            title: d,
            assignee: attendeesRaw.split(',')[0]?.trim() || 'Ty',
            priority: 'Wysoki',
          })),
          linkedProjectId: lastCreatedProjectPage?.id,
          linkedProjectTitle: lastCreatedProjectPage?.title,
          ownerId: context.actor?.uid || 'local-user',
        });

        workingPages.unshift(conversion.updatedMeetingPage);
        createdPages.push(conversion.updatedMeetingPage);
        createdTasks.push(...conversion.createdTasks);

        summaryLines.push(
          `🤝 Utworzono notatkę ze spotkania: "${meetingTitle}" oraz przekształcono ${conversion.createdTasks.length} decyzji w zadania.`
        );
        break;
      }

      case 'CHART': {
        // Jeśli body to "workspace" / "tasks" lub puste, budujemy wykres z realnych zadań w Workspace
        const bodyLower = cmd.rawBody.toLowerCase();
        const chartType: 'bar' | 'line' | 'pie' | 'donut' =
          cmd.param === 'line'
            ? 'line'
            : cmd.param === 'pie' || cmd.param === 'donut'
              ? 'donut'
              : 'bar';

        let chartBlock: DocBlock;
        if (
          !cmd.rawBody ||
          bodyLower === 'workspace' ||
          bodyLower === 'tasks' ||
          bodyLower === 'zadania' ||
          !cmd.rawBody.includes(':')
        ) {
          chartBlock = buildChartBlockFromWorkspaceState(
            { pages: workingPages, tasks: [...context.tasks, ...createdTasks] },
            cmd.rawBody && bodyLower !== 'workspace' && bodyLower !== 'tasks'
              ? cmd.rawBody
              : 'Wykres statusu zadań w Workspace',
            chartType
          );
        } else {
          const parsed = parseAiBlockTagsToBlocks(cmd.rawTag);
          chartBlock =
            parsed.blocks.find((b) => b.type === 'chart') ||
            buildChartBlockFromWorkspaceState(
              { pages: workingPages, tasks: [...context.tasks, ...createdTasks] },
              'Wykres analityczny',
              chartType
            );
        }

        createdBlocks.push(chartBlock);
        summaryLines.push(`📊 Wygenerowano interaktywny blok wykresu: "${chartBlock.content}"`);
        break;
      }

      case 'DATABASE': {
        const parts = cmd.rawBody.split('|').map((s) => s.trim());
        const rawKind = (cmd.param || parts[0] || 'tasks').toLowerCase();
        const entityKind: 'projects' | 'tasks' | 'meetings' =
          rawKind.includes('proj')
            ? 'projects'
            : rawKind.includes('meet') || rawKind.includes('spotk')
              ? 'meetings'
              : 'tasks';
        const viewModeRaw = (parts[1] || 'table').toLowerCase();
        const viewMode: 'table' | 'board' | 'calendar' | 'list' | 'gallery' =
          viewModeRaw === 'board' || viewModeRaw === 'kanban'
            ? 'board'
            : viewModeRaw === 'calendar'
              ? 'calendar'
              : viewModeRaw === 'list'
                ? 'list'
                : viewModeRaw === 'gallery'
                  ? 'gallery'
                  : 'table';
        const title = parts[0] || `Powiązana baza: ${entityKind}`;
        const linkedDbBlock = factory.linkedDatabase(entityKind, viewMode, title, 'auto');
        createdBlocks.push(linkedDbBlock);
        summaryLines.push(`🗃️ Wstawiono osadzony widok bazy danych (${entityKind} · ${viewMode})`);
        break;
      }

      case 'SHARE': {
        const parts = cmd.rawBody.split(/\s*\|\s*/).filter(Boolean);
        const targetEmail = cmd.param && cmd.param.includes('@') ? cmd.param : parts[0] || '';
        const rolePart =
          cmd.param && !cmd.param.includes('@') ? cmd.param : parts[1] || 'can_edit';
        const role: NotionAccessRole = normalizeAccessRole(rolePart);
        const specificPageQuery = parts[2]?.trim();

        // Jeśli komenda podaje konkretną notatkę/projekt (np. "Koty i Psy"), wyszukaj ją
        let targetPage: WorkspacePage | undefined = undefined;
        if (specificPageQuery) {
          const qLower = specificPageQuery.toLowerCase();
          targetPage = workingPages.find(
            (p) => p.title.toLowerCase().includes(qLower) || qLower.includes(p.title.toLowerCase())
          );
        }
        if (!targetPage) {
          targetPage = createdPages[0] || context.activePage || workingPages[0];
        }

        if (!targetPage) {
          errors.push('Brak aktywnej strony do udostępnienia.');
          break;
        }

        try {
          const res = applyShareToWorkspacePages({
            pages: workingPages,
            targetPageId: targetPage.id,
            targetEmail,
            role,
            actor: context.actor,
          });
          workingPages = res.updatedPages;
          for (const pid of res.affectedPageIds) {
            const p = workingPages.find((wp) => wp.id === pid);
            if (p) updatedPagesMap.set(pid, p);
          }
          summaryLines.push(
            res.isWorkspaceWide
              ? `🌐 Aktywowano dyrektywę ${res.normalizedEmail.toUpperCase()} — udostępniono ${res.affectedPageIds.length} stron w Workspace (rola: ${res.appliedRole}).`
              : `👥 Udostępniono stronę "${targetPage.title}" użytkownikowi ${res.normalizedEmail} (rola: ${res.appliedRole}).`
          );
        } catch (err: any) {
          errors.push(err?.message || 'Błąd udostępniania strony');
        }
        break;
      }

      case 'PING': {
        const targetPage =
          createdPages[0] || context.activePage || workingPages[0];
        if (!targetPage) {
          errors.push('Brak strony dla wzmianki @ping.');
          break;
        }

        const parts = cmd.rawBody.split('|').map((s) => s.trim());
        const targetEmail =
          cmd.param && cmd.param.includes('@') ? cmd.param : parts[0] || '';
        const message =
          cmd.param && cmd.param.includes('@')
            ? cmd.rawBody
            : parts.slice(1).join(' | ') || 'Wspomniano Cię w dokumencie';

        const pingRes = createPingNotification({
          page: targetPage,
          targetEmail,
          message,
          senderName: context.actor?.displayName || context.actor?.email || 'Właściciel',
          allPages: workingPages,
        });

        if (pingRes.allowed && pingRes.notification) {
          notifications.push(pingRes.notification);
          summaryLines.push(`🔔 Wysłano powiadomienie (@ping) do ${targetEmail} w "${targetPage.title}".`);
        } else if (pingRes.reason) {
          errors.push(pingRes.reason);
        }
        break;
      }

      case 'UPDATE_TASK': {
        const parts = cmd.rawBody.split(/\s*\|\s*/);
        const taskQuery = (parts[0] || '').trim().toLowerCase();
        const targetStatus = (parts[1] || cmd.param || 'Zrobione') as TaskStatus;

        const foundTask = [...context.tasks, ...createdTasks].find((t) =>
          t.title.toLowerCase().includes(taskQuery) || taskQuery.includes(t.title.toLowerCase())
        );

        if (foundTask) {
          foundTask.status = targetStatus;
          foundTask.isCompleted = targetStatus === 'Zrobione';
          foundTask.updatedAt = now;
          updatedTasks.push(foundTask);
          summaryLines.push(`🔄 Zaktualizowano status zadania "${foundTask.title}" → ${targetStatus}`);
        } else {
          errors.push(`Nie znaleziono zadania pasującego do: "${parts[0]}"`);
        }
        break;
      }

      case 'AUTO_SCHEDULE': {
        // Autonomiczne planowanie: wykrywa zadania z przeszłą datą lub bez terminu i optymalizuje harmonogram
        const allPendingTasks = [...context.tasks, ...createdTasks].filter((t) => t.status !== 'Zrobione');
        const todayIso = new Date().toISOString().split('T')[0];
        let rebalancedCount = 0;

        allPendingTasks.forEach((t, idx) => {
          if (!t.dueDate || t.dueDate < todayIso) {
            const nextDue = new Date(now + 86400000 * (1 + (idx % 5))).toISOString().split('T')[0];
            t.dueDate = nextDue;
            t.updatedAt = now;
            updatedTasks.push(t);
            rebalancedCount++;
          }
        });

        summaryLines.push(`⚡ Autonomiczny harmonogram: zoptymalizowano terminy ${rebalancedCount} zadań.`);
        insights.push(`Przeprowadzono automatyczne poziomowanie obciążenia — zlikwidowano opóźnienia.`);
        break;
      }

      case 'AUDIT_WORKSPACE': {
        // Autonomiczna analiza całego workspace
        const totalPages = workingPages.length;
        const totalTasks = [...context.tasks, ...createdTasks].length;
        const doneTasks = [...context.tasks, ...createdTasks].filter((t) => t.status === 'Zrobione').length;
        const projects = workingPages.filter((p) => p.pageType === 'Project');
        const sharedPagesCount = workingPages.filter((p) => (p.sharedWith && p.sharedWith.length > 0) || (p.sharedCollaborators && p.sharedCollaborators.length > 0)).length;

        const healthScore = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 100;
        summaryLines.push(
          `🛡️ Audyt Workspace (Health Score: ${healthScore}%): ${totalPages} stron, ${projects.length} projektów, ${totalTasks} zadań (${doneTasks} ukończonych), ${sharedPagesCount} współdzielonych.`
        );
        insights.push(`Projektów w toku: ${projects.length}. Współdzielenie zespołu: ${sharedPagesCount} stron.`);
        break;
      }

      default:
        break;
    }
  }

  // Dodatkowe sprawdzenie jawnych dyrektyw udostępniania (_user@gmail.com / ALL_USER@GMAIAL.COM) poza tagami #SHARE#
  const looseShares = extractExplicitShareDirectives(rawInput).filter(
    (d) => d.sourceSyntax !== 'share_tag'
  );
  for (const shareDir of looseShares) {
    const targetPage = createdPages[0] || context.activePage || workingPages[0];
    if (!targetPage) continue;
    try {
      executedCommandsCount += 1;
      const res = applyShareToWorkspacePages({
        pages: workingPages,
        targetPageId: targetPage.id,
        targetEmail: shareDir.targetEmail,
        role: shareDir.role,
        actor: context.actor,
      });
      workingPages = res.updatedPages;
      for (const pid of res.affectedPageIds) {
        const p = workingPages.find((wp) => wp.id === pid);
        if (p) updatedPagesMap.set(pid, p);
      }
      summaryLines.push(
        res.isWorkspaceWide
          ? `🌐 Dyrektywa ${res.normalizedEmail.toUpperCase()}: nadano dostęp do ${res.affectedPageIds.length} stron w Workspace.`
          : `👥 Udostępniono stronę "${targetPage.title}" dla ${res.normalizedEmail} (${res.appliedRole}).`
      );
    } catch (err: any) {
      errors.push(err?.message || 'Błąd wykonania dyrektywy udostępniania');
    }
  }

  // Dodatkowe sprawdzenie @ping poza tagami #PING#
  const loosePings = extractPingDirectives(rawInput).filter(
    (p) => !p.rawMatch.toUpperCase().startsWith('#PING')
  );
  for (const pingDir of loosePings) {
    const targetPage = createdPages[0] || context.activePage || workingPages[0];
    if (!targetPage) continue;
    executedCommandsCount += 1;
    const pingRes = createPingNotification({
      page: targetPage,
      targetEmail: pingDir.targetEmail,
      message: pingDir.message,
      senderName: context.actor?.displayName || context.actor?.email || 'Właściciel',
      allPages: workingPages,
    });
    if (pingRes.allowed && pingRes.notification) {
      notifications.push(pingRes.notification);
      summaryLines.push(`🔔 Wysłano ping do ${pingDir.targetEmail} w "${targetPage.title}".`);
    } else if (pingRes.reason) {
      errors.push(pingRes.reason);
    }
  }

  return {
    executedCommandsCount,
    createdPages,
    updatedPages: Array.from(updatedPagesMap.values()),
    createdTasks,
    updatedTasks,
    createdBlocks,
    notifications,
    errors,
    summaryLines,
    insights,
  };
}
