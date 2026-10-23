import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ArrowRight,
  FileText,
  Users,
  CheckSquare,
  MessageSquare,
  BellOff,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { WorkspaceNotification } from '../types/workspace';

export const ToastContainer: React.FC = () => {
  const {
    activeToasts,
    dismissToast,
    markNotificationAsRead,
    setActivePageId,
    setActiveView,
    switchWorkspace,
    isQuietMode,
    toggleQuietMode,
  } = useWorkspace();

  if (activeToasts.length === 0) return null;

  const handleAction = (toast: WorkspaceNotification) => {
    markNotificationAsRead(toast.id);
    dismissToast(toast.id);

    if (toast.pageId) {
      setActivePageId(toast.pageId);
      setActiveView('doc');
      return;
    }

    if (toast.teamId) {
      switchWorkspace(toast.teamId);
      setActiveView('teams');
      return;
    }

    if (toast.taskId) {
      setActiveView('tasks');
      return;
    }

    if (toast.category === 'team') {
      setActiveView('teams');
      return;
    }

    if (toast.category === 'task') {
      setActiveView('tasks');
      return;
    }
  };

  const getIcon = (type: WorkspaceNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  const getCategoryBadge = (cat?: WorkspaceNotification['category']) => {
    switch (cat) {
      case 'team':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.2 rounded-full border border-purple-200/50">
            <Users size={9} /> Zespół
          </span>
        );
      case 'task':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded-full border border-amber-200/50">
            <CheckSquare size={9} /> Zadanie
          </span>
        );
      case 'doc':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded-full border border-blue-200/50">
            <FileText size={9} /> Notatka
          </span>
        );
      case 'comment':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-200/50">
            <MessageSquare size={9} /> Komentarz
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none max-w-sm w-full px-3 sm:px-0"
    >
      {/* Quick Anti-Spam Control Toolbar */}
      <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md px-2 py-0.8 rounded-full shadow-md text-[10px] text-zinc-300 select-none animate-in fade-in duration-150">
        <button
          type="button"
          onClick={toggleQuietMode}
          className="flex items-center gap-1 hover:text-white cursor-pointer px-1 py-0.5 rounded transition-colors"
          title="Włącz tryb skupienia (wycisz wszystkie wyskakujące dymki)"
        >
          <BellOff size={10} className="text-amber-400" />
          <span>Wycisz dymki</span>
        </button>
      </div>

      {activeToasts.map((toast) => {
        const hasAction = Boolean(toast.pageId || toast.teamId || toast.taskId || toast.actionLabel);
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-200 transform translate-y-0 opacity-100 flex items-start gap-2.5 group animate-in slide-in-from-bottom-2 fade-in duration-150"
          >
            <div className="mt-0.5">{getIcon(toast.type)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                {getCategoryBadge(toast.category)}
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {toast.title}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                {toast.message}
              </p>

              {hasAction && (
                <button
                  type="button"
                  onClick={() => handleAction(toast)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                >
                  <span>
                    {toast.actionLabel ||
                      (toast.pageId
                        ? 'Otwórz stronę'
                        : toast.teamId
                        ? 'Przejdź do zespołu'
                        : toast.taskId
                        ? 'Zobacz zadanie'
                        : 'Szczegóły')}
                  </span>
                  <ArrowRight size={11} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0 -mr-1 -mt-1"
              title="Zamknij"
              aria-label="Zamknij powiadomienie"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
