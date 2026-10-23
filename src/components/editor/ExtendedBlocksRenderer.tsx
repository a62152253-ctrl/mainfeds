import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Users,
  Vote,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  Github,
  HelpCircle,
  ShieldAlert,
  Target,
  FileCode,
  Layers,
  ArrowRight,
  UserCheck,
  Check,
  Plus,
  Trash2,
  Copy,
  Sparkles,
} from 'lucide-react';
import { DocBlock } from '../../types/workspace';
import { LinkedDatabaseBlockView } from './LinkedDatabaseBlockView';

interface ExtendedBlockProps {
  block: DocBlock;
  currentPageId?: string;
  currentPageTitle?: string;
  onUpdate: (updatedBlock: Partial<DocBlock>) => void;
  isPreview?: boolean;
}

export const ExtendedBlockRenderer: React.FC<ExtendedBlockProps> = ({
  block,
  currentPageId,
  currentPageTitle,
  onUpdate,
  isPreview = false,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlockId(id);
    setTimeout(() => setCopiedBlockId(null), 1500);
  };

  // =========================================================================
  // 1. MACIERZ DECYZJI (decision_matrix)
  // =========================================================================
  if (block.type === 'decision_matrix') {
    const data = block.decisionMatrixData || {
      criteria: ['Wydajność', 'Bezpieczeństwo', 'Czas Wdrożenia'],
      options: [
        { name: 'Wariant A (Architektura Local-First)', scores: [9, 10, 8], totalScore: 27 },
        { name: 'Wariant B (Chmura Centralna)', scores: [6, 7, 5], totalScore: 18 },
      ],
    };

    const handleScoreChange = (optIndex: number, critIndex: number, val: number) => {
      const newOptions = data.options.map((opt, oi) => {
        if (oi !== optIndex) return opt;
        const newScores = [...opt.scores];
        newScores[critIndex] = Math.max(1, Math.min(10, val));
        const total = newScores.reduce((sum, s) => sum + s, 0);
        return { ...opt, scores: newScores, totalScore: total };
      });
      // Sort or determine best
      onUpdate({
        decisionMatrixData: {
          ...data,
          options: newOptions,
        },
      });
    };

    const bestOption = [...data.options].sort((a, b) => b.totalScore - a.totalScore)[0];

    return (
      <div className="my-2.5 p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs space-y-3 font-sans transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e9e9e7] dark:border-[#2f2f2f] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[4px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800/60">
              ⚖️ Macierz Decyzji
            </span>
            <input
              type="text"
              disabled={isPreview}
              value={block.content || 'Wybór rozwiązania architektonicznego'}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="font-semibold text-xs bg-transparent border-none focus:outline-none text-[#37352f] dark:text-[#d4d4d4] min-w-[200px]"
              placeholder="Tytuł macierzy decyzji..."
            />
          </div>
          {bestOption && (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-[4px] border border-emerald-200/60 dark:border-emerald-800/60">
              Rekomendowany wariant: 🏆 {bestOption.name} ({bestOption.totalScore} pkt)
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e9e9e7] dark:border-[#2f2f2f] text-[10px] text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider">
                <th className="py-1.5 px-2.5 font-semibold">Opcja / Wariant</th>
                {data.criteria.map((c, ci) => (
                  <th key={ci} className="py-1.5 px-2.5 text-center font-semibold">
                    {c} (1–10)
                  </th>
                ))}
                <th className="py-1.5 px-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">Wynik Łączny</th>
              </tr>
            </thead>
            <tbody>
              {data.options.map((opt, oi) => {
                const isWinner = bestOption && opt.name === bestOption.name;
                return (
                  <tr
                    key={oi}
                    className={`border-b border-[#e9e9e7] dark:border-[#2f2f2f] last:border-b-0 transition-colors ${
                      isWinner
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-medium'
                        : 'hover:bg-[#f7f6f5] dark:hover:bg-[#252525]'
                    }`}
                  >
                    <td className="py-2 px-2.5 text-[#37352f] dark:text-[#d4d4d4]">
                      <div className="flex items-center gap-1.5">
                        {isWinner && <span>⭐</span>}
                        <span>{opt.name}</span>
                      </div>
                    </td>
                    {opt.scores.map((sc, sci) => (
                      <td key={sci} className="py-2 px-2.5 text-center tabular-nums">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          disabled={isPreview}
                          value={sc}
                          onChange={(e) => handleScoreChange(oi, sci, parseInt(e.target.value) || 1)}
                          className="w-10 text-center py-0.5 px-1 bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[3px] text-xs font-semibold focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                    ))}
                    <td className="py-2 px-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400 tabular-nums text-sm">
                      {opt.totalScore} pkt
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. REJESTR RYZYK (risk_register)
  // =========================================================================
  if (block.type === 'risk_register') {
    const risks = block.riskRegisterData || [
      {
        risk: 'Opóźnienia w integracji zewnętrznego API',
        likelihood: 'Średnia',
        impact: 'Wysoki',
        mitigation: 'Implementacja timeoutów oraz lokalnych modeli offline',
      },
      {
        risk: 'Spadek wydajności renderowania przy 500+ blokach',
        likelihood: 'Niska',
        impact: 'Krytyczny',
        mitigation: 'Optymalizacja cyklu życia komponentów i wirtualizacja',
      },
    ];

    return (
      <div className="my-2.5 p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs space-y-3 font-sans transition-all">
        <div className="flex items-center justify-between border-b border-[#e9e9e7] dark:border-[#2f2f2f] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[4px] bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-200/60 dark:border-rose-800/60">
              <ShieldAlert size={13} />
              <span>Rejestr Ryzyk i Środki Zaradcze</span>
            </span>
          </div>
          <span className="text-[11px] text-[#787774] dark:text-[#9b9a97]">
            {risks.length} zidentyfikowane ryzyka
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e9e9e7] dark:border-[#2f2f2f] text-[10px] text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider">
                <th className="py-1.5 px-2.5 font-semibold">Identyfikowane Ryzyko</th>
                <th className="py-1.5 px-2.5 text-center font-semibold">Prawdopodobieństwo</th>
                <th className="py-1.5 px-2.5 text-center font-semibold">Wpływ</th>
                <th className="py-1.5 px-2.5 font-semibold">Plan Mitygacji</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r, ri) => (
                <tr key={ri} className="border-b border-[#e9e9e7] dark:border-[#2f2f2f] last:border-b-0 hover:bg-[#f7f6f5] dark:hover:bg-[#252525] transition-colors">
                  <td className="py-2 px-2.5 font-medium text-[#37352f] dark:text-[#d4d4d4]">{r.risk}</td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                      {r.likelihood}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                      {r.impact}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-[#555] dark:text-[#aaa]">{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. KAMIENIE MILOWE ROADMAPA (milestone_roadmap)
  // =========================================================================
  if (block.type === 'milestone_roadmap') {
    const milestones = block.roadmapData || [
      { quarter: 'Etap 1', title: 'Fundamenty danych i relacyjne modele SQLite', status: 'completed', owner: 'Architekt' },
      { quarter: 'Etap 2', title: 'Pełna gama 80+ profesjonalnych bloków edytora', status: 'in_progress', owner: 'Lead Dev' },
      { quarter: 'Etap 3', title: 'Wdrożenie produkcyjne i synchronizacja zespołowa', status: 'planned', owner: 'DevOps & Zespół' },
    ];

    const cycleStatus = (index: number) => {
      if (isPreview) return;
      const order: Array<'planned' | 'in_progress' | 'completed'> = ['planned', 'in_progress', 'completed'];
      const current = milestones[index].status || 'planned';
      const next = order[(order.indexOf(current) + 1) % order.length];
      const newMs = [...milestones];
      newMs[index] = { ...newMs[index], status: next };
      onUpdate({ roadmapData: newMs });
    };

    return (
      <div className="my-2.5 p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs space-y-3 font-sans transition-all">
        <div className="flex items-center justify-between border-b border-[#e9e9e7] dark:border-[#2f2f2f] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[4px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 border border-blue-200/60 dark:border-blue-800/60">
              🗺️ Roadmapa
            </span>
            <input
              type="text"
              disabled={isPreview}
              value={block.content || 'Harmonogram Realizacji Projektu'}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="text-xs font-bold text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none"
              placeholder="Tytuł roadmapy..."
            />
          </div>
          <span className="text-[10px] text-[#787774] dark:text-[#9b9a97]">
            Kliknij status, aby przełączyć
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {milestones.map((m, mi) => (
            <div
              key={mi}
              className={`p-3 rounded-[6px] border transition-all ${
                m.status === 'completed'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60 text-[#37352f] dark:text-[#d4d4d4]'
                  : m.status === 'in_progress'
                  ? 'bg-white dark:bg-[#191919] border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/10 text-[#37352f] dark:text-white'
                  : 'bg-[#f7f6f5] dark:bg-[#252525] border-[#e9e9e7] dark:border-[#2f2f2f] text-[#787774] dark:text-[#9b9a97]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-bold tracking-wider uppercase text-[10px] text-[#787774] dark:text-[#9b9a97]">{m.quarter}</span>
                <button
                  type="button"
                  onClick={() => cycleStatus(mi)}
                  className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold cursor-pointer transition-colors ${
                    m.status === 'completed'
                      ? 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                      : m.status === 'in_progress'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m.status === 'completed' ? 'Ukończono' : m.status === 'in_progress' ? 'W toku' : 'Planowane'}
                </button>
              </div>
              <p className="text-xs font-semibold leading-snug">{m.title}</p>
              {m.owner && (
                <p className="text-[10px] text-[#787774] dark:text-[#9b9a97] mt-1.5 flex items-center gap-1">
                  <span>👤</span>
                  <span>{m.owner}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. ANALIZA SWOT (swot_analysis)
  // =========================================================================
  if (block.type === 'swot_analysis') {
    const swot = block.swotData || {
      strengths: ['Baza SQLite zero-lag w przeglądarce', 'Wieloźródłowy silnik Deep Research (4+ domeny)'],
      weaknesses: ['Wymaga pamięci lokalnej przeglądarki'],
      opportunities: ['Rozbudowa o kolejne akademickie rejestry wiedzy'],
      threats: ['Zmieniające się zewnętrzne API'],
    };

    return (
      <div className="my-2.5 p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs space-y-3 font-sans transition-all">
        <div className="flex items-center gap-2 border-b border-[#e9e9e7] dark:border-[#2f2f2f] pb-2.5">
          <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-200/60 dark:border-amber-800/60">
            🧭 Analiza Strategiczna SWOT
          </span>
          <span className="text-xs font-semibold text-[#37352f] dark:text-[#d4d4d4]">
            {block.content || 'Ocena strategiczna projektu'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-[6px] bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] mb-1.5 flex items-center gap-1">
              <span>💪</span>
              <span>Mocne Strony (Strengths)</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[#37352f] dark:text-[#d4d4d4] text-[11px]">
              {swot.strengths.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-[6px] bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <h4 className="font-bold text-amber-800 dark:text-amber-300 text-[11px] mb-1.5 flex items-center gap-1">
              <span>⚠️</span>
              <span>Słabe Strony (Weaknesses)</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[#37352f] dark:text-[#d4d4d4] text-[11px]">
              {swot.weaknesses.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-[6px] bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
            <h4 className="font-bold text-blue-800 dark:text-blue-300 text-[11px] mb-1.5 flex items-center gap-1">
              <span>🚀</span>
              <span>Szanse (Opportunities)</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[#37352f] dark:text-[#d4d4d4] text-[11px]">
              {swot.opportunities.map((o, idx) => (
                <li key={idx}>{o}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-[6px] bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
            <h4 className="font-bold text-rose-800 dark:text-rose-300 text-[11px] mb-1.5 flex items-center gap-1">
              <span>🛡️</span>
              <span>Zagrożenia (Threats)</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[#37352f] dark:text-[#d4d4d4] text-[11px]">
              {swot.threats.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. KARTA KPI / SCORECARD (kpi_scorecard)
  // =========================================================================
  if (block.type === 'kpi_scorecard') {
    const kpi = block.kpiScorecardData || {
      metricName: 'Czas Reakcji Edytora',
      currentValue: '95 ms',
      targetValue: '< 150 ms',
      trendPercent: '+35% wydajniej',
      status: 'on_track' as const,
    };

    return (
      <div className="my-2.5 p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs flex flex-wrap items-center justify-between gap-4 font-sans transition-all">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-[#787774] dark:text-[#9b9a97] tracking-wider">
            Karta Wskaźnika KPI
          </span>
          <h4 className="text-sm font-bold text-[#37352f] dark:text-white">{kpi.metricName}</h4>
          <p className="text-[11px] text-[#787774] dark:text-[#9b9a97]">Cel docelowy: {kpi.targetValue}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-black text-[#2383e2] dark:text-[#529cca] tabular-nums">
              {kpi.currentValue}
            </span>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
              <span>{kpi.trendPercent}</span>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold ${
              kpi.status === 'on_track'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
            }`}
          >
            {kpi.status === 'on_track' ? 'W Normie' : 'Wymaga Uwagi'}
          </span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 6. ENDPOINT API (api_endpoint)
  // =========================================================================
  if (block.type === 'api_endpoint') {
    const api = block.apiEndpointData || {
      method: 'GET' as const,
      path: '/api/v1/workspace/pages',
      status: 200,
      responseJson: '{\n  "status": "success",\n  "count": 12,\n  "engine": "local_sqlite"\n}',
    };

    return (
      <div className="my-2.5 p-4 rounded-[6px] bg-[#111827] text-white font-mono text-xs shadow-md space-y-2.5 border border-[#1f2937]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-[3px] font-bold text-[10px] ${
                api.method === 'GET'
                  ? 'bg-blue-600 text-white'
                  : api.method === 'POST'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {api.method}
            </span>
            <span className="text-slate-200 text-xs font-semibold">{api.path}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[3px] bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              {api.status} OK
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(api.responseJson || '', block.id)}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Copy size={11} />
              <span>{copiedBlockId === block.id ? 'Skopiowano' : 'Kopiuj'}</span>
            </button>
          </div>
        </div>

        {api.responseJson && (
          <pre className="p-3 rounded-[4px] bg-black/60 text-[11px] text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800">
            {api.responseJson}
          </pre>
        )}
      </div>
    );
  }

  // =========================================================================
  // 7. PUNKT AGENDY ZE SPOTKANIA (event_schedule)
  // =========================================================================
  if (block.type === 'event_schedule') {
    const sched = block.eventScheduleData || {
      timeStart: '10:00',
      timeEnd: '10:45',
      title: 'Wprowadzenie i omówienie celów kwartału',
      speakerOrLead: 'Prowadzący spotkanie',
      roomOrLink: 'Sala konferencyjna / Online',
    };

    return (
      <div className="my-2 p-3 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border-l-3 border-amber-500 border-t border-r border-b border-[#e9e9e7] dark:border-[#2f2f2f] flex items-center justify-between gap-3 text-xs shadow-2xs font-sans">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0">
            <Clock size={13} />
            <span>
              {sched.timeStart} – {sched.timeEnd}
            </span>
          </div>
          <div>
            <p className="font-semibold text-[#37352f] dark:text-[#d4d4d4]">{sched.title}</p>
            {sched.speakerOrLead && (
              <p className="text-[10px] text-[#787774] dark:text-[#9b9a97]">Prowadzi: {sched.speakerOrLead}</p>
            )}
          </div>
        </div>

        {sched.roomOrLink && (
          <span className="px-2 py-0.5 rounded-[4px] bg-white dark:bg-[#191919] text-[#555] dark:text-[#aaa] text-[10px] border border-[#e9e9e7] dark:border-[#2f2f2f] shrink-0">
            📍 {sched.roomOrLink}
          </span>
        )}
      </div>
    );
  }

  // =========================================================================
  // 8. KARTA CYTOWANIA / ŹRÓDŁO NAUKOWE (citation_source)
  // =========================================================================
  if (block.type === 'citation_source') {
    const cit = block.citationData || {
      title: 'Architectures for Real-Time Collaborative Applications and Knowledge Systems',
      authors: 'Kowalski J., Nowak A.',
      journalOrSource: 'ACM Transactions on Software Engineering',
      year: '2026',
      doi: '10.1145/3412345.3412346',
    };

    return (
      <div className="my-2.5 p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs text-xs space-y-2 font-sans transition-all">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-200/60 dark:border-emerald-800/60">
            <BookOpen size={12} />
            <span>Źródło / Cytowanie Naukowe</span>
          </span>
          <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">Rok: {cit.year}</span>
        </div>

        <h4 className="font-bold text-[#37352f] dark:text-white text-xs leading-snug">
          "{cit.title}"
        </h4>
        <p className="text-[11px] text-[#555] dark:text-[#aaa]">
          Autorzy: <span className="font-medium text-[#37352f] dark:text-white">{cit.authors}</span> · <i>{cit.journalOrSource}</i>
        </p>

        {cit.doi && (
          <div className="pt-1 flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
            <span>DOI: {cit.doi}</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-[9px] font-semibold">
              Zweryfikowano
            </span>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 9. PODSUMOWANIE TL;DR (summary_box)
  // =========================================================================
  if (block.type === 'summary_box') {
    return (
      <div className="my-2.5 p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border-l-3 border-[#2383e2] dark:border-[#529cca] border-t border-r border-b border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs space-y-2 font-sans">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#2383e2] dark:text-[#529cca]">
          <Sparkles size={13} />
          <span>PODSUMOWANIE WYKONAWCZE (TL;DR)</span>
        </div>
        <p className="text-xs text-[#37352f] dark:text-[#d4d4d4] leading-relaxed whitespace-pre-wrap">
          {block.content || 'Najważniejsze wnioski i ustalenia w jednym zwięzłym podsumowaniu.'}
        </p>
      </div>
    );
  }

  // =========================================================================
  // 10. BANER INFORMACYJNY (announcement_banner)
  // =========================================================================
  if (block.type === 'announcement_banner') {
    const ann = block.announcementData || {
      title: 'Ważny Komunikat',
      message: block.content || 'Nowa wersja systemu jest już aktywna w workspace.',
      bannerType: 'info' as const,
    };

    return (
      <div className="my-2.5 p-3.5 rounded-[6px] bg-[#2383e2] dark:bg-[#1a5fb4] text-white shadow-xs flex items-center justify-between gap-3 text-xs font-sans">
        <div>
          <h4 className="font-bold text-xs">{ann.title}</h4>
          <p className="text-[11px] text-blue-100">{ann.message}</p>
        </div>
        {ann.actionText && (
          <button className="px-2.5 py-1 rounded-[4px] bg-white text-[#2383e2] font-bold text-[10px] shrink-0 cursor-pointer hover:bg-blue-50">
            {ann.actionText}
          </button>
        )}
      </div>
    );
  }

  // =========================================================================
  // 11. TABELA SPECYFIKACJI TECHNICZNEJ (spec_table)
  // =========================================================================
  if (block.type === 'spec_table') {
    const specs = block.specTableData || [
      { key: 'Wersja API', value: 'v2.4.0 (Studio Kernel)', note: 'Produkcyjna' },
      { key: 'Baza Danych', value: 'SQLite Local-First (Zero-Lag)', note: 'Zoptymalizowano' },
      { key: 'Silnik Badawczy', value: '4+ Niezależne Domeny Online', note: 'Zweryfikowano' },
    ];

    return (
      <div className="my-2.5 p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs space-y-2.5 font-sans">
        <span className="text-[10px] uppercase font-bold text-[#787774] dark:text-[#9b9a97] tracking-wider">
          Specyfikacja Techniczna
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <tbody>
              {specs.map((s, si) => (
                <tr key={si} className="border-b border-[#e9e9e7] dark:border-[#2f2f2f] last:border-b-0 hover:bg-[#f7f6f5] dark:hover:bg-[#252525]">
                  <td className="py-2 px-2.5 font-semibold text-[#37352f] dark:text-[#d4d4d4] w-1/3">
                    {s.key}
                  </td>
                  <td className="py-2 px-2.5 font-mono text-[#37352f] dark:text-white">{s.value}</td>
                  {s.note && <td className="py-2 px-2.5 text-[10px] text-[#787774] dark:text-[#9b9a97]">{s.note}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 12. PIASKOWNICA KODU (code_sandbox)
  // =========================================================================
  if (block.type === 'code_sandbox') {
    const sandbox = block.codeSandboxData || {
      code: '// JavaScript / TypeScript Sandbox\nconst sum = (a: number, b: number) => a + b;\nconsole.log("Wynik obliczeń:", sum(40, 2));',
      language: 'typescript',
      outputConsole: 'Wynik obliczeń: 42',
    };

    return (
      <div className="my-2.5 rounded-[6px] bg-[#111827] text-white font-mono text-xs overflow-hidden shadow-md border border-[#1f2937]">
        <div className="px-3.5 py-2 bg-[#1f2937] flex items-center justify-between border-b border-[#374151] text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <FileCode size={13} className="text-blue-400" />
            <span>Interactive Code Sandbox ({sandbox.language})</span>
          </span>
          <span className="px-2 py-0.5 rounded-[3px] bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            Wykonaj (Run)
          </span>
        </div>
        <pre className="p-3 text-emerald-300 text-xs overflow-x-auto leading-relaxed">
          {sandbox.code}
        </pre>
        {sandbox.outputConsole && (
          <div className="p-2.5 bg-black/60 border-t border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
            <span className="text-slate-500 font-bold">$</span>
            <span>{sandbox.outputConsole}</span>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 13. NOTATKA GŁOSOWA (audio_memo)
  // =========================================================================
  if (block.type === 'audio_memo') {
    const audio = block.audioMemoData || {
      title: 'Notatka Głosowa ze Spotkania Zespołu',
      duration: '02:15',
      recordedAt: 'Dzisiaj, 10:45',
    };

    return (
      <div className="my-2 p-3.5 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs flex items-center justify-between gap-3 text-xs font-sans">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xs cursor-pointer hover:bg-amber-600 transition-colors"
          >
            {isPlayingAudio ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
          </button>
          <div>
            <h4 className="font-semibold text-[#37352f] dark:text-[#d4d4d4]">{audio.title}</h4>
            <span className="text-[10px] text-[#787774] dark:text-[#9b9a97]">{audio.recordedAt}</span>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
          {audio.duration}
        </span>
      </div>
    );
  }

  // =========================================================================
  // 14. DEDYKOWANY PUNKT ACTION ITEM (meeting_action_item)
  // =========================================================================
  if (block.type === 'meeting_action_item') {
    return (
      <div className="my-1.5 p-2.5 rounded-[4px] bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] flex items-center justify-between gap-2 text-xs font-sans">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="checkbox"
            checked={!!block.checked}
            onChange={(e) => onUpdate({ checked: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-[#2383e2]"
          />
          <input
            type="text"
            disabled={isPreview}
            value={block.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Zadanie ze spotkania..."
            className={`w-full bg-transparent border-none focus:outline-none ${
              block.checked ? 'line-through text-[#787774] dark:text-[#777]' : 'font-medium text-[#37352f] dark:text-[#d4d4d4]'
            }`}
          />
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium shrink-0 border border-blue-200/60 dark:border-blue-800/60">
          Action Item
        </span>
      </div>
    );
  }

  // =========================================================================
  // 15. EMBED GITHUB (embed_github)
  // =========================================================================
  if (block.type === 'embed_github') {
    return (
      <div className="my-2.5 p-3.5 rounded-[6px] bg-[#111827] text-white shadow-xs flex items-center justify-between gap-3 text-xs font-sans border border-[#1f2937]">
        <div className="flex items-center gap-2.5">
          <Github size={20} className="text-slate-300" />
          <div>
            <h4 className="font-bold text-xs">{block.content || 'GitHub Repository'}</h4>
            <span className="text-[10px] text-slate-400 font-mono">{block.bookmarkUrl || 'https://github.com'}</span>
          </div>
        </div>
        <a
          href={block.bookmarkUrl || 'https://github.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-[4px] bg-[#1f2937] hover:bg-[#374151] text-white text-[10px] font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>Otwórz</span>
          <ExternalLink size={10} />
        </a>
      </div>
    );
  }

  // =========================================================================
  // 16. INTERAKTYWNY WYKRES ANALITYCZNY SVG (chart & data_metric_bar)
  // =========================================================================
  if (block.type === 'chart' || block.type === 'data_metric_bar') {
    const chartData = block.chartData || {
      chartType: 'bar' as const,
      title: block.content || 'Wykres metryk projektowych',
      unit: '',
      dataPoints: [
        { label: 'Do zrobienia', value: 4, color: '#64748b' },
        { label: 'W trakcie', value: 3, color: '#2383e2' },
        { label: 'Zrobione', value: 8, color: '#10b981' },
      ],
      sourceLabel: 'Dane z Workspace',
    };

    const points = chartData.dataPoints.length > 0
      ? chartData.dataPoints
      : [{ label: 'Brak danych', value: 0, color: '#94a3b8' }];
    const maxVal = Math.max(1, ...points.map((p) => Math.abs(p.value)));
    const totalVal = points.reduce((acc, p) => acc + Math.max(0, p.value), 0);
    const defaultPalette = ['#2383e2', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];

    const handlePointChange = (idx: number, field: 'label' | 'value', rawVal: string) => {
      const nextPoints = points.map((pt, i) => {
        if (i !== idx) return pt;
        if (field === 'label') return { ...pt, label: rawVal };
        const parsed = parseFloat(rawVal);
        return { ...pt, value: Number.isFinite(parsed) ? parsed : 0 };
      });
      onUpdate({
        chartData: {
          ...chartData,
          dataPoints: nextPoints,
        },
      });
    };

    const handleAddPoint = () => {
      onUpdate({
        chartData: {
          ...chartData,
          dataPoints: [
            ...points,
            {
              label: `Seria ${points.length + 1}`,
              value: Math.round(maxVal * 0.6) || 10,
              color: defaultPalette[points.length % defaultPalette.length],
            },
          ],
        },
      });
    };

    const handleRemovePoint = (idx: number) => {
      if (points.length <= 1) return;
      onUpdate({
        chartData: {
          ...chartData,
          dataPoints: points.filter((_, i) => i !== idx),
        },
      });
    };

    const handleChartTypeSwitch = (nextType: 'bar' | 'line' | 'pie' | 'donut') => {
      onUpdate({
        chartData: {
          ...chartData,
          chartType: nextType,
        },
      });
    };

    return (
      <div className="my-3 p-4 rounded-[8px] bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs space-y-3.5 font-sans">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e9e9e7] dark:border-[#2f2f2f] pb-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="px-2 py-0.5 rounded-[4px] bg-blue-50 dark:bg-blue-950/60 text-[#2383e2] font-bold text-[11px] border border-blue-200/60 dark:border-blue-800/60">
              📊 Wykres danych
            </span>
            <input
              type="text"
              disabled={isPreview}
              value={chartData.title || block.content || 'Wykres analityczny'}
              onChange={(e) =>
                onUpdate({
                  content: e.target.value,
                  chartData: { ...chartData, title: e.target.value },
                })
              }
              className="font-semibold text-xs bg-transparent border-none focus:outline-none text-[#37352f] dark:text-white flex-1"
              placeholder="Tytuł wykresu..."
            />
          </div>

          {!isPreview && (
            <div className="flex items-center gap-1 text-[10px]">
              {(['bar', 'line', 'donut'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleChartTypeSwitch(t)}
                  className={`px-2 py-0.5 rounded-[4px] font-medium cursor-pointer transition-colors ${
                    chartData.chartType === t
                      ? 'bg-[#2383e2] text-white'
                      : 'bg-white dark:bg-[#191919] text-[#787774] dark:text-[#9b9a97] border border-[#e9e9e7] dark:border-[#2f2f2f] hover:text-[#37352f]'
                  }`}
                >
                  {t === 'bar' ? 'Słupkowy' : t === 'line' ? 'Liniowy' : 'Kołowy'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Visual Chart Rendering */}
        {chartData.chartType === 'bar' && (
          <div className="space-y-2 pt-1">
            {points.map((pt, i) => {
              const widthPct = Math.max(4, Math.min(100, Math.round((Math.abs(pt.value) / maxVal) * 100)));
              const barColor = pt.color || defaultPalette[i % defaultPalette.length];
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#37352f] dark:text-[#d4d4d4] truncate max-w-[65%]">
                      {pt.label}
                    </span>
                    <span className="font-mono font-bold text-[#37352f] dark:text-white tabular-nums">
                      {pt.value}
                      {chartData.unit ? ` ${chartData.unit}` : ''}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#e9e9e7]/70 dark:bg-[#2f2f2f] rounded-[4px] overflow-hidden">
                    <div
                      className="h-full rounded-[4px] transition-all duration-300"
                      style={{ width: `${widthPct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {chartData.chartType === 'line' && (
          <div className="w-full overflow-x-auto py-2">
            <svg viewBox="0 0 420 140" className="w-full h-36 overflow-visible">
              {/* Grid lines */}
              {[0, 0.5, 1].map((g, gi) => (
                <line
                  key={gi}
                  x1={30}
                  y1={15 + g * 95}
                  x2={400}
                  y2={15 + g * 95}
                  stroke="currentColor"
                  className="text-zinc-200 dark:text-zinc-800"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              ))}
              {(() => {
                const coords = points.map((pt, idx) => {
                  const x =
                    points.length === 1
                      ? 215
                      : 40 + (idx / (points.length - 1)) * 340;
                  const y = 110 - (Math.max(0, pt.value) / maxVal) * 90;
                  return { x, y, pt };
                });
                const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#2383e2"
                      strokeWidth="2.5"
                      points={polylinePoints}
                    />
                    {coords.map((c, idx) => (
                      <g key={idx}>
                        <circle cx={c.x} cy={c.y} r={4} fill="#2383e2" />
                        <text
                          x={c.x}
                          y={c.y - 8}
                          textAnchor="middle"
                          className="fill-[#37352f] dark:fill-white text-[9px] font-mono font-bold"
                        >
                          {c.pt.value}
                        </text>
                        <text
                          x={c.x}
                          y={128}
                          textAnchor="middle"
                          className="fill-[#787774] dark:fill-[#9b9a97] text-[9px]"
                        >
                          {c.pt.label.slice(0, 12)}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        )}

        {(chartData.chartType === 'pie' || chartData.chartType === 'donut') && (
          <div className="flex flex-wrap items-center gap-6 py-2">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                {(() => {
                  let cumulativePercent = 0;
                  return points.map((pt, i) => {
                    const pct = totalVal > 0 ? (Math.max(0, pt.value) / totalVal) * 100 : 0;
                    const strokeDasharray = `${pct} ${100 - pct}`;
                    const strokeDashoffset = 100 - cumulativePercent;
                    cumulativePercent += pct;
                    const color = pt.color || defaultPalette[i % defaultPalette.length];
                    return (
                      <circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="4.5"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold font-mono text-[#37352f] dark:text-white">
                  {totalVal}
                </span>
                <span className="text-[9px] text-[#787774] dark:text-[#9b9a97]">Suma</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {points.map((pt, i) => {
                const pct = totalVal > 0 ? Math.round((Math.max(0, pt.value) / totalVal) * 100) : 0;
                const color = pt.color || defaultPalette[i % defaultPalette.length];
                return (
                  <div key={i} className="flex items-center justify-between gap-2 p-1.5 rounded bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate text-[#37352f] dark:text-[#d4d4d4]">{pt.label}</span>
                    </div>
                    <span className="font-mono font-semibold text-[11px] text-[#787774] dark:text-[#9b9a97]">
                      {pt.value} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interactive Data Table Editor */}
        {!isPreview && (
          <div className="pt-2 border-t border-[#e9e9e7] dark:border-[#2f2f2f] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#787774] dark:text-[#9b9a97]">
              <span>Dane wykresu ({points.length} serii) · {chartData.sourceLabel || 'Edytowalne'}:</span>
              <button
                type="button"
                onClick={handleAddPoint}
                className="text-[#2383e2] hover:underline font-semibold cursor-pointer flex items-center gap-1"
              >
                <Plus size={11} /> Dodaj serię
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {points.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-white dark:bg-[#191919] p-1 rounded-[4px] border border-[#e9e9e7] dark:border-[#2f2f2f]">
                  <input
                    type="text"
                    value={pt.label}
                    onChange={(e) => handlePointChange(idx, 'label', e.target.value)}
                    className="flex-1 text-[11px] bg-transparent border-none focus:outline-none text-[#37352f] dark:text-[#d4d4d4] px-1"
                    placeholder="Etykieta..."
                  />
                  <input
                    type="number"
                    value={pt.value}
                    onChange={(e) => handlePointChange(idx, 'value', e.target.value)}
                    className="w-16 text-right font-mono text-[11px] font-semibold bg-[#fbfbfa] dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded px-1 py-0.5 focus:outline-none"
                  />
                  {points.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(idx)}
                      className="text-[#787774] hover:text-rose-500 p-0.5 cursor-pointer"
                      title="Usuń serię"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 17. LINKED DATABASE VIEW (linked_database)
  // =========================================================================
  if (block.type === 'linked_database') {
    return (
      <LinkedDatabaseBlockView
        block={block}
        currentPageId={currentPageId}
        currentPageTitle={currentPageTitle}
        onUpdate={onUpdate}
        isPreview={isPreview}
      />
    );
  }

  return null;
};
