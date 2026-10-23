import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { TaskItem } from '../../types/workspace';

interface MiniCalendarSidecarProps {
  scheduledEventTitle?: string;
  scheduledDate?: string;
  tasks: TaskItem[];
  onNavigateToCalendar?: () => void;
}

export const MiniCalendarSidecar: React.FC<MiniCalendarSidecarProps> = ({
  scheduledEventTitle,
  scheduledDate,
  tasks,
  onNavigateToCalendar,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const targetDate = scheduledDate || todayStr;

  // Filtrujemy zadania z przypisaną datą
  const upcomingTasks = tasks
    .filter((t) => t.dueDate)
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
    .slice(0, 6);

  // Przygotowanie 7 dni tygodnia
  const daysOfWeek = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
  const now = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() + i);
    return {
      dayName: daysOfWeek[d.getDay()],
      dateNum: d.getDate(),
      fullDate: d.toISOString().split('T')[0],
      isToday: i === 0,
      isTarget: d.toISOString().split('T')[0] === targetDate,
    };
  });

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200/90 shadow-lg">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CalendarIcon size={14} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800 truncate">
              Harmonogram & Kalendarz
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Live Calendar Inspector · Komenda @calendar
            </p>
          </div>
        </div>

        {onNavigateToCalendar && (
          <button
            onClick={onNavigateToCalendar}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
            title="Przejdź do pełnego kalendarza"
          >
            <ExternalLink size={11} />
            <span>Pełny kalendarz</span>
          </button>
        )}
      </div>

      {/* Week Days Strip */}
      <div className="p-3 border-b border-slate-100 bg-emerald-50/30">
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((d, i) => (
            <div
              key={i}
              className={`p-1.5 rounded-xl text-center border transition-all ${
                d.isTarget
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                  : d.isToday
                  ? 'bg-white text-emerald-700 border-emerald-300 font-bold'
                  : 'bg-white/60 text-slate-600 border-slate-200'
              }`}
            >
              <div className="text-[9px] uppercase tracking-wider opacity-80">{d.dayName}</div>
              <div className="text-xs mt-0.5">{d.dateNum}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Event Highlight Card */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {scheduledEventTitle && (
          <div className="p-3 bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1">
              <Sparkles size={11} className="text-emerald-600" />
              <span>Nowo zaplanowane wydarzenie</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 leading-snug">
              {scheduledEventTitle}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-emerald-700">
              <span className="flex items-center gap-1">
                <CalendarDays size={11} /> {targetDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} /> Cały dzień
              </span>
            </div>
          </div>
        )}

        {/* Upcoming events list */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Nadchodzące terminy z tablicy:
          </h4>
          <div className="space-y-1.5">
            {upcomingTasks.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Brak zadań z przypisaną datą.</p>
            ) : (
              upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 text-[11px] truncate">{t.title}</p>
                    <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {t.dueDate} · {t.priority}
                    </p>
                  </div>
                  <ChevronRight size={13} className="text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/70 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <span>Synchronizacja terminów</span>
        <span>Widok tygodniowy</span>
      </div>
    </div>
  );
};
