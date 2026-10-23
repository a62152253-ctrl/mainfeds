import React, { useState } from 'react';
import {
  Search,
  FileText,
  CheckSquare,
  Clock,
  Eye,
  Bell,
  Tag,
  ArrowRight,
  Plus,
  Share2,
  Maximize2,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Info,
  ExternalLink,
  Zap,
  Users,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { NotificationsModal } from './NotificationsModal';

interface RightSidebarProps {
  onToggleFocusMode?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ onToggleFocusMode }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const workspaceCtx = useWorkspace();
  const { user } = useAuth();
  const {
    tasks,
    pages,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    switchWorkspace,
    setIsSearchOpen,
    setActivePageId,
    setActiveView,
    createPage,
    addTask,
    setSelectedTag,
  } = workspaceCtx;

  // Compute dynamic tag counts from real pages and tasks
  const tagFrequency: Record<string, number> = {};
  pages.forEach((p) => {
    (p.tags || []).forEach((t) => {
      tagFrequency[t] = (tagFrequency[t] || 0) + 1;
    });
  });
  tasks.forEach((t) => {
    if (t.tag) {
      tagFrequency[t.tag] = (tagFrequency[t.tag] || 0) + 1;
    }
  });

  const sortedTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <aside className="w-80 h-full bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 text-xs select-none shadow-xs no-print">
      {/* ========================================================================= */}
      {/* 1. SZYBKI DOSTĘP I SKRÓTY WORKSPACE                                      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Zap size={14} />
            </div>
            <span className="font-bold text-sm text-gray-900">Szybki Dostęp</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Zsynchronizowano</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-1.5 pt-1">
          <button
            onClick={async () => {
              const newId = await createPage(undefined, 'Nowy dokument');
              if (newId) {
                setActivePageId(newId);
                setActiveView('doc');
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-blue-50/70 hover:bg-blue-100 text-blue-800 font-semibold text-xs border border-blue-200/60 transition-colors cursor-pointer text-left"
          >
            <Plus size={14} className="text-blue-600" />
            <span>Nowa notatka</span>
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50/80 hover:bg-gray-100 text-gray-700 font-medium text-xs border border-gray-200/70 transition-colors cursor-pointer text-left"
          >
            <Search size={14} className="text-gray-400" />
            <span>Szukaj w notatkach</span>
            <kbd className="ml-auto text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">^K</kbd>
          </button>

          <button
            onClick={() => setActiveView('kanban')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50/80 hover:bg-gray-100 text-gray-700 font-medium text-xs border border-gray-200/70 transition-colors cursor-pointer text-left"
          >
            <CheckSquare size={14} className="text-gray-400" />
            <span>Tablica zadań Kanban</span>
          </button>

          <button
            onClick={() => setActiveView('all-pages')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50/80 hover:bg-gray-100 text-gray-700 font-medium text-xs border border-gray-200/70 transition-colors cursor-pointer text-left"
          >
            <FileText size={14} className="text-gray-400" />
            <span>Wszystkie dokumenty</span>
          </button>

          <button
            onClick={() => setActiveView('teams')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-800 font-medium text-xs border border-indigo-200/60 transition-colors cursor-pointer text-left"
          >
            <Users size={14} className="text-indigo-600" />
            <span>Pokoje zespołów (Teams)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. POWIADOMIENIA (REAL FIRESTORE NOTIFICATIONS)                          */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-gray-700" />
            <span className="font-bold text-sm text-gray-900">Powiadomienia</span>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadNotificationsCount > 0 && (
              <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full border border-rose-100">
                {unreadNotificationsCount} nowe
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
            >
              Wszystkie
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-center text-gray-400 text-xs">
              Brak nowych powiadomień. Akcje z dokumentów i zespołów pojawią się tutaj.
            </div>
          ) : (
            notifications.slice(0, 4).map((notif) => {
              const handleCardClick = () => {
                markNotificationAsRead(notif.id);
                if (notif.pageId) {
                  setActivePageId(notif.pageId);
                  setActiveView('doc');
                } else if (notif.teamId) {
                  switchWorkspace(notif.teamId);
                  setActiveView('teams');
                } else if (notif.taskId) {
                  setActiveView('tasks');
                } else if (notif.category === 'team') {
                  setActiveView('teams');
                } else if (notif.category === 'task') {
                  setActiveView('tasks');
                }
              };

              return (
                <div
                  key={notif.id}
                  onClick={handleCardClick}
                  className={`flex items-start gap-2.5 p-2 rounded-xl transition-all cursor-pointer border ${
                    notif.read
                      ? 'border-transparent hover:bg-gray-50'
                      : 'bg-blue-50/40 border-blue-100 hover:bg-blue-50/70'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center shrink-0 text-xs mt-0.5 ${
                      notif.type === 'success'
                        ? 'bg-emerald-50 text-emerald-600'
                        : notif.type === 'warning'
                        ? 'bg-amber-50 text-amber-600'
                        : notif.type === 'error'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {notif.type === 'success' ? (
                      <CheckCircle2 size={13} />
                    ) : notif.type === 'warning' ? (
                      <AlertTriangle size={13} />
                    ) : notif.type === 'error' ? (
                      <AlertCircle size={13} />
                    ) : (
                      <Info size={13} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 font-semibold leading-snug truncate">
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate leading-snug mt-0.5">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-0.5 block font-mono">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. NAJPOPULARNIEJSZE TAGI (DYNAMIC FROM FIRESTORE)                       */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center gap-2">
          <Tag size={15} className="text-gray-700" />
          <span className="font-bold text-sm text-gray-900">Najpopularniejsze tagi</span>
        </div>

        {sortedTags.length === 0 ? (
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-center text-gray-400 text-xs">
            Brak tagów. Dodaj tag (#) w edytorze dokumentu lub zadaniu.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {sortedTags.map(([tagName, count]) => (
              <button
                key={tagName}
                onClick={() => {
                  setSelectedTag(tagName);
                  setActiveView('all-pages');
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border bg-gray-50/80 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer text-left"
              >
                <span className="font-medium text-gray-700 truncate">#{tagName}</span>
                <span className="text-[11px] font-mono text-gray-400 ml-1">{count}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setActiveView('all-pages')}
          className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 pt-1 cursor-pointer"
        >
          <span>Zobacz wszystkie strony</span>
          <ArrowRight size={11} />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. SZYBKI DOSTĘP (SKRÓTY KLAWISZOWE)                                     */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <span>⚡</span>
            <span>Szybki dostęp</span>
          </span>
        </div>

        <div className="space-y-1.5">
          <button
            onClick={async () => {
              const id = await createPage(undefined, 'Nowy dokument');
              if (id) {
                setActivePageId(id);
                setActiveView('doc');
              }
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-gray-400" />
              <span>Nowa strona</span>
            </div>
            <kbd className="text-[10px] bg-gray-100 text-gray-500 font-mono px-1.5 py-0.5 rounded border border-gray-200">
              Ctrl + N
            </kbd>
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-gray-400" />
              <span>Szukaj</span>
            </div>
            <kbd className="text-[10px] bg-gray-100 text-gray-500 font-mono px-1.5 py-0.5 rounded border border-gray-200">
              Ctrl + K
            </kbd>
          </button>

          <button
            onClick={() => onToggleFocusMode && onToggleFocusMode()}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Maximize2 size={14} className="text-gray-400" />
              <span>Tryb skupienia</span>
            </div>
            <kbd className="text-[10px] bg-gray-100 text-gray-500 font-mono px-1.5 py-0.5 rounded border border-gray-200">
              Ctrl + Shift + F
            </kbd>
          </button>

          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Download size={14} className="text-gray-400" />
              <span>Eksportuj</span>
            </div>
            <kbd className="text-[10px] bg-gray-100 text-gray-500 font-mono px-1.5 py-0.5 rounded border border-gray-200">
              Ctrl + E
            </kbd>
          </button>
        </div>
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </aside>
  );
};
