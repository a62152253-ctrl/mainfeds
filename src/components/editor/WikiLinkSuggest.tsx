import React, { useState, useEffect } from 'react';
import { BookOpen, ArrowRight, Plus } from 'lucide-react';
import { WorkspacePage } from '../../types/workspace';

interface WikiLinkSuggestProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  pages: WorkspacePage[];
  onSelectPage: (pageTitle: string) => void;
}

export const WikiLinkSuggest: React.FC<WikiLinkSuggestProps> = ({
  isOpen,
  onClose,
  query,
  pages,
  onSelectPage,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activePages = pages.filter((p) => !p.isDeleted);
  const q = query.toLowerCase().trim();
  const filtered = activePages.filter((p) => p.title.toLowerCase().includes(q));

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelectPage(filtered[selectedIndex].title);
        } else if (query.trim()) {
          onSelectPage(query.trim());
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered, query, onSelectPage, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute left-6 mt-1 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 w-72 text-xs select-none animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
        <span>Połącz ze stroną [[</span>
        <kbd className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-500">Esc aby zamknąć</kbd>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-0.5">
        {filtered.length === 0 ? (
          <div className="p-3 text-center text-slate-400 text-xs">
            Brak strony o nazwie „{query}”.
            {query.trim() && (
              <button
                type="button"
                onClick={() => onSelectPage(query.trim())}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 cursor-pointer transition-colors"
              >
                <Plus size={12} />
                <span>Utwórz [[{query.trim()}]]</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map((page, idx) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.title)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left cursor-pointer transition-colors ${
                idx === selectedIndex
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-100 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-sm shrink-0">{page.icon || '📄'}</span>
                <span className="font-medium truncate">{page.title}</span>
              </div>
              <ArrowRight
                size={12}
                className={idx === selectedIndex ? 'text-white' : 'text-slate-300'}
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
};
