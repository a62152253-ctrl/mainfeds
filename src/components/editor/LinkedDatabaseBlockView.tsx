import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  Columns3,
  Calendar as CalendarIcon,
  List as ListIcon,
  LayoutGrid,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Circle,
  Database,
} from 'lucide-react';
import {
  DocBlock,
  LinkedDatabaseBlockData,
  Priority,
  TaskStatus,
} from '../../types/workspace';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  DatabaseEntityKind,
  DatabaseViewMode,
  UnifiedDatabaseRecord,
  PROJECT_STATUSES,
  TASK_STATUSES,
  MEETING_STATUSES,
  buildProjectRecords,
  buildTaskRecords,
  buildMeetingRecords,
  filterAndSortDatabaseRecords,
} from '../../features/database/viewConfigService';

interface LinkedDatabaseBlockViewProps {
  block: DocBlock;
  currentPageId?: string;
  currentPageTitle?: string;
  onUpdate: (patch: Partial<DocBlock>) => void;
  isPreview?: boolean;
}

export const LinkedDatabaseBlockView: React.FC<LinkedDatabaseBlockViewProps> = ({
  block,
  currentPageId,
  currentPageTitle,
  onUpdate,
  isPreview = false,
}) => {
  const {
    pages,
    tasks,
    addTask,
    updateTask,
    createPage,
    updatePageMetadata,
    openTaskAsPage,
    setActivePageId,
    setActiveView,
    currentWorkspace,
  } = useWorkspace();

  const data: LinkedDatabaseBlockData = block.linkedDatabaseData || {
    entityKind: 'tasks',
    viewMode: 'table',
    title: block.content || 'Powiązana baza zadań',
    searchQuery: '',
    statusFilter: 'all',
    priorityFilter: 'all',
    projectFilter: currentPageId ? 'auto' : 'all',
    limit: 20,
  };

  const [newRowTitle, setNewRowTitle] = useState('');

  const updateLinkedConfig = (patch: Partial<LinkedDatabaseBlockData>) => {
    const next: LinkedDatabaseBlockData = {
      ...data,
      ...patch,
    };
    onUpdate({
      content: next.title || block.content,
      linkedDatabaseData: next,
    });
  };

  const allProjects = useMemo(() => buildProjectRecords(pages, tasks), [pages, tasks]);
  const allTasks = useMemo(() => buildTaskRecords(tasks, pages), [tasks, pages]);
  const allMeetings = useMemo(() => buildMeetingRecords(pages, tasks), [pages, tasks]);

  const rawRecords = useMemo(() => {
    if (data.entityKind === 'projects') return allProjects;
    if (data.entityKind === 'meetings') return allMeetings;
    return allTasks;
  }, [data.entityKind, allProjects, allTasks, allMeetings]);

  const effectiveProjectFilter =
    data.projectFilter === 'auto' && currentPageId ? currentPageId : data.projectFilter || 'all';

  const filteredRecords = useMemo(() => {
    return filterAndSortDatabaseRecords(rawRecords, {
      id: `linked-${block.id}`,
      name: data.title || 'Linked View',
      entityKind: data.entityKind,
      viewMode: data.viewMode,
      searchQuery: data.searchQuery || '',
      statusFilter: data.statusFilter || 'all',
      priorityFilter: data.priorityFilter || 'all',
      ownerFilter: 'all',
      projectFilter: effectiveProjectFilter,
      sortField: 'dueDate',
      sortDir: 'asc',
      groupBy: 'none',
      visibleColumns: ['title', 'status', 'priority', 'owner', 'dueDate'],
    }).slice(0, data.limit || 25);
  }, [
    rawRecords,
    block.id,
    data.title,
    data.entityKind,
    data.viewMode,
    data.searchQuery,
    data.statusFilter,
    data.priorityFilter,
    effectiveProjectFilter,
    data.limit,
  ]);

  const statusList: string[] = useMemo(() => {
    if (data.entityKind === 'projects') return PROJECT_STATUSES;
    if (data.entityKind === 'meetings') return MEETING_STATUSES;
    return TASK_STATUSES;
  }, [data.entityKind]);

  const handleOpenRecord = async (rec: UnifiedDatabaseRecord) => {
    if (rec.kind === 'tasks') {
      await openTaskAsPage(rec.id);
    } else {
      setActivePageId(rec.id);
      setActiveView('doc');
    }
  };

  const handleUpdateRecordStatus = async (rec: UnifiedDatabaseRecord, nextStatus: string) => {
    if (rec.kind === 'tasks') {
      await updateTask(rec.id, {
        status: nextStatus as TaskStatus,
        isCompleted: nextStatus === 'Zrobione',
      });
    } else {
      await updatePageMetadata(rec.id, { status: nextStatus });
    }
  };

  const handleCreateRecordInView = async (defaultStatus?: string) => {
    const titleToUse =
      newRowTitle.trim() ||
      (data.entityKind === 'projects'
        ? 'Nowy projekt'
        : data.entityKind === 'meetings'
          ? 'Nowe spotkanie'
          : 'Nowe zadanie');

    const todayIso = new Date().toISOString().split('T')[0];
    const linkedProjId =
      effectiveProjectFilter && effectiveProjectFilter !== 'all'
        ? effectiveProjectFilter
        : currentPageId;
    const linkedProjTitle =
      allProjects.find((p) => p.id === linkedProjId)?.title || currentPageTitle || '';

    if (data.entityKind === 'tasks') {
      const status = (defaultStatus as TaskStatus) || 'Do zrobienia';
      await addTask({
        title: titleToUse,
        status,
        priority: 'Wysoki',
        dueDate: todayIso,
        tag: linkedProjTitle ? linkedProjTitle.slice(0, 16) : 'Zadanie',
        assignee: currentWorkspace?.members?.[0]?.name || 'Ty',
        isCompleted: status === 'Zrobione',
        pageId: linkedProjId,
        relationPageId: linkedProjId,
        relationPageTitle: linkedProjTitle || undefined,
      });
      setNewRowTitle('');
      return;
    }

    if (data.entityKind === 'meetings') {
      const status = defaultStatus || 'Zaplanowane';
      const newId = await createPage(
        undefined,
        titleToUse,
        [
          { id: `b-m-${Date.now()}-1`, type: 'h2', content: 'Agenda spotkania' },
          { id: `b-m-${Date.now()}-2`, type: 'bullet', content: 'Omówienie postępów i priorytetów' },
          { id: `b-m-${Date.now()}-3`, type: 'h2', content: 'Decyzje i ustalenia' },
          { id: `b-m-${Date.now()}-4`, type: 'p', content: 'Notatki ze spotkania...' },
        ],
        'Meeting',
        '🤝'
      );
      if (newId) {
        await updatePageMetadata(newId, {
          status,
          priority: 'Średni',
          date: todayIso,
          meetingDate: todayIso,
          startTime: '10:00',
          endTime: '11:00',
          organizer: currentWorkspace?.members?.[0]?.name || 'Organizator',
          projectId: linkedProjId || '',
          projectTitle: linkedProjTitle || '',
        });
      }
      setNewRowTitle('');
      return;
    }

    // Projects
    const status = defaultStatus || 'W trakcie';
    const newProjId = await createPage(
      undefined,
      titleToUse,
      [
        { id: `b-p-${Date.now()}-1`, type: 'lead', content: 'Cel projektu, zakres i powiązane zadania.' },
        {
          id: `b-p-${Date.now()}-2`,
          type: 'linked_database',
          content: 'Zadania projektu',
          linkedDatabaseData: {
            entityKind: 'tasks',
            viewMode: 'board',
            title: 'Zadania projektu',
            projectFilter: 'auto',
          },
        },
      ],
      'Project',
      '🚀'
    );
    if (newProjId) {
      await updatePageMetadata(newProjId, {
        status,
        priority: 'Wysoki',
        owner: currentWorkspace?.members?.[0]?.name || 'Właściciel',
        startDate: todayIso,
        targetDate: todayIso,
      });
    }
    setNewRowTitle('');
  };

  return (
    <div
      className="my-3 rounded-[6px] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] bg-white dark:bg-[#191919] overflow-hidden select-none shadow-2xs"
      data-testid="linked-database-block"
    >
      {/* Top Notion Linked Database Toolbar */}
      <div className="px-3 py-2 bg-[#fbfbfa] dark:bg-[#202020] border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database size={13} className="text-[#787774]" />
          <input
            type="text"
            disabled={isPreview}
            value={data.title || block.content || 'Widok bazy danych'}
            onChange={(e) => updateLinkedConfig({ title: e.target.value })}
            className="text-xs font-bold text-[#37352f] dark:text-white bg-transparent border-none focus:outline-none min-w-[140px]"
            placeholder="Tytuł widoku bazy..."
          />

          {/* Source Database Selector */}
          {!isPreview && (
            <select
              value={data.entityKind}
              onChange={(e) =>
                updateLinkedConfig({ entityKind: e.target.value as DatabaseEntityKind })
              }
              className="text-[11px] px-2 py-0.5 rounded-[4px] bg-white dark:bg-[#252525] border border-[rgba(55,53,47,0.12)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer focus:outline-none"
              title="Źródło danych"
            >
              <option value="tasks">☑️ Tasks ({allTasks.length})</option>
              <option value="projects">🚀 Projects ({allProjects.length})</option>
              <option value="meetings">🤝 Meetings ({allMeetings.length})</option>
            </select>
          )}

          {/* Scope Filter (Auto Current Page vs All Workspace) */}
          {!isPreview && currentPageId && data.entityKind !== 'projects' && (
            <button
              type="button"
              onClick={() =>
                updateLinkedConfig({
                  projectFilter: data.projectFilter === 'auto' ? 'all' : 'auto',
                })
              }
              className={`text-[10px] px-2 py-0.5 rounded-[4px] font-medium cursor-pointer border transition-colors ${
                data.projectFilter === 'auto'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#2383e2] border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-[#252525] text-[#787774] border-[rgba(55,53,47,0.12)]'
              }`}
              title="Filtruj tylko rekordy powiązane z tą stroną lub pokaż wszystkie"
            >
              {data.projectFilter === 'auto' ? '🔗 Tylko ta strona' : '🌐 Cały Workspace'}
            </button>
          )}
        </div>

        {/* View Mode Tabs + Search + Open Full Database */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5 bg-white dark:bg-[#191919] p-0.5 rounded-[4px] border border-[rgba(55,53,47,0.09)]">
            {(
              [
                { id: 'table', label: 'Table', icon: <TableIcon size={11} /> },
                { id: 'board', label: 'Board', icon: <Columns3 size={11} /> },
                { id: 'list', label: 'List', icon: <ListIcon size={11} /> },
                { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={11} /> },
                { id: 'gallery', label: 'Gallery', icon: <LayoutGrid size={11} /> },
              ] as const
            ).map((vm) => (
              <button
                key={vm.id}
                type="button"
                onClick={() => updateLinkedConfig({ viewMode: vm.id as DatabaseViewMode })}
                className={`px-2 py-0.5 rounded-[3px] text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  data.viewMode === vm.id
                    ? 'bg-[#37352f] text-white dark:bg-white dark:text-[#191919]'
                    : 'text-[#787774] hover:text-[#37352f] dark:hover:text-white'
                }`}
              >
                {vm.icon}
                <span>{vm.label}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#787774]" />
            <input
              type="text"
              value={data.searchQuery || ''}
              onChange={(e) => updateLinkedConfig({ searchQuery: e.target.value })}
              placeholder="Filtruj..."
              className="pl-6 pr-2 py-0.5 text-[11px] bg-white dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] rounded-[4px] w-28 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setActiveView(data.entityKind)}
            className="text-[10px] px-2 py-0.5 rounded-[4px] text-[#787774] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] flex items-center gap-1 cursor-pointer"
            title="Otwórz pełną bazę danych"
          >
            <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: TABLE                                                         */}
      {/* ===================================================================== */}
      {data.viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[rgba(55,53,47,0.09)] text-[10px] text-[#787774] uppercase tracking-wider bg-[#fbfbfa]/60 dark:bg-[#202020]/60">
                <th className="py-1.5 px-3 font-semibold">Nazwa</th>
                <th className="py-1.5 px-3 font-semibold">Status</th>
                <th className="py-1.5 px-3 font-semibold">Priorytet</th>
                <th className="py-1.5 px-3 font-semibold">Osoba</th>
                <th className="py-1.5 px-3 font-semibold text-right">Termin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(55,53,47,0.06)]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-[#787774]">
                    Brak powiązanych rekordów w tym widoku. Dodaj pierwszy poniżej.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-[#fbfbfa] dark:hover:bg-[#202020] transition-colors group"
                  >
                    <td className="py-1.5 px-3 font-medium">
                      <button
                        type="button"
                        onClick={() => handleOpenRecord(rec)}
                        className="flex items-center gap-1.5 text-left hover:text-[#2383e2] cursor-pointer"
                      >
                        <span>{rec.icon}</span>
                        <span className={rec.isCompleted ? 'line-through text-[#9b9a97]' : ''}>
                          {rec.title}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-[#787774] px-1.5 py-0.2 rounded bg-[rgba(55,53,47,0.06)]">
                          OTWÓRZ
                        </span>
                      </button>
                    </td>
                    <td className="py-1.5 px-3">
                      <select
                        value={rec.status}
                        onChange={(e) => handleUpdateRecordStatus(rec, e.target.value)}
                        className="text-[11px] bg-[#f1f1ef] dark:bg-[#252525] px-2 py-0.5 rounded-[4px] border-none focus:outline-none cursor-pointer"
                      >
                        {statusList.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-3 text-[11px]">{rec.priority}</td>
                    <td className="py-1.5 px-3 text-[11px] text-[#787774]">{rec.owner}</td>
                    <td className="py-1.5 px-3 text-[11px] font-mono text-right text-[#787774]">
                      {rec.dueDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: BOARD / KANBAN                                                */}
      {/* ===================================================================== */}
      {data.viewMode === 'board' && (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#fbfbfa]/40 dark:bg-[#191919]">
          {statusList.map((statusCol) => {
            const colItems = filteredRecords.filter((r) => r.status === statusCol);
            return (
              <div
                key={statusCol}
                className="p-2 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.08)] space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#37352f] dark:text-white px-1">
                  <span>{statusCol}</span>
                  <span className="font-mono text-[10px] text-[#787774]">{colItems.length}</span>
                </div>
                <div className="space-y-1.5">
                  {colItems.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => handleOpenRecord(rec)}
                      className="p-2 rounded-[5px] bg-white dark:bg-[#191919] border border-[rgba(55,53,47,0.1)] hover:border-[#2383e2] cursor-pointer shadow-2xs space-y-1 transition-all"
                    >
                      <div className="text-xs font-medium text-[#37352f] dark:text-white flex items-center gap-1.5">
                        <span>{rec.icon}</span>
                        <span className="truncate">{rec.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#787774]">
                        <span>{rec.priority}</span>
                        <span className="font-mono">{rec.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: LIST / CALENDAR / GALLERY                                     */}
      {/* ===================================================================== */}
      {(data.viewMode === 'list' ||
        data.viewMode === 'calendar' ||
        data.viewMode === 'gallery') && (
        <div
          className={
            data.viewMode === 'gallery'
              ? 'p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5'
              : 'divide-y divide-[rgba(55,53,47,0.06)] p-2'
          }
        >
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              onClick={() => handleOpenRecord(rec)}
              className="p-2 rounded-[5px] hover:bg-[#fbfbfa] dark:hover:bg-[#202020] flex items-center justify-between gap-2 cursor-pointer transition-colors border border-transparent hover:border-[rgba(55,53,47,0.08)]"
            >
              <div className="flex items-center gap-2 min-w-0">
                {rec.kind === 'tasks' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateRecordStatus(
                        rec,
                        rec.isCompleted ? 'Do zrobienia' : 'Zrobione'
                      );
                    }}
                    className="text-[#787774] hover:text-emerald-600 cursor-pointer"
                  >
                    {rec.isCompleted ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <Circle size={14} />
                    )}
                  </button>
                ) : (
                  <span>{rec.icon}</span>
                )}
                <span
                  className={`text-xs font-medium truncate ${
                    rec.isCompleted ? 'line-through text-[#9b9a97]' : ''
                  }`}
                >
                  {rec.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#787774] shrink-0">
                <span className="px-1.5 py-0.5 rounded bg-[#f1f1ef] dark:bg-[#252525]">
                  {rec.status}
                </span>
                <span className="font-mono">{rec.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Inline Record Creator Row at Bottom of Linked Database */}
      {!isPreview && (
        <div className="px-3 py-1.5 border-t border-[rgba(55,53,47,0.08)] bg-[#fbfbfa]/50 dark:bg-[#202020]/50 flex items-center gap-2">
          <Plus size={12} className="text-[#787774]" />
          <input
            type="text"
            value={newRowTitle}
            onChange={(e) => setNewRowTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newRowTitle.trim()) {
                e.preventDefault();
                handleCreateRecordInView();
              }
            }}
            placeholder={`+ Nowy rekord w ${
              data.entityKind === 'projects'
                ? 'Projects'
                : data.entityKind === 'meetings'
                  ? 'Meetings'
                  : 'Tasks'
            }...`}
            className="flex-1 text-xs bg-transparent border-none focus:outline-none text-[#37352f] dark:text-white placeholder-[#9b9a97]"
          />
          {newRowTitle.trim() && (
            <button
              type="button"
              onClick={() => handleCreateRecordInView()}
              className="px-2 py-0.5 bg-[#2383e2] text-white rounded text-[10px] font-semibold cursor-pointer"
            >
              Dodaj
            </button>
          )}
        </div>
      )}
    </div>
  );
};
