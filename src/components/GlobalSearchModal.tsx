import React, { useEffect, useState } from 'react';
import { Search, FileText, CheckSquare, Tag, ArrowRight, X, Sparkles } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { knowledgeIndex, SearchHit } from '../features/ai/knowledgeIndexService';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    pages,
    tasks,
    setActivePageId,
    setActiveView,
  } = useWorkspace();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // 1. Wyszukiwanie w czasie rzeczywistym przez KnowledgeIndex (pełnotekstowe + semantyczne)
  const indexHits: SearchHit[] = cleanQuery ? knowledgeIndex.search(cleanQuery, 10) : [];

  // 2. Zadania pasujące do zapytania
  const matchingTasks = tasks
    .filter((t) => {
      if (!cleanQuery) return false;
      const titleMatch = (t.title || '').toLowerCase().includes(cleanQuery);
      const tagMatch = (t.tag || '').toLowerCase().includes(cleanQuery);
      return titleMatch || tagMatch;
    })
    .slice(0, 5);

  // Jeśli brak zapytania, wyświetl ostatnio edytowane strony
  const defaultRecentPages = pages
    .filter((p) => !p.isDeleted)
    .slice(0, 6);

  const handleOpenPage = (pageId: string) => {
    setActivePageId(pageId);
    setActiveView('doc');
    setIsSearchOpen(false);
  };

  const handleOpenTask = () => {
    setActiveView('kanban');
    setIsSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (cleanQuery && indexHits.length > 0) {
        handleOpenPage(indexHits[0].pageId);
      } else if (cleanQuery && matchingTasks.length > 0) {
        handleOpenTask();
      } else if (!cleanQuery && defaultRecentPages.length > 0) {
        handleOpenPage(defaultRecentPages[0].id);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4 font-sans select-none"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[8px] max-w-xl w-full shadow-2xl overflow-hidden text-xs text-[#37352f] dark:text-[#d4d4d4] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex items-center gap-2.5 bg-white dark:bg-[#202020]">
          <Search size={15} className="text-[#787774] dark:text-[#9b9a97] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Szukaj stron, podstron, treści bloków, źródeł lub zadań..."
            className="flex-1 bg-transparent text-sm text-[#37352f] dark:text-white placeholder-[#787774] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#787774] hover:text-[#37352f] dark:hover:text-white p-1 rounded-[3px] cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
          <kbd className="text-[10px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] px-1.5 py-0.5 rounded-[3px] text-[#787774] dark:text-[#9b9a97] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Indexed Pages & Blocks Results */}
          {cleanQuery && indexHits.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                <span>Wyniki z Indeksu Wiedzy ({indexHits.length})</span>
                <span className="text-[9px] text-[#2383e2] font-mono">Błyskawiczne SQLite & AI</span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {indexHits.map((hit) => (
                  <div
                    key={`${hit.pageId}-${hit.blockId || 'title'}`}
                    onClick={() => handleOpenPage(hit.pageId)}
                    className="p-2 rounded-[5px] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.055)] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base shrink-0">{hit.pageIcon}</span>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#37352f] dark:text-white group-hover:text-[#2383e2] transition-colors truncate">
                            {hit.pageTitle}
                          </span>
                          <span className="text-[9px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97] px-1.5 py-0.2 rounded-[3px]">
                            {hit.matchType === 'title' ? 'Tytuł' : hit.matchType === 'tag' ? 'Tag' : 'Blok treści'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#787774] dark:text-[#9b9a97] truncate mt-0.5">
                          {hit.snippet}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-[#787774] group-hover:text-[#2383e2] transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {cleanQuery && matchingTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider px-2 py-1">
                Zadania Kanban ({matchingTasks.length})
              </div>
              <div className="space-y-0.5 mt-0.5">
                {matchingTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={handleOpenTask}
                    className="p-2 rounded-[5px] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.055)] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CheckSquare size={13} className="text-[#2383e2] shrink-0" />
                      <span className="font-medium text-[#37352f] dark:text-white group-hover:text-[#2383e2] transition-colors truncate">
                        {t.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#787774] dark:text-[#9b9a97] tabular-nums">
                      <span className="text-[#2383e2]">#{t.tag}</span>
                      <span>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default view when no query is typed */}
          {!cleanQuery && (
            <div>
              <div className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider px-2 py-1">
                Ostatnio edytowane strony
              </div>
              <div className="space-y-0.5 mt-0.5">
                {defaultRecentPages.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleOpenPage(p.id)}
                    className="p-2 rounded-[5px] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.055)] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base shrink-0">{p.icon || '📄'}</span>
                      <span className="font-medium text-[#37352f] dark:text-white group-hover:text-[#2383e2] transition-colors truncate">
                        {p.title}
                      </span>
                    </div>
                    <ArrowRight size={12} className="text-[#787774] group-hover:text-[#2383e2] transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {cleanQuery && indexHits.length === 0 && matchingTasks.length === 0 && (
            <div className="text-center py-8 text-[#787774] dark:text-[#9b9a97] text-xs italic">
              Brak wyników w indeksie dla „{query}”.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 px-3 border-t border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] bg-[#fbfbfa] dark:bg-[#1c1c1c] flex items-center justify-between text-[11px] text-[#787774] dark:text-[#9b9a97]">
          <span>Naciśnij <kbd className="px-1 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono">↵ Enter</kbd> aby otworzyć pierwszy wynik</span>
          <span className="font-medium text-[#2383e2]">SearchPoint Global Index 1:1</span>
        </div>
      </div>
    </div>
  );
};
