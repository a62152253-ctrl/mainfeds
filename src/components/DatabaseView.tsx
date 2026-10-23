import React, { useState, useEffect, useMemo } from 'react';
import {
  Table as TableIcon,
  Columns3,
  Calendar as CalendarIcon,
  List as ListIcon,
  LayoutGrid,
  Plus,
  ArrowUpDown,
  Trash2,
  Search,
  CheckCircle2,
  Circle,
  Download,
  CheckSquare,
  Square,
  ExternalLink,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  FolderKanban,
  FileText,
  BookmarkPlus,
  Sparkles,
  Users,
} from 'lucide-react';
import { Priority, TaskStatus, DocBlock } from '../types/workspace';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  DatabaseEntityKind,
  DatabaseViewMode,
  DatabaseViewConfig,
  UnifiedDatabaseRecord,
  PROJECT_STATUSES,
  TASK_STATUSES,
  MEETING_STATUSES,
  loadDatabaseViewConfig,
  saveDatabaseViewConfig,
  loadSavedDatabaseViews,
  saveNamedDatabaseView,
  buildProjectRecords,
  buildTaskRecords,
  buildMeetingRecords,
  filterAndSortDatabaseRecords,
} from '../features/database/viewConfigService';

export type DatabaseViewType = DatabaseViewMode;

