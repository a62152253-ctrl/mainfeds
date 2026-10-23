import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Bot,
  ChevronDown,
  ChevronUp,
  FilePlus,
  Table as TableIcon,
  ListTodo,
  Rocket,
  Globe,
  Lightbulb,
  X,
  Zap,
  Lock,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DocBlock, WorkspacePage } from '../../types/workspace';
import { parseMarkdownToNotionBlocks } from '../../features/ai/markdownToBlocks';
import { generateEditorAiResponse, EditorAiResponse } from '../../features/ai/editorAiService';

export interface EditorAiCopilotProps {
  activeDoc: WorkspacePage;
  pages?: WorkspacePage[];
  onTriggerPreview: () => void;
  onInsertBlocks: (blocks: Partial<DocBlock>[]) => void;
  onCreateNewNote: (title: string, blocks?: Partial<DocBlock>[]) => Promise<string | undefined>;
  onAddTasks?: (tasks: { title: string; priority?: string }[]) => void;
  onNotification?: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenMainAi?: () => void;
  isShrunk?: boolean;
  onToggleShrink?: () => void;
}

type ExecutionStatus =
  | { type: 'idle' }
  | { type: 'executing'; taskDescription: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export const EditorAiCopilot: React.FC<EditorAiCopilotProps> = ({
  activeDoc,
  pages = [],
  onTriggerPreview,
  onInsertBlocks,
  onCreateNewNote,
  onAddTasks,
  onNotification,
  onOpenMainAi,
}) => {
  const { user, setIsAuthModalOpen } = useAuth();
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ExecutionStatus>({ type: 'idle' });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'claude-3-5-sonnet' | 'gpt-4o' | 'gpt-4o-mini'>('gpt-4o-mini');
  const inputRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const setTransientSuccess = (message: string) => {
    setStatus({ type: 'success', message });
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setStatus({ type: 'idle' });
    }, 3800);
  };

  const setTransientError = (message: string) => {
    setStatus({ type: 'error', message });
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setStatus({ type: 'idle' });
    }, 4500);
  };

  /**
   * Główny Egzekutor Zadań AI (Pure Action Executor)
   * ONO NIE ODPISUJE A WYKONUJE ZADANIA!
   */
  const executeTask = async (taskQuery?: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      setTransientError('Wymagane logowanie: Zaloguj się do usługi, aby asystent AI mógł wykonywać zadania w notatkach.');
      return;
    }

    const query = (taskQuery || input).trim();
    if (!query || status.type === 'executing') return;

    setInput('');
    setStatus({ type: 'executing', taskDescription: query });

    try {
      const qLower = query.toLowerCase();

      // 1. Zadanie: Otwórz pełne AI
      if (
        qLower.includes('pełne ai') ||
        qLower.includes('pelne ai') ||
        qLower.includes('otwórz ai') ||
        qLower.includes('otworz ai') ||
        qLower.includes('asystent ai') ||
        qLower.includes('przejdź do ai')
      ) {
        if (onOpenMainAi) {
          onOpenMainAi();
          setTransientSuccess('Otwarto pełnego Asystenta AI.');
        } else {
          setTransientSuccess('Asystent AI jest dostępny w menu głównym.');
        }
        return;
      }

      // 2. Zadanie: Live Preview (@priev)
      if (
        qLower.startsWith('@priev') ||
        qLower.startsWith('/priev') ||
        qLower.includes('podgląd') ||
        qLower.includes('podglad') ||
        qLower.includes('live preview')
      ) {
        onTriggerPreview();
        setTransientSuccess('Włączono Live Preview dokumentu.');
        return;
      }

      // 3. Zadanie: Wywołaj serwis analizy i generowania bloków
      const response: EditorAiResponse = await generateEditorAiResponse({
        query,
        activeDoc,
        pages,
        preferredModel: selectedModel,
      });

      // 4. Zadanie: Tworzenie nowej notatki (np. "stwórz notatkę o psach", @note, @deepresearch)
      const isCreateNote =
        response.actionType === 'create_note' ||
        qLower.startsWith('@deepresearch') ||
        qLower.startsWith('/deepresearch') ||
        qLower.startsWith('@research') ||
        qLower.startsWith('/research') ||
        qLower.startsWith('@noteweb') ||
        qLower.startsWith('@note') ||
        qLower.startsWith('/note') ||
        /(?:stwórz|stworz|stwurz|napisz|utwórz|utworz|zrób|zrob|dodaj|nowa)\s+(?:nową\s+|nowa\s+)?notatk[ęea]\b/i.test(qLower) ||
        /^(?:stwórz|stworz|stwurz|utwórz|utworz|zrób|zrob)\s+(?:o|dla|notatk[ęea])/i.test(qLower);

      if (isCreateNote) {
        let title = '';
        const titleMatch = response.text.match(/(?:Wieloźródłowe Badanie i Synteza|Badanie i Synteza):\s*"([^"]+)"/);
        if (titleMatch) {
          title = titleMatch[1];
        } else {
          const rawTopic = query
            .replace(/^(@[a-zA-Z0-9_]+|\/[a-zA-Z0-9_]+)\s*/i, '')
            .replace(/^(?:stwórz|stworz|stwurz|napisz|utwórz|utworz|zrób|zrob|dodaj|nowa)\s+(?:nową\s+|nowa\s+)?notatk[ęea]\s*(?:o|i|dla|dotyczącą|dotyczaca|ze|z|na temat|:|-)?\s*/i, '')
            .replace(/^(?:o|i|dla)\s+/i, '')
            .replace(/["'„”«»]/g, '')
            .trim();

          // Normalizacja typowych przypadków w języku polskim
          const lower = rawTopic.toLowerCase();
          if (lower === 'psach' || lower === 'psy' || lower === 'pies') title = 'Psy';
          else if (lower === 'kotach' || lower === 'koty' || lower === 'kot') title = 'Koty';
          else if (lower === 'koniach' || lower === 'konie') title = 'Konie';
          else if (lower.length > 0) title = rawTopic.charAt(0).toUpperCase() + rawTopic.slice(1);
          else title = `${activeDoc.title} - Nowa Notatka`;
        }

        let blocksToUse = response.blocks;
        if (!blocksToUse || blocksToUse.length === 0) {
          blocksToUse = parseMarkdownToNotionBlocks(response.text, title).blocks;
        }

        const newId = await onCreateNewNote(title, blocksToUse);
        if (newId) {
          setTransientSuccess(`Utworzono notatkę „${title}” i przełączono do edycji.`);
          onNotification?.('Utworzono notatkę', `Nowa notatka „${title}” została utworzona w Twoim workspace.`, 'success');
        } else {
          setTransientSuccess(`Zapisano notatkę „${title}”.`);
        }
        return;
      }

      // 5. Zadanie: Ekstrakcja zadań (@actionitems, wyciągnij zadania)
      if (
        (qLower.includes('wyciągnij zadania') ||
          qLower.includes('wyciagnij zadania') ||
          qLower.includes('lista zadań') ||
          qLower.includes('lista zadan') ||
          qLower.startsWith('@actionitems') ||
          qLower.startsWith('/actionitems')) &&
        response.blocks
      ) {
        const todoBlocks = response.blocks.filter((b) => b.type === 'todo');
        if (todoBlocks.length > 0 && onAddTasks) {
          onAddTasks(todoBlocks.map((t) => ({ title: t.content, priority: 'Średni' })));
        }
        onInsertBlocks(response.blocks);
        setTransientSuccess(`Wyciągnięto i wstawiono zadania do notatki "${activeDoc.title}".`);
        onNotification?.('Wyciągnięto zadania', `Dodano zadania do dokumentu oraz tablicy Kanban.`, 'success');
        return;
      }

      // 6. Zadanie: Wstawienie bloków do bieżącej notatki (tabela, plan, tłumaczenie, podsumowanie, kod itp.)
      let blocksToInsert = response.blocks;
      if (!blocksToInsert || blocksToInsert.length === 0) {
        blocksToInsert = parseMarkdownToNotionBlocks(response.text, activeDoc.title).blocks;
      }

      if (blocksToInsert && blocksToInsert.length > 0) {
        onInsertBlocks(blocksToInsert);
        const count = blocksToInsert.length;
        setTransientSuccess(`Wstawiono ${count} ${count === 1 ? 'blok' : 'bloki/ów'} do "${activeDoc.title}".`);
        onNotification?.('Wstawiono do notatki', `Zadanie wykonane: dodano bloki do "${activeDoc.title}".`, 'success');
      } else {
        setTransientSuccess('Zadanie wykonane pomyślnie.');
      }
    } catch {
      setTransientError('Nie udało się wykonać zadania. Spróbuj ponownie.');
    }
  };

  // 1. Zminimalizowany pasek (Ultra-slim bar)
  if (isCollapsed) {
    return (
      <div className="w-full bg-slate-950/95 dark:bg-[#0c1017]/95 backdrop-blur-md border-t border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs shadow-2xl transition-all duration-200 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Zap size={12} className="animate-pulse" />
          </div>
          <span className="font-semibold text-slate-300 text-[11px]">AI Zadania</span>
          {status.type === 'executing' && (
            <span className="text-blue-400 text-[11px] animate-pulse flex items-center gap-1">
              <RefreshCw size={10} className="animate-spin" /> Wykonuję: {status.taskDescription}...
            </span>
          )}
          {status.type === 'success' && (
            <span className="text-emerald-400 text-[11px] flex items-center gap-1">
              <CheckCircle2 size={10} /> {status.message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenMainAi && (
            <button
              onClick={onOpenMainAi}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              Pełne AI ↗
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium cursor-pointer"
          >
            <ChevronUp size={12} />
            <span>Rozwiń pasek</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Pełny czarny pasek zadań AI ("to czarne na dole keep - ONO NIE ODPISUJE A WYKONUJE ZADANIA")
  return (
    <div className="w-full bg-slate-950/95 dark:bg-[#0c1017]/95 backdrop-blur-md border-t border-slate-800/90 text-white shadow-2xl px-3 sm:px-4 py-2.5 flex flex-col gap-2 shrink-0 transition-all select-none">
      {/* Linia 1: Nagłówek narzędzia + Status wykonania + Przełącznik Modelu + Skrót Pełnego AI */}
      <div className="flex items-center justify-between gap-2 text-xs">
        {/* Lewo: Nazwa i Dynamiczny Status Akcji */}
        <div className="flex items-center gap-2 overflow-hidden">
          {user ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] font-semibold shrink-0">
              <Zap size={12} className="text-amber-400" />
              <span>AI Zadania</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold shrink-0">
              <Lock size={11} className="text-amber-400" />
              <span>AI Zablokowane (Wymagane logowanie)</span>
            </div>
          )}

          {/* Dynamiczny Status Wykonania Zadania */}
          {status.type === 'executing' && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] truncate animate-pulse">
              <RefreshCw size={11} className="animate-spin text-blue-400 shrink-0" />
              <span className="truncate">Wykonuję: &quot;{status.taskDescription}&quot;...</span>
            </div>
          )}

          {status.type === 'success' && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] truncate animate-in fade-in duration-200">
              <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
              <span className="truncate">{status.message}</span>
              <button
                onClick={() => setStatus({ type: 'idle' })}
                className="text-emerald-400 hover:text-white ml-1 cursor-pointer"
                title="Zamknij powiadomienie"
              >
                ✕
              </button>
            </div>
          )}

          {status.type === 'error' && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] truncate">
              <AlertCircle size={11} className="text-rose-400 shrink-0" />
              <span className="truncate">{status.message}</span>
              <button
                onClick={() => setStatus({ type: 'idle' })}
                className="text-rose-400 hover:text-white ml-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Prawo: Wybór Modelu Puter + Skrót Pełnego AI + Zwijanie */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Puter AI Model Selector */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="bg-transparent font-medium cursor-pointer focus:outline-none text-slate-300"
              title="Model Puter AI do wykonania zadania"
            >
              <option value="gpt-4o-mini" className="bg-slate-900 text-white">GPT-4o mini (Szybki)</option>
              <option value="claude-3-5-sonnet" className="bg-slate-900 text-white">Claude 3.5 Sonnet</option>
              <option value="gpt-4o" className="bg-slate-900 text-white">GPT-4o</option>
            </select>
          </div>

          {/* Otwórz Pełnego Asystenta AI */}
          {onOpenMainAi && (
            <button
              onClick={onOpenMainAi}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] font-semibold cursor-pointer transition-all shadow-2xs"
              title="Przejdź do pełnego konwersacyjnego Asystenta AI"
            >
              <Bot size={12} className="text-blue-300" />
              <span className="hidden md:inline">Pełne AI</span>
              <ExternalLink size={10} />
            </button>
          )}

          {/* Zwiń pasek */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            title="Zwiń pasek zadań AI"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Linia 2: Szybkie Akcje Klikalne (Pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
        <button
          onClick={() => {
            setInput('Stwórz notatkę o ');
            inputRef.current?.focus();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-medium shrink-0 cursor-pointer transition-all active:scale-95"
          title="Stwórz zupełnie nową notatkę na dowolny temat"
        >
          <FilePlus size={11} className="text-emerald-400" />
          <span>📝 Nowa notatka...</span>
        </button>

        <button
          onClick={() => executeTask('Wstaw tabelę porównawczą')}
          disabled={status.type === 'executing'}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-medium shrink-0 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
          title="Wygeneruj i wstaw gotową tabelę do bieżącej notatki"
        >
          <TableIcon size={11} className="text-blue-400" />
          <span>📊 Wstaw tabelę</span>
        </button>

        <button
          onClick={() => executeTask('Wstaw plan wdrożenia i harmonogram')}
          disabled={status.type === 'executing'}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-medium shrink-0 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
          title="Wygeneruj plan wdrożenia z fazami i rejestrem ryzyk"
        >
          <Rocket size={11} className="text-indigo-400" />
          <span>🚀 Wstaw plan</span>
        </button>

        <button
          onClick={() => executeTask('Wyciągnij zadania z tej notatki')}
          disabled={status.type === 'executing'}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-medium shrink-0 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
          title="Wyszukaj zadania w tekście i wstaw je do listy oraz tablicy Kanban"
        >
          <ListTodo size={11} className="text-amber-400" />
          <span>☑️ Wyciągnij zadania</span>
        </button>

        <button
          onClick={() => executeTask('Przetłumacz notatkę na język angielski')}
          disabled={status.type === 'executing'}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-medium shrink-0 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
          title="Przetłumacz dokument na angielski"
        >
          <Globe size={11} className="text-sky-400" />
          <span>🌐 Przetłumacz (EN)</span>
        </button>

        <button
          onClick={() => executeTask('Podsumuj ten dokument i wyciągnij kluczowe wnioski')}
          disabled={status.type === 'executing'}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-medium shrink-0 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
          title="Wstaw blok podsumowania z kluczowym wnioskiem"
        >
          <Lightbulb size={11} className="text-yellow-400" />
          <span>💡 Podsumuj</span>
        </button>

        <button
          onClick={onTriggerPreview}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 font-medium shrink-0 cursor-pointer transition-all active:scale-95 ml-auto"
          title="Podgląd dokumentu"
        >
          <Eye size={11} />
          <span>👁️ Podgląd</span>
        </button>
      </div>

      {/* Linia 3: Pole wprowadzania zadania dla AI */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              executeTask();
            } else if (e.key === 'Escape') {
              setInput('');
            }
          }}
          disabled={status.type === 'executing'}
          placeholder={
            user
              ? "Wpisz zadanie dla AI (np. 'stwórz notatkę o psach', 'wstaw tabelę', 'wstaw plan', 'wyciągnij zadania')..."
              : "🔒 Zaloguj się do usługi, aby asystent AI wykonywał zadania w notatkach..."
          }
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors pr-28 shadow-inner disabled:opacity-50"
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {input.trim() && (
            <button
              onClick={() => setInput('')}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Wyczyść pole"
            >
              <X size={12} />
            </button>
          )}

          {user ? (
            <button
              onClick={() => executeTask()}
              disabled={!input.trim() || status.type === 'executing'}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm active:scale-95 disabled:cursor-not-allowed"
              title="Wykonaj zadanie (Enter)"
            >
              {status.type === 'executing' ? (
                <>
                  <RefreshCw size={12} className="animate-spin text-white" />
                  <span>Robię...</span>
                </>
              ) : (
                <>
                  <Zap size={12} className="text-amber-300" />
                  <span>Wykonaj</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setTransientError('Zaloguj się do usługi, aby asystent AI mógł wykonywać zadania w notatkach.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm active:scale-95"
              title="Zaloguj się do usługi, aby odblokować AI"
            >
              <LogIn size={12} className="text-amber-300" />
              <span>Zaloguj się</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
