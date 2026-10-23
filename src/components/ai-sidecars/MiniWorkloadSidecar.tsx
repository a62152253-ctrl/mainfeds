import React from 'react';
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { TeamMember, TaskItem } from '../../types/workspace';

interface MiniWorkloadSidecarProps {
  members: TeamMember[];
  tasks: TaskItem[];
  onNavigateToTeams?: () => void;
}

export const MiniWorkloadSidecar: React.FC<MiniWorkloadSidecarProps> = ({
  members,
  tasks,
  onNavigateToTeams,
}) => {
  // Obliczenie statystyk obciążenia dla każdego członka
  const workloadStats = members.map((member) => {
    const memberTasks = tasks.filter(
      (t) =>
        t.assignee === member.name ||
        t.assignee === member.email ||
        t.ownerId === member.userId
    );
    const totalHours = memberTasks.reduce((sum, t) => sum + (t.estimatedHours || 4), 0);

    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    if (totalHours > 35) riskLevel = 'high';
    else if (totalHours > 20) riskLevel = 'moderate';

    return {
      member,
      taskCount: memberTasks.length,
      totalHours,
      riskLevel,
    };
  });

  const highRiskCount = workloadStats.filter((w) => w.riskLevel === 'high').length;

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200/90 shadow-lg">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Zap size={14} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800 truncate">
              Obciążenie & Wypalenie
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Workload Inspector · Komenda @burnout
            </p>
          </div>
        </div>

        {onNavigateToTeams && (
          <button
            onClick={onNavigateToTeams}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
            title="Przejdź do pełnej analizy obciążenia"
          >
            <ExternalLink size={11} />
            <span>Pokoje Teams</span>
          </button>
        )}
      </div>

      {/* Burnout Alert Banner */}
      <div className="p-3 border-b border-slate-100 bg-amber-50/40">
        <div className="flex items-start gap-2 text-xs">
          {highRiskCount > 0 ? (
            <>
              <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 text-[11px]">
                  Wykryto ryzyko wypalenia ({highRiskCount} os.)
                </p>
                <p className="text-[10px] text-rose-700 mt-0.5">
                  Zalecane zrównoważenie zadań między członkami zespołu.
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 text-[11px]">
                  Optymalne obciążenie zespołu
                </p>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  Żaden pracownik nie przekracza limitu 35h tygodniowo.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Team Member Workload Breakdown */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {workloadStats.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic text-center py-8">
            Brak przypisanych członków do kalkulacji.
          </p>
        ) : (
          workloadStats.map((item, idx) => (
            <div
              key={item.member.userId || idx}
              className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {(item.member.name || item.member.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-[11px] truncate">
                      {item.member.name || item.member.email.split('@')[0]}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {item.taskCount} zadań · {item.totalHours}h alokacji
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    item.riskLevel === 'high'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : item.riskLevel === 'moderate'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {item.riskLevel === 'high'
                    ? 'Wypalenie'
                    : item.riskLevel === 'moderate'
                    ? 'Umiarkowane'
                    : 'Optymalne'}
                </span>
              </div>

              {/* Workload Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    item.riskLevel === 'high'
                      ? 'bg-rose-500'
                      : item.riskLevel === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min((item.totalHours / 45) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/70 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <span>Kalkulator 40h/tydzień</span>
        <span>Metryka ergonomii pracy</span>
      </div>
    </div>
  );
};
