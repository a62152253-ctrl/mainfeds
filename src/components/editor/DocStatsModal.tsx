import React, { useMemo } from 'react';
import {
  X,
  BarChart2,
  Clock,
  Type,
  AlignLeft,
  CheckSquare,
  FileText,
  Volume2,
  Sparkles,
  Layers,
  Heading,
} from 'lucide-react';
import { DocBlock } from '../../types/workspace';

interface DocStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  blocks: DocBlock[];
}

export const DocStatsModal: React.FC<DocStatsModalProps> = ({
  isOpen,
  onClose,
  title,
  blocks,
}) => {
  const stats = useMemo(() => {
    let fullText = title ? title + ' ' : '';
    let headingsCount = 0;
    let paragraphsCount = 0;
    let codeBlocksCount = 0;
    let totalTodos = 0;
    let completedTodos = 0;
    let imagesCount = 0;

    blocks.forEach((b) => {
      if (b.content) fullText += b.content + ' ';
      if (b.type === 'h1' || b.type === 'h2' || b.type === 'h3') headingsCount++;
      if (b.type === 'p') paragraphsCount++;
      if (b.type === 'code') codeBlocksCount++;
      if (b.type === 'image') imagesCount++;
      if (b.type === 'todo') {
        totalTodos++;
        if (b.checked) completedTodos++;
      }
    });

    const trimmed = fullText.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const charsWithSpaces = fullText.length;
    const charsWithoutSpaces = fullText.replace(/\s+/g, '').length;
    const readingTimeMin = Math.max(1, Math.ceil(words / 200));
    const speakingTimeMin = Math.max(1, Math.ceil(words / 130));

    let documentScale = 'Krótka notatka';
    if (words > 1500) documentScale = 'Kompleksowy dokument / PRD';
    else if (words > 600) documentScale = 'Rozbudowany artykuł';
    else if (words > 200) documentScale = 'Standardowa notatka';

    return {
      words,
      charsWithSpaces,
      charsWithoutSpaces,
      readingTimeMin,
      speakingTimeMin,
      blocksCount: blocks.length,
      headingsCount,
      paragraphsCount,
      codeBlocksCount,
      totalTodos,
      completedTodos,
      imagesCount,
      documentScale,
    };
  }, [title, blocks]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
              <BarChart2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Statystyki Dokumentu</h3>
              <p className="text-xs text-slate-500 mt-0.5">Analiza objętości i struktury tekstu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Document Scale Pill */}
          <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-100 rounded-2xl">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-900">Profil dokumentu:</span>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-white px-2.5 py-1 rounded-xl shadow-2xs border border-blue-200/50">
              {stats.documentScale}
            </span>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-2 gap-3">
            {/* Reading Time */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Clock size={14} className="text-emerald-500" />
                <span>Czas czytania</span>
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono">
                ~{stats.readingTimeMin} min
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">w tempie 200 słów/min</p>
            </div>

            {/* Speaking Time */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Volume2 size={14} className="text-purple-500" />
                <span>Czas przemowy</span>
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono">
                ~{stats.speakingTimeMin} min
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">w tempie 130 słów/min</p>
            </div>

            {/* Word Count */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Type size={14} className="text-blue-500" />
                <span>Liczba słów</span>
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono">
                {stats.words.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">we wszystkich blokach</p>
            </div>

            {/* Character Count */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <AlignLeft size={14} className="text-amber-500" />
                <span>Liczba znaków</span>
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono">
                {stats.charsWithSpaces.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                ({stats.charsWithoutSpaces.toLocaleString()} bez spacji)
              </p>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-2 text-xs">
            <span className="font-bold text-slate-700 block mb-1">Elementy struktury:</span>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Layers size={13} className="text-slate-400" />
                Łączna liczba bloków:
              </span>
              <strong className="font-mono text-slate-900">{stats.blocksCount}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400" />
                Nagłówki (H1, H2, H3):
              </span>
              <strong className="font-mono text-slate-900">{stats.headingsCount}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckSquare size={13} className="text-slate-400" />
                Zadania To-Do:
              </span>
              <strong className="font-mono text-slate-900">
                {stats.completedTodos} / {stats.totalTodos} ukończone
              </strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
