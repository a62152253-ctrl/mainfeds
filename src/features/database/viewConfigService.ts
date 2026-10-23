import { Priority, TaskItem, TaskStatus, WorkspacePage } from '../../types/workspace';
import { calculateProjectProgress } from '../ai/universalCommandSystem';

export type DatabaseEntityKind = 'projects' | 'tasks' | 'meetings';
export type DatabaseViewMode = 'table' | 'board' | 'calendar' | 'list' | 'gallery';

export type ProjectStatus = 'Planowanie' | 'W trakcie' | 'Wstrzymany' | 'Ukończony';
export type MeetingStatus = 'Zaplanowane' | 'W trakcie' | 'Zakończone';

export interface UnifiedDatabaseRecord {
  id: string;
  kind: DatabaseEntityKind;
  icon: string;
  title: string;
  description: string;
  status: string;
  priority: Priority;
  owner: string;
  assignee: string;
  members: string[];
  startDate: string;
  dueDate: string; // Target Date for Projects, Due Date for Tasks, Meeting Date for Meetings
  date: string; // Alias for dueDate used in Meetings / Calendar
  startTime?: string;
  endTime?: string;
  tag: string;
  progressPercent: number;
  estimatedHours?: number;
  isCompleted: boolean;
  relationProjectId?: string;
  relationProjectTitle?: string;
  relatedProjectTitle?: string; // Alias for relationProjectTitle
  relatedTaskIds: string[];
  relatedMeetingIds: string[];
  relatedTasksCount: number;
  completedTasksCount: number;
  relatedMeetingsCount: number;
  agenda?: string;
  decisions?: string;
  rawTask?: TaskItem;
  rawPage?: WorkspacePage;
  updatedAt: number;
}

export interface DatabaseViewConfig {
  id: string;
  name: string;
  entityKind: DatabaseEntityKind;
  viewMode: DatabaseViewMode;
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  ownerFilter: string;
  projectFilter: string;
  sortField: 'title' | 'dueDate' | 'priority' | 'status' | 'progressPercent' | 'updatedAt';
  sortDir: 'asc' | 'desc';
  groupBy: 'none' | 'status' | 'priority' | 'owner' | 'project';
  visibleColumns: string[];
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  Krytyczny: 4,
  Wysoki: 3,
  Średni: 2,
  Niski: 1,
};

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Planowanie',
  'W trakcie',
  'Wstrzymany',
  'Ukończony',
];

export const TASK_STATUSES: TaskStatus[] = ['Do zrobienia', 'W trakcie', 'Zrobione'];

export const MEETING_STATUSES: MeetingStatus[] = ['Zaplanowane', 'W trakcie', 'Zakończone'];

export function getDefaultViewConfig(
  entityKind: DatabaseEntityKind,
  viewMode: DatabaseViewMode = 'table'
): DatabaseViewConfig {
  return {
    id: `view-${entityKind}-default`,
    name: 'Widok domyślny',
    entityKind,
    viewMode,
    searchQuery: '',
    statusFilter: 'all',
    priorityFilter: 'all',
    ownerFilter: 'all',
    projectFilter: 'all',
    sortField: 'dueDate',
    sortDir: 'asc',
    groupBy: 'none',
    visibleColumns: ['title', 'status', 'priority', 'owner', 'dueDate', 'progress', 'relations'],
  };
}

/**
 * Zapisuje i odczytuje konfigurację widoków bazy danych w localStorage (zachowanie stanu po odświeżeniu).
 */
