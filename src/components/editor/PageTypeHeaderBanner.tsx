import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Target,
  Sparkles,
  Rocket,
  ShieldAlert,
  Kanban,
  CheckCircle2,
  FolderOpen,
  FlaskConical,
  BookOpen,
  CheckSquare,
  StickyNote,
  FileText,
  Bookmark,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { PageType, WorkspacePage, DocBlock } from '../../types/workspace';

interface PageTypeHeaderBannerProps {
  page: WorkspacePage;
  onUpdatePageType: (pageId: string, newType: PageType) => void;
  onInsertBlocks: (blocks: Partial<DocBlock>[]) => void;
  onTriggerPreview?: () => void;
  onOpenAiCopilot?: () => void;
}

export const PageTypeHeaderBanner: React.FC<PageTypeHeaderBannerProps> = ({
  page,
  onUpdatePageType,
  onInsertBlocks,
  onTriggerPreview,
  onOpenAiCopilot,
}) => {
  const pageType: PageType = page.pageType || 'Document';

  // Licznik ukończenia zadań w dokumencie dla paska postępu
  const todoBlocks = page.blocks.filter((b) => b.type === 'todo');
  const doneTodos = todoBlocks.filter((b) => b.checked).length;
  const progressPercent = todoBlocks.length > 0 ? Math.round((doneTodos / todoBlocks.length) * 100) : 0;

  // 1. SPOTKANIE (Meeting) — Styl ciepły bursztyn / zachód słońca
  if (pageType === 'Meeting') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 dark:border-amber-500/20 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5">
              <Users size={14} />
              <span>PROTOKÓŁ SPOTKANIA</span>
            </span>
            <span className="text-[11px] font-mono text-amber-800 dark:text-amber-300">
              📅 {new Date().toLocaleDateString('pl-PL')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium">
              Status: W toku
            </span>
          </div>
        </div>

        {/* Metadane spotkania */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-amber-700 dark:text-amber-400">👥 Uczestnicy:</span>
            <span>Zespół projektowy, Lead, Interesariusze</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-amber-700 dark:text-amber-400">🎯 Cel:</span>
            <span>Ustalenie architektury i harmonogramu wdrożenia</span>
          </div>
        </div>

        {/* Szybkie bloki dedykowane dla spotkania */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 shrink-0">
            Szybkie bloki:
          </span>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'event_schedule',
                  content: 'Agenda Spotkania',
                  eventScheduleData: {
                    timeStart: '10:00',
                    timeEnd: '10:30',
                    title: 'Omówienie celów i architektury',
                    speakerOrLead: 'Prowadzący',
                  },
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            ⏱️ + Agenda Czasowa
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'decision_matrix',
                  content: 'Rejestr Podjętych Decyzji',
                  decisionMatrixData: {
                    criteria: ['Wpływ', 'Czas'],
                    options: [{ name: 'Przyjęto architekturę DocBlock', scores: [10, 9], totalScore: 19 }],
                  },
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            ⚖️ + Rejestr Decyzji
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                { type: 'todo', content: 'Zadanie: Przygotować podsumowanie spotkania', checked: false },
                { type: 'todo', content: 'Zadanie: Skonfigurować środowisko stagingowe', checked: false },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            ☑️ + Action Items
          </button>
          <button
            onClick={onOpenAiCopilot}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold cursor-pointer shadow-2xs flex items-center gap-1 transition-colors ml-auto"
          >
            <Sparkles size={11} />
            <span>Puter AI: Podsumuj Ustalenia</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. PROJEKT (Project) — Styl technologiczny indygo / cyber błękit
  if (pageType === 'Project') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-transparent border border-indigo-500/30 dark:border-indigo-500/20 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5">
              <Rocket size={14} />
              <span>KARTA PROJEKTU & ROADMAP</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-medium">
              Sprint 2026.Q4 · Aktywny
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">
              Postęp zadań: <b className="text-indigo-600 dark:text-indigo-400">{progressPercent}%</b> ({doneTodos}/{todoBlocks.length})
            </span>
            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Szybkie bloki dedykowane dla projektu */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 shrink-0">
            Bloki projektu:
          </span>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'milestone_roadmap',
                  content: 'Kluczowe Etapy Projektu',
                  roadmapData: [
                    { quarter: 'M1', title: 'Architektura i API', status: 'completed', owner: 'Architekt' },
                    { quarter: 'M2', title: 'Implementacja 90+ Bloków', status: 'in_progress', owner: 'Frontend Lead' },
                    { quarter: 'M3', title: 'Wdrożenie i Produkcja', status: 'planned', owner: 'DevOps' },
                  ],
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            🗺️ + Kamienie Milowe
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'risk_register',
                  content: 'Rejestr Ryzyk i Mitygacja',
                  riskRegisterData: [
                    { risk: 'Przeciążenie edytora dużą liczbą bloków', likelihood: 'Niska', impact: 'Krytyczny', mitigation: 'Wirtualizacja i debouncing zapisu' },
                  ],
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            🛡️ + Rejestr Ryzyk
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'kpi_scorecard',
                  content: 'Metryki Sukcesu Projektu',
                  kpiScorecardData: {
                    metricName: 'Czas reakcji edytora',
                    currentValue: '95 ms',
                    targetValue: '< 150 ms',
                    trendPercent: '+35% szybszy',
                    status: 'on_track',
                  },
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            📈 + Karta KPI
          </button>
          <button
            onClick={onOpenAiCopilot}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold cursor-pointer shadow-2xs flex items-center gap-1 transition-colors ml-auto"
          >
            <Sparkles size={11} />
            <span>Puter AI: Generuj Plan Sprintu</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. BADANIA / RESEARCH (Research) — Styl szmaragd / naukowy cyjan
  if (pageType === 'Research') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 dark:border-emerald-500/20 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
              <FlaskConical size={14} />
              <span>RAPORT BADAWCZY & WERYFIKACJA WIEDZY</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium">
              Metodologia: Analiza empiryczna
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
              🛡️ Weryfikacja: 95% konsensus
            </span>
          </div>
        </div>

        {/* Szybkie bloki dedykowane dla badań */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
            Narzędzia badawcze:
          </span>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'citation_source',
                  content: 'Źródło Referencyjne',
                  citationData: {
                    title: 'Empirical Study on Collaborative AI Interfaces',
                    authors: 'Smith J., Kowalski T.',
                    journalOrSource: 'IEEE Transactions on Software',
                    year: '2026',
                    doi: '10.1109/TSE.2026.1042',
                  },
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            📚 + Karta Cytowania / DOI
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'swot_analysis',
                  content: 'Macierz SWOT Tematu Badania',
                  swotData: {
                    strengths: ['Wysoka dokładność modelu', 'Odporność na timeouty'],
                    weaknesses: ['Wymaga pamięci operacyjnej klienta'],
                    opportunities: ['Automatyczna weryfikacja z bazami wiedzy'],
                    threats: ['Zmienność zewnętrznych serwisów informacyjnych'],
                  },
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            🧭 + Analiza SWOT
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'spec_table',
                  content: 'Zestawienie Parametrów Badawczych',
                  specTableData: [
                    { key: 'Wielkość próby', value: '1,200 zapytań', note: 'Zbiór testowy' },
                    { key: 'Czas analizy', value: '< 2.5 sekundy', note: 'Średnia' },
                  ],
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            📊 + Tabela Specyfikacji
          </button>
          <button
            onClick={onOpenAiCopilot}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer shadow-2xs flex items-center gap-1 transition-colors ml-auto"
          >
            <Sparkles size={11} />
            <span>Puter AI: Wieloźródłowy Research</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. BAZA DANYCH (Database) — Styl głęboki fiolet / violet
  if (pageType === 'Database') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent border border-violet-500/30 dark:border-violet-500/20 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold text-xs flex items-center gap-1.5">
              <Layers size={14} />
              <span>RELACYJNA BAZA DANYCH & TABLICE</span>
            </span>
            <span className="text-[11px] font-mono text-violet-800 dark:text-violet-300">
              Widoki: Tabela · Kanban · Kalendarz
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 font-medium">
              {page.blocks.filter((b) => b.type === 'table').length} aktywnych tabel
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-violet-700 dark:text-violet-400 shrink-0">
            Widoki danych:
          </span>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'table',
                  content: 'Nowa Baza Rekordów',
                  tableData: [
                    ['Nazwa Zasobu', 'Kategoria', 'Właściciel', 'Status', 'Priorytet'],
                    ['Moduł Edytora', 'Frontend', 'Tomasz', 'Aktywny', 'Wysoki'],
                    ['Katalog Bloków', 'Architektura', 'Anna', 'Wdrożony', 'Krytyczny'],
                  ],
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/40 dark:hover:bg-violet-900/60 text-violet-900 dark:text-violet-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            📊 + Nowa Tabela Relacyjna
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'decision_matrix',
                  content: 'Macierz Oceny Rekordów',
                  decisionMatrixData: {
                    criteria: ['Kryterium 1', 'Kryterium 2'],
                    options: [{ name: 'Pozycja A', scores: [8, 9], totalScore: 17 }],
                  },
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/40 dark:hover:bg-violet-900/60 text-violet-900 dark:text-violet-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            ⚖️ + Macierz Decyzji
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'kanban_board',
                  content: 'Widok Kanban',
                  kanbanColumns: [
                    { id: 'c1', title: 'Planowane', color: '#64748b', items: [{ id: 'i1', title: 'Nowy rekord' }] },
                    { id: 'c2', title: 'W toku', color: '#8b5cf6', items: [] },
                    { id: 'c3', title: 'Gotowe', color: '#10b981', items: [] },
                  ],
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/40 dark:hover:bg-violet-900/60 text-violet-900 dark:text-violet-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            📋 + Widok Kanban
          </button>
        </div>
      </div>
    );
  }

  // 5. LISTA ZADAŃ (TaskList) — Styl lazur / błękit nieba
  if (pageType === 'TaskList') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent border border-sky-500/30 dark:border-sky-500/20 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center gap-1.5">
              <CheckSquare size={14} />
              <span>LISTA ZADAŃ & SPRINT BACKLOG</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-medium">
              Zrobione: {doneTodos} / {todoBlocks.length} ({progressPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-28 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-400 shrink-0">
            Szybkie akcje zadań:
          </span>
          <button
            onClick={() => onInsertBlocks([{ type: 'todo', content: 'Nowe zadanie sprintu...', checked: false }])}
            className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 text-sky-900 dark:text-sky-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            ☑️ + Dodaj Zadanie
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'user_mention',
                  content: 'Wykonawca zadania',
                  mentionUser: { name: 'Tomasz Nowak', role: 'Fullstack Dev', status: 'Dostępny' },
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 text-sky-900 dark:text-sky-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            👤 + Przypisz Osobę
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'countdown',
                  content: 'Termin realizacji zadań',
                  countdownTitle: 'Koniec Sprintu',
                  targetDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 text-sky-900 dark:text-sky-200 text-[11px] font-medium cursor-pointer transition-colors"
          >
            ⏳ + Deadline Odliczanie
          </button>
          <button
            onClick={onOpenAiCopilot}
            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold cursor-pointer shadow-2xs flex items-center gap-1 transition-colors ml-auto"
          >
            <Sparkles size={11} />
            <span>Puter AI: @actionitems</span>
          </button>
        </div>
      </div>
    );
  }

  // 6. NOTATKA (Note) — Styl ciepły żółty / karteczka post-it / scratchpad
  if (pageType === 'Note') {
    return (
      <div className="mb-6 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-700/40 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center gap-1.5">
              <StickyNote size={13} />
              <span>SZYBKA NOTATKA / BRUDNOPIS</span>
            </span>
            <span className="text-[11px] text-amber-800/70 dark:text-amber-300/70">
              Swobodny scratchpad do szybkich myśli i szkiców
            </span>
          </div>

          <button
            onClick={() => onUpdatePageType(page.id, 'Document')}
            className="text-[10px] text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
          >
            Przekształć w Pełny Dokument →
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'callout_tip',
                  content: 'Ważna myśl do zapamiętania...',
                  calloutType: 'tip',
                },
              ])
            }
            className="px-2 py-0.5 rounded-md bg-amber-200/60 hover:bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-[11px] font-medium cursor-pointer"
          >
            💡 + Ważna Myśl (Tip)
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'audio_memo',
                  content: 'Notatka głosowa ze spotkania',
                  audioMemoData: { title: 'Notatka Głosowa', duration: '01:45', recordedAt: 'Dzisiaj' },
                },
              ])
            }
            className="px-2 py-0.5 rounded-md bg-amber-200/60 hover:bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-[11px] font-medium cursor-pointer"
          >
            🎙️ + Notatka Głosowa
          </button>
          <button
            onClick={onOpenAiCopilot}
            className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-medium cursor-pointer ml-auto flex items-center gap-1"
          >
            <Sparkles size={11} />
            <span>Rozwiń z Puter AI</span>
          </button>
        </div>
      </div>
    );
  }

  // 7. KOLEKCJA (Collection) — Styl różowy / magazyn zasobów
  if (pageType === 'Collection') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-transparent border border-rose-500/30 dark:border-rose-500/20 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5">
              <Bookmark size={14} />
              <span>KOLEKCJA MATERIAŁÓW & ZASOBÓW</span>
            </span>
          </div>
          <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
            Katalog biblioteczny i baza wiedzy
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'card',
                  content: 'Karta Nowego Zasobu w Kolekcji',
                  bookmarkTitle: 'Materiały źródłowe',
                  bookmarkDesc: 'Kluczowe odnośniki i artykuły',
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 text-[11px] font-medium cursor-pointer"
          >
            🗂️ + Karta Zasobu
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'bookmark',
                  content: 'Zakładka URL',
                  bookmarkUrl: 'https://searchpoint.pl',
                  bookmarkTitle: 'SearchPoint Workspace',
                  bookmarkDesc: 'Główny portal platformy',
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 text-[11px] font-medium cursor-pointer"
          >
            🔗 + Zakładka URL
          </button>
          <button
            onClick={() =>
              onInsertBlocks([
                {
                  type: 'embed_github',
                  content: 'Repozytorium Projektowe na GitHub',
                  bookmarkUrl: 'https://github.com',
                },
              ])
            }
            className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 text-[11px] font-medium cursor-pointer"
          >
            💻 + Repozytorium GitHub
          </button>
        </div>
      </div>
    );
  }

  // 8. DOKUMENT (Document) — Domyślny elegancki styl redakcyjny (Editorial Slate)
  return (
    <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5">
            <FileText size={14} />
            <span>OFICJALNY DOKUMENT & RAPORT</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Wersja v1.0 (Draft) · Pełna Hierarchia DocBlock
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onTriggerPreview && (
            <button
              onClick={onTriggerPreview}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              👁️ Otwórz Live Preview
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">
          Struktura dokumentu:
        </span>
        <button
          onClick={() =>
            onInsertBlocks([
              {
                type: 'summary_box',
                content: 'Podsumowanie Wykonawcze (TL;DR):\n• Kluczowy cel dokumentu\n• Główne założenia architektury\n• Planowane rezultaty',
              },
            ])
          }
          className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium cursor-pointer"
        >
          💡 + Podsumowanie TL;DR
        </button>
        <button
          onClick={() =>
            onInsertBlocks([
              {
                type: 'table',
                content: 'Zestawienie Kluczowych Danych',
                tableData: [
                  ['Zakres', 'Wymagania', 'Status'],
                  ['Etap 1', 'Wszystkie testy zaliczone', 'Gotowe'],
                ],
              },
            ])
          }
          className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium cursor-pointer"
        >
          📊 + Tabela Porównawcza
        </button>
        <button
          onClick={() =>
            onInsertBlocks([
              {
                type: 'announcement_banner',
                content: 'Oficjalny komunikat: Niniejszy dokument wchodzi w życie z dniem dzisiejszym.',
                announcementData: {
                  title: 'Ważna Informacja',
                  message: 'Wszystkie zmiany w dokumencie są automatycznie wersjonowane.',
                  bannerType: 'info',
                },
              },
            ])
          }
          className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium cursor-pointer"
        >
          📢 + Baner Informacyjny
        </button>
        <button
          onClick={onOpenAiCopilot}
          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer shadow-2xs flex items-center gap-1 transition-colors ml-auto"
        >
          <Sparkles size={11} />
          <span>Puter AI: Generuj Opracowanie</span>
        </button>
      </div>
    </div>
  );
};
