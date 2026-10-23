import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ArrowUp,
  ArrowDown,
  X,
  Replace,
  CaseSensitive,
  Check,
} from 'lucide-react';
import { DocBlock } from '../../types/workspace';

interface DocSearchReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: DocBlock[];
  onReplaceCurrent: (blockId: string, fromText: string, toText: string) => void;
  onReplaceAll: (fromText: string, toText: string, matchCase: boolean) => void;
  onScrollToBlock: (blockId: string) => void;
}

export const DocSearchReplace: React.FC<DocSearchReplaceProps> = ({
  isOpen,
  onClose,
  blocks,
  onReplaceCurrent,
  onReplaceAll,
  onScrollToBlock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute all match occurrences across all blocks
  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const results: { blockId: string; blockIndex: number; matchIndexInBlock: number }[] = [];

    const query = matchCase ? searchQuery : searchQuery.toLowerCase();

    blocks.forEach((block, bIdx) => {
      const content = matchCase ? (block.content || '') : (block.content || '').toLowerCase();
      let pos = 0;
      while (pos < content.length) {
        const found = content.indexOf(query, pos);
        if (found === -1) break;
        results.push({
          blockId: block.id,
          blockIndex: bIdx,
          matchIndexInBlock: found,
        });
        pos = found + query.length;
      }
    });

    return results;
  }, [blocks, searchQuery, matchCase]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.select();
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Auto-scroll to active match
  useEffect(() => {
    if (matches.length > 0 && activeMatchIndex < matches.length) {
      const currentMatch = matches[activeMatchIndex];
      if (currentMatch) {
        onScrollToBlock(currentMatch.blockId);
      }
    }
  }, [activeMatchIndex, matches, onScrollToBlock]);

  // Reset index when query changes
  useEffect(() => {
    setActiveMatchIndex(0);
  }, [searchQuery, matchCase]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (matches.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    setActiveMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  const handleReplaceOne = () => {
    if (matches.length === 0 || !searchQuery) return;
    const current = matches[activeMatchIndex];
    if (current) {
      onReplaceCurrent(current.blockId, searchQuery, replaceQuery);
    }
  };

  const handleReplaceAllClick = () => {
    if (matches.length === 0 || !searchQuery) return;
    onReplaceAll(searchQuery, replaceQuery, matchCase);
  };

  return (
    <div className="sticky top-2 z-30 flex justify-center px-4 animate-in fade-in slide-in-from-top-3 duration-150">
      <div
        onKeyDown={handleKeyDown}
        className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-2.5 flex flex-wrap items-center gap-2 max-w-2xl w-full text-xs select-none"
      >
        {/* Search Input */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 flex-1 min-w-[140px]">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj w dokumencie..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Matches Count Pill */}
        {searchQuery.trim() && (
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium shrink-0 ${
              matches.length > 0
                ? 'bg-blue-100 text-blue-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {matches.length > 0
              ? `${activeMatchIndex + 1} z ${matches.length}`
              : '0 wyników'}
          </span>
        )}

        {/* Prev / Next */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={matches.length === 0}
            title="Poprzedni (Shift+Enter)"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={matches.length === 0}
            title="Następny (Enter)"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
          >
            <ArrowDown size={14} />
          </button>
        </div>

        {/* Case Sensitivity Toggle */}
        <button
          type="button"
          onClick={() => setMatchCase(!matchCase)}
          title="Uwzględniaj wielkość liter"
          className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            matchCase
              ? 'bg-blue-600 text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <CaseSensitive size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* Replace Input */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 flex-1 min-w-[140px]">
          <Replace size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Zamień na..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-800 placeholder:text-slate-400"
          />
          {replaceQuery && (
            <button
              type="button"
              onClick={() => setReplaceQuery('')}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Replace Buttons */}
        <button
          type="button"
          onClick={handleReplaceOne}
          disabled={matches.length === 0}
          title="Zamień bieżące dopasowanie"
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs disabled:opacity-40 cursor-pointer transition-colors shrink-0"
        >
          Zamień
        </button>
        <button
          type="button"
          onClick={handleReplaceAllClick}
          disabled={matches.length === 0}
          title="Zamień wszystkie dopasowania w dokumencie"
          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs disabled:opacity-40 cursor-pointer transition-colors shrink-0"
        >
          Wszystko
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Zamknij (Esc)"
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors ml-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
