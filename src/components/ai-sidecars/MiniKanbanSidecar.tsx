import React from 'react';
import {
  CheckSquare,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { TaskItem, TaskStatus, Priority } from '../../types/workspace';

interface MiniKanbanSidecarProps {
  tasks: TaskItem[];
  highlightedTaskId?: string;
  onUpdateStatus?: (taskId: string, newStatus: TaskStatus) => void;
  onNavigateToTasks?: () => void;
}

export const MiniKanbanSidecar: React.FC<MiniKanbanSidecarProps> = ({
  tasks,
  highlightedTaskId,
  onUpdateStatus,
  onNavigateToTasks,
}) => {
  const todoTasks = tasks.filter((t) => t.status === 'Do zrobienia');
  const inProgressTasks = tasks.filter((t) => t.status === 'W trakcie');
  const doneTasks = tasks.filter((t) => t.status === 'Zrobione');

  const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
      case 'Krytyczny':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Wysoki':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Średni':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const cycleStatus = (status: TaskStatus): TaskStatus => {
    if (status === 'Do zrobienia') return 'W trakcie';
    if (status === 'W trakcie') return 'Zrobione';
    return 'Do zrobienia';
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200/90 shadow-lg">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <CheckSquare size={14} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800 truncate">
              Tablica Kanban & Zadania
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Live Task Inspector · Komenda @task
            </p>
          </div>
        </div>

        {onNavigateToTasks && (
          <button
            onClick={onNavigateToTasks}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
            title="Przejdź do pełnej tablicy zadań"
          >
            <ExternalLink size={11} />
            <span>Tablica Kanban</span>
          </button>
        )}
      </div>

      {/* Task Columns Summary */}
      <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-around text-center text-xs">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Do zrobienia</span>
          <p className="font-extrabold text-slate-800 text-xs">{todoTasks.length}</p>
        </div>
        <div className="w-px h-6 bg-slate-200" />
        <div>
          <span className="text-[10px] font-bold text-blue-500 uppercase">W trakcie</span>
          <p className="font-extrabold text-blue-600 text-xs">{inProgressTasks.length}</p>
        </div>
        <div className="w-px h-6 bg-slate-200" />
        <div>
          <span className="text-[10px] font-bold text-emerald-500 uppercase">Zrobione</span>
          <p className="font-extrabold text-emerald-600 text-xs">{doneTasks.length}</p>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic text-center py-8">
            Brak zadań w tablicy. Wpisz @task &lt;tytuł&gt; w AI!
          </p>
        ) : (
          tasks.slice(0, 15).map((t) => {
            const isTarget = highlightedTaskId === t.id;
            return (
              <div
                key={t.id}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  isTarget
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {isTarget && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded mb-1">
                        <Sparkles size={9} /> Nowe zadanie
                      </span>
                    )}
                    <h4 className="font-semibold text-slate-800 text-[11px] leading-snug">
                      {t.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[9px]">
                      <span
                        className={`px-1.5 py-0.2 rounded border font-semibold ${getPriorityBadgeClass(
                          t.priority
                        )}`}
                      >
                        {t.priority}
                      </span>
                      {t.tag && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          #{t.tag}
                        </span>
                      )}
                      {t.dueDate && (
                        <span className="text-slate-400 flex items-center gap-0.5">
                          <Clock size={9} /> {t.dueDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status switcher button */}
                  {onUpdateStatus && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(t.id, cycleStatus(t.status))}
                      className="px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-colors border shrink-0 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      title="Zmień status zadania"
                    >
                      {t.status}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/70 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <span>Zadania Kanban</span>
        <span>Metryki przepływu zadań</span>
      </div>
    </div>
  );
};
