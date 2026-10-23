import React, { useState, useMemo } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  Trash2,
  Check,
  FileText,
  Users,
  CheckSquare,
  MessageSquare,
  Sparkles,
  BellOff,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { WorkspaceNotification, NotificationCategory } from '../types/workspace';

type FilterTab = 'all' | 'unread' | 'team' | 'doc' | 'task';

export const NotificationsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearNotifications,
    setActivePageId,
    setActiveView,
    switchWorkspace,
    isQuietMode,
    toggleQuietMode,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      team: notifications.filter((n) => n.category === 'team').length,
      doc: notifications.filter((n) => n.category === 'doc').length,
      task: notifications.filter((n) => n.category === 'task').length,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'team':
        return notifications.filter((n) => n.category === 'team');
      case 'doc':
        return notifications.filter((n) => n.category === 'doc');
      case 'task':
        return notifications.filter((n) => n.category === 'task');
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  if (!isOpen) return null;

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'przed chwilą';
    if (diffMin < 60) return `${diffMin} min temu`;
    if (diffHour < 24) return `${diffHour} godz. temu`;
    if (diffDay === 1) {
      return `wczoraj, ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return new Date(timestamp).toLocaleDateString([], {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAction = (notif: WorkspaceNotification) => {
    markNotificationAsRead(notif.id);
    onClose();

    if (notif.pageId) {
      setActivePageId(notif.pageId);
      setActiveView('doc');
      return;
    }
    if (notif.teamId) {
      switchWorkspace(notif.teamId);
      setActiveView('teams');
      return;
    }
    if (notif.taskId) {
      setActiveView('tasks');
      return;
    }
    if (notif.category === 'team') {
      setActiveView('teams');
      return;
    }
    if (notif.category === 'task') {
      setActiveView('tasks');
      return;
    }
  };

  const getIcon = (type: WorkspaceNotification['type']) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-7 h-7 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={15} />
          </div>
        );
      case 'warning':
        return (
          <div className="w-7 h-7 rounded-[4px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
        );
      case 'error':
        return (
          <div className="w-7 h-7 rounded-[4px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle size={15} />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-7 h-7 rounded-[4px] bg-blue-50 dark:bg-blue-950/40 text-[#2383e2] flex items-center justify-center shrink-0">
            <Info size={15} />
          </div>
        );
    }
  };

  const getCategoryBadge = (cat?: NotificationCategory) => {
    switch (cat) {
      case 'team':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.2 rounded-[3px]">
            <Users size={10} /> Zespół
          </span>
        );
      case 'task':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded-[3px]">
            <CheckSquare size={10} /> Zadanie
          </span>
        );
      case 'doc':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded-[3px]">
            <FileText size={10} /> Dokument
          </span>
        );
      case 'comment':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-[3px]">
            <MessageSquare size={10} /> Komentarz
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[8px] w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-[#37352f] dark:text-[#d4d4d4]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#1c1c1c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#2383e2] text-white flex items-center justify-center shadow-2xs">
              <Bell size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#37352f] dark:text-white">Centrum Powiadomień</h3>
                {counts.unread > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-[3px] bg-[#2383e2]/15 text-[#2383e2] font-medium">
                    {counts.unread} nowe
                  </span>
                )}
              </div>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-0.5">
                Bieżące aktualności, wzmianki i zadania
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleQuietMode}
              title={isQuietMode ? 'Włącz dymki' : 'Wycisz dymki (tryb skupienia)'}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-[4px] border transition-all cursor-pointer ${
                isQuietMode
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200'
                  : 'text-[#787774] dark:text-[#9b9a97] border-transparent hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
              }`}
            >
              {isQuietMode ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  <span>Skupienie</span>
                </>
              ) : (
                <>
                  <BellOff size={13} />
                  <span className="hidden sm:inline">Wycisz</span>
                </>
              )}
            </button>

            {counts.unread > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                title="Oznacz wszystkie jako przeczytane"
                className="inline-flex items-center gap-1 text-xs text-[#787774] dark:text-[#9b9a97] hover:text-[#2383e2] px-2 py-1 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline">Przeczytane</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                title="Wyczyść historię"
                className="p-1 text-[#787774] hover:text-red-600 rounded-[4px] hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#787774] hover:text-[#37352f] dark:hover:text-white rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] cursor-pointer transition-colors ml-1"
              title="Zamknij"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pt-2 pb-1.5 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] bg-white dark:bg-[#202020] flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-[4px] text-xs font-medium whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#37352f] dark:bg-white text-white dark:text-[#37352f] shadow-2xs'
                : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            <span>Wszystkie</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full ${
                activeTab === 'all' ? 'bg-white/20 dark:bg-black/20' : 'bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)]'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`px-2.5 py-1 rounded-[4px] text-xs font-medium whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-[#2383e2] text-white shadow-2xs'
                : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            <span>Nieprzeczytane</span>
            {counts.unread > 0 && (
              <span
                className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                  activeTab === 'unread' ? 'bg-white/30 text-white' : 'bg-[#2383e2]/15 text-[#2383e2]'
                }`}
              >
                {counts.unread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`px-2.5 py-1 rounded-[4px] text-xs font-medium whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'team'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            <Users size={12} />
            <span>Zespoły</span>
            {counts.team > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                {counts.team}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('doc')}
            className={`px-2.5 py-1 rounded-[4px] text-xs font-medium whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'doc'
                ? 'bg-[#37352f] dark:bg-white text-white dark:text-[#37352f] shadow-2xs'
                : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            <FileText size={12} />
            <span>Dokumenty</span>
            {counts.doc > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)]">
                {counts.doc}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`px-2.5 py-1 rounded-[4px] text-xs font-medium whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'task'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            <CheckSquare size={12} />
            <span>Zadania</span>
            {counts.task > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                {counts.task}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 px-4 text-[#787774] dark:text-[#9b9a97]">
              <div className="w-12 h-12 rounded-[4px] bg-[rgba(55,53,47,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(55,53,47,0.08)] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-center mx-auto mb-2.5 opacity-60">
                <Sparkles size={22} />
              </div>
              <h4 className="text-sm font-medium text-[#37352f] dark:text-white">
                {activeTab === 'unread'
                  ? 'Wszystko przeczytane!'
                  : activeTab === 'team'
                  ? 'Brak powiadomień zespołowych'
                  : activeTab === 'doc'
                  ? 'Brak powiadomień o dokumentach'
                  : activeTab === 'task'
                  ? 'Brak powiadomień o zadaniach'
                  : 'Brak powiadomień'}
              </h4>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-1 max-w-xs mx-auto">
                {activeTab === 'unread'
                  ? 'Jesteś na bieżąco ze wszystkimi zmianami w Twoich projektach.'
                  : 'Nowe aktualizacje i powiadomienia pojawią się tutaj w czasie rzeczywistym.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const hasAction = Boolean(
                notif.pageId || notif.teamId || notif.taskId || notif.actionLabel
              );
              return (
                <div
                  key={notif.id}
                  className={`relative group p-3 rounded-[6px] border transition-all duration-150 flex items-start gap-3 ${
                    notif.read
                      ? 'bg-white dark:bg-[#202020] border-[rgba(55,53,47,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(55,53,47,0.02)]'
                      : 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 shadow-2xs'
                  }`}
                >
                  {/* Status Icon */}
                  {getIcon(notif.type)}

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-10">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {getCategoryBadge(notif.category)}
                      <h4
                        className={`text-xs font-semibold leading-tight ${
                          notif.read ? 'text-[#37352f] dark:text-[#d4d4d4]' : 'text-[#37352f] dark:text-white'
                        }`}
                      >
                        {notif.title}
                      </h4>
                    </div>

                    <p className="text-xs text-[#787774] dark:text-[#9b9a97] leading-snug">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">
                        {formatRelativeTime(notif.timestamp)}
                      </span>

                      {hasAction && (
                        <button
                          type="button"
                          onClick={() => handleAction(notif)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#2383e2] hover:underline cursor-pointer"
                        >
                          <span>
                            {notif.actionLabel ||
                              (notif.pageId
                                ? 'Otwórz stronę'
                                : notif.teamId
                                ? 'Przejdź do zespołu'
                                : notif.taskId
                                ? 'Zobacz zadanie'
                                : 'Przejdź')}
                          </span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Item Actions */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => markNotificationAsRead(notif.id)}
                      title={notif.read ? 'Przeczytane' : 'Oznacz jako przeczytane'}
                      className={`p-1 rounded-[3px] cursor-pointer transition-colors ${
                        notif.read
                          ? 'text-[#787774] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)]'
                          : 'text-[#2383e2] bg-[#2383e2]/10 hover:bg-[#2383e2]/20'
                      }`}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNotification(notif.id)}
                      title="Usuń powiadomienie"
                      className="p-1 text-[#787774] hover:text-red-600 rounded-[3px] hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] bg-[#fbfbfa] dark:bg-[#1c1c1c] flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
          <div className="text-[11px]">
            {counts.unread > 0 ? (
              <span>
                <strong className="text-[#37352f] dark:text-white">{counts.unread}</strong> nieprzeczytanych z{' '}
                <strong className="text-[#37352f] dark:text-white">{counts.all}</strong>
              </span>
            ) : (
              <span>Wszystkie przeczytane ({counts.all})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {counts.unread > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="text-xs text-[#2383e2] hover:underline font-medium cursor-pointer transition-colors"
              >
                Oznacz wszystkie
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 bg-white dark:bg-[#202020] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] text-[#37352f] dark:text-[#d4d4d4] rounded-[4px] cursor-pointer transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