interface DatabaseViewProps {
  initialEntityKind?: DatabaseEntityKind;
  initialViewMode?: DatabaseViewMode;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  initialEntityKind = 'projects',
  initialViewMode,
}) => {
  const {
    tasks,
    updateTask,
    addTask,
    deleteTask,
    openTaskAsPage,
    pages,
    createPage,
    updatePageTitle,
    updatePageMetadata,
    deletePage,
    setActivePageId,
    setActiveView,
    currentWorkspace,
    addNotification,
  } = useWorkspace();

  const [entityKind, setEntityKind] = useState<DatabaseEntityKind>(initialEntityKind);
  const [config, setConfig] = useState<DatabaseViewConfig>(() => {
    const loaded = loadDatabaseViewConfig(initialEntityKind);
    return initialViewMode ? { ...loaded, viewMode: initialViewMode } : loaded;
  });

  const [savedViews, setSavedViews] = useState<DatabaseViewConfig[]>(() =>
    loadSavedDatabaseViews(initialEntityKind)
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  // Sync when prop `initialEntityKind` changes (e.g. clicking Projects vs Tasks vs Meetings in Sidebar)
  useEffect(() => {
    setEntityKind(initialEntityKind);
    const loaded = loadDatabaseViewConfig(initialEntityKind);
    setConfig(initialViewMode ? { ...loaded, viewMode: initialViewMode } : loaded);
    setSavedViews(loadSavedDatabaseViews(initialEntityKind));
    setSelectedIds([]);
  }, [initialEntityKind, initialViewMode]);

  // Persist current view config on change
  useEffect(() => {
    saveDatabaseViewConfig(config);
  }, [config]);

  const updateConfig = (patch: Partial<DatabaseViewConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  // Build unified records from real Workspace state
  const allProjectRecords = useMemo(
    () => buildProjectRecords(pages, tasks),
    [pages, tasks]
  );
  const allTaskRecords = useMemo(
    () => buildTaskRecords(tasks, pages),
    [tasks, pages]
  );
  const allMeetingRecords = useMemo(
    () => buildMeetingRecords(pages, tasks),
    [pages, tasks]
  );

  const rawRecords: UnifiedDatabaseRecord[] = useMemo(() => {
    if (entityKind === 'projects') return allProjectRecords;
    if (entityKind === 'meetings') return allMeetingRecords;
    return allTaskRecords;
  }, [entityKind, allProjectRecords, allTaskRecords, allMeetingRecords]);

  const filteredRecords = useMemo(
    () => filterAndSortDatabaseRecords(rawRecords, config),
    [rawRecords, config]
  );

  const statusColumns: string[] = useMemo(() => {
    if (entityKind === 'projects') return PROJECT_STATUSES;
    if (entityKind === 'meetings') return MEETING_STATUSES;
    return TASK_STATUSES;
  }, [entityKind]);

  const allOwners = useMemo(() => {
    const owners = new Set<string>();
    rawRecords.forEach((r) => {
      if (r.owner) owners.add(r.owner);
    });
    (currentWorkspace?.members || []).forEach((m) => {
      if (m.name) owners.add(m.name);
    });
    return Array.from(owners);
  }, [rawRecords, currentWorkspace]);

  // =========================================================================
  // CRUD HANDLERS ON REAL RECORDS
  // =========================================================================

  const handleCreateRecord = async (defaultStatus?: string, defaultDate?: string) => {
    const dateIso = defaultDate || new Date().toISOString().split('T')[0];

    if (entityKind === 'projects') {
      const status = defaultStatus || 'Planowanie';
      const title = 'Nowy Projekt';
      const targetIso =
        defaultDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

      const blocks: DocBlock[] = [
        {
          id: `b-proj-${Date.now()}-1`,
          type: 'lead',
          content: 'Cel projektu, kluczowe rezultaty oraz powiązane zadania i spotkania.',
        },
        { id: `b-proj-${Date.now()}-2`, type: 'h2', content: 'Cele i zakres projektu' },
        { id: `b-proj-${Date.now()}-3`, type: 'todo', content: 'Zdefiniować architekturę i backlog zadań', checked: false },
        { id: `b-proj-${Date.now()}-4`, type: 'h2', content: 'Zadania projektu (Linked Database)' },
        {
          id: `b-proj-${Date.now()}-5`,
          type: 'linked_database',
          content: 'Zadania projektu',
          linkedDatabaseData: {
            entityKind: 'tasks',
            viewMode: 'board',
            title: 'Zadania tego projektu',
            projectFilter: 'auto',
          },
        },
        { id: `b-proj-${Date.now()}-6`, type: 'h2', content: 'Spotkania projektu (Linked Database)' },
        {
          id: `b-proj-${Date.now()}-7`,
          type: 'linked_database',
          content: 'Spotkania projektu',
          linkedDatabaseData: {
            entityKind: 'meetings',
            viewMode: 'table',
            title: 'Powiązane spotkania',
            projectFilter: 'auto',
          },
        },
      ];

      const newPageId = await createPage(undefined, title, blocks, 'Project', '🚀');
      if (newPageId) {
        await updatePageMetadata(newPageId, {
          status,
          priority: 'Wysoki',
          owner: currentWorkspace?.members?.[0]?.name || 'Właściciel',
          members: (currentWorkspace?.members || []).map((m) => m.name),
          startDate: new Date().toISOString().split('T')[0],
          deadline: targetIso,
          targetDate: targetIso,
          goal: 'Kompleksowa realizacja nowego projektu w Workspace.',
        });
        setActivePageId(newPageId);
        setActiveView('doc');
      }
      return;
    }

    if (entityKind === 'meetings') {
      const status = defaultStatus || 'Zaplanowane';
      const title = `Spotkanie zespołu (${dateIso})`;
      const firstProject = allProjectRecords[0];

      const blocks: DocBlock[] = [
        {
          id: `b-meet-${Date.now()}-1`,
          type: 'lead',
          content: `Data: ${dateIso} · Godz. 10:00–11:00 · Organizator: ${currentWorkspace?.members?.[0]?.name || 'Ty'}`,
        },
        { id: `b-meet-${Date.now()}-2`, type: 'h2', content: 'Agenda spotkania' },
        { id: `b-meet-${Date.now()}-3`, type: 'bullet', content: 'Omówienie statusu bieżących zadań i projektów' },
        { id: `b-meet-${Date.now()}-4`, type: 'h2', content: 'Ustalenia i decyzje' },
        { id: `b-meet-${Date.now()}-5`, type: 'p', content: 'Wpisz podjęte decyzje...' },
        { id: `b-meet-${Date.now()}-6`, type: 'h2', content: 'Zadania Follow-up (Linked Database)' },
        {
          id: `b-meet-${Date.now()}-7`,
          type: 'linked_database',
          content: 'Zadania ze spotkania',
          linkedDatabaseData: {
            entityKind: 'tasks',
            viewMode: 'table',
            title: 'Zadania przypisane po spotkaniu',
            projectFilter: 'auto',
          },
        },
      ];

      const newMeetId = await createPage(undefined, title, blocks, 'Meeting', '🤝');
      if (newMeetId) {
        await updatePageMetadata(newMeetId, {
          status,
          priority: 'Średni',
          date: dateIso,
          meetingDate: dateIso,
          startTime: '10:00',
          endTime: '11:00',
          organizer: currentWorkspace?.members?.[0]?.name || 'Organizator',
          attendees: (currentWorkspace?.members || []).map((m) => m.name),
          projectId: firstProject?.id || '',
          projectTitle: firstProject?.title || '',
          agenda: 'Omówienie statusu bieżących zadań i projektów',
          decisions: '',
        });
        setActivePageId(newMeetId);
        setActiveView('doc');
      }
      return;
    }

    // Default: Tasks
    const status = (defaultStatus as TaskStatus) || 'Do zrobienia';
    const firstProject = allProjectRecords[0];
    const newTaskId = await addTask({
      title: 'Nowe zadanie projektowe',
      status,
      priority: 'Wysoki',
      dueDate: dateIso,
      tag: firstProject ? firstProject.title.slice(0, 16) : 'Sprint',
      assignee: currentWorkspace?.members?.[0]?.name || 'Ty',
      estimatedHours: 2,
      isCompleted: status === 'Zrobione',
      relationPageId: firstProject?.id,
      relationPageTitle: firstProject?.title,
    });
    if (newTaskId) {
      await openTaskAsPage(newTaskId);
    }
  };

  const handleUpdateRecordTitle = async (record: UnifiedDatabaseRecord, title: string) => {
    if (record.kind === 'tasks') {
      await updateTask(record.id, { title });
    } else {
      await updatePageTitle(record.id, title);
    }
  };

  const handleUpdateRecordStatus = async (record: UnifiedDatabaseRecord, status: string) => {
    if (record.kind === 'tasks') {
      await updateTask(record.id, {
        status: status as TaskStatus,
        isCompleted: status === 'Zrobione',
      });
    } else {
      await updatePageMetadata(record.id, { status });
    }
  };

  const handleUpdateRecordPriority = async (record: UnifiedDatabaseRecord, priority: Priority) => {
    if (record.kind === 'tasks') {
      await updateTask(record.id, { priority });
    } else {
      await updatePageMetadata(record.id, { priority });
    }
  };

  const handleUpdateRecordDate = async (record: UnifiedDatabaseRecord, dueDate: string) => {
    if (record.kind === 'tasks') {
      await updateTask(record.id, { dueDate });
    } else if (record.kind === 'projects') {
      await updatePageMetadata(record.id, { deadline: dueDate, targetDate: dueDate });
    } else {
      await updatePageMetadata(record.id, { date: dueDate, meetingDate: dueDate });
    }
  };

  const handleUpdateRecordOwner = async (record: UnifiedDatabaseRecord, owner: string) => {
    if (record.kind === 'tasks') {
      await updateTask(record.id, { assignee: owner });
    } else if (record.kind === 'projects') {
      await updatePageMetadata(record.id, { owner });
    } else {
      await updatePageMetadata(record.id, { organizer: owner });
    }
  };

  const handleUpdateRecordProjectRelation = async (
    record: UnifiedDatabaseRecord,
    projectId: string
  ) => {
    const proj = allProjectRecords.find((p) => p.id === projectId);
    if (record.kind === 'tasks') {
      await updateTask(record.id, {
        relationPageId: projectId || undefined,
        relationPageTitle: proj?.title || undefined,
        pageId: projectId || undefined,
      });
    } else if (record.kind === 'meetings') {
      await updatePageMetadata(record.id, {
        projectId: projectId || '',
        projectTitle: proj?.title || '',
      });
    }
  };

  const handleDeleteRecord = async (record: UnifiedDatabaseRecord) => {
    if (record.kind === 'tasks') {
      await deleteTask(record.id);
    } else {
      await deletePage(record.id);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    for (const id of selectedIds) {
      const rec = rawRecords.find((r) => r.id === id);
      if (rec) {
        await handleUpdateRecordStatus(rec, status);
      }
    }
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      const rec = rawRecords.find((r) => r.id === id);
      if (rec) {
        await handleDeleteRecord(rec);
      }
    }
    setSelectedIds([]);
  };

  const toggleColumnVisibility = (colKey: string) => {
    const current = config.visibleColumns || ['title', 'status', 'priority', 'owner', 'dueDate', 'progress', 'relations'];
    const next = current.includes(colKey)
      ? current.filter((c) => c !== colKey)
      : [...current, colKey];
    updateConfig({ visibleColumns: next });
  };

  const handleOpenRecordAsPage = async (record: UnifiedDatabaseRecord) => {
    if (record.kind === 'tasks') {
      await openTaskAsPage(record.id);
    } else {
      setActivePageId(record.id);
      setActiveView('doc');
    }
  };

  const handleSaveCurrentView = () => {
    const viewName = window.prompt(
      'Podaj nazwę zapisywanego widoku (np. "Krytyczne w tym tygodniu"):',
      `${config.viewMode.toUpperCase()} — ${config.statusFilter === 'all' ? 'Wszystkie' : config.statusFilter}`
    );
    if (!viewName || !viewName.trim()) return;
    const newSaved: DatabaseViewConfig = {
      ...config,
      id: `saved-${Date.now()}`,
      name: viewName.trim(),
    };
    const nextList = saveNamedDatabaseView(newSaved);
    setSavedViews(nextList);
    addNotification('Zapisano widok bazy', `Widok "${viewName.trim()}" został utrwalony.`, 'success');
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Typ', 'Nazwa', 'Status', 'Priorytet', 'Właściciel', 'Termin', 'Postęp (%)', 'Projekt'];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.kind,
      `"${r.title.replace(/"/g, '""')}"`,
      r.status,
      r.priority,
      `"${r.owner.replace(/"/g, '""')}"`,
      r.dueDate,
      r.progressPercent,
      `"${(r.relationProjectTitle || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityKind}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const headerMeta = {
    projects: {
      icon: '🚀',
      title: 'Projects',
      subtitle: 'Baza projektów z rzeczywistym wyliczaniem postępu z powiązanych zadań i spotkań',
      newButtonLabel: 'Nowy projekt',
      dateLabel: 'Target Date',
      ownerLabel: 'Owner',
    },
    tasks: {
      icon: '☑️',
      title: 'Tasks',
      subtitle: 'Zunifikowana baza zadań powiązana z projektami, spotkaniami i notatkami',
      newButtonLabel: 'Nowe zadanie',
      dateLabel: 'Due Date',
      ownerLabel: 'Assignee',
    },
    meetings: {
      icon: '🤝',
      title: 'Meetings',
      subtitle: 'Rejestr spotkań zespołu z agendą, uczestnikami i konwersją ustaleń na zadania',
      newButtonLabel: 'Nowe spotkanie',
      dateLabel: 'Data spotkania',
      ownerLabel: 'Organizator',
    },
  }[entityKind];

  return (
    <div className="flex-1 h-full overflow-hidden bg-white dark:bg-[#191919] p-4 sm:p-6 lg:p-8 flex flex-col text-[#37352f] dark:text-[#d4d4d4] transition-colors select-none">
      {/* ========================================================================= */}
      {/* 1. HEADER: DATABASE SWITCHER & 5 REAL VIEWS (Table/Board/Calendar/List/Gallery) */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] gap-3 shrink-0">
        <div>
          {/* Top Breadcrumb + Entity Switcher Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#787774] dark:text-[#9b9a97] mb-1">
            <span>Teamspaces</span>
            <span>/</span>
            <div className="inline-flex items-center gap-1 bg-[#fbfbfa] dark:bg-[#202020] p-0.5 rounded-[5px] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)]">
              {(
                [
                  { id: 'projects', label: '🚀 Projects', count: allProjectRecords.length },
                  { id: 'tasks', label: '☑️ Tasks', count: allTaskRecords.length },
                  { id: 'meetings', label: '🤝 Meetings', count: allMeetingRecords.length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setEntityKind(tab.id);
                    setActiveView(tab.id);
                  }}
                  className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                    entityKind === tab.id
                      ? 'bg-[#37352f] text-white dark:bg-white dark:text-[#191919] font-semibold'
                      : 'text-[#787774] hover:text-[#37352f] dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#37352f] dark:text-white flex items-center gap-2">
            <span>{headerMeta.icon}</span>
            <span>{headerMeta.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.06)] text-[#787774] dark:text-[#9b9a97] font-mono font-normal tabular-nums">
              {filteredRecords.length} z {rawRecords.length}
            </span>
          </h2>
          <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5">
            {headerMeta.subtitle}
          </p>
        </div>

        {/* 5 Real Database Views Switcher: [ Table ] [ Board ] [ Calendar ] [ List ] [ Gallery ] */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 p-1 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)]">
            {(
              [
                { id: 'table', label: 'Table', icon: <TableIcon size={13} /> },
                { id: 'board', label: 'Board', icon: <Columns3 size={13} /> },
                { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={13} /> },
                { id: 'list', label: 'List', icon: <ListIcon size={13} /> },
                { id: 'gallery', label: 'Gallery', icon: <LayoutGrid size={13} /> },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                onClick={() => updateConfig({ viewMode: v.id })}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer transition-colors ${
                  config.viewMode === v.id
                    ? 'bg-white dark:bg-[#2c2c2c] text-[#37352f] dark:text-white font-semibold shadow-2xs border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.09)]'
                    : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white'
                }`}
              >
                {v.icon}
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSaveCurrentView}
              className="px-2.5 py-1 bg-white dark:bg-[#202020] hover:bg-[rgba(55,53,47,0.06)] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] text-[#37352f] dark:text-[#d4d4d4] rounded-[4px] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Zapisz bieżący widok (filtry, sortowanie, układ)"
            >
              <BookmarkPlus size={12} />
              <span className="hidden sm:inline">Zapisz widok</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1 bg-white dark:bg-[#202020] hover:bg-[rgba(55,53,47,0.06)] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] text-[#37352f] dark:text-[#d4d4d4] rounded-[4px] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Eksportuj do CSV"
            >
              <Download size={12} />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={() => handleCreateRecord()}
              className="px-3 py-1 bg-[#2383e2] hover:bg-[#1d6fc2] text-white rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus size={14} />
              <span>{headerMeta.newButtonLabel}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER, SORT, GROUP & SAVED VIEWS BAR                                  */}
      {/* ========================================================================= */}
      <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774]" />
            <input
              type="text"
              value={config.searchQuery}
              onChange={(e) => updateConfig({ searchQuery: e.target.value })}
              placeholder={`Szukaj w ${headerMeta.title}...`}
              className="bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] pl-7 pr-3 py-1 text-xs text-[#37352f] dark:text-white placeholder-[#9b9a97] focus:outline-none focus:border-[#2383e2] w-44 sm:w-56"
            />
          </div>

          {/* Status Filter */}
          <select
            value={config.statusFilter}
            onChange={(e) => updateConfig({ statusFilter: e.target.value })}
            className="bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] px-2.5 py-1 text-xs text-[#37352f] dark:text-[#d4d4d4] focus:outline-none cursor-pointer"
          >
            <option value="all">Status: Wszystkie</option>
            {statusColumns.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={config.priorityFilter}
            onChange={(e) => updateConfig({ priorityFilter: e.target.value })}
            className="bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] px-2.5 py-1 text-xs text-[#37352f] dark:text-[#d4d4d4] focus:outline-none cursor-pointer"
          >
            <option value="all">Priorytet: Wszystkie</option>
            <option value="Krytyczny">🔥 Krytyczny</option>
            <option value="Wysoki">⚡ Wysoki</option>
            <option value="Średni">📌 Średni</option>
            <option value="Niski">🌱 Niski</option>
          </select>

          {/* Owner / Assignee Filter */}
          <select
            value={config.ownerFilter}
            onChange={(e) => updateConfig({ ownerFilter: e.target.value })}
            className="bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] px-2.5 py-1 text-xs text-[#37352f] dark:text-[#d4d4d4] focus:outline-none cursor-pointer"
          >
            <option value="all">{headerMeta.ownerLabel}: Wszyscy</option>
            {allOwners.map((ow) => (
              <option key={ow} value={ow}>
                👤 {ow}
              </option>
            ))}
          </select>

          {/* Project Relation Filter (for Tasks and Meetings) */}
          {entityKind !== 'projects' && allProjectRecords.length > 0 && (
            <select
              value={config.projectFilter}
              onChange={(e) => updateConfig({ projectFilter: e.target.value })}
              className="bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] px-2.5 py-1 text-xs text-[#37352f] dark:text-[#d4d4d4] focus:outline-none cursor-pointer"
            >
              <option value="all">Projekt: Wszystkie</option>
              {allProjectRecords.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  🚀 {proj.title}
                </option>
              ))}
            </select>
          )}

          {/* Sort selector */}
          <select
            value={`${config.sortField}:${config.sortDir}`}
            onChange={(e) => {
              const [sortField, sortDir] = e.target.value.split(':') as [
                DatabaseViewConfig['sortField'],
                'asc' | 'desc',
              ];
              updateConfig({ sortField, sortDir });
            }}
            className="bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] px-2.5 py-1 text-xs text-[#37352f] dark:text-[#d4d4d4] focus:outline-none cursor-pointer"
          >
            <option value="dueDate:asc">Sortuj: Termin (rosnąco)</option>
            <option value="dueDate:desc">Sortuj: Termin (malejąco)</option>
            <option value="priority:asc">Sortuj: Priorytet (najwyższy)</option>
            <option value="progressPercent:desc">Sortuj: Postęp % (malejąco)</option>
            <option value="title:asc">Sortuj: Nazwa (A–Z)</option>
          </select>

          {/* GroupBy selector */}
          <select
            value={config.groupBy || 'none'}
            onChange={(e) =>
              updateConfig({
                groupBy: e.target.value as DatabaseViewConfig['groupBy'],
              })
            }
            className="bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] px-2.5 py-1 text-xs text-[#37352f] dark:text-[#d4d4d4] focus:outline-none cursor-pointer"
          >
            <option value="none">Grupuj: Brak</option>
            <option value="status">Grupuj: Status</option>
            <option value="priority">Grupuj: Priorytet</option>
            <option value="owner">Grupuj: {headerMeta.ownerLabel}</option>
            {entityKind !== 'projects' && <option value="project">Grupuj: Projekt</option>}
          </select>
        </div>

        {/* Bulk Actions Bar when rows are selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-[5px] text-xs">
            <span className="font-semibold text-[#2383e2]">
              Zaznaczono: {selectedIds.length}
            </span>
            {statusColumns.map((st) => (
              <button
                key={st}
                onClick={() => handleBulkUpdateStatus(st)}
                className="px-2 py-0.5 rounded bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] hover:border-[#2383e2] text-[11px] font-medium cursor-pointer"
              >
                → {st}
              </button>
            ))}
            <button
              onClick={handleBulkDelete}
              className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-semibold cursor-pointer"
            >
              Usuń zaznaczone
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-[#787774] hover:underline cursor-pointer"
            >
              Anuluj
            </button>
          </div>
        )}

        {/* Saved Views Pills */}
        {savedViews.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] text-[#787774] font-semibold uppercase mr-1">Zapisane:</span>
            {savedViews.map((sv) => (
              <button
                key={sv.id}
                onClick={() => setConfig(sv)}
                className="px-2 py-0.5 rounded-[4px] bg-[rgba(35,131,226,0.08)] hover:bg-[rgba(35,131,226,0.15)] text-[#2383e2] text-[11px] font-medium cursor-pointer transition-colors"
              >
                {sv.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. UNIFIED 5-VIEW RENDERER (Operating on the exact same `filteredRecords`) */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-auto mt-3 rounded-[6px] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] bg-white dark:bg-[#191919]">
        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 1: TABLE                                                           */}
        {/* ----------------------------------------------------------------------- */}
        {config.viewMode === 'table' && (
          <div className="overflow-x-auto h-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#fbfbfa] dark:bg-[#202020] border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] sticky top-0 z-10 text-[#787774] dark:text-[#9b9a97] font-medium text-[11px]">
                <tr>
                  <th className="p-2.5 w-8">
                    <button
                      onClick={() =>
                        setSelectedIds(
                          selectedIds.length === filteredRecords.length
                            ? []
                            : filteredRecords.map((r) => r.id)
                        )
                      }
                      className="cursor-pointer"
                    >
                      {selectedIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                        <CheckSquare size={14} className="text-[#2383e2]" />
                      ) : (
                        <Square size={14} className="text-[#787774]" />
                      )}
                    </button>
                  </th>
                  <th
                    className="p-2.5 min-w-[220px] cursor-pointer"
                    onClick={() =>
                      updateConfig({
                        sortField: 'title',
                        sortDir: config.sortDir === 'asc' ? 'desc' : 'asc',
                      })
                    }
                  >
                    <div className="flex items-center gap-1">
                      <span>Nazwa</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th className="p-2.5 min-w-[130px]">Status</th>
                  <th className="p-2.5 min-w-[110px]">Priorytet</th>
                  <th className="p-2.5 min-w-[120px]">{headerMeta.ownerLabel}</th>
                  <th className="p-2.5 min-w-[125px]">{headerMeta.dateLabel}</th>
                  {entityKind === 'projects' ? (
                    <>
                      <th className="p-2.5 min-w-[150px]">Postęp zadań</th>
                      <th className="p-2.5 min-w-[130px]">Relacje</th>
                    </>
                  ) : (
                    <>
                      <th className="p-2.5 min-w-[150px]">Powiązany Projekt</th>
                      <th className="p-2.5 min-w-[110px]">
                        {entityKind === 'meetings' ? 'Godzina / Zadania' : 'Postęp'}
                      </th>
                    </>
                  )}
                  <th className="p-2.5 text-right w-24">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(55,53,47,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-[#787774]">
                      Brak rekordów w widoku. Kliknij <strong>„{headerMeta.newButtonLabel}”</strong> powyżej, aby dodać pierwszy rekord.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => handleOpenRecordAsPage(rec)}
                      className="hover:bg-[#fbfbfa] dark:hover:bg-[#202020]/60 transition-colors group cursor-pointer"
                    >
                      <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() =>
                            setSelectedIds((prev) =>
                              prev.includes(rec.id)
                                ? prev.filter((id) => id !== rec.id)
                                : [...prev, rec.id]
                            )
                          }
                          className="cursor-pointer"
                        >
                          {selectedIds.includes(rec.id) ? (
                            <CheckSquare size={14} className="text-[#2383e2]" />
                          ) : (
                            <Square size={14} className="text-[#787774]" />
                          )}
                        </button>
                      </td>

                      {/* Title inline input + Open Page icon */}
                      <td className="p-2.5 font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm shrink-0">
                            {rec.kind === 'projects' ? '🚀' : rec.kind === 'meetings' ? '🤝' : '☑️'}
                          </span>
                          <input
                            type="text"
                            value={rec.title}
                            onChange={(e) => handleUpdateRecordTitle(rec, e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-[#37352f] dark:text-white font-semibold focus:ring-1 focus:ring-[#2383e2] rounded px-1 py-0.5"
                          />
                          <button
                            onClick={() => handleOpenRecordAsPage(rec)}
                            className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-[10px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] hover:bg-[#2383e2] hover:text-white rounded text-[#37352f] dark:text-white font-medium shrink-0 cursor-pointer transition-colors"
                          >
                            OTWÓRZ
                          </button>
                        </div>
                      </td>

                      {/* Status selector */}
                      <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={rec.status}
                          onChange={(e) => handleUpdateRecordStatus(rec, e.target.value)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer ${
                            rec.isCompleted || rec.status === 'Ukończony' || rec.status === 'Zakończone'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : rec.status === 'W trakcie'
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2383e2] dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-[#f7f6f3] dark:bg-[#252525] text-[#37352f] dark:text-[#d4d4d4] border-[rgba(55,53,47,0.12)]'
                          }`}
                        >
                          {statusColumns.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Priority selector */}
                      <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={rec.priority}
                          onChange={(e) =>
                            handleUpdateRecordPriority(rec, e.target.value as Priority)
                          }
                          className="text-[11px] font-medium bg-transparent border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded px-2 py-0.5 cursor-pointer"
                        >
                          <option value="Niski">Niski</option>
                          <option value="Średni">Średni</option>
                          <option value="Wysoki">Wysoki</option>
                          <option value="Krytyczny">Krytyczny</option>
                        </select>
                      </td>

                      {/* Owner / Assignee */}
                      <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={rec.owner}
                          onChange={(e) => handleUpdateRecordOwner(rec, e.target.value)}
                          className="bg-transparent border-none outline-none text-[11px] text-[#37352f] dark:text-[#d4d4d4] w-28 focus:ring-1 focus:ring-[#2383e2] rounded px-1"
                        />
                      </td>

                      {/* Date */}
                      <td className="p-2.5 font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="date"
                          value={rec.dueDate}
                          onChange={(e) => handleUpdateRecordDate(rec, e.target.value)}
                          className="bg-transparent border-none outline-none text-[#37352f] dark:text-[#d4d4d4] text-[11px] font-mono cursor-pointer"
                        />
                      </td>

                      {/* Conditional Columns: Projects vs Tasks/Meetings */}
                      {entityKind === 'projects' ? (
                        <>
                          <td className="p-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-[#e9e9e7] dark:bg-[#2f2f2f] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${rec.progressPercent}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-mono font-semibold">
                                {rec.progressPercent}%
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 text-[11px] text-[#787774]">
                            <span>
                              ☑️ {rec.completedTasksCount}/{rec.relatedTasksCount} zad. · 🤝{' '}
                              {rec.relatedMeetingsCount} spotk.
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={rec.relationProjectId || ''}
                              onChange={(e) =>
                                handleUpdateRecordProjectRelation(rec, e.target.value)
                              }
                              className="text-[11px] bg-transparent border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded px-1.5 py-0.5 max-w-[145px] truncate cursor-pointer"
                            >
                              <option value="">Brak projektu</option>
                              {allProjectRecords.map((p) => (
                                <option key={p.id} value={p.id}>
                                  🚀 {p.title}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5 text-[11px] font-mono text-[#787774]">
                            {entityKind === 'meetings' ? (
                              <span>
                                {rec.startTime}–{rec.endTime} ({rec.relatedTasksCount} zad.)
                              </span>
                            ) : (
                              <span>{rec.progressPercent}%</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenRecordAsPage(rec)}
                            className="p-1 hover:text-[#2383e2] rounded cursor-pointer"
                            title="Otwórz jako pełną stronę w edytorze blokowym"
                          >
                            <FileText size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec)}
                            className="p-1 hover:text-rose-600 rounded cursor-pointer"
                            title="Usuń rekord"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Bottom "+ New" row like Notion */}
            <button
              onClick={() => handleCreateRecord()}
              className="w-full text-left px-3 py-2 text-xs text-[#787774] hover:text-[#37352f] dark:hover:text-white hover:bg-[#fbfbfa] dark:hover:bg-[#202020] border-t border-[rgba(55,53,47,0.06)] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus size={13} />
              <span>{headerMeta.newButtonLabel}</span>
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 2: BOARD / KANBAN                                                  */}
        {/* ----------------------------------------------------------------------- */}
        {config.viewMode === 'board' && (
          <div
            className={`p-4 grid grid-cols-1 ${
              statusColumns.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'
            } gap-4 h-full overflow-y-auto`}
          >
            {statusColumns.map((status) => {
              const colRecords = filteredRecords.filter((r) => r.status === status);

              return (
                <div
                  key={status}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const recId = e.dataTransfer.getData('text/plain');
                    const found = rawRecords.find((r) => r.id === recId);
                    if (found) {
                      handleUpdateRecordStatus(found, status);
                    }
                  }}
                  className="flex flex-col bg-[#fbfbfa] dark:bg-[#202020] rounded-[8px] p-3 border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] max-h-[calc(100vh-230px)]"
                >
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[rgba(55,53,47,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#37352f] dark:text-white">
                      <span>{status}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97] text-[10px] font-mono">
                        {colRecords.length}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCreateRecord(status)}
                      className="p-1 hover:text-[#2383e2] rounded cursor-pointer text-[#787774]"
                      title={`Dodaj do: ${status}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                    {colRecords.map((rec) => (
                      <div
                        key={rec.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', rec.id)}
                        onClick={() => handleOpenRecordAsPage(rec)}
                        className="p-3 bg-white dark:bg-[#191919] border border-[rgba(55,53,47,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[6px] shadow-2xs hover:border-[#2383e2] cursor-pointer transition-all group space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-xs text-[#37352f] dark:text-white line-clamp-2">
                            {rec.kind === 'projects' ? '🚀 ' : rec.kind === 'meetings' ? '🤝 ' : ''}
                            {rec.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRecord(rec);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-[#787774] hover:text-rose-600 p-0.5 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {rec.relationProjectTitle && (
                          <div className="text-[10px] text-[#2383e2] bg-blue-50/70 dark:bg-blue-950/40 px-1.5 py-0.5 rounded inline-block truncate max-w-full">
                            🚀 {rec.relationProjectTitle}
                          </div>
                        )}

                        {rec.kind === 'projects' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-[#787774]">
                              <span>Postęp zadań ({rec.completedTasksCount}/{rec.relatedTasksCount})</span>
                              <span className="font-mono font-semibold">{rec.progressPercent}%</span>
                            </div>
                            <div className="w-full h-1 bg-[#e9e9e7] dark:bg-[#2f2f2f] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${rec.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[10px] text-[#787774] font-mono">
                          <span>[{rec.priority}] · 👤 {rec.owner}</span>
                          <span>{rec.dueDate}</span>
                        </div>

                        {/* Accessible quick status switcher */}
                        <div
                          className="flex items-center gap-1 pt-1 border-t border-[rgba(55,53,47,0.06)] opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {statusColumns
                            .filter((st) => st !== rec.status)
                            .map((st) => (
                              <button
                                key={st}
                                onClick={() => handleUpdateRecordStatus(rec, st)}
                                className="px-1.5 py-0.5 rounded bg-[#f7f6f3] dark:bg-[#252525] hover:bg-[#2383e2] hover:text-white text-[9px] font-medium cursor-pointer transition-colors"
                                title={`Przenieś do: ${st}`}
                              >
                                → {st}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => handleCreateRecord(status)}
                      className="w-full py-1.5 text-left px-2 rounded-[4px] text-[11px] text-[#787774] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.05)] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Dodaj</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 3: CALENDAR                                                        */}
        {/* ----------------------------------------------------------------------- */}
        {config.viewMode === 'calendar' && (
          <div className="p-4 flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)]">
              <h3 className="font-bold text-sm text-[#37352f] dark:text-white capitalize">
                {currentCalendarDate.toLocaleDateString('pl-PL', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCurrentCalendarDate(
                      new Date(
                        currentCalendarDate.getFullYear(),
                        currentCalendarDate.getMonth() - 1,
                        1
                      )
                    )
                  }
                  className="p-1 hover:bg-[rgba(55,53,47,0.06)] rounded cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentCalendarDate(new Date())}
                  className="px-2.5 py-0.5 text-xs rounded border border-[rgba(55,53,47,0.12)] cursor-pointer"
                >
                  Dziś
                </button>
                <button
                  onClick={() =>
                    setCurrentCalendarDate(
                      new Date(
                        currentCalendarDate.getFullYear(),
                        currentCalendarDate.getMonth() + 1,
                        1
                      )
                    )
                  }
                  className="p-1 hover:bg-[rgba(55,53,47,0.06)] rounded cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-[rgba(55,53,47,0.09)] dark:bg-[rgba(255,255,255,0.09)] rounded-[6px] overflow-hidden flex-1 border border-[rgba(55,53,47,0.09)]">
              {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day) => (
                <div
                  key={day}
                  className="bg-[#fbfbfa] dark:bg-[#202020] p-2 text-center text-[10px] font-bold text-[#787774]"
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: 35 }).map((_, i) => {
                const year = currentCalendarDate.getFullYear();
                const month = currentCalendarDate.getMonth();
                const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
                const dayNumber = i - firstDayIndex + 1;
                const dateObj = new Date(year, month, dayNumber);
                const dateStr = dateObj.toISOString().split('T')[0];
                const isCurrentMonth = dateObj.getMonth() === month;

                const dayRecords = filteredRecords.filter((r) => r.dueDate === dateStr);

                return (
                  <div
                    key={i}
                    onClick={() => handleCreateRecord(undefined, dateStr)}
                    className={`min-h-[82px] p-1.5 flex flex-col justify-between cursor-pointer transition-colors ${
                      isCurrentMonth
                        ? 'bg-white dark:bg-[#191919] hover:bg-[#fbfbfa] dark:hover:bg-[#202020]'
                        : 'bg-[#fbfbfa]/60 dark:bg-[#141414] text-[#9b9a97]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#787774]">
                      <span>{dateObj.getDate()}</span>
                      {dayRecords.length > 0 && (
                        <span className="text-[9px] px-1 rounded bg-blue-50 dark:bg-blue-950 text-[#2383e2]">
                          {dayRecords.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 overflow-hidden mt-1">
                      {dayRecords.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRecordAsPage(r);
                          }}
                          className="px-1.5 py-0.5 rounded bg-[rgba(35,131,226,0.1)] hover:bg-[rgba(35,131,226,0.2)] text-[#2383e2] dark:text-[#529cca] text-[10px] font-medium truncate"
                        >
                          {r.startTime ? `${r.startTime} ` : ''}
                          {r.title}
                        </div>
                      ))}
                      {dayRecords.length > 3 && (
                        <span className="text-[9px] text-[#787774]">
                          +{dayRecords.length - 3} więcej
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 4: LIST                                                            */}
        {/* ----------------------------------------------------------------------- */}
        {config.viewMode === 'list' && (
          <div className="divide-y divide-[rgba(55,53,47,0.06)] dark:divide-[rgba(255,255,255,0.06)] p-2">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#787774]">
                Brak elementów na liście.
              </div>
            ) : (
              (() => {
                const groups: Record<string, UnifiedDatabaseRecord[]> = {};
                if (config.groupBy && config.groupBy !== 'none') {
                  filteredRecords.forEach((r) => {
                    const key =
                      config.groupBy === 'status'
                        ? r.status
                        : config.groupBy === 'priority'
                          ? r.priority
                          : config.groupBy === 'owner'
                            ? r.owner
                            : r.relationProjectTitle || 'Bez projektu';
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(r);
                  });
                } else {
                  groups['Wszystkie rekordy'] = filteredRecords;
                }

                return Object.entries(groups).map(([groupLabel, groupItems]) => (
                  <div key={groupLabel} className="py-1.5">
                    {config.groupBy && config.groupBy !== 'none' && (
                      <div className="px-2.5 py-1 text-[11px] font-bold text-[#787774] uppercase tracking-wider flex items-center justify-between bg-[#fbfbfa] dark:bg-[#202020] rounded-[4px] mb-1">
                        <span>{groupLabel}</span>
                        <span className="font-mono text-[10px]">{groupItems.length}</span>
                      </div>
                    )}
                    {groupItems.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => handleOpenRecordAsPage(rec)}
                        className="p-2.5 flex items-center justify-between hover:bg-[#fbfbfa] dark:hover:bg-[#202020] rounded-[6px] cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {rec.kind === 'tasks' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateRecordStatus(
                                  rec,
                                  rec.isCompleted ? 'Do zrobienia' : 'Zrobione'
                                );
                              }}
                              className="cursor-pointer text-[#787774] hover:text-emerald-600"
                            >
                              {rec.isCompleted ? (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                              ) : (
                                <Circle size={16} />
                              )}
                            </button>
                          ) : (
                            <span className="text-base">
                              {rec.kind === 'projects' ? '🚀' : '🤝'}
                            </span>
                          )}

                          <div className="truncate">
                            <div
                              className={`font-semibold text-xs truncate ${
                                rec.isCompleted
                                  ? 'line-through text-[#9b9a97]'
                                  : 'text-[#37352f] dark:text-white'
                              }`}
                            >
                              {rec.title}
                            </div>
                            {rec.description && (
                              <div className="text-[11px] text-[#787774] truncate max-w-lg">
                                {rec.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs shrink-0">
                          {rec.relationProjectTitle && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[10px] text-[#2383e2] font-medium">
                              🚀 {rec.relationProjectTitle}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-[#f7f6f3] dark:bg-[#252525] text-[10px] text-[#37352f] dark:text-[#d4d4d4]">
                            {rec.status}
                          </span>
                          <span className="text-[11px] text-[#787774] hidden sm:inline">
                            👤 {rec.owner}
                          </span>
                          <span className="text-[11px] font-mono text-[#787774]">{rec.dueDate}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRecord(rec);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-[#787774] hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 5: GALLERY                                                         */}
        {/* ----------------------------------------------------------------------- */}
        {config.viewMode === 'gallery' && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto h-full">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                onClick={() => handleOpenRecordAsPage(rec)}
                className="border border-[rgba(55,53,47,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[8px] bg-white dark:bg-[#202020] overflow-hidden shadow-2xs hover:border-[#2383e2] cursor-pointer transition-all group flex flex-col justify-between"
              >
                <div className="h-20 bg-gradient-to-r from-[#2383e2]/10 via-indigo-500/10 to-emerald-500/10 p-3 flex items-start justify-between border-b border-[rgba(55,53,47,0.06)]">
                  <span className="px-2 py-0.5 rounded-full bg-white/90 dark:bg-[#191919]/90 text-[10px] font-semibold text-[#37352f] dark:text-[#d4d4d4]">
                    {rec.status}
                  </span>
                  <span className="text-lg">
                    {rec.kind === 'projects'
                      ? '🚀'
                      : rec.kind === 'meetings'
                        ? '🤝'
                        : rec.priority === 'Krytyczny'
                          ? '🔥'
                          : '☑️'}
                  </span>
                </div>

                <div className="p-3.5 space-y-2 flex-1">
                  <h4 className="font-bold text-xs text-[#37352f] dark:text-white line-clamp-2">
                    {rec.title}
                  </h4>
                  {rec.description && (
                    <p className="text-[11px] text-[#787774] line-clamp-2 leading-relaxed">
                      {rec.description}
                    </p>
                  )}

                  {rec.kind === 'projects' && (
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between text-[10px] text-[#787774]">
                        <span>Zadania: {rec.completedTasksCount}/{rec.relatedTasksCount}</span>
                        <span className="font-mono font-bold">{rec.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e9e9e7] dark:bg-[#2f2f2f] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${rec.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-3.5 py-2 border-t border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[10px] text-[#787774] font-mono">
                  <span>👤 {rec.owner}</span>
                  <span>{rec.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
