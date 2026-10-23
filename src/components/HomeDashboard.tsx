import React, { useState, useEffect } from 'react';
import {
  FileText,
  Table as TableIcon,
  Columns3,
  Calendar as CalendarIcon,
  CheckSquare,
  Folder,
  Globe,
  ArrowRight,
  Plus,
  Star,
  Sparkles,
  Search,
  Check,
  Send,
  Zap,
  BookOpen,
  Users,
  Compass,
  Layers,
  ExternalLink,
  ChevronRight,
  Clock,
  Trash2,
  Bookmark,
  Share2,
  X,
  Database,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { TaskStatus } from '../types/workspace';
import { AllPublicPagesModal } from './AllPublicPagesModal';
import { reasonAboutUserInput } from '../features/ai/reasoning';
import { performMultiSourceResearch } from '../features/ai/multiSourceResearchService';

export const HomeDashboard: React.FC = () => {
  const {
    tasks,
    pages,
    folders,
    publicPages,
    createPage,
    setActivePageId,
    setActivePublicPageId,
    setActiveView,
    updateTaskStatus,
    addTask,
    incrementPublicPageView,
    toggleFavorite,
    autoOrganizePagesIntoThematicFolders,
    addNotification,
  } = useWorkspace();

  const { user, setIsAuthModalOpen } = useAuth();

  // Navigation tabs in Home (Studio style)
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'tasks' | 'knowledge' | 'public'>('overview');

  // Omnibar Smart Capture state
  const [omnibarInput, setOmnibarInput] = useState('');
  const [isSubmittingOmnibar, setIsSubmittingOmnibar] = useState(false);
  const [omnibarSuccessMsg, setOmnibarSuccessMsg] = useState<string | null>(null);

  // Quick inline task input
  const [newQuickTaskTitle, setNewQuickTaskTitle] = useState('');
  const [taskFilter, setTaskFilter] = useState<'todo' | 'all' | 'done'>('todo');

  // AI Folder organizer loading state
  const [isOrganizingFolders, setIsOrganizingFolders] = useState(false);
  const [isFolderBannerDismissed, setIsFolderBannerDismissed] = useState(false);

  // Public pages modal
  const [isAllPublicModalOpen, setIsAllPublicModalOpen] = useState(false);

  const activePages = pages.filter((p) => !p.isDeleted);
  const favoritePages = activePages.filter((p) => p.isFavorite);
  const unorganizedPages = activePages.filter((p) => !p.folderId);

  // AI / Research pages (created via Wikipedia, searchweb, noteweb, etc.)
  const aiResearchPages = activePages.filter(
    (p) =>
      p.tags.includes('AI') ||
      p.tags.includes('Badanie') ||
      p.tags.includes('Wikipedia') ||
      p.title.toLowerCase().includes('badanie') ||
      p.title.toLowerCase().includes('notatka:') ||
      p.blocks?.some((b) => b.content?.toLowerCase().includes('wikipedia') || b.content?.toLowerCase().includes('źródło:'))
  );

  // Tasks counts
  const todoTasks = tasks.filter((t) => t.status === 'Do zrobienia');
  const inProgressTasks = tasks.filter((t) => t.status === 'W trakcie');
  const doneTasks = tasks.filter((t) => t.status === 'Zrobione');

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'todo') return t.status !== 'Zrobione';
    if (taskFilter === 'done') return t.status === 'Zrobione';
    return true;
  });

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Kacper';

  // Greeting according to time of day
  const currentHour = new Date().getHours();
  let timeGreeting = 'Dzień dobry';
  if (currentHour >= 18 || currentHour < 5) timeGreeting = 'Dobry wieczór';
  else if (currentHour >= 12) timeGreeting = 'Dobre popołudnie';

  const todayFormatted = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  /**
   * Inteligentne wykonanie dowolnego polecenia z Omnibara za pierwszym razem
   */
  const handleOmnibarSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = omnibarInput.trim();
    if (!raw) return;

    setIsSubmittingOmnibar(true);

    try {
      const reasoning = reasonAboutUserInput(raw);

      // 1. Polecenie tworzenia notatki / Deep Research / Analizy
      if (
        reasoning.actionTrigger === 'create_note_live' ||
        reasoning.intent === 'CREATE_NOTE_LIVE' ||
        reasoning.actionTrigger === 'deep_research' ||
        reasoning.intent === 'DEEP_RESEARCH' ||
        reasoning.actionTrigger === 'note_web' ||
        reasoning.intent === 'NOTE_WEB'
      ) {
        const topic = reasoning.extractedTopic || raw;
        const res = await performMultiSourceResearch(topic);
        const pageId = await createPage(undefined, res.resolvedTitle, res.blocks, 'Document', '📄');

        setIsSubmittingOmnibar(false);
        setOmnibarInput('');
        if (pageId) {
          setActivePageId(pageId);
          setActiveView('doc');
          addNotification('Utworzono stronę', `Notatka "${res.resolvedTitle}" jest gotowa.`, 'success', pageId);
        }
        return;
      }

      // 2. Polecenie zadania / @task
      if (
        reasoning.actionTrigger === 'create_task' ||
        reasoning.intent === 'CREATE_TASK_LIVE' ||
        raw.toLowerCase().startsWith('zadanie') ||
        raw.toLowerCase().startsWith('@task')
      ) {
        const taskTitle =
          reasoning.extractedTopic ||
          raw.replace(/^(@task|\/task|zadanie:?|dodaj zadanie:?)\s*/i, '').trim() ||
          'Nowe zadanie';

        await addTask({
          title: taskTitle,
          status: 'Do zrobienia',
          priority: 'Średni',
          dueDate: new Date().toISOString().split('T')[0],
          tag: 'Inbox',
        });

        setIsSubmittingOmnibar(false);
        setOmnibarInput('');
        setOmnibarSuccessMsg(`Dodano zadanie: "${taskTitle}"`);
        setTimeout(() => setOmnibarSuccessMsg(null), 3000);
        return;
      }

      // 3. Polecenie porządkowania / @organize
      if (
        reasoning.intent === 'ORGANIZE_FOLDERS' ||
        raw.toLowerCase().includes('uporzadkuj') ||
        raw.toLowerCase().includes('foldery')
      ) {
        await autoOrganizePagesIntoThematicFolders();
        setIsSubmittingOmnibar(false);
        setOmnibarInput('');
        setOmnibarSuccessMsg('Uporządkowano wszystkie notatki w foldery tematyczne!');
        setTimeout(() => setOmnibarSuccessMsg(null), 3000);
        return;
      }

      // 4. Inne polecenia lub pytania -> przełącz do Studio AI i wykonaj
      setIsSubmittingOmnibar(false);
      setOmnibarInput('');
      setActiveView('ai');
    } catch (err) {
      console.error('Błąd wykonania Omnibara:', err);
      // Fallback: Utwórz nową pustą stronę
      const pageId = await createPage(undefined, raw);
      setIsSubmittingOmnibar(false);
      setOmnibarInput('');
      if (pageId) {
        setActivePageId(pageId);
        setActiveView('doc');
      }
    }
  };

  // Dodawanie szybkiego zadania inline
  const handleAddInlineTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickTaskTitle.trim()) return;

    await addTask({
      title: newQuickTaskTitle.trim(),
      status: 'Do zrobienia',
      priority: 'Średni',
      dueDate: new Date().toISOString().split('T')[0],
      tag: 'Dzisiaj',
    });
    setNewQuickTaskTitle('');
  };

  const handleOpenPage = (pageId: string) => {
    setActivePageId(pageId);
    setActiveView('doc');
  };

  const handleOpenPublicPage = async (pubId: string) => {
    setActivePublicPageId(pubId);
    setActiveView('public');
    await incrementPublicPageView(pubId);
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'przed chwilą';
    if (minutes < 60) return `${minutes} min temu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} godz. temu`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'wczoraj';
    if (days < 7) return `${days} dni temu`;
    return new Date(timestamp).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#d4d4d4] font-sans select-none antialiased transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. SERENE HEADER                                                          */}
        {/* ========================================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-[#787774] dark:text-[#9b9a97]">
              <span>{todayFormatted}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Zsynchronizowano
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('ai')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 rounded-[4px] text-xs font-medium cursor-pointer transition-colors"
              >
                <Sparkles size={13} className="text-purple-600 dark:text-purple-400" />
                <span>Otwórz Asystenta AI</span>
              </button>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#37352f] dark:text-white tracking-tight">
            {timeGreeting}, {displayName} 👋
          </h1>
          <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
            Pulpit główny. Twórz, organizuj i współpracuj z asystentem AI.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 2. STUDIO SMART OMNIBAR (INTELIGENTNY PASEK POLECEŃ ZA 1. RAZEM)           */}
        {/* ========================================================================= */}
        <div className="bg-[#fbfbfa] dark:bg-[#202020] rounded-[6px] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] p-3 space-y-2.5 transition-all focus-within:border-[#2383e2]">
          <form onSubmit={handleOmnibarSubmit} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[4px] bg-[rgba(35,131,226,0.1)] text-[#2383e2] flex items-center justify-center shrink-0">
              <Sparkles size={15} />
            </div>

            <input
              type="text"
              value={omnibarInput}
              onChange={(e) => setOmnibarInput(e.target.value)}
              placeholder="Wpisz polecenie np. 'Stwórz notatkę o kotach', 'Zbadaj rynek w 4 źródłach', 'Zadanie: wdrożyć kod'..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-[#37352f] dark:text-white placeholder-[#9b9a97] focus:outline-none"
              disabled={isSubmittingOmnibar}
            />

            <button
              type="submit"
              disabled={!omnibarInput.trim() || isSubmittingOmnibar}
              className="px-3 py-1 bg-[#37352f] hover:bg-[#252525] dark:bg-white dark:hover:bg-slate-100 disabled:opacity-40 text-white dark:text-[#191919] rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              {isSubmittingOmnibar ? (
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Wykonaj</span>
                  <Send size={11} />
                </>
              )}
            </button>
          </form>

          {/* Quick Action Chips beneath Omnibar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 text-xs select-none">
            <span className="text-[11px] text-[#787774] dark:text-[#9b9a97] font-medium shrink-0">Szybkie skróty:</span>

            <button
              type="button"
              onClick={async () => {
                const id = await createPage(undefined, '');
                if (id) {
                  setActivePageId(id);
                  setActiveView('doc');
                }
              }}
              className="px-2 py-0.5 bg-white dark:bg-[#252525] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)] text-[#37352f] dark:text-[#d4d4d4] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 text-xs"
            >
              <FileText size={12} className="text-blue-600 dark:text-blue-400" />
              <span>Nowa strona</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOmnibarInput('Stwórz notatkę o kotach');
              }}
              className="px-2 py-0.5 bg-white dark:bg-[#252525] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)] text-[#37352f] dark:text-[#d4d4d4] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 text-xs"
            >
              <span>🐾</span>
              <span>Notatka: Koty</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOmnibarInput('Zbadaj rynek w 4 źródłach');
              }}
              className="px-2 py-0.5 bg-white dark:bg-[#252525] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)] text-[#37352f] dark:text-[#d4d4d4] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 text-xs"
            >
              <span>🔬</span>
              <span>Badanie 4 źródła</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setIsOrganizingFolders(true);
                await autoOrganizePagesIntoThematicFolders();
                setIsOrganizingFolders(false);
              }}
              disabled={isOrganizingFolders}
              className="px-2 py-0.5 bg-white dark:bg-[#252525] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)] text-[#37352f] dark:text-[#d4d4d4] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 text-xs"
            >
              <Sparkles size={12} className={isOrganizingFolders ? 'animate-spin' : ''} />
              <span>Uporządkuj foldery</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('database')}
              className="px-2 py-0.5 bg-white dark:bg-[#252525] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)] text-[#37352f] dark:text-[#d4d4d4] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 text-xs"
            >
              <Database size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Baza danych</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('kanban')}
              className="px-2 py-0.5 bg-white dark:bg-[#252525] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)] text-[#37352f] dark:text-[#d4d4d4] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[4px] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 text-xs"
            >
              <Columns3 size={12} className="text-amber-600 dark:text-amber-400" />
              <span>Zadania Kanban</span>
            </button>
          </div>

          {/* Feedback banner */}
          {omnibarSuccessMsg && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-[4px] text-xs font-medium animate-in fade-in">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>{omnibarSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. TABS NAVIGATION                                                        */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] pb-1 text-xs font-medium overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-2.5 py-1 rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
            }`}
          >
            <Compass size={13} />
            <span>Pulpit główny</span>
          </button>

          <button
            onClick={() => setActiveTab('pages')}
            className={`px-2.5 py-1 rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'pages'
                ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
            }`}
          >
            <FileText size={13} />
            <span>Wszystkie notatki ({activePages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-2.5 py-1 rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
            }`}
          >
            <CheckSquare size={13} />
            <span>Zadania ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-2.5 py-1 rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
            }`}
          >
            <Sparkles size={13} />
            <span>Baza Wiedzy AI ({aiResearchPages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('public')}
            className={`px-2.5 py-1 rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'public'
                ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
            }`}
          >
            <Globe size={13} />
            <span>Publiczne WWW ({publicPages.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 4. TAB 1: OVERVIEW (HOME 1:1)                                             */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* FAVORITES (ULUBIONE) */}
            {favoritePages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  <span>Ulubione i przypięte</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {favoritePages.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => handleOpenPage(page.id)}
                      className="p-3 bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] hover:bg-[rgba(55,53,47,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] rounded-[6px] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl shrink-0 mt-0.5">{page.icon || '📄'}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-xs text-[#37352f] dark:text-white group-hover:text-blue-600 truncate transition-colors">
                            {page.title || 'Bez tytułu'}
                          </h4>
                          <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-1 line-clamp-2">
                            {page.blocks?.find((b) => b.content?.trim())?.content || 'Pusty dokument'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">
                        <span>{formatTimeAgo(page.updatedAt)}</span>
                        <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          Otwórz <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DUAL COLUMN: OSTATNIO EDYTOWANE (7 COLS) & MOJE ZADANIA (5 COLS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: OSTATNIO EDYTOWANE NOTATKI */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#787774] dark:text-[#9b9a97]" />
                    <h3 className="font-semibold text-xs text-[#37352f] dark:text-white uppercase tracking-wider">Ostatnio odwiedzone</h3>
                  </div>

                  <button
                    onClick={() => setActiveTab('pages')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Wszystkie ({activePages.length})</span>
                    <ChevronRight size={12} />
                  </button>
                </div>

                <div className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] overflow-hidden divide-y divide-[rgba(55,53,47,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                  {activePages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#787774] space-y-2">
                      <p>Brak notatek w studiu.</p>
                      <button
                        onClick={() => createPage(undefined, '')}
                        className="px-3 py-1 bg-[rgba(35,131,226,0.1)] text-[#2383e2] hover:bg-[rgba(35,131,226,0.16)] rounded-[4px] font-semibold cursor-pointer transition-colors text-xs"
                      >
                        + Utwórz pierwszą stronę
                      </button>
                    </div>
                  ) : (
                    activePages.slice(0, 6).map((page) => {
                      const firstContent = page.blocks?.find((b) => b.content?.trim())?.content?.trim();
                      const folderObj = folders.find((f) => f.id === page.folderId);

                      return (
                        <div
                          key={page.id}
                          onClick={() => handleOpenPage(page.id)}
                          className="p-2.5 hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer group flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base shrink-0">{page.icon || '📄'}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-xs text-[#37352f] dark:text-white group-hover:text-blue-600 truncate transition-colors">
                                  {page.title || 'Bez tytułu'}
                                </h4>
                                {folderObj && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.06)] text-[#787774] dark:text-[#9b9a97] font-medium shrink-0">
                                    {folderObj.name}
                                  </span>
                                )}
                              </div>
                              {firstContent && (
                                <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] truncate mt-0.5 max-w-md">
                                  {firstContent}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">
                              {formatTimeAgo(page.updatedAt)}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(page.id);
                              }}
                              className={`p-1 rounded-[4px] transition-colors cursor-pointer ${
                                page.isFavorite
                                  ? 'text-amber-500'
                                  : 'text-slate-300 dark:text-zinc-600 hover:text-amber-500 opacity-0 group-hover:opacity-100'
                              }`}
                              title={page.isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                            >
                              <Star size={13} fill={page.isFavorite ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* AI Folder notification banner if there are unorganized pages */}
                {unorganizedPages.length > 2 && !isFolderBannerDismissed && (
                  <div className="p-3 bg-[rgba(35,131,226,0.05)] dark:bg-[rgba(35,131,226,0.12)] border border-[rgba(35,131,226,0.2)] rounded-[6px] flex items-center justify-between gap-3 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-[4px] bg-[#2383e2] text-white flex items-center justify-center shrink-0">
                        <Sparkles size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#37352f] dark:text-white flex items-center gap-2">
                          <span>Masz {unorganizedPages.length} nieprzypisanych notatek</span>
                        </div>
                        <div className="text-[11px] text-[#787774] dark:text-[#9b9a97] truncate">
                          AI może je natychmiast posegregować w logiczne foldery tematyczne.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsOrganizingFolders(true);
                          await autoOrganizePagesIntoThematicFolders();
                          setIsOrganizingFolders(false);
                        }}
                        disabled={isOrganizingFolders}
                        className="px-2.5 py-1 bg-[#2383e2] hover:bg-[#1d6fc2] disabled:opacity-40 text-white rounded-[4px] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        {isOrganizingFolders ? 'Porządkuję...' : 'Uporządkuj'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsFolderBannerDismissed(true)}
                        className="p-1 text-[#787774] hover:text-[#37352f] dark:hover:text-white rounded-[4px] cursor-pointer"
                        title="Odrzuć"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: MOJE ZADANIA (CHECKLIST) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-semibold text-xs text-[#37352f] dark:text-white">Moje zadania</h4>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-medium">
                      <button
                        onClick={() => setTaskFilter('todo')}
                        className={`px-1.5 py-0.5 rounded-[3px] cursor-pointer ${
                          taskFilter === 'todo' ? 'bg-[rgba(35,131,226,0.12)] text-[#2383e2] font-semibold' : 'text-[#787774] dark:text-[#9b9a97]'
                        }`}
                      >
                        Do zrobienia ({todoTasks.length})
                      </button>
                      <button
                        onClick={() => setTaskFilter('done')}
                        className={`px-1.5 py-0.5 rounded-[3px] cursor-pointer ${
                          taskFilter === 'done' ? 'bg-[rgba(35,131,226,0.12)] text-[#2383e2] font-semibold' : 'text-[#787774] dark:text-[#9b9a97]'
                        }`}
                      >
                        Zrobione ({doneTasks.length})
                      </button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {filteredTasks.length === 0 ? (
                      <div className="py-4 text-center text-[11px] text-[#787774] dark:text-[#9b9a97]">
                        Brak zadań w wybranym filtrze.
                      </div>
                    ) : (
                      filteredTasks.slice(0, 7).map((task) => (
                        <div key={task.id} className="flex items-center justify-between gap-2 text-xs group py-1">
                          <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={task.status === 'Zrobione'}
                              onChange={(e) =>
                                updateTaskStatus(task.id, e.target.checked ? 'Zrobione' : 'Do zrobienia')
                              }
                              className="w-3.5 h-3.5 rounded-[3px] border-[rgba(55,53,47,0.2)] dark:border-[rgba(255,255,255,0.2)] text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <span
                              className={`truncate text-xs ${
                                task.status === 'Zrobione'
                                  ? 'line-through text-[#787774] dark:text-[#9b9a97] font-normal'
                                  : 'text-[#37352f] dark:text-white font-medium'
                              }`}
                            >
                              {task.title}
                            </span>
                          </label>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                task.priority === 'Krytyczny'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                  : task.priority === 'Wysoki'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.06)] text-[#787774] dark:text-[#9b9a97]'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Inline Add Task */}
                  <form onSubmit={handleAddInlineTask} className="pt-2 border-t border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] flex items-center gap-2">
                    <input
                      type="text"
                      value={newQuickTaskTitle}
                      onChange={(e) => setNewQuickTaskTitle(e.target.value)}
                      placeholder="+ Nowe zadanie (Enter)..."
                      className="flex-1 text-xs bg-transparent placeholder-[#9b9a97] text-[#37352f] dark:text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newQuickTaskTitle.trim()}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* WYRÓŻNIONE SZABLONY (FEATURED TEMPLATES)                                  */}
            {/* ========================================================================= */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider">
                <Bookmark size={13} />
                <span>Wyróżnione szablony</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    icon: '📄',
                    title: 'Pusta strona',
                    desc: 'Czysty dokument do swobodnej edycji blokowej z menu /.',
                    action: () => createPage(undefined, ''),
                  },
                  {
                    icon: '🤝',
                    title: 'Protokół ze spotkania',
                    desc: 'Agenda, uczestnicy, tabela decyzji i zadania do wdrożenia.',
                    action: () => handleOmnibarSubmit({ preventDefault: () => {} } as any),
                    prompt: 'Stwórz protokół ze spotkania projektowego',
                  },
                  {
                    icon: '🔬',
                    title: 'Badanie wieloźródłowe',
                    desc: 'Strona zweryfikowana w 4 bazach (OpenAlex, Wikidata, Crossref, Web).',
                    action: () => {
                      setOmnibarInput('Zbadaj rynek w 4 źródłach');
                    },
                  },
                  {
                    icon: '📚',
                    title: 'Baza wiedzy zespołu',
                    desc: 'Dokumentacja procesów, procedur i zasobów projektowych.',
                    action: () => createPage(undefined, 'Baza wiedzy zespołu'),
                  },
                  {
                    icon: '🚀',
                    title: 'Plan projektu i Roadmapa',
                    desc: 'Kamienie milowe, cele kwartalne i matryca ryzyk.',
                    action: () => createPage(undefined, 'Roadmapa projektu 2026'),
                  },
                  {
                    icon: '🐾',
                    title: 'Notatka tematyczna: Koty',
                    desc: 'Dynamiczna architektura zoologiczna bez sztywnego szablonu.',
                    action: () => {
                      setOmnibarInput('Stwórz notatkę o kotach');
                    },
                  },
                ].map((tpl, idx) => (
                  <div
                    key={idx}
                    onClick={async () => {
                      if (tpl.prompt) {
                        setOmnibarInput(tpl.prompt);
                      } else {
                        const id = await tpl.action();
                        if (typeof id === 'string') {
                          setActivePageId(id);
                          setActiveView('doc');
                        }
                      }
                    }}
                    className="p-3 bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-[6px] transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tpl.icon}</span>
                        <h4 className="font-semibold text-xs text-[#37352f] dark:text-white group-hover:text-blue-600 transition-colors">
                          {tpl.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] leading-relaxed line-clamp-2">
                        {tpl.desc}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Użyj szablonu</span>
                      <ArrowRight size={10} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. TAB 2: ALL PAGES (CLEAN TABLE VIEW)                                    */}
        {/* ========================================================================= */}
        {activeTab === 'pages' && (
          <div className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] overflow-hidden">
            <div className="p-3 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#202020]">
              <div className="font-semibold text-xs text-[#37352f] dark:text-white">Wszystkie dokumenty ({activePages.length})</div>
              <button
                onClick={() => createPage(undefined, '')}
                className="px-2.5 py-1 bg-[#2383e2] hover:bg-[#1d6fc2] text-white rounded-[4px] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus size={12} />
                <span>Nowa strona</span>
              </button>
            </div>

            <div className="divide-y divide-[rgba(55,53,47,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
              {activePages.map((page) => {
                const folderObj = folders.find((f) => f.id === page.folderId);
                return (
                  <div
                    key={page.id}
                    onClick={() => handleOpenPage(page.id)}
                    className="p-2.5 hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">{page.icon || '📄'}</span>
                      <div className="min-w-0">
                        <span className="font-semibold text-[#37352f] dark:text-white group-hover:text-blue-600 truncate transition-colors">
                          {page.title || 'Bez tytułu'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {folderObj ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.06)] text-[#787774] dark:text-[#9b9a97] font-medium">
                          {folderObj.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] italic">Nieprzypisana</span>
                      )}

                      <span className="text-[11px] text-[#787774] dark:text-[#9b9a97] font-mono">
                        {formatTimeAgo(page.updatedAt)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(page.id);
                        }}
                        className={`p-1 rounded-[4px] transition-colors cursor-pointer ${
                          page.isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-zinc-600 hover:text-amber-500 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Star size={13} fill={page.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. TAB 3: TASKS VIEW                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-[#37352f] dark:text-white" />
                <h3 className="font-semibold text-sm text-[#37352f] dark:text-white">Zadania i terminy</h3>
              </div>
              <button
                onClick={() => setActiveView('kanban')}
                className="px-3 py-1 bg-[rgba(55,53,47,0.08)] hover:bg-[rgba(55,53,47,0.12)] dark:bg-[rgba(255,255,255,0.08)] dark:hover:bg-[rgba(255,255,255,0.12)] text-[#37352f] dark:text-white rounded-[4px] text-xs font-medium cursor-pointer transition-colors"
              >
                Otwórz pełną tablicę Kanban →
              </button>
            </div>

            <div className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] p-3.5 divide-y divide-[rgba(55,53,47,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#787774]">
                  Brak zadań w Twoim studiu.
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                    <label className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={task.status === 'Zrobione'}
                        onChange={(e) =>
                          updateTaskStatus(task.id, e.target.checked ? 'Zrobione' : 'Do zrobienia')
                        }
                        className="w-3.5 h-3.5 rounded-[3px] border-[rgba(55,53,47,0.2)] text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span
                        className={`truncate ${
                          task.status === 'Zrobione' ? 'line-through text-[#787774] dark:text-[#9b9a97]' : 'text-[#37352f] dark:text-white font-medium'
                        }`}
                      >
                        {task.title}
                      </span>
                    </label>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          task.priority === 'Krytyczny'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            : task.priority === 'Wysoki'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.06)] text-[#787774] dark:text-[#9b9a97]'
                        }`}
                      >
                        {task.priority}
                      </span>

                      <span className="text-[11px] font-mono text-[#787774] dark:text-[#9b9a97]">
                        {task.dueDate || 'Brak daty'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. TAB 4: AI KNOWLEDGE FEED                                               */}
        {/* ========================================================================= */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4">
            <div className="p-3 bg-[rgba(35,131,226,0.06)] border border-[rgba(35,131,226,0.2)] rounded-[6px] flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-[#2383e2]">Baza Wiedzy AI</h4>
                <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5">
                  Artykuły i notatki zbadane w sieci w min. 4 niezależnych domenach.
                </p>
              </div>
              <button
                onClick={() => {
                  setOmnibarInput('Stwórz notatkę o sztucznej inteligencji');
                  setActiveTab('overview');
                }}
                className="px-2.5 py-1 bg-[#2383e2] hover:bg-[#1d6fc2] text-white rounded-[4px] text-xs font-semibold cursor-pointer"
              >
                + Nowe badanie
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiResearchPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => handleOpenPage(page.id)}
                  className="p-3 bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] hover:border-[#2383e2] transition-all cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{page.icon || '🧠'}</span>
                      <h4 className="font-semibold text-xs text-[#37352f] dark:text-white group-hover:text-[#2383e2] transition-colors">
                        {page.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-[#787774] dark:text-[#9b9a97]">
                      {formatTimeAgo(page.updatedAt)}
                    </span>
                  </div>

                  <p className="text-xs text-[#787774] dark:text-[#9b9a97] line-clamp-3">
                    {page.blocks?.find((b) => b.content?.trim())?.content || 'Notatka badawcza.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8. TAB 5: PUBLIC WWW PAGES                                                */}
        {/* ========================================================================= */}
        {activeTab === 'public' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-[#37352f] dark:text-white">Publiczne strony w internecie</h4>
                <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-0.5">
                  Twoje dokumenty z włączoną opcją publicznego linku WWW.
                </p>
              </div>
              <button
                onClick={() => setIsAllPublicModalOpen(true)}
                className="px-2.5 py-1 bg-[rgba(55,53,47,0.08)] hover:bg-[rgba(55,53,47,0.12)] text-[#37352f] dark:text-white rounded-[4px] text-xs font-medium cursor-pointer"
              >
                Odkrywaj wszystkie publiczne strony →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {publicPages.map((pubPage) => (
                <div
                  key={pubPage.id}
                  onClick={() => handleOpenPublicPage(pubPage.id)}
                  className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] p-3 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{pubPage.icon || '📄'}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold">
                      PUBLICZNA
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs text-[#37352f] dark:text-white group-hover:text-blue-600 transition-colors truncate">
                    {pubPage.title}
                  </h4>

                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(55,53,47,0.06)] text-[10px] text-[#787774] font-mono">
                    <span>👁️ {pubPage.viewsCount || 1}</span>
                    <span>❤️ {pubPage.likesCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 9. SERENE FOOTER SUMMARY                                                  */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#787774] dark:text-[#9b9a97]">
          <div className="flex items-center gap-3">
            <span>{activePages.length} dokumentów</span>
            <span>•</span>
            <span>{todoTasks.length} zadań do zrobienia</span>
            <span>•</span>
            <span>{folders.length} folderów</span>
          </div>

          <div className="flex items-center gap-2">
            <span>SearchPoint Studio • Inteligentna przestrzeń pracy</span>
          </div>
        </div>

      </div>

      {/* Modal with all public notes */}
      <AllPublicPagesModal
        isOpen={isAllPublicModalOpen}
        onClose={() => setIsAllPublicModalOpen(false)}
      />
    </div>
  );
};