export function loadDatabaseViewConfig(entityKind: DatabaseEntityKind): DatabaseViewConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`sp_db_view_config_${entityKind}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...getDefaultViewConfig(entityKind), ...parsed, entityKind };
      }
    }
  } catch {
    // ignore
  }
  return getDefaultViewConfig(entityKind, entityKind === 'tasks' ? 'board' : 'table');
}

export function saveDatabaseViewConfig(config: DatabaseViewConfig): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`sp_db_view_config_${config.entityKind}`, JSON.stringify(config));
    }
  } catch {
    // ignore
  }
}

export function loadSavedDatabaseViews(entityKind: DatabaseEntityKind): DatabaseViewConfig[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`sp_db_saved_views_${entityKind}`);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveNamedDatabaseView(config: DatabaseViewConfig): DatabaseViewConfig[] {
  const existing = loadSavedDatabaseViews(config.entityKind).filter((v) => v.id !== config.id);
  const next = [...existing, config];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`sp_db_saved_views_${config.entityKind}`, JSON.stringify(next));
    }
  } catch {
    // ignore
  }
  return next;
}

/**
 * Buduje zunifikowane rekordy projektów (`Projects`) na podstawie rzeczywistych stron `pageType === 'Project'`
 * oraz powiązanych z nimi zadań (`TaskItem[]`) i spotkań (`pageType === 'Meeting'`).
 */
export function buildProjectRecords(
  pages: WorkspacePage[],
  tasks: TaskItem[]
): UnifiedDatabaseRecord[] {
  const activePages = pages.filter((p) => !p.isDeleted);
  const projectPages = activePages.filter((p) => p.pageType === 'Project');
  const meetingPages = activePages.filter((p) => p.pageType === 'Meeting');

  return projectPages.map((p) => {
    const meta = p.metadata || {};
    const prog = calculateProjectProgress(p.id, tasks, p.title);
    const relatedMeetings = meetingPages.filter(
      (m) =>
        m.metadata?.projectId === p.id ||
        m.metadata?.relatedProjectId === p.id ||
        m.parentPageId === p.id ||
        (m.metadata?.projectTitle &&
          String(m.metadata.projectTitle).toLowerCase() === p.title.toLowerCase())
    );

    const rawStatus = meta.status || (prog.progressPercent === 100 && prog.totalTasks > 0 ? 'Ukończony' : 'W trakcie');
    const status: ProjectStatus = PROJECT_STATUSES.includes(rawStatus as ProjectStatus)
      ? (rawStatus as ProjectStatus)
      : 'W trakcie';

    const priority: Priority = ['Krytyczny', 'Wysoki', 'Średni', 'Niski'].includes(meta.priority)
      ? meta.priority
      : 'Wysoki';

    const leadBlock = p.blocks.find((b) => b.type === 'lead' || b.type === 'p');
    const description =
      meta.goal ||
      meta.description ||
      leadBlock?.content ||
      'Projekt w przestrzeni roboczej SearchPoint';

    const todayIso = new Date(p.createdAt || Date.now()).toISOString().split('T')[0];
    const defaultTarget = new Date((p.createdAt || Date.now()) + 14 * 86400000)
      .toISOString()
      .split('T')[0];

    const dueDateStr = meta.deadline || meta.targetDate || meta.dueDate || defaultTarget;

    return {
      id: p.id,
      kind: 'projects',
      icon: p.icon || '🚀',
      title: p.title || 'Bez nazwy projektu',
      description,
      status,
      priority,
      owner: meta.owner || p.authorName || 'Właściciel',
      assignee: meta.owner || p.authorName || 'Właściciel',
      members: Array.isArray(meta.members)
        ? meta.members
        : p.sharedWith && p.sharedWith.length > 0
          ? p.sharedWith
          : [meta.owner || p.authorName || 'Właściciel'],
      startDate: meta.startDate || todayIso,
      dueDate: dueDateStr,
      date: dueDateStr,
      tag: p.tags?.[0] || 'Projekt',
      progressPercent: prog.progressPercent,
      isCompleted: status === 'Ukończony',
      relatedTaskIds: prog.linkedTasks.map((lt) => lt.id),
      relatedMeetingIds: relatedMeetings.map((rm) => rm.id),
      relatedTasksCount: prog.totalTasks,
      completedTasksCount: prog.completedTasks,
      relatedMeetingsCount: relatedMeetings.length,
      rawPage: p,
      updatedAt: p.updatedAt || Date.now(),
    };
  });
}

/**
 * Buduje zunifikowane rekordy zadań (`Tasks`) z rzeczywistej tablicy `TaskItem[]`.
 */
export function buildTaskRecords(
  tasks: TaskItem[],
  pages: WorkspacePage[]
): UnifiedDatabaseRecord[] {
  const activePages = pages.filter((p) => !p.isDeleted);

  return tasks.map((t) => {
    const linkedPage = activePages.find(
      (p) => p.id === t.relationPageId || p.id === t.pageId
    );
    const isDone = t.status === 'Zrobione' || Boolean(t.isCompleted);

    const dueDateStr = t.dueDate || new Date().toISOString().split('T')[0];
    const relProjTitle = t.relationPageTitle || linkedPage?.title;

    return {
      id: t.id,
      kind: 'tasks',
      icon: isDone ? '✅' : '☑️',
      title: t.title || 'Nowe zadanie',
      description: t.description || '',
      status: t.status || 'Do zrobienia',
      priority: t.priority || 'Średni',
      owner: t.assignee || 'Ty',
      assignee: t.assignee || 'Ty',
      members: t.assignee ? [t.assignee] : ['Ty'],
      startDate: new Date(t.createdAt || Date.now()).toISOString().split('T')[0],
      dueDate: dueDateStr,
      date: dueDateStr,
      tag: t.tag || 'Zadanie',
      progressPercent: isDone ? 100 : t.status === 'W trakcie' ? 50 : 0,
      estimatedHours: t.estimatedHours || 2,
      isCompleted: isDone,
      relationProjectId: t.relationPageId || t.pageId || linkedPage?.id,
      relationProjectTitle: relProjTitle,
      relatedProjectTitle: relProjTitle,
      relatedTaskIds: [],
      relatedMeetingIds: [],
      relatedTasksCount: 0,
      completedTasksCount: isDone ? 1 : 0,
      relatedMeetingsCount: 0,
      rawTask: t,
      updatedAt: t.updatedAt || Date.now(),
    };
  });
}

/**
 * Buduje zunifikowane rekordy spotkań (`Meetings`) z rzeczywistych stron `pageType === 'Meeting'`.
 */
export function buildMeetingRecords(
  pages: WorkspacePage[],
  tasks: TaskItem[]
): UnifiedDatabaseRecord[] {
  const activePages = pages.filter((p) => !p.isDeleted);
  const meetingPages = activePages.filter((p) => p.pageType === 'Meeting');

  return meetingPages.map((m) => {
    const meta = m.metadata || {};
    const linkedTasks = tasks.filter(
      (t) => t.pageId === m.id || t.relationPageId === m.id
    );
    const completedLinked = linkedTasks.filter(
      (t) => t.status === 'Zrobione' || t.isCompleted
    );

    const rawStatus = meta.status || 'Zaplanowane';
    const status: MeetingStatus = MEETING_STATUSES.includes(rawStatus as MeetingStatus)
      ? (rawStatus as MeetingStatus)
      : 'Zaplanowane';

    const priority: Priority = ['Krytyczny', 'Wysoki', 'Średni', 'Niski'].includes(meta.priority)
      ? meta.priority
      : 'Średni';

    const dateStr =
      meta.date ||
      meta.meetingDate ||
      new Date(m.createdAt || Date.now()).toISOString().split('T')[0];

    const attendees: string[] = Array.isArray(meta.attendees)
      ? meta.attendees
      : typeof meta.attendees === 'string'
        ? meta.attendees.split(',').map((s: string) => s.trim()).filter(Boolean)
        : m.sharedWith && m.sharedWith.length > 0
          ? m.sharedWith
          : [m.authorName || 'Zespół'];

    const linkedProject = activePages.find(
      (p) =>
        p.pageType === 'Project' &&
        (p.id === meta.projectId || p.id === meta.relatedProjectId || p.id === m.parentPageId)
    );
    const relProjTitle = meta.projectTitle || linkedProject?.title;

    return {
      id: m.id,
      kind: 'meetings',
      icon: m.icon || '📅',
      title: m.title || 'Spotkanie zespołu',
      description: meta.agenda || m.blocks.find((b) => b.type === 'lead' || b.type === 'p')?.content || '',
      status,
      priority,
      owner: meta.organizer || m.authorName || 'Organizator',
      assignee: attendees.join(', '),
      members: attendees,
      startDate: dateStr,
      dueDate: dateStr,
      date: dateStr,
      startTime: meta.startTime || '10:00',
      endTime: meta.endTime || '11:00',
      tag: m.tags?.[0] || 'Spotkanie',
      progressPercent:
        linkedTasks.length > 0
          ? Math.round((completedLinked.length / linkedTasks.length) * 100)
          : status === 'Zakończone'
            ? 100
            : 0,
      isCompleted: status === 'Zakończone',
      relationProjectId: meta.projectId || meta.relatedProjectId || linkedProject?.id,
      relationProjectTitle: relProjTitle,
      relatedProjectTitle: relProjTitle,
      relatedTaskIds: linkedTasks.map((lt) => lt.id),
      relatedMeetingIds: [],
      relatedTasksCount: linkedTasks.length,
      completedTasksCount: completedLinked.length,
      relatedMeetingsCount: 0,
      agenda: meta.agenda || 'Omówienie postępów i priorytetów',
      decisions: meta.decisions || '',
      rawPage: m,
      updatedAt: m.updatedAt || Date.now(),
    };
  });
}

/**
 * Filtruje i sortuje zunifikowane rekordy bazy danych według `DatabaseViewConfig`.
 * Wszystkie 5 widoków (Table, Board, Calendar, List, Gallery) korzysta z tej samej funkcji!
 */
export function filterAndSortDatabaseRecords(
  records: UnifiedDatabaseRecord[],
  config: DatabaseViewConfig
): UnifiedDatabaseRecord[] {
  const q = (config.searchQuery || '').trim().toLowerCase();

  return records
    .filter((r) => {
      if (config.statusFilter && config.statusFilter !== 'all' && r.status !== config.statusFilter) {
        return false;
      }
      if (config.priorityFilter && config.priorityFilter !== 'all' && r.priority !== config.priorityFilter) {
        return false;
      }
      if (config.ownerFilter && config.ownerFilter !== 'all') {
        const ownerMatch =
          r.owner.toLowerCase().includes(config.ownerFilter.toLowerCase()) ||
          r.assignee.toLowerCase().includes(config.ownerFilter.toLowerCase());
        if (!ownerMatch) return false;
      }
      if (config.projectFilter && config.projectFilter !== 'all') {
        if (r.relationProjectId !== config.projectFilter && r.id !== config.projectFilter) {
          return false;
        }
      }
      if (q) {
        const hay = `${r.title} ${r.description} ${r.owner} ${r.assignee} ${r.tag} ${r.relationProjectTitle || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (config.sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title, 'pl');
          break;
        case 'dueDate':
          cmp = (a.dueDate || '').localeCompare(b.dueDate || '');
          break;
        case 'priority':
          cmp = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status, 'pl');
          break;
        case 'progressPercent':
          cmp = a.progressPercent - b.progressPercent;
          break;
        case 'updatedAt':
        default:
          cmp = b.updatedAt - a.updatedAt;
          break;
      }
      return config.sortDir === 'asc' ? cmp : -cmp;
    });
}
