import React, { useState } from 'react';
import {
  FileText,
  Search,
  ExternalLink,
  Plus,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Star,
} from 'lucide-react';
import { WorkspacePage } from '../../types/workspace';

interface MiniNotesListSidecarProps {
  pages: WorkspacePage[];
  onOpenPage: (pageId: string) => void;
  onCreateNewPage: () => void;
  onAskAiToSummarize?: (pageTitle: string) => void;
}

export const MiniNotesListSidecar: React.FC<MiniNotesListSidecarProps> = ({
  pages,
  onOpenPage,
  onCreateNewPage,
  onAskAiToSummarize,
}) => {
  const [filter, setFilter] = useState('');

  const activePages = pages.filter((p) => !p.isDeleted);
  const filtered = activePages.filter((p) =>
    (p.title || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200/90 shadow-lg">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText size={14} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800 truncate">
              Twoje Notatki & Baza Wiedzy
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              {activePages.length} zapisanych stron · Sterowanie przez AI
            </p>
          </div>
        </div>

        <button
          onClick={onCreateNewPage}
          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
          title="Utwórz nowy dokument"
        >
          <Plus size={11} />
          <span>Nowa</span>
        </button>
      </div>

      {/* Search Input Filter */}
      <div className="p-2.5 border-b border-slate-100 bg-slate-50/40">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtruj notatki..."
            className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <FileText size={24} className="mx-auto mb-2 text-slate-300" />
            <p>Nie znaleziono notatek.</p>
            <button
              onClick={onCreateNewPage}
              className="mt-2 text-blue-600 hover:underline text-[11px] font-semibold cursor-pointer"
            >
              + Utwórz pierwszą stronę
            </button>
          </div>
        ) : (
          filtered.map((page) => (
            <div
              key={page.id}
              className="p-2.5 bg-white hover:bg-slate-50/80 border border-slate-200/90 rounded-xl transition-all shadow-2xs space-y-1.5 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  onClick={() => onOpenPage(page.id)}
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                >
                  <span className="text-sm shrink-0">{page.icon || '📄'}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                      {page.title || 'Bez tytułu'}
                    </h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{page.blocks?.length || 0} bloków</span>
                      <span>·</span>
                      <span>
                        {new Date(page.updatedAt || page.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </p>
                  </div>
                </div>

                {page.isFavorite && (
                  <Star size={12} className="text-amber-500 fill-amber-500 shrink-0 mt-1" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <button
                  type="button"
                  onClick={() => onOpenPage(page.id)}
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Otwórz</span>
                  <ChevronRight size={11} />
                </button>

                {onAskAiToSummarize && (
                  <button
                    type="button"
                    onClick={() => onAskAiToSummarize(page.title)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded text-[9px] font-semibold cursor-pointer transition-colors"
                    title="Poproś AI o streszczenie tej notatki"
                  >
                    <Sparkles size={9} className="text-blue-500" />
                    <span>Streszcz mi</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/70 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <span>Baza wiedzy</span>
        <span>Autozapis w chmurze</span>
      </div>
    </div>
  );
};
