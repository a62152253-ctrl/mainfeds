import React, { useState } from 'react';
import {
  Compass,
  Search,
  ExternalLink,
  FilePlus,
  Trash2,
  Sparkles,
  ArrowRight,
  Globe,
  Clock,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Lock,
  Layers,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  Filter,
  Bot,
  Flame,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { DocBlock } from '../types/workspace';
import { reuseFirstEngine } from '../features/global-searches/reuseFirstEngine';
import { globalKnowledgeService } from '../features/global-searches/knowledgeCollectionsService';
import { bugReportService } from '../features/global-searches/bugReportService';
import { ReportBugModal } from '../features/global-searches/ReportBugModal';
import {
  UserSearchItem,
  GlobalKnowledgeCollection,
  SearchPrivacyMode,
  VerifiedClaim,
  BugReportItem,
  ClaimVerificationStatus,
} from '../features/global-searches/types';

export const SearchesView: React.FC = () => {
  const { createPage, setActiveView, addNotification } = useWorkspace();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'my_searches' | 'collections' | 'audits'>('my_searches');
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchExecutionInput, setSearchExecutionInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<SearchPrivacyMode>('my_searches');
  const [forceReverify, setForceReverify] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Inspector: expanded sources by claim ID
  const [expandedClaimSources, setExpandedClaimSources] = useState<Record<string, boolean>>({});

  // Bug report modal state
  const [bugModalData, setBugModalData] = useState<{
    claimText: string;
    claimId?: string;
    searchId?: string;
    collectionId?: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [mySearches, setMySearches] = useState<UserSearchItem[]>(() =>
    reuseFirstEngine.getMySearches()
  );
  const [collections, setCollections] = useState<GlobalKnowledgeCollection[]>(() =>
    globalKnowledgeService.getAllCollections()
  );
  const [bugReports, setBugReports] = useState<BugReportItem[]>(() =>
    bugReportService.getAllReports()
  );

  const refreshData = () => {
    setMySearches(reuseFirstEngine.getMySearches());
    setCollections(globalKnowledgeService.getAllCollections());
    setBugReports(bugReportService.getAllReports());
  };

  const userId = user?.uid || 'guest-user';
  const remainingQuota = bugReportService.getRemainingQuota(userId);

  const toggleClaimSources = (claimId: string) => {
    setExpandedClaimSources((prev) => ({
      ...prev,
      [claimId]: !prev[claimId],
    }));
  };

  const handleExecuteSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchExecutionInput.trim();
    if (!query || isSearching) return;

    setIsSearching(true);
    try {
      const res = await reuseFirstEngine.executeSearch(query, selectedMode, forceReverify);
      setSearchExecutionInput('');
      setForceReverify(false);
      refreshData();
      addNotification(
        res.reusedFromCollection ? 'Pobrano ze zbioru wiedzy' : 'Zbadano i zweryfikowano w 5 źródłach',
        `Pomyślnie zbadano: „${res.topic}” (${res.reusedFromCollection ? '0 opóźnień (Reuse-First)' : `5 niezależnych źródeł`}).`,
        'success'
      );
    } catch {
      addNotification('Błąd wyszukiwania', 'Nie udało się pobrać danych ze źródeł.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReverifyCollection = async (topic: string) => {
    setIsSearching(true);
    try {
      await reuseFirstEngine.executeSearch(topic, 'public', true);
      refreshData();
      addNotification(
        'Zaktualizowano wiedzę',
        `Pomyślnie przeprowadzono ponowną weryfikację tematu „${topic}” w 5 niezależnych bazach.`,
        'success'
      );
    } catch {
      addNotification('Błąd', 'Nie udało się zaktualizować kolekcji.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveSearch = (id: string) => {
    reuseFirstEngine.removeSearch(id);
    refreshData();
  };

  const handleClearSearches = () => {
    if (window.confirm('Czy na pewno chcesz wyczyścić całą prywatną historię wyszukiwań?')) {
      reuseFirstEngine.clearAll();
      refreshData();
    }
  };

  const handleConvertSearchToNote = async (item: UserSearchItem) => {
    const blocks: DocBlock[] = [
      {
        id: `h1-${Date.now()}`,
        type: 'h1',
        content: item.topic,
      },
      {
        id: 'callout-1',
        type: 'callout_info',
        content: `🌐 **Global Searches & Weryfikacja 5 Źródeł:** Zbadano zapytanie „${item.query}”. Tryb: ${
          item.mode === 'public' ? 'Publiczny (Zbiór Globalny)' : 'Prywatny (My Searches)'
        }. Data: ${new Date(item.createdAt).toLocaleDateString('pl-PL')}.`,
      },
    ];

    if (item.summary) {
      blocks.push({
        id: 'p-summary',
        type: 'lead',
        content: item.summary,
      });
    }

    if (item.keyTakeaways && item.keyTakeaways.length > 0) {
      blocks.push({
        id: 'key-1',
        type: 'key_takeaway',
        content: `🏆 **Kluczowe Wnioski i Konsensus:**\n${item.keyTakeaways.join('\n')}`,
      });
    }

    if (item.claims && item.claims.length > 0) {
      blocks.push({
        id: 'h2-claims',
        type: 'h2',
        content: 'Zweryfikowane Fakty i Twierdzenia (Weryfikacja Wieloźródłowa)',
      });

      // Zbuduj tabelę źródeł
      const tableRows: string[][] = [
        ['Twierdzenie', 'Status', 'Wiarygodność', 'Źródła referencyjne'],
      ];

      for (const claim of item.claims) {
        const sourceNames = claim.sources.map((s) => s.name).join(', ');
        tableRows.push([
          claim.claim,
          claim.status,
          `${claim.confidenceScore}%`,
          sourceNames || '5 baz wiedzy',
        ]);

        blocks.push({
          id: `claim-${claim.id}`,
          type: 'bullet',
          content: `**[${claim.status.toUpperCase()}]** ${claim.claim} *(Pewność: ${claim.confidenceScore}%, Konsensus: ${claim.consensusPercentage || 95}% z ${claim.sources.length} baz)*`,
        });
      }

      blocks.push({
        id: 'tbl-sources',
        type: 'table',
        content: 'Matryca Weryfikacji Faktów',
        tableData: tableRows,
      });
    }

    const newPageId = await createPage(
      undefined,
      `Badanie: ${item.topic}`,
      blocks,
      'Research',
      '🔬'
    );

    addNotification(
      'Utworzono notatkę',
      `Stworzono stronę na podstawie badania: „${item.topic}”.`,
      'success'
    );
    setActiveView('doc');
  };

  const handleCopyReport = (item: UserSearchItem) => {
    const reportText = `# Raport Weryfikacji Faktów: ${item.topic}
Data: ${new Date(item.createdAt).toLocaleString('pl-PL')}
Zapytanie: ${item.query}
Tryb: ${item.mode}

## Podsumowanie
${item.summary}

## Zweryfikowane Twierdzenia:
${item.claims
  .map(
    (c, i) =>
      `${i + 1}. [${c.status}] ${c.claim}\n   - Wiarygodność: ${c.confidenceScore}%\n   - Źródła: ${c.sources
        .map((s) => s.name)
        .join(', ')}`
  )
  .join('\n\n')}

Wygenerowano automatycznie w SearchPoint.`;

    navigator.clipboard.writeText(reportText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper render status badge
  const renderStatusBadge = (status: ClaimVerificationStatus) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={11} />
            <span>Confirmed (min. 4-5 źródeł)</span>
          </span>
        );
      case 'Likely':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <CheckCircle2 size={11} />
            <span>Likely (Prawdopodobne)</span>
          </span>
        );
      case 'Disputed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle size={11} />
            <span>Disputed (Sporne / Zgłoszono uwagę)</span>
          </span>
        );
      case 'Outdated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Clock size={11} />
            <span>Outdated (Nieaktualne)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <HelpCircle size={11} />
            <span>Unverified</span>
          </span>
        );
    }
  };

  // Filtered collections
  const filteredCollections = collections.filter((c) => {
    const matchesQuery =
      c.topic.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.aliases.some((a) => a.toLowerCase().includes(filterQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'all' ||
      c.verifiedClaims.some((claim) => claim.status === selectedStatus);
    return matchesQuery && matchesCategory && matchesStatus;
  });

  // Filtered my searches
  const filteredMySearches = mySearches.filter((s) => {
    const matchesQuery =
      s.query.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.topic.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' ||
      s.claims.some((claim) => claim.status === selectedStatus);
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#191919] p-6 lg:p-8 space-y-6 text-[#37352f] dark:text-[#d4d4d4] font-sans transition-colors">
      {/* ========================================================================= */}
      {/* 1. HEADER & SEARCH EXECUTION BAR                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[4px] bg-[#2383e2] text-white shadow-2xs">
              <Compass size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#37352f] dark:text-white flex items-center gap-2">
                <span>Wyszukiwania & Weryfikacja Multi-Source</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-[4px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97]">
                  v5.0 · 5 Źródeł
                </span>
              </h1>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-0.5">
                Encyklopedia, Graf Wiedzy Wikidata, Baza Naukowa OpenAlex, Indeks Sieci i Konsensus AI.
              </p>
            </div>
          </div>
        </div>

        {/* Live Quota Pill */}
        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-1 rounded-[4px] bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] text-xs flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span className="text-[#787774] dark:text-[#9b9a97]">Limit zgłoszeń:</span>
            <span
              className={`font-semibold ${
                remainingQuota.remaining > 0 ? 'text-[#2383e2]' : 'text-red-500'
              }`}
            >
              {remainingQuota.remaining}/{remainingQuota.max} na 24h
            </span>
          </div>

          {activeTab === 'my_searches' && mySearches.length > 0 && (
            <button
              onClick={handleClearSearches}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium cursor-pointer border border-transparent hover:border-red-200 transition-colors"
            >
              <Trash2 size={12} />
              <span>Wyczyść historię</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ADVANCED SEARCH CONTROLLER WITH REUSE-FIRST & 5-SOURCE ENGINE          */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-[6px] bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] shadow-2xs space-y-3">
        <form onSubmit={handleExecuteSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787774] dark:text-[#9b9a97]"
              />
              <input
                type="text"
                value={searchExecutionInput}
                onChange={(e) => setSearchExecutionInput(e.target.value)}
                placeholder="Zbadaj temat w 5 niezależnych bazach (np. Architektura Transformer, Felis catus, React 19)..."
                className="w-full pl-9 pr-3 py-2 rounded-[4px] bg-[rgba(55,53,47,0.02)] dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] text-xs text-[#37352f] dark:text-white placeholder-[#787774] focus:outline-none focus:border-[#2383e2] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!searchExecutionInput.trim() || isSearching}
              className="px-4 py-2 rounded-[4px] bg-[#2383e2] hover:bg-[#1d6fc2] text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs transition-colors shrink-0"
            >
              {isSearching ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Weryfikacja w 5 źródłach...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Zbadaj & Zweryfikuj</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[#787774] dark:text-[#9b9a97] text-[11px]">Tryb wyszukiwania:</span>
              <button
                type="button"
                onClick={() => setSelectedMode('public')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] cursor-pointer text-xs transition-colors ${
                  selectedMode === 'public'
                    ? 'bg-[#2383e2]/10 text-[#2383e2] font-medium border border-[#2383e2]/20'
                    : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
                }`}
              >
                <Globe size={12} className="text-[#2383e2]" />
                <span>Publiczny (Zbiór Globalny)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode('my_searches')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] cursor-pointer text-xs transition-colors ${
                  selectedMode === 'my_searches'
                    ? 'bg-[#2383e2]/10 text-[#2383e2] font-medium border border-[#2383e2]/20'
                    : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
                }`}
              >
                <Lock size={12} className="text-amber-500" />
                <span>Prywatny (My Searches)</span>
              </button>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-[#787774] dark:text-[#9b9a97]">
              <input
                type="checkbox"
                checked={forceReverify}
                onChange={(e) => setForceReverify(e.target.checked)}
                className="rounded border-[rgba(55,53,47,0.2)] text-[#2383e2] focus:ring-[#2383e2]"
              />
              <span className="flex items-center gap-1">
                <RefreshCw size={11} className={forceReverify ? 'animate-spin' : ''} />
                <span>Wymuś głęboką weryfikację w sieci (pomiń cache)</span>
              </span>
            </label>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABS: MY SEARCHES vs GLOBAL COLLECTIONS vs AUDITS                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 border-b sm:border-b-0 border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('my_searches')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] cursor-pointer text-xs transition-colors ${
              activeTab === 'my_searches'
                ? 'bg-[#37352f] dark:bg-white text-white dark:text-[#37352f] font-medium shadow-2xs'
                : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            <Lock size={12} />
            <span>Prywatne Wyszukiwania</span>
            <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/10 dark:bg-black/20">
              {mySearches.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('collections')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] cursor-pointer text-xs transition-colors ${
              activeTab === 'collections'
                ? 'bg-[#37352f] dark:bg-white text-white dark:text-[#37352f] font-medium shadow-2xs'
                : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            <Globe size={12} />
            <span>Globalne Kolekcje</span>
            <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/10 dark:bg-black/20">
              {collections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audits')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] cursor-pointer text-xs transition-colors ${
              activeTab === 'audits'
                ? 'bg-[#37352f] dark:bg-white text-white dark:text-[#37352f] font-medium shadow-2xs'
                : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            <AlertTriangle size={12} />
            <span>Audyty & Zgłoszenia</span>
            <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/10 dark:bg-black/20">
              {bugReports.length}
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774] dark:text-[#9b9a97]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtruj wyniki..."
              className="pl-7 pr-2.5 py-1 rounded-[4px] bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] text-xs text-[#37352f] dark:text-white focus:outline-none focus:border-[#2383e2] w-40"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2 py-1 rounded-[4px] bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] text-xs text-[#37352f] dark:text-[#d4d4d4] focus:outline-none focus:border-[#2383e2] cursor-pointer"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Likely">Likely</option>
            <option value="Disputed">Disputed</option>
            <option value="Outdated">Outdated</option>
          </select>

          {activeTab === 'collections' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-1 rounded-[4px] bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] text-xs text-[#37352f] dark:text-[#d4d4d4] focus:outline-none focus:border-[#2383e2] cursor-pointer"
            >
              <option value="all">Wszystkie kategorie</option>
              <option value="Nauka">Nauka</option>
              <option value="Technologia">Technologia</option>
              <option value="Biznes">Biznes</option>
              <option value="Kultura">Kultura</option>
              <option value="Natura">Natura</option>
              <option value="Ogólne">Ogólne</option>
            </select>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT                                                            */}
      {/* ========================================================================= */}

      {/* TAB 1: MY SEARCHES */}
      {activeTab === 'my_searches' && (
        <div className="space-y-4">
          {filteredMySearches.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Compass size={24} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Brak prywatnych wyszukiwań
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Wpisz dowolne zagadnienie powyżej. Możesz używać potocznego języka i pytań – dane w
                tym trybie pozostają w 100% odizolowane od globalnego indeksu.
              </p>
            </div>
          ) : (
            filteredMySearches.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4 hover:border-blue-500/30 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.topic}
                      </span>
                      {item.reusedFromCollection && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                          <Flame size={11} className="text-indigo-500" />
                          <span>Reuse-First (0 opóźnień)</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString('pl-PL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 italic">
                      <Search size={11} className="text-slate-400" />
                      <span>Zapytanie: „{item.query}”</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyReport(item)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                      title="Kopiuj raport weryfikacji"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          <span className="text-emerald-600">Skopiowano!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Kopiuj</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleConvertSearchToNote(item)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition-colors"
                      title="Zamień badanie na notatkę z tabelą źródeł"
                    >
                      <FilePlus size={13} />
                      <span>Stwórz notatkę</span>
                    </button>

                    <button
                      onClick={() => handleRemoveSearch(item.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                      title="Usuń z historii"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {item.summary}
                </p>

                {/* Verified Claims with 5 Sources Inspector */}
                <div className="space-y-3 pt-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Zweryfikowane Fakty (Weryfikacja w 5 Źródłach):</span>
                    <span className="text-[10px] font-mono text-slate-400 lowercase">
                      {item.claims.length} twierdzeń
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {item.claims.map((claim) => {
                      const isSourcesOpen = !!expandedClaimSources[claim.id];
                      return (
                        <div
                          key={claim.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {renderStatusBadge(claim.status)}
                              <span className="text-[10px] font-mono text-slate-400">
                                Pewność: {claim.confidenceScore}% · Konsensus:{' '}
                                {claim.consensusPercentage || 95}%
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Zgłoś błąd button */}
                              <button
                                onClick={() =>
                                  setBugModalData({
                                    claimText: claim.claim,
                                    claimId: claim.id,
                                    searchId: item.id,
                                    collectionId: item.collectionId,
                                  })
                                }
                                className="px-2 py-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                                title="Zgłoś błąd lub zdezaktualizowaną informację (limit 4/24h)"
                              >
                                <AlertTriangle size={11} />
                                <span>Zgłoś błąd</span>
                              </button>

                              {/* Toggle sources button */}
                              <button
                                onClick={() => toggleClaimSources(claim.id)}
                                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-300 text-[11px] font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                              >
                                <BookOpen size={11} className="text-blue-500" />
                                <span>Źródła ({claim.sources.length})</span>
                                {isSourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-slate-900 dark:text-white font-medium leading-relaxed">
                            {claim.claim}
                          </div>

                          {claim.disputeReason && (
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px] border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                              <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                              <span>{claim.disputeReason}</span>
                            </div>
                          )}

                          {/* Expanded Source Inspector (4-5 Sources Breakdown) */}
                          {isSourcesOpen && (
                            <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2 animate-in fade-in">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                4-5 Niezależnych Źródeł Referencyjnych:
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {claim.sources.map((src, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                                        {src.name}
                                      </span>
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        {src.sourceType}
                                      </span>
                                    </div>
                                    {src.snippet && (
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                                        „{src.snippet}”
                                      </p>
                                    )}
                                    <div className="flex items-center justify-between pt-0.5 text-[10px]">
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                                        Wiarygodność: {src.reliabilityScore || 90}%
                                      </span>
                                      {src.url && (
                                        <a
                                          href={src.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                          <span>Otwórz źródło</span>
                                          <ExternalLink size={10} />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: GLOBAL COLLECTIONS */}
      {activeTab === 'collections' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <strong>Architektura Reuse-First:</strong> Setki zapytań użytkowników o ten sam
                temat zasilają jedną wspólną kolekcję. Wyszukiwarka najpierw sprawdza gotową wiedzę,
                unikając nadmiarowych zapytań sieciowych.
              </div>
            </div>
            <span className="font-mono font-bold text-xs shrink-0 pl-2">
              {collections.length} Kolekcji
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCollections.map((col) => (
              <div
                key={col.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-blue-500/40 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {col.topic}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {col.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {col.summary}
                  </p>

                  {/* Claims preview */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Fakty ({col.verifiedClaims.length}):
                    </div>
                    {col.verifiedClaims.slice(0, 2).map((clm) => (
                      <div
                        key={clm.id}
                        className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="line-clamp-2">{clm.claim}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span title="Liczba zapytań o ten temat zredukowanych do tej kolekcji">
                      🔥 {col.searchCount}+ zapytań
                    </span>
                    <span>Jakość: {col.qualityScore}%</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReverifyCollection(col.topic)}
                      className="px-2.5 py-1 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                      title="Wymuś weryfikację 5 źródeł"
                    >
                      <RefreshCw size={11} />
                      <span>Odśwież</span>
                    </button>

                    <button
                      onClick={() =>
                        handleConvertSearchToNote({
                          id: col.id,
                          query: col.topic,
                          mode: 'public',
                          topic: col.topic,
                          summary: col.summary,
                          keyTakeaways: col.keyTakeaways,
                          claims: col.verifiedClaims,
                          sourcesCount: 5,
                          createdAt: col.lastUpdatedAt,
                          reusedFromCollection: true,
                        })
                      }
                      className="px-3 py-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-[11px] cursor-pointer hover:opacity-90 flex items-center gap-1 shadow-2xs"
                    >
                      <FilePlus size={11} />
                      <span>Notatka</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDITS & BUG REPORTS */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <strong>Centrum Weryfikacji i Audytu Zgłoszeń:</strong> Każde zgłoszenie błędu
                przechodzi audyt AI i jest weryfikowane w niezależnych bazach. Oznacza sporne
                twierdzenia statusem <code>Disputed</code>, zapobiegając dezinformacji.
              </div>
            </div>
            <div className="font-mono text-xs shrink-0 pl-2">
              Limit: {remainingQuota.remaining} / {remainingQuota.max} na 24h
            </div>
          </div>

          {bugReports.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Brak zarejestrowanych sporów
              </h3>
              <p className="text-xs text-slate-500">
                Wszystkie fakty w kolekcjach posiadają status zweryfikowany przez min. 4-5 źródeł.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bugReports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          report.status === 'verified_bug'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : report.status === 'rejected'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {report.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Kategoria: {report.reason || 'Błąd merytoryczny'}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(report.createdAt).toLocaleString('pl-PL')}
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kwestionowane twierdzenie:
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs italic text-slate-800 dark:text-slate-200">
                      „{report.claimText}”
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Zarzut użytkownika:
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {report.userComment}
                    </p>
                    {report.counterSourceUrl && (
                      <a
                        href={report.counterSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>Źródło korygujące: {report.counterSourceUrl}</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  {report.aiVerdict && (
                    <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300 text-[11px]">
                        <Bot size={13} />
                        <span>Werdykt i analiza audytora AI:</span>
                      </div>
                      <p className="leading-relaxed">{report.aiVerdict}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: REPORT BUG IN CLAIM                                             */}
      {/* ========================================================================= */}
      {bugModalData && (
        <ReportBugModal
          isOpen={true}
          onClose={() => setBugModalData(null)}
          userId={userId}
          userEmail={user?.email || undefined}
          claimText={bugModalData.claimText}
          claimId={bugModalData.claimId}
          searchId={bugModalData.searchId}
          collectionId={bugModalData.collectionId}
          onSuccess={() => {
            refreshData();
            addNotification(
              'Zgłoszenie przyjęte',
              'Twierdzenie zostało przekazane do weryfikacji i oznaczone statusem Disputed.',
              'success'
            );
          }}
        />
      )}
    </div>
  );
};
