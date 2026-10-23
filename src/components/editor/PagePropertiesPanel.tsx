import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  User,
  Users,
  Flag,
  FolderKanban,
  Plus,
  ExternalLink,
  CheckSquare,
  ListTodo,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Priority, TaskStatus, WorkspacePage } from '../../types/workspace';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  PROJECT_STATUSES,
  TASK_STATUSES,
  MEETING_STATUSES,
  buildProjectRecords,
  buildTaskRecords,
  buildMeetingRecords,
} from '../../features/database/viewConfigService';

interface PagePropertiesPanelProps {
  page: WorkspacePage;
  readOnly?: boolean;
}

export const PagePropertiesPanel: React.FC<PagePropertiesPanelProps> = ({
  page,
  readOnly = false,
}) => {
  const {
    pages,
    tasks,
    updatePageMetadata,
    updateTask,
    addTask,
    openTaskAsPage,
    setActivePageId,
    setActiveView,
    currentWorkspace,
    addNotification,
  } = useWorkspace();

  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [showAddProp, setShowAddProp] = useState(false);

  // Follow-up action item state for Meeting pages
  const [newActionItemTitle, setNewActionItemTitle] = useState('');
  const [newActionItemAssignee, setNewActionItemAssignee] = useState('');

  // Quick task state for Project pages
  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState('');

  const pageType = page.pageType || 'Document';
  const meta = page.metadata || {};

  // Build live records to resolve relations and progress
  const allProjects = useMemo(() => buildProjectRecords(pages, tasks), [pages, tasks]);
  const allTasks = useMemo(() => buildTaskRecords(tasks, pages), [tasks, pages]);
  const allMeetings = useMemo(() => buildMeetingRecords(pages, tasks), [pages, tasks]);

  // Only render structured database properties for Project, Task, Meeting, Database, or when customProperties exist
  const customProps: Record<string, string> = meta.customProperties || {};
  const hasCustomProps = Object.keys(customProps).length > 0;

  if (
    pageType !== 'Project' &&
    pageType !== 'Task' &&
    pageType !== 'Meeting' &&
    !hasCustomProps
  ) {
    return null;
  }

  // Find corresponding canonical records
  const projectRecord = pageType === 'Project' ? allProjects.find((p) => p.id === page.id) : undefined;
  const linkedTaskId = pageType === 'Task' ? String(meta.taskId || '') : '';
  const taskRecord =
    pageType === 'Task'
      ? allTasks.find((t) => t.id === linkedTaskId || t.rawTask?.pageId === page.id)
      : undefined;
  const meetingRecord = pageType === 'Meeting' ? allMeetings.find((m) => m.id === page.id) : undefined;

  const handleAddCustomProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropKey.trim() || readOnly) return;
    const nextCustom = {
      ...customProps,
      [newPropKey.trim()]: newPropValue.trim() || '—',
    };
    await updatePageMetadata(page.id, { customProperties: nextCustom });
    setNewPropKey('');
    setNewPropValue('');
    setShowAddProp(false);
  };

  const handleUpdateCustomProperty = async (key: string, val: string) => {
    if (readOnly) return;
    const nextCustom = { ...customProps, [key]: val };
    await updatePageMetadata(page.id, { customProperties: nextCustom });
  };

  const handleDeleteCustomProperty = async (key: string) => {
    if (readOnly) return;
    const nextCustom = { ...customProps };
    delete nextCustom[key];
    await updatePageMetadata(page.id, { customProperties: nextCustom });
  };

  return (
    <div
      className="my-4 py-3 border-y border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] text-xs text-[#37352f] dark:text-[#d4d4d4] select-none space-y-1.5"
      data-testid="notion-page-properties"
    >
      {/* ===================================================================== */}
      {/* 1. PROJECT PROPERTIES (Status, Priority, Owner, Dates, Live Progress) */}
      {/* ===================================================================== */}
      {pageType === 'Project' && (
        <>
          {/* Status */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <Clock size={13} />
              <span>Status</span>
            </div>
            <div className="flex-1">
              <select
                disabled={readOnly}
                value={projectRecord?.status || meta.status || 'W trakcie'}
                onChange={(e) => updatePageMetadata(page.id, { status: e.target.value })}
                className="px-2 py-0.5 rounded-[4px] bg-[#f1f1ef] dark:bg-[#252525] text-[#37352f] dark:text-white font-medium text-xs border-none focus:outline-none cursor-pointer"
              >
                {PROJECT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <Flag size={13} />
              <span>Priority</span>
            </div>
            <div className="flex-1">
              <select
                disabled={readOnly}
                value={projectRecord?.priority || meta.priority || 'Wysoki'}
                onChange={(e) =>
                  updatePageMetadata(page.id, { priority: e.target.value as Priority })
                }
                className="px-2 py-0.5 rounded-[4px] bg-[#f1f1ef] dark:bg-[#252525] text-[#37352f] dark:text-white font-medium text-xs border-none focus:outline-none cursor-pointer"
              >
                <option value="Niski">Niski</option>
                <option value="Średni">Średni</option>
                <option value="Wysoki">Wysoki</option>
                <option value="Krytyczny">Krytyczny</option>
              </select>
            </div>
          </div>

          {/* Owner */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <User size={13} />
              <span>Owner</span>
            </div>
            <div className="flex-1">
              <input
                type="text"
                readOnly={readOnly}
                value={projectRecord?.owner || meta.owner || page.authorName || 'Właściciel'}
                onChange={(e) => updatePageMetadata(page.id, { owner: e.target.value })}
                className="bg-transparent border-none focus:outline-none text-xs text-[#37352f] dark:text-white px-1.5 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)] w-full max-w-xs"
              />
            </div>
          </div>

          {/* Start Date & Target Date */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <Calendar size={13} />
              <span>Timeline</span>
            </div>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              <input
                type="date"
                readOnly={readOnly}
                value={
                  projectRecord?.startDate ||
                  meta.startDate ||
                  new Date().toISOString().split('T')[0]
                }
                onChange={(e) => updatePageMetadata(page.id, { startDate: e.target.value })}
                className="bg-transparent font-mono text-xs text-[#37352f] dark:text-white focus:outline-none px-1 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)]"
              />
              <span className="text-[#787774]">→</span>
              <input
                type="date"
                readOnly={readOnly}
                value={
                  projectRecord?.dueDate ||
                  meta.targetDate ||
                  meta.deadline ||
                  new Date().toISOString().split('T')[0]
                }
                onChange={(e) =>
                  updatePageMetadata(page.id, {
                    targetDate: e.target.value,
                    deadline: e.target.value,
                  })
                }
                className="bg-transparent font-mono text-xs text-[#37352f] dark:text-white focus:outline-none px-1 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)]"
              />
            </div>
          </div>

          {/* Live Calculated Progress from Linked Tasks */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <CheckCircle2 size={13} />
              <span>Progress</span>
            </div>
            <div className="flex-1 flex items-center gap-3 max-w-xs">
              <div className="flex-1 h-2 bg-[#e9e9e7] dark:bg-[#2f2f2f] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${projectRecord?.progressPercent || 0}%` }}
                />
              </div>
              <span className="font-mono font-semibold text-[11px] text-[#37352f] dark:text-white">
                {projectRecord?.progressPercent || 0}% ({projectRecord?.completedTasksCount || 0}/
                {projectRecord?.relatedTasksCount || 0} zadań)
              </span>
            </div>
          </div>

          {/* Related Tasks & Quick Add Task */}
          <div className="flex items-start min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5 py-1">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0 mt-0.5">
              <ListTodo size={13} />
              <span>Related Tasks</span>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {allTasks
                  .filter((t) => t.relationProjectId === page.id)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openTaskAsPage(t.id)}
                      className="px-2 py-0.5 rounded-[4px] bg-[#fbfbfa] dark:bg-[#202020] hover:bg-[#f1f1ef] dark:hover:bg-[#2a2a2a] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Otwórz stronę tego zadania"
                    >
                      <span>{t.isCompleted ? '✅' : '☑️'}</span>
                      <span className={t.isCompleted ? 'line-through text-[#9b9a97]' : 'font-medium'}>
                        {t.title}
                      </span>
                    </button>
                  ))}
              </div>
              {!readOnly && (
                <div className="flex items-center gap-1.5 max-w-md">
                  <input
                    type="text"
                    value={newProjectTaskTitle}
                    onChange={(e) => setNewProjectTaskTitle(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newProjectTaskTitle.trim()) {
                        e.preventDefault();
                        await addTask({
                          title: newProjectTaskTitle.trim(),
                          status: 'Do zrobienia',
                          priority: 'Wysoki',
                          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
                          tag: page.title.slice(0, 16) || 'Projekt',
                          assignee: projectRecord?.owner || 'Ty',
                          pageId: page.id,
                          relationPageId: page.id,
                          relationPageTitle: page.title,
                        });
                        setNewProjectTaskTitle('');
                      }
                    }}
                    placeholder="+ Dodaj powiązane zadanie do projektu..."
                    className="flex-1 bg-transparent border-b border-dashed border-[rgba(55,53,47,0.18)] focus:border-[#2383e2] px-1 py-0.5 text-xs focus:outline-none"
                  />
                  {newProjectTaskTitle.trim() && (
                    <button
                      type="button"
                      onClick={async () => {
                        await addTask({
                          title: newProjectTaskTitle.trim(),
                          status: 'Do zrobienia',
                          priority: 'Wysoki',
                          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
                          tag: page.title.slice(0, 16) || 'Projekt',
                          assignee: projectRecord?.owner || 'Ty',
                          pageId: page.id,
                          relationPageId: page.id,
                          relationPageTitle: page.title,
                        });
                        setNewProjectTaskTitle('');
                      }}
                      className="px-2 py-0.5 bg-[#2383e2] text-white rounded text-[11px] font-medium cursor-pointer"
                    >
                      Dodaj
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Meetings */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <Users size={13} />
              <span>Meetings</span>
            </div>
            <div className="flex-1 flex flex-wrap items-center gap-1.5">
              {allMeetings
                .filter((m) => m.relationProjectId === page.id)
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setActivePageId(m.id);
                      setActiveView('doc');
                    }}
                    className="px-2 py-0.5 rounded-[4px] bg-[#fbfbfa] dark:bg-[#202020] hover:bg-[#f1f1ef] border border-[rgba(55,53,47,0.12)] text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>🤝</span>
                    <span>{m.title}</span>
                    <span className="text-[10px] text-[#787774] font-mono">({m.date})</span>
                  </button>
                ))}
              {allMeetings.filter((m) => m.relationProjectId === page.id).length === 0 && (
                <span className="text-[11px] text-[#9b9a97]">Brak powiązanych spotkań</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* 2. TASK PROPERTIES (Status, Priority, Assignee, Due Date, Project)    */}
      {/* ===================================================================== */}
      {pageType === 'Task' && (
        <>
          {/* Status */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <CheckSquare size={13} />
              <span>Status</span>
            </div>
            <div className="flex-1">
              <select
                disabled={readOnly}
                value={taskRecord?.status || meta.status || 'Do zrobienia'}
                onChange={async (e) => {
                  const nextStatus = e.target.value as TaskStatus;
                  await updatePageMetadata(page.id, {
                    status: nextStatus,
                    isCompleted: nextStatus === 'Zrobione',
                  });
                  if (taskRecord) {
                    await updateTask(taskRecord.id, {
                      status: nextStatus,
                      isCompleted: nextStatus === 'Zrobione',
                    });
                  }
                }}
                className="px-2 py-0.5 rounded-[4px] bg-[#f1f1ef] dark:bg-[#252525] text-[#37352f] dark:text-white font-medium text-xs border-none focus:outline-none cursor-pointer"
              >
                {TASK_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <Flag size={13} />
              <span>Priority</span>
            </div>
            <div className="flex-1">
              <select
                disabled={readOnly}
                value={taskRecord?.priority || meta.priority || 'Średni'}
                onChange={async (e) => {
                  const nextPriority = e.target.value as Priority;
                  await updatePageMetadata(page.id, { priority: nextPriority });
                  if (taskRecord) {
                    await updateTask(taskRecord.id, { priority: nextPriority });
                  }
                }}
                className="px-2 py-0.5 rounded-[4px] bg-[#f1f1ef] dark:bg-[#252525] text-[#37352f] dark:text-white font-medium text-xs border-none focus:outline-none cursor-pointer"
              >
                <option value="Niski">Niski</option>
                <option value="Średni">Średni</option>
                <option value="Wysoki">Wysoki</option>
                <option value="Krytyczny">Krytyczny</option>
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <User size={13} />
              <span>Assignee</span>
            </div>
            <div className="flex-1">
              <input
                type="text"
                readOnly={readOnly}
                value={taskRecord?.assignee || meta.assignee || 'Ty'}
                onChange={async (e) => {
                  const val = e.target.value;
                  await updatePageMetadata(page.id, { assignee: val, owner: val });
                  if (taskRecord) {
                    await updateTask(taskRecord.id, { assignee: val });
                  }
                }}
                className="bg-transparent border-none focus:outline-none text-xs text-[#37352f] dark:text-white px-1.5 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)] w-full max-w-xs"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <Calendar size={13} />
              <span>Due Date</span>
            </div>
            <div className="flex-1">
              <input
                type="date"
                readOnly={readOnly}
                value={
                  taskRecord?.dueDate ||
                  meta.dueDate ||
                  new Date().toISOString().split('T')[0]
                }
                onChange={async (e) => {
                  const val = e.target.value;
                  await updatePageMetadata(page.id, { dueDate: val });
                  if (taskRecord) {
                    await updateTask(taskRecord.id, { dueDate: val });
                  }
                }}
                className="bg-transparent font-mono text-xs text-[#37352f] dark:text-white focus:outline-none px-1.5 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)]"
              />
            </div>
          </div>

          {/* Related Project Relation */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <FolderKanban size={13} />
              <span>Project</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <select
                disabled={readOnly}
                value={taskRecord?.relationProjectId || meta.relationProjectId || ''}
                onChange={async (e) => {
                  const projId = e.target.value;
                  const proj = allProjects.find((p) => p.id === projId);
                  await updatePageMetadata(page.id, {
                    relationProjectId: projId,
                    relationProjectTitle: proj?.title || '',
                  });
                  if (taskRecord) {
                    await updateTask(taskRecord.id, {
                      relationPageId: projId || undefined,
                      relationPageTitle: proj?.title || undefined,
                      pageId: projId || undefined,
                    });
                  }
                }}
                className="px-2 py-0.5 rounded-[4px] bg-[#f1f1ef] dark:bg-[#252525] text-[#37352f] dark:text-white font-medium text-xs border-none focus:outline-none cursor-pointer"
              >
                <option value="">Brak przypisanego projektu</option>
                {allProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    🚀 {proj.title}
                  </option>
                ))}
              </select>
              {(taskRecord?.relationProjectId || meta.relationProjectId) && (
                <button
                  type="button"
                  onClick={() => {
                    const pid = taskRecord?.relationProjectId || meta.relationProjectId;
                    if (pid) {
                      setActivePageId(pid);
                      setActiveView('doc');
                    }
                  }}
                  className="text-[11px] text-[#2383e2] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink size={11} />
                  <span>Otwórz projekt</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* 3. MEETING PROPERTIES (Date & Time, Status, Organizer, Attendees, Project) */}
      {/* ===================================================================== */}
      {pageType === 'Meeting' && (
        <>
          {/* Date & Time */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <Calendar size={13} />
              <span>Date & Time</span>
            </div>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              <input
                type="date"
                readOnly={readOnly}
                value={
                  meetingRecord?.date ||
                  meta.date ||
                  meta.meetingDate ||
                  new Date().toISOString().split('T')[0]
                }
                onChange={(e) =>
                  updatePageMetadata(page.id, {
                    date: e.target.value,
                    meetingDate: e.target.value,
                  })
                }
                className="bg-transparent font-mono text-xs text-[#37352f] dark:text-white focus:outline-none px-1 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)]"
              />
              <input
                type="time"
                readOnly={readOnly}
                value={meetingRecord?.startTime || meta.startTime || '10:00'}
                onChange={(e) => updatePageMetadata(page.id, { startTime: e.target.value })}
                className="bg-transparent font-mono text-xs text-[#37352f] dark:text-white focus:outline-none px-1 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)]"
              />
              <span className="text-[#787774]">–</span>
              <input
                type="time"
                readOnly={readOnly}
                value={meetingRecord?.endTime || meta.endTime || '11:00'}
                onChange={(e) => updatePageMetadata(page.id, { endTime: e.target.value })}
                className="bg-transparent font-mono text-xs text-[#37352f] dark:text-white focus:outline-none px-1 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)]"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <Clock size={13} />
              <span>Status</span>
            </div>
            <div className="flex-1">
              <select
                disabled={readOnly}
                value={meetingRecord?.status || meta.status || 'Zaplanowane'}
                onChange={(e) => updatePageMetadata(page.id, { status: e.target.value })}
                className="px-2 py-0.5 rounded-[4px] bg-[#f1f1ef] dark:bg-[#252525] text-[#37352f] dark:text-white font-medium text-xs border-none focus:outline-none cursor-pointer"
              >
                {MEETING_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Organizer */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <User size={13} />
              <span>Organizer</span>
            </div>
            <div className="flex-1">
              <input
                type="text"
                readOnly={readOnly}
                value={meetingRecord?.owner || meta.organizer || page.authorName || 'Organizator'}
                onChange={(e) => updatePageMetadata(page.id, { organizer: e.target.value })}
                className="bg-transparent border-none focus:outline-none text-xs text-[#37352f] dark:text-white px-1.5 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)] w-full max-w-xs"
              />
            </div>
          </div>

          {/* Attendees */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <Users size={13} />
              <span>Attendees</span>
            </div>
            <div className="flex-1">
              <input
                type="text"
                readOnly={readOnly}
                value={
                  Array.isArray(meta.attendees)
                    ? meta.attendees.join(', ')
                    : meta.attendees ||
                      (currentWorkspace?.members || []).map((m) => m.name).join(', ') ||
                      'Zespół'
                }
                onChange={(e) =>
                  updatePageMetadata(page.id, {
                    attendees: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Wpisz uczestników po przecinku..."
                className="bg-transparent border-none focus:outline-none text-xs text-[#37352f] dark:text-white px-1.5 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)] w-full max-w-md"
              />
            </div>
          </div>

          {/* Related Project */}
          <div className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0">
              <FolderKanban size={13} />
              <span>Related Project</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <select
                disabled={readOnly}
                value={meetingRecord?.relationProjectId || meta.projectId || ''}
                onChange={(e) => {
                  const projId = e.target.value;
                  const proj = allProjects.find((p) => p.id === projId);
                  updatePageMetadata(page.id, {
                    projectId: projId,
                    projectTitle: proj?.title || '',
                  });
                }}
                className="px-2 py-0.5 rounded-[4px] bg-[#f1f1ef] dark:bg-[#252525] text-[#37352f] dark:text-white font-medium text-xs border-none focus:outline-none cursor-pointer"
              >
                <option value="">Brak przypisanego projektu</option>
                {allProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    🚀 {proj.title}
                  </option>
                ))}
              </select>
              {(meetingRecord?.relationProjectId || meta.projectId) && (
                <button
                  type="button"
                  onClick={() => {
                    const pid = meetingRecord?.relationProjectId || meta.projectId;
                    if (pid) {
                      setActivePageId(pid);
                      setActiveView('doc');
                    }
                  }}
                  className="text-[11px] text-[#2383e2] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink size={11} />
                  <span>Otwórz projekt</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Items / Follow-up Tasks Generator directly on Meeting Page */}
          <div className="flex items-start min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5 py-1">
            <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0 mt-0.5">
              <Sparkles size={13} />
              <span>Follow-up Tasks</span>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {allTasks
                  .filter(
                    (t) =>
                      t.rawTask?.pageId === page.id || t.relationProjectId === page.id
                  )
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openTaskAsPage(t.id)}
                      className="px-2 py-0.5 rounded-[4px] bg-[#fbfbfa] dark:bg-[#202020] hover:bg-[#f1f1ef] border border-[rgba(55,53,47,0.12)] text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t.isCompleted ? '✅' : '☑️'}</span>
                      <span className={t.isCompleted ? 'line-through text-[#9b9a97]' : 'font-medium'}>
                        {t.title}
                      </span>
                      <span className="text-[10px] text-[#787774]">({t.assignee})</span>
                    </button>
                  ))}
              </div>
              {!readOnly && (
                <div className="flex flex-wrap items-center gap-1.5 max-w-lg">
                  <input
                    type="text"
                    value={newActionItemTitle}
                    onChange={(e) => setNewActionItemTitle(e.target.value)}
                    placeholder="+ Utwórz zadanie follow-up z tego spotkania..."
                    className="flex-1 min-w-[180px] bg-transparent border-b border-dashed border-[rgba(55,53,47,0.18)] focus:border-[#2383e2] px-1 py-0.5 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newActionItemAssignee}
                    onChange={(e) => setNewActionItemAssignee(e.target.value)}
                    placeholder="Osoba..."
                    className="w-24 bg-transparent border-b border-dashed border-[rgba(55,53,47,0.18)] focus:border-[#2383e2] px-1 py-0.5 text-xs focus:outline-none"
                  />
                  {newActionItemTitle.trim() && (
                    <button
                      type="button"
                      onClick={async () => {
                        const relProjId = meetingRecord?.relationProjectId || meta.projectId || page.id;
                        const relProjTitle =
                          meetingRecord?.relationProjectTitle || meta.projectTitle || page.title;
                        await addTask({
                          title: newActionItemTitle.trim(),
                          status: 'Do zrobienia',
                          priority: 'Wysoki',
                          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
                          tag: 'Spotkanie',
                          assignee:
                            newActionItemAssignee.trim() ||
                            meetingRecord?.owner ||
                            'Ty',
                          pageId: page.id,
                          relationPageId: relProjId,
                          relationPageTitle: relProjTitle,
                        });
                        setNewActionItemTitle('');
                        setNewActionItemAssignee('');
                        addNotification(
                          'Dodano zadanie ze spotkania',
                          'Zadanie follow-up jest teraz widoczne w bazie Tasks oraz w projekcie.',
                          'success'
                        );
                      }}
                      className="px-2.5 py-0.5 bg-[#2383e2] text-white rounded text-[11px] font-medium cursor-pointer"
                    >
                      + Zadanie
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* 4. CUSTOM USER-DEFINED PROPERTIES                                     */}
      {/* ===================================================================== */}
      {Object.entries(customProps).map(([propKey, propVal]) => (
        <div
          key={propKey}
          className="flex items-center min-h-[28px] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[4px] px-1.5 group/prop"
        >
          <div className="w-40 flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] shrink-0 truncate">
            <span className="text-[11px] font-mono">Aa</span>
            <span className="truncate">{propKey}</span>
          </div>
          <div className="flex-1 flex items-center justify-between gap-2">
            <input
              type="text"
              readOnly={readOnly}
              value={propVal}
              onChange={(e) => handleUpdateCustomProperty(propKey, e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs text-[#37352f] dark:text-white px-1.5 py-0.5 rounded hover:bg-[rgba(55,53,47,0.05)] flex-1"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleDeleteCustomProperty(propKey)}
                className="opacity-0 group-hover/prop:opacity-100 text-[#9b9a97] hover:text-rose-500 p-0.5 cursor-pointer"
                title="Usuń właściwość"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* + Add a property button (Notion 1:1) */}
      {!readOnly && (
        <div className="pt-1 px-1.5">
          {showAddProp ? (
            <form onSubmit={handleAddCustomProperty} className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                autoFocus
                value={newPropKey}
                onChange={(e) => setNewPropKey(e.target.value)}
                placeholder="Nazwa właściwości (np. Budżet, Klient)..."
                className="px-2 py-1 rounded bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.14)] text-xs focus:outline-none"
              />
              <input
                type="text"
                value={newPropValue}
                onChange={(e) => setNewPropValue(e.target.value)}
                placeholder="Wartość..."
                className="px-2 py-1 rounded bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.14)] text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-[#37352f] text-white rounded text-xs font-medium cursor-pointer"
              >
                Dodaj
              </button>
              <button
                type="button"
                onClick={() => setShowAddProp(false)}
                className="text-xs text-[#787774] hover:text-[#37352f] cursor-pointer"
              >
                Anuluj
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddProp(true)}
              className="text-[11px] text-[#787774] hover:text-[#37352f] dark:hover:text-white flex items-center gap-1 cursor-pointer py-0.5"
            >
              <Plus size={12} />
              <span>Add a property</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
